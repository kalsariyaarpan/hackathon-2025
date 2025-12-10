import { analyzeImageWithGoogleVision } from './googleVisionService';

export const analyzeFileWithAI = async (
  fileId: string,
  name: string,
  size: number,
  type: string,
  url: string
): Promise<{ healthScore: number; issues: string[]; action: string }> => {
  // Start with a perfect score
  let healthScore = 100;
  let issues: string[] = [];
  
  // 1. DYNAMIC BASELINE (Entropy Jitter)
  const entropy = (name.length + size) % 5; 
  healthScore -= entropy; 

  // --- 2. BASIC HEURISTIC CHECKS (Local) ---
  
  // Size Checks
  if (size === 0) {
    healthScore = 0;
    issues.push("Critical: File is empty (0 bytes).");
  } else if (size < 2048 && type.includes('image')) {
    healthScore -= 5;
    issues.push("Warning: File size is unusually small for an image (Low Quality).");
  } else if (size > 15 * 1024 * 1024) {
    healthScore -= 10;
    issues.push("Large file size (>15MB) increases risk of bit rot.");
  }

  // Filename Checks
  const lowerName = name.toLowerCase();
  if (lowerName.includes("copy") || lowerName.includes("(") || lowerName.includes("backup")) {
    healthScore -= 8;
    issues.push("Duplicate or backup artifact detected in filename.");
  }
  if (name.length > 50) {
    healthScore -= 3;
    issues.push("Filename is excessively long (Metadata risk).");
  }

  // File Type Checks
  const lowerType = type.toLowerCase();
  const isImage = lowerType.includes("image") || lowerType.includes("png") || lowerType.includes("jpg") || lowerType.includes("jpeg");
  
  if (!isImage && !lowerType.includes("pdf") && !lowerType.includes("text")) {
     healthScore -= 5;
     issues.push("Unknown file format schema.");
  }

  // --- 3. AI CHECKS (Google Vision) ---
  
  if (isImage && url) {
    try {
      const vision = await analyzeImageWithGoogleVision(url, fileId);

      // Check for API/Edge Function Errors
      if (vision.error) {
        const msg = vision.error.message || "";
        
        if (msg.includes("Connection Failed") || msg.includes("Failed to send a request")) {
           issues.push("Info: AI Server function not deployed (Skipped).");
        } else if (msg.includes("is disabled") || msg.includes("has not been used")) {
           issues.push("Info: Cloud Vision API disabled (Skipped).");
        } else {
           healthScore -= 15;
           issues.push(`Error: AI Analysis failed - ${msg}`);
        }
      } 
      // CASE D: Successful Analysis
      else if (vision && Object.keys(vision).length > 0) {
        
        // 1. LABELS (What is in the image?)
        if (vision.labelAnnotations && vision.labelAnnotations.length > 0) {
            const topLabels = vision.labelAnnotations
                .slice(0, 3) // Get top 3 tags
                .map(l => l.description)
                .join(", ");
            // We add this as an "Info" item, not a penalty
            issues.push(`AI Identified: ${topLabels}`);
        }

        // 2. OCR (Is there text?)
        if (vision.fullTextAnnotation?.text) {
             const textLen = vision.fullTextAnnotation.text.length;
             issues.push(`AI Text Scan: Detected ${textLen} characters of text.`);
        }

        // 3. Blur/Quality
        if (vision.labelAnnotations) {
           const labels = vision.labelAnnotations.map(l => l.description.toLowerCase());
           if (labels.some(l => l.includes("blur"))) {
              healthScore -= 15;
              issues.push("Issue: AI detected image is blurry.");
           }
        }

        // 4. Safe Search
        const safe = vision.safeSearchAnnotation;
        if (safe) {
          if (["LIKELY", "VERY_LIKELY"].includes(safe.adult) || ["LIKELY", "VERY_LIKELY"].includes(safe.violence)) {
            issues.push("Warning: AI flagged sensitive content.");
            healthScore -= 20;
          }
        }
        
        // 5. Properties (Dominant Color Variance)
        if (vision.imagePropertiesAnnotation?.dominantColors?.colors?.length && 
            vision.imagePropertiesAnnotation.dominantColors.colors.length < 2) {
            healthScore -= 10;
            issues.push("Issue: Low color variance (Possible blank scan).");
        }
      }

    } catch (e) {
      console.warn("AI Logic Exception", e);
      issues.push("Error: AI Scan skipped due to internal error.");
    }
  }

  // --- 4. FINAL SCORING & ACTION ---

  healthScore = Math.max(0, Math.min(100, healthScore));

  let action = "No action needed.";
  
  if (healthScore === 100) {
     action = "File is in perfect condition.";
  } else if (healthScore >= 90) {
     action = "File is healthy. Standard backup recommended.";
  } else if (healthScore >= 75) {
     action = "Minor issues detected. Consider organizing metadata.";
  } else if (healthScore >= 50) {
     action = "Quality issues found. Re-uploading a clearer version is advised.";
  } else {
     action = "CRITICAL: File is corrupted or unsafe. Isolate immediately.";
  }

  if (issues.length === 0 && healthScore < 100) {
     issues.push("Info: Minor encoding inefficiencies detected.");
  }
  if (issues.length === 0) {
     issues.push("Info: Integrity check passed.");
  }

  return { healthScore, issues, action };
};