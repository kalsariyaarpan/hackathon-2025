import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Signup from './components/Signup';
import Notification from './components/Notification';
import { View, ScannedFile, FileStatus, HealthStatus } from './types';
import { supabase } from './services/supabaseClient';
import { saveFileMetadata, saveScanResult, getFileDetails, updateFileBackupInfo } from './services/dbService';
import { analyzeFileWithAI } from './services/scanningService';
import { createBackupCopy, uploadFileToStorage } from './services/storageService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.HOME);
  const [files, setFiles] = useState<ScannedFile[]>([]);
  const [session, setSession] = useState<any>(null);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        if (currentView === View.LOGIN || currentView === View.SIGNUP) {
            setCurrentView(View.DASHBOARD);
        }
      } else {
        if (currentView === View.DASHBOARD) {
            setCurrentView(View.LOGIN);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLoginNavigation = () => {
    setCurrentView(View.LOGIN);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentView(View.HOME);
    setNotification({ message: "Logged out successfully", type: "success" });
  };

  // Handle Backup
  const handleBackup = async (fileId: string) => {
    if (!session) return;
    try {
      // 1. Try to find the file locally first
      let fileToBackup = files.find(f => f.id === fileId);
      let realDbId = fileId;
      let publicUrl = fileToBackup?.url;
      let fileName = fileToBackup?.name || '';

      // 2. If missing URL, check if we can fetch from DB
      if (!publicUrl) {
         try {
             const dbFile = await getFileDetails(fileId);
             realDbId = dbFile.id;
             publicUrl = dbFile.file_url;
             fileName = dbFile.file_name;
         } catch (e) {
             // Not in DB either
         }
      }

      // 3. Logic: If we STILL don't have a URL, check if we have the local file blob to sync it.
      // IMPORTANT: We must check file.size > 0 to ensure it's not a "dummy" file from DB reload
      if (!publicUrl && fileToBackup && fileToBackup.file && fileToBackup.file.size > 0) {
         setNotification({ message: "Syncing file to cloud before backup...", type: "success" });
         
         try {
            // A. Upload to Main Storage
            publicUrl = await uploadFileToStorage(fileToBackup.file, session.user.id);
            
            // B. Create DB Record (or assume it might exist and we just got the URL)
            // For robustness, we save metadata.
            const saved = await saveFileMetadata(fileToBackup.name, fileToBackup.size, fileToBackup.type, publicUrl);
            realDbId = saved.id;
            fileName = saved.file_name;

            // C. Update local state
            const updatedLocalFile = { ...fileToBackup, id: realDbId, url: publicUrl };
            fileToBackup = updatedLocalFile; 
            setFiles(prev => prev.map(f => f.id === fileId ? updatedLocalFile : f));
         } catch (syncError: any) {
             throw new Error(`Sync failed: ${syncError.message}`);
         }
      }

      // 4. Final Check
      if (!publicUrl) {
        throw new Error("Cannot backup: Missing file URL. Analysis may be incomplete.");
      }

      setNotification({ message: "Creating secure backup...", type: "success" });

      // 5. Perform Backup
      let backupUrl = '';
      
      // Optimization: If we have the local file blob, upload directly
      if (fileToBackup?.file && fileToBackup.file.size > 0) {
         const backupPath = `backup/${session.user.id}/${Date.now()}_${fileName}`;
         const { error } = await supabase.storage.from('user-files').upload(backupPath, fileToBackup.file);
         if (error) {
             if ((error as any).statusCode === '404') throw new Error("Bucket 'user-files' not found.");
             throw new Error(`Backup upload failed: ${error.message}`);
         }
         
         const { data } = supabase.storage.from('user-files').getPublicUrl(backupPath);
         backupUrl = data.publicUrl;
      } else {
         // Fallback: Use server-side copy
         backupUrl = await createBackupCopy(publicUrl, session.user.id, fileName);
      }

      // 6. Update DB with backup info
      const backupAt = new Date().toISOString();
      await updateFileBackupInfo(realDbId, backupUrl, backupAt);

      // 7. Update UI
      setFiles(prev => prev.map(f => 
        f.id === realDbId ? { ...f, backupUrl, backupAt } : f
      ));

      setNotification({ message: "Backup successful! File secured.", type: "success" });

    } catch (error: any) {
      console.error("Backup failed", error);
      setNotification({ message: `Backup failed: ${error.message}`, type: "error" });
    }
  };

  // Unified Analysis Handler
  const handleAnalyze = async (fileId: string, isDbFile: boolean = false): Promise<any> => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, status: FileStatus.ANALYZING } : f
    ));

    try {
      let fileName = "";
      let fileSize = 0;
      let fileType = "";
      let realDbId = fileId;
      let fileUrl = "";

      // Fetch Details
      if (isDbFile && session) {
        const dbData = await getFileDetails(fileId);
        fileName = dbData.file_name;
        fileSize = dbData.file_size;
        fileType = dbData.file_type;
        fileUrl = dbData.file_url;
        realDbId = dbData.id;
      } else {
        const localFile = files.find(f => f.id === fileId);
        if (!localFile) throw new Error("File not found locally");
        fileName = localFile.name;
        fileSize = localFile.size;
        fileType = localFile.type;
        
        if (localFile.url) {
            fileUrl = localFile.url;
            realDbId = localFile.id;
        } 
        else if (session) {
           // Upload to Storage if not present
           try {
             fileUrl = await uploadFileToStorage(localFile.file, session.user.id);
           } catch(e: any) {
             console.warn("Storage upload failed (Bucket missing?), proceeding with metadata only.", e);
             setNotification({ message: "Cloud upload failed. Running analysis locally...", type: "error" });
             fileUrl = ""; // Proceed with empty URL so analysis is not blocked
           }
           
           try {
             const saved = await saveFileMetadata(fileName, fileSize, fileType, fileUrl);
             realDbId = saved.id;
           } catch(e: any) {
             console.error("Metadata sync failed", e);
             throw new Error(`Failed to save file metadata: ${e.message}`);
           }
        }
      }

      // Scanning Logic (Async with Google Vision)
      // Pass fileUrl to enable AI scan
      const result = await analyzeFileWithAI(realDbId, fileName, fileSize, fileType, fileUrl);
      
      let healthEnum = HealthStatus.HEALTHY;
      if (result.healthScore < 60) healthEnum = HealthStatus.CORRUPTED;
      else if (result.healthScore < 90) healthEnum = HealthStatus.WARNING;

      if (session) {
        await saveScanResult(realDbId, result.healthScore, result.issues, result.action);
      }

      const updatedFile = {
        id: realDbId,
        name: fileName,
        size: fileSize,
        type: fileType,
        url: fileUrl,
        status: FileStatus.COMPLETED,
        healthScore: result.healthScore,
        healthStatus: healthEnum,
        issues: result.issues.map(i => ({ severity: 'medium', description: i })),
        recommendations: [result.action],
        uploadDate: Date.now()
      };

      setFiles(prev => {
        const exists = prev.find(f => f.id === fileId);
        if (exists) {
           return prev.map(f => f.id === fileId ? { ...f, ...updatedFile } as ScannedFile : f);
        }
        return [...prev]; 
      });

      setNotification({ message: "Analysis complete.", type: "success" });
      return result;

    } catch (error: any) {
      console.error("Analysis failed", error);
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: FileStatus.ERROR } : f
      ));
      
      const errorMsg = error.message || (typeof error === 'string' ? error : 'Unknown error occurred');
      setNotification({ message: `Analysis failed: ${errorMsg}`, type: "error" });
      return null;
    }
  };

  const renderView = () => {
    switch (currentView) {
      case View.HOME:
        return <Hero onStart={() => setCurrentView(View.UPLOAD)} />;
      case View.UPLOAD:
        return <FileUpload files={files} setFiles={setFiles} onAnalyze={(id) => handleAnalyze(id, false)} />;
      case View.DASHBOARD:
        return session ? (
          <Dashboard files={files} session={session} onAnalyze={handleAnalyze} onBackup={handleBackup} />
        ) : (
          <Login onNavigateHome={() => setCurrentView(View.HOME)} onNavigateSignup={() => setCurrentView(View.SIGNUP)} />
        );
      case View.LOGIN:
        return <Login 
          onNavigateHome={() => setCurrentView(View.HOME)} 
          onNavigateSignup={() => setCurrentView(View.SIGNUP)}
        />;
      case View.SIGNUP:
        return <Signup onNavigateLogin={() => setCurrentView(View.LOGIN)} />;
      default:
        return <Hero onStart={() => setCurrentView(View.UPLOAD)} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-brand-100 selection:text-brand-900">
      {currentView !== View.LOGIN && currentView !== View.SIGNUP && (
        <Navbar 
          currentView={currentView} 
          setCurrentView={setCurrentView} 
          session={session}
          onLogin={handleLoginNavigation}
          onLogout={handleLogout}
        />
      )}
      <main className="animate-fade-in-up">
        {renderView()}
      </main>
      
      {currentView !== View.LOGIN && currentView !== View.SIGNUP && (
        <footer className="bg-white border-t border-gray-200 mt-12 py-8">
           <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
              <p>&copy; {new Date().getFullYear()} ai-guardian. All rights reserved.</p>
           </div>
        </footer>
      )}

      {notification && (
        <Notification 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification(null)} 
        />
      )}
    </div>
  );
};

export default App;