import React, { useRef, useState } from 'react';
import { Upload, File as FileIcon, Loader2, Play, Trash2, HardDrive } from 'lucide-react';
import { ScannedFile, FileStatus } from '../types';
import AnalysisResult from './AnalysisResult';

interface FileUploadProps {
  files: ScannedFile[];
  setFiles: React.Dispatch<React.SetStateAction<ScannedFile[]>>;
  onAnalyze: (fileId: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ files, setFiles, onAnalyze }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (fileList: FileList) => {
    const newFiles: ScannedFile[] = Array.from(fileList).map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadDate: Date.now(),
      status: FileStatus.PENDING,
    }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Upload Files for Analysis</h2>
      
      {/* Drop Zone */}
      <div 
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ease-in-out
          ${isDragging 
            ? 'border-brand-500 bg-brand-50 scale-[1.01]' 
            : 'border-gray-300 bg-white hover:border-gray-400'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          multiple 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileSelect}
        />
        
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-brand-100 text-brand-600 rounded-full">
            <Upload size={32} />
          </div>
          <div>
            <p className="text-lg font-medium text-gray-700">Drag & Drop files here</p>
            <p className="text-sm text-gray-500 mt-1">or click to browse from your device</p>
          </div>
          <div className="flex gap-3 mt-4">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
            >
              Select Files
            </button>
          
          </div>
        </div>
      </div>

      {/* File List */}
      <div className="mt-12 space-y-6">
        {files.length > 0 && <h3 className="text-xl font-semibold text-gray-800">Files ({files.length})</h3>}
        
        <div className="grid gap-4">
          {files.map(file => (
            <div key={file.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md">
              <div className="p-4 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4 min-w-[200px]">
                  <div className="p-3 bg-gray-100 rounded-lg text-gray-600">
                    <FileIcon size={24} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 truncate max-w-[200px] sm:max-w-xs" title={file.name}>{file.name}</h4>
                    <p className="text-xs text-gray-500">{formatSize(file.size)} • {new Date(file.uploadDate).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {file.status === FileStatus.PENDING && (
                    <button 
                      onClick={() => onAnalyze(file.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
                    >
                      <Play size={16} fill="currentColor" /> Analyze
                    </button>
                  )}
                  {file.status === FileStatus.ANALYZING && (
                    <span className="flex items-center gap-2 px-4 py-2 bg-brand-100 text-brand-700 text-sm font-medium rounded-lg">
                      <Loader2 size={16} className="animate-spin" /> Analyzing...
                    </span>
                  )}
                  {file.status === FileStatus.COMPLETED && (
                    <span className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 text-sm font-medium rounded-lg">
                      Done
                    </span>
                  )}
                  
                  <button 
                    onClick={() => removeFile(file.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              {/* Analysis Result Section */}
              {file.status === FileStatus.COMPLETED && (
                <div className="border-t border-gray-100 bg-gray-50/50">
                  <AnalysisResult file={file} />
                </div>
              )}
            </div>
          ))}
          
          {files.length === 0 && (
             <div className="text-center py-12 text-gray-400 italic">
               No files uploaded yet.
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;