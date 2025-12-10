import { ScannedFile, FileStatus, HealthStatus, AnalysisIssue } from '../types';

export const analyzeFileMock = (file: ScannedFile): Promise<ScannedFile> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Generate random health score between 40 and 100
      const score = Math.floor(Math.random() * (100 - 40 + 1)) + 40;
      let status = HealthStatus.HEALTHY;
      const issues: AnalysisIssue[] = [];
      const recommendations: string[] = [];

      if (score < 60) {
        status = HealthStatus.CORRUPTED;
        issues.push({ severity: 'high', description: 'Metadata header corruption detected.' });
        issues.push({ severity: 'high', description: 'Unexpected EOF marker.' });
        recommendations.push('Attempt binary reconstruction.');
        recommendations.push('Restore from an older backup immediately.');
      } else if (score < 85) {
        status = HealthStatus.WARNING;
        issues.push({ severity: 'medium', description: 'Legacy file format version detected.' });
        issues.push({ severity: 'low', description: 'Missing optional EXIF tags.' });
        recommendations.push('Convert to a modern format (e.g., PDF/A, WebP).');
      } else {
        issues.push({ severity: 'low', description: 'Minor compression artifacts.' });
        recommendations.push('File is healthy. No action needed.');
      }

      resolve({
        ...file,
        status: FileStatus.COMPLETED,
        healthScore: score,
        healthStatus: status,
        issues,
        recommendations,
      });
    }, 2000); // 2 second mock delay
  });
};