import React from 'react';
import { X, CheckCircle, AlertTriangle, XCircle, Shield, Sparkles, Info } from 'lucide-react';

interface ScanResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  healthScore: number;
  issues: string[];
  action: string;
}

const ScanResultModal: React.FC<ScanResultModalProps> = ({ 
  isOpen, onClose, fileName, healthScore, issues, action 
}) => {
  if (!isOpen) return null;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getIcon = (score: number) => {
    if (score >= 90) return <CheckCircle size={48} className="text-green-500" />;
    if (score >= 70) return <AlertTriangle size={48} className="text-yellow-500" />;
    return <XCircle size={48} className="text-red-500" />;
  };

  // Helper to style individual issue lines
  const renderIssue = (text: string, idx: number) => {
    let icon = <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0"></span>;
    let style = "text-gray-700";

    if (text.startsWith("AI Identified") || text.startsWith("AI Text")) {
        icon = <Sparkles size={14} className="mt-0.5 text-blue-500 shrink-0" />;
        style = "text-blue-700 font-medium";
    } else if (text.startsWith("Info:")) {
        icon = <Info size={14} className="mt-0.5 text-gray-500 shrink-0" />;
        style = "text-gray-600";
    } else if (text.startsWith("Warning:") || text.startsWith("Issue:")) {
        icon = <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0"></span>;
        style = "text-yellow-800";
    } else if (text.startsWith("Critical:") || text.startsWith("Error:")) {
        icon = <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>;
        style = "text-red-800 font-medium";
    }

    return (
        <li key={idx} className={`text-sm flex items-start gap-2 ${style}`}>
            {icon}
            {text}
        </li>
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-white/50 relative animate-scale-up">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-2 text-brand-700 font-bold">
            <Shield size={20} />
            <h3>Analysis Report</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 flex flex-col items-center text-center">
          {/* Score Indicator */}
          <div className="mb-4">
             {getIcon(healthScore)}
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 mb-1 truncate max-w-full px-4">{fileName}</h2>
          
          <div className={`mt-2 px-4 py-1 rounded-full text-lg font-bold border ${getScoreColor(healthScore)}`}>
            Health Score: {healthScore}%
          </div>

          <div className="w-full mt-6 space-y-4 text-left">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Scan Findings</p>
              <ul className="space-y-2">
                {issues.map((issue, idx) => renderIssue(issue, idx))}
              </ul>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <p className="text-xs font-semibold text-blue-500 uppercase mb-1">Recommended Action</p>
              <p className="text-sm text-blue-800 font-medium">{action}</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <button 
            onClick={onClose}
            className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-xl transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScanResultModal;