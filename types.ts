export enum View {
  HOME = 'HOME',
  UPLOAD = 'UPLOAD',
  DASHBOARD = 'DASHBOARD',
  LOGIN = 'LOGIN',
  SIGNUP = 'SIGNUP',
}

export enum FileStatus {
  PENDING = 'PENDING',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export enum HealthStatus {
  HEALTHY = 'Healthy',
  WARNING = 'Warning',
  CORRUPTED = 'Corrupted',
  UNKNOWN = 'Unknown',
}

export interface AnalysisIssue {
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface ScannedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  url?: string; // Public URL of the file
  uploadDate: number;
  status: FileStatus;
  healthScore?: number;
  healthStatus?: HealthStatus;
  issues?: AnalysisIssue[];
  recommendations?: string[];
  backupUrl?: string;
  backupAt?: string;
}

export interface ScanHistoryItem {
  id: string;
  scannedAt: string;
  healthScore: number;
  issues: string;
  recommendedAction: string;
}