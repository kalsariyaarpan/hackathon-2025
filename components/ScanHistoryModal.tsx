
import React from 'react';
import { X, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { ScanHistoryItem } from '../types';

interface ScanHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  history: ScanHistoryItem[];
  loading: boolean;
}

const ScanHistoryModal: React.FC<ScanHistoryModalProps> = ({ 
  isOpen, onClose, fileName, history, loading 
}) => {
  if (!isOpen) return null;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getIcon = (score: number) => {
    if (score >= 90) return <CheckCircle size={16} className="text-green-500" />;
    if (score >= 70) return <AlertTriangle size={16} className="text-yellow-500" />;
    return <XCircle size={16} className="text-red-500" />;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-white/50 relative animate-scale-up flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2 text-brand-700 font-bold">
            <Clock size={20} />
            <h3>Scan History: <span className="text-gray-900 font-normal">{fileName}</span></h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mb-2"></div>
               <p>Loading history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-gray-500 italic">
              No previous scans found for this file.
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((scan) => (
                <div key={scan.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm text-gray-500 font-medium">
                      {new Date(scan.scannedAt).toLocaleString()}
                    </p>
                    <div className={`flex items-center gap-1 font-bold text-sm ${getScoreColor(scan.healthScore)}`}>
                       {getIcon(scan.healthScore)}
                       {scan.healthScore}% Health
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 mt-3">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Issues Detected</p>
                      <p className="text-sm text-gray-700">{scan.issues || "No issues recorded."}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-xs font-semibold text-blue-500 uppercase mb-1">Recommendation</p>
                      <p className="text-sm text-blue-800">{scan.recommendedAction || "None"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <button 
            onClick={onClose}
            className="w-full py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScanHistoryModal;
