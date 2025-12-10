import React from 'react';
import { ScannedFile, HealthStatus } from '../types';
import { AlertTriangle, CheckCircle, XCircle, FileText, DownloadCloud } from 'lucide-react';

interface AnalysisResultProps {
  file: ScannedFile;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ file }) => {
  if (!file.healthScore && file.healthScore !== 0) return null;

  const getStatusColor = (status?: HealthStatus) => {
    switch (status) {
      case HealthStatus.HEALTHY: return 'text-green-600 bg-green-50 border-green-200';
      case HealthStatus.WARNING: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case HealthStatus.CORRUPTED: return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status?: HealthStatus) => {
    switch (status) {
      case HealthStatus.HEALTHY: return <CheckCircle size={24} />;
      case HealthStatus.WARNING: return <AlertTriangle size={24} />;
      case HealthStatus.CORRUPTED: return <XCircle size={24} />;
      default: return <FileText size={24} />;
    }
  };

  return (
    <div className="mt-4 p-6 bg-white rounded-xl border border-gray-200 shadow-sm animate-fade-in">
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Score Circle */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center p-4">
           <div className="relative w-32 h-32">
             <svg className="w-full h-full" viewBox="0 0 36 36">
                <path
                  className="text-gray-100"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className={`${file.healthScore > 80 ? 'text-green-500' : file.healthScore > 50 ? 'text-yellow-500' : 'text-red-500'} transition-all duration-1000 ease-out`}
                  strokeDasharray={`${file.healthScore}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
             </svg>
             <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-800">{file.healthScore}</span>
                <span className="text-xs text-gray-500 uppercase font-semibold">Score</span>
             </div>
           </div>
           <div className={`mt-3 px-3 py-1 rounded-full text-sm font-medium border flex items-center gap-2 ${getStatusColor(file.healthStatus)}`}>
             {getStatusIcon(file.healthStatus)}
             {file.healthStatus}
           </div>
        </div>

        {/* Details */}
        <div className="flex-grow space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Detected Issues</h4>
            {file.issues && file.issues.length > 0 ? (
              <ul className="space-y-2">
                {file.issues.map((issue, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className={`mt-1 w-2 h-2 rounded-full ${issue.severity === 'high' ? 'bg-red-500' : issue.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'}`}></span>
                    {issue.description}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">No issues detected.</p>
            )}
          </div>

          <div>
             <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Recommended Fixes</h4>
             {file.recommendations && file.recommendations.length > 0 ? (
               <ul className="space-y-1">
                 {file.recommendations.map((rec, idx) => (
                   <li key={idx} className="text-sm text-gray-700 bg-gray-50 p-2 rounded border border-gray-100">
                     💡 {rec}
                   </li>
                 ))}
               </ul>
             ) : (
                <p className="text-sm text-gray-500 italic">No actions needed.</p>
             )}
          </div>
          
          <div className="pt-2">
            <button className="flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline">
               <DownloadCloud size={16} /> Backup to Cloud (Simulated)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResult;