import React, { useEffect, useState } from 'react';
import { ScannedFile, HealthStatus, FileStatus, ScanHistoryItem } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Activity, CheckCircle, AlertTriangle, XCircle, Shield, RefreshCw, Play, History, Cloud, DownloadCloud, Loader2, Sparkles, Download } from 'lucide-react';
import { loadUserFiles, getFileHistory } from '../services/dbService';
import ScanResultModal from './ScanResultModal';
import ScanHistoryModal from './ScanHistoryModal';

interface DashboardProps {
  files: ScannedFile[]; // Local files from current session
  session: any;
  onAnalyze: (fileId: string, isDbFile: boolean) => Promise<any>;
  onBackup: (fileId: string) => Promise<void>;
}

const Dashboard: React.FC<DashboardProps> = ({ files: localFiles, session, onAnalyze, onBackup }) => {
  const [dbFiles, setDbFiles] = useState<ScannedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [backingUpId, setBackingUpId] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  
  // Modal State for Analysis Result
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [resultModalData, setResultModalData] = useState({
    fileName: '',
    healthScore: 0,
    issues: [] as string[],
    action: ''
  });

  // Modal State for History
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyData, setHistoryData] = useState<ScanHistoryItem[]>([]);
  const [historyFileName, setHistoryFileName] = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchFiles = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const data = await loadUserFiles();
      setDbFiles(data);
    } catch (e) {
      console.error("Failed to fetch DB files", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [session]);

  const handleScanClick = async (file: ScannedFile) => {
    setAnalyzingId(file.id);
    try {
      const isDbFile = !!dbFiles.find(d => d.id === file.id);
      const result = await onAnalyze(file.id, isDbFile);

      if (result) {
        setResultModalData({
          fileName: file.name,
          healthScore: result.healthScore,
          issues: result.issues,
          action: result.action
        });
        setResultModalOpen(true);
        if (isDbFile) fetchFiles(); 
      }
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleHistoryClick = async (file: ScannedFile) => {
    setHistoryFileName(file.name);
    setHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      const isDbFile = !!dbFiles.find(d => d.id === file.id);
      if (isDbFile) {
        const history = await getFileHistory(file.id);
        setHistoryData(history);
      } else {
        setHistoryData([]);
      }
    } catch (e) {
      console.error("Failed to load history", e);
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleBackupClick = async (fileId: string) => {
    setBackingUpId(fileId);
    await onBackup(fileId);
    setBackingUpId(null);
    fetchFiles(); // Refresh to show backup badge
  };

  const mergedFiles = [...dbFiles];
  localFiles.forEach(localFile => {
    if (!mergedFiles.find(f => f.id === localFile.id)) {
        mergedFiles.unshift(localFile);
    }
  });

  const completedFiles = mergedFiles.filter(f => f.status === FileStatus.COMPLETED);
  const healthyCount = completedFiles.filter(f => f.healthStatus === HealthStatus.HEALTHY).length;
  const warningCount = completedFiles.filter(f => f.healthStatus === HealthStatus.WARNING).length;
  const corruptedCount = completedFiles.filter(f => f.healthStatus === HealthStatus.CORRUPTED).length;
  const totalScanned = completedFiles.length;

  const data = [
    { name: 'Healthy', value: healthyCount, color: '#16a34a' },
    { name: 'Warning', value: warningCount, color: '#ca8a04' },
    { name: 'Corrupted', value: corruptedCount, color: '#dc2626' },
  ];

  const chartData = completedFiles.slice(0, 10).map(f => ({
      name: f.name.length > 10 ? f.name.substring(0, 10) + '...' : f.name,
      score: f.healthScore || 0
  }));

  const StatCard = ({ title, value, icon, colorClass }: any) => (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
       <div>
         <p className="text-sm font-medium text-gray-500 uppercase">{title}</p>
         <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
       </div>
       <div className={`p-3 rounded-full ${colorClass}`}>
         {icon}
       </div>
    </div>
  );

  if (!session) return <div className="p-8 text-center text-gray-500">Please log in to view the dashboard.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 relative">
      <ScanResultModal 
        isOpen={resultModalOpen} 
        onClose={() => setResultModalOpen(false)}
        {...resultModalData}
      />

      <ScanHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        fileName={historyFileName}
        history={historyData}
        loading={historyLoading}
      />

      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            Welcome, <span className="text-brand-600">{session?.user?.email || 'Guardian'}</span>
          </h2>
          <p className="text-gray-500 mt-1">Here is the integrity status of your digital archives.</p>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={fetchFiles} 
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-600 hover:text-brand-600 rounded-lg text-sm font-medium border border-gray-200 transition-colors"
           >
             <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
           </button>
           <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-200">
            <Shield size={16} /> Live Database
           </div>
        </div>
      </div>

      {loading && mergedFiles.length === 0 ? (
        <div className="flex justify-center py-20">
           <div className="flex flex-col items-center text-gray-400">
              <RefreshCw size={32} className="animate-spin mb-4" />
              <p>Syncing with secure database...</p>
           </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard title="Total Scanned" value={totalScanned} icon={<Activity size={24} />} colorClass="bg-blue-50 text-blue-600" />
            <StatCard title="Healthy" value={healthyCount} icon={<CheckCircle size={24} />} colorClass="bg-green-50 text-green-600" />
            <StatCard title="Warnings" value={warningCount} icon={<AlertTriangle size={24} />} colorClass="bg-yellow-50 text-yellow-600" />
            <StatCard title="Corrupted" value={corruptedCount} icon={<XCircle size={24} />} colorClass="bg-red-50 text-red-600" />
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Health Distribution</h3>
              <div className="h-64 w-full">
                {completedFiles.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center text-gray-400 text-sm">No analysis data yet.</div>}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Health Scores</h3>
              <div className="h-64 w-full">
                 {completedFiles.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" tick={{fontSize: 12}} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="score" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                 ) : <div className="h-full flex items-center justify-center text-gray-400 text-sm">No analysis data yet.</div>}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">File Management</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                  <tr>
                    <th className="px-6 py-3">File Name</th>
                    <th className="px-6 py-3">Size</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Backup Status</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {mergedFiles.length > 0 ? mergedFiles.map((file) => (
                    <tr key={file.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900 max-w-[150px] truncate" title={file.name}>
                         {file.name}
                      </td>
                      <td className="px-6 py-4">{(file.size / 1024).toFixed(1)} KB</td>
                      <td className="px-6 py-4">
                         {file.status === FileStatus.COMPLETED ? (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                              ${file.healthStatus === HealthStatus.HEALTHY ? 'bg-green-100 text-green-800' : 
                                file.healthStatus === HealthStatus.WARNING ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                              {file.healthStatus}
                            </span>
                         ) : <span className="text-gray-400 text-xs">Pending</span>}
                      </td>
                      <td className="px-6 py-4">
                         {file.backupUrl ? (
                           <div className="flex flex-col">
                             <span className="text-green-600 text-xs font-bold flex items-center gap-1">
                               <Cloud size={12} /> Backed Up
                             </span>
                             <span className="text-[10px] text-gray-400">
                               {new Date(file.backupAt!).toLocaleDateString()}
                             </span>
                           </div>
                         ) : (
                           <span className="text-gray-400 text-xs">Not backed up</span>
                         )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleScanClick(file)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm text-xs font-medium"
                            title="Run AI Analysis"
                            disabled={analyzingId === file.id}
                          >
                            {analyzingId === file.id ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                            AI Scan
                          </button>
                          <button 
                            onClick={() => handleHistoryClick(file)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                            title="View History"
                          >
                            <History size={16} />
                          </button>
                          <button 
                             onClick={() => handleBackupClick(file.id)}
                             disabled={!!file.backupUrl || backingUpId === file.id}
                             className={`p-2 rounded-lg transition-colors border border-transparent flex items-center gap-1 ${
                               file.backupUrl 
                               ? 'text-green-600 cursor-default opacity-50' 
                               : 'text-purple-600 hover:bg-purple-50 hover:border-purple-200'
                             }`}
                             title={file.backupUrl ? "Already Backed Up" : "Backup to Cloud"}
                          >
                            {backingUpId === file.id ? <Loader2 size={16} className="animate-spin" /> : <DownloadCloud size={16} />}
                          </button>
                          {file.url && (
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                              title="Download File"
                            >
                              <Download size={16} />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No files found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;