import { supabase } from './supabaseClient';
import { ScannedFile, FileStatus, HealthStatus, AnalysisIssue, ScanHistoryItem } from '../types';

// 0. Fetch File Details for Scanning
export const getFileDetails = async (fileId: string) => {
  const { data, error } = await supabase
    .from("user_files")
    .select("*")
    .eq("id", fileId)
    .single();
  
  if (error) {
    console.error("Get details error:", JSON.stringify(error, null, 2));
    throw new Error(error.message);
  }
  return data;
};

// 1. Save Uploaded File Metadata
export const saveFileMetadata = async (
  fileName: string, 
  fileSize: number, 
  fileType: string, 
  fileUrl: string = ''
) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not logged in");

  const { data, error } = await supabase
    .from("user_files")
    .insert([
      {
        user_id: user.id,
        file_name: fileName,
        file_size: fileSize,
        file_type: fileType,
        file_url: fileUrl
      }
    ])
    .select()
    .single();

  if (error) {
    console.error("File save error:", JSON.stringify(error, null, 2));
    throw new Error(error.message || "Database save failed");
  }
  return data;
};

// 2. Save Scan Result
export const saveScanResult = async (
  fileId: string, 
  score: number, 
  issues: string[], 
  action: string
) => {
  const issuesText = issues.join(', ');

  const { data, error } = await supabase
    .from("file_scans")
    .insert([
      {
        file_id: fileId,
        health_score: score,
        issues: issuesText,
        recommended_action: action
      }
    ])
    .select();

  if (error) {
    console.error("Scan save error:", JSON.stringify(error, null, 2));
    throw new Error(error.message);
  }
  return data;
};

// 3. Update File Backup Info
export const updateFileBackupInfo = async (fileId: string, backupUrl: string, backupAt: string) => {
  const { data, error } = await supabase
    .from("user_files")
    .update({
      backup_url: backupUrl,
      backup_at: backupAt
    })
    .eq("id", fileId)
    .select()
    .single();

  if (error) {
    console.error("Update backup info error:", JSON.stringify(error, null, 2));
    // Handle the specific "0 rows" error which usually means RLS blocked the update
    if (error.code === 'PGRST116') {
        throw new Error("Permission denied: Cannot update file record. Please run the SQL Policy for 'UPDATE' in Supabase.");
    }
    throw new Error(error.message);
  }
  return data;
};

// 4. Fetch User Files for Dashboard
export const loadUserFiles = async (): Promise<ScannedFile[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Fetch files and their latest scan
  const { data, error } = await supabase
    .from("user_files")
    .select(`
      id,
      file_name,
      file_size,
      file_type,
      file_url,
      uploaded_at,
      backup_url,
      backup_at,
      file_scans (
        health_score,
        issues,
        recommended_action,
        scanned_at
      )
    `)
    .eq("user_id", user.id)
    .order('uploaded_at', { ascending: false });

  if (error) {
    console.error("Error loading files:", JSON.stringify(error, null, 2));
    return [];
  }

  // Transform DB data to ScannedFile type for UI
  return data.map((item: any) => {
    const lastScan = item.file_scans?.[0];
    
    // Determine status based on health score
    let healthStatus = HealthStatus.UNKNOWN;
    if (lastScan?.health_score !== undefined) {
      if (lastScan.health_score < 60) healthStatus = HealthStatus.CORRUPTED;
      else if (lastScan.health_score < 90) healthStatus = HealthStatus.WARNING;
      else healthStatus = HealthStatus.HEALTHY;
    }

    // Parse issues back to array
    const parsedIssues: AnalysisIssue[] = lastScan?.issues 
      ? lastScan.issues.split(', ').map((desc: string) => ({ severity: 'medium', description: desc }))
      : [];

    return {
      id: item.id, // Use DB ID
      file: new File([], item.file_name), // Dummy file object for UI compatibility (Size 0)
      name: item.file_name,
      size: item.file_size, // Real metadata size
      type: item.file_type || 'unknown',
      url: item.file_url,
      uploadDate: new Date(item.uploaded_at).getTime(),
      status: lastScan ? FileStatus.COMPLETED : FileStatus.PENDING,
      healthScore: lastScan?.health_score,
      healthStatus: healthStatus,
      issues: parsedIssues,
      recommendations: lastScan?.recommended_action ? [lastScan.recommended_action] : [],
      backupUrl: item.backup_url,
      backupAt: item.backup_at
    };
  });
};

// 5. Fetch Scan History
export const getFileHistory = async (fileId: string): Promise<ScanHistoryItem[]> => {
  const { data, error } = await supabase
    .from("file_scans")
    .select("*")
    .eq("file_id", fileId)
    .order("scanned_at", { ascending: false });

  if (error) {
    console.error("Error fetching history:", JSON.stringify(error, null, 2));
    return [];
  }

  return data.map((item: any) => ({
    id: item.id,
    scannedAt: item.scanned_at,
    healthScore: item.health_score,
    issues: item.issues,
    recommendedAction: item.recommended_action
  }));
};