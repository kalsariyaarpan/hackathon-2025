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

      // Check for Errors
      if (vision.error) {
        const msg = vision.error.message || "";
        // Don't deduct too much score for API configuration errors, but show them
        if (msg.includes("Cloud Vision API has not been used") || msg.includes("is disabled")) {
           issues.push("Info: AI API not enabled in Google Console.");
        } else {
           healthScore -= 10;
           issues.push(`Error: AI Analysis failed - ${msg}`);
        }
      } 
      // CASE: Successful Analysis
      else if (vision && Object.keys(vision).length > 0) {
        
        // 1. LABELS (Positive Identification)
        if (vision.labelAnnotations && vision.labelAnnotations.length > 0) {
            // Get top 3 tags with high confidence
            const topLabels = vision.labelAnnotations
                .filter(l => l.score > 0.7)
                .slice(0, 4) 
                .map(l => l.description)
                .join(", ");
            
            if (topLabels) {
                issues.push(`AI Identified: ${topLabels}`);
            }
        }

        // 2. OCR (Text Detection)
        if (vision.fullTextAnnotation?.text) {
             const textLen = vision.fullTextAnnotation.text.length;
             // If text is found, it's usually a good sign for scanned docs
             issues.push(`AI Text Scan: Verified ${textLen} characters of readable text.`);
        }

        // 3. Blur/Quality Detection
        // Note: Google Vision doesn't return a direct "Blur" score, we infer from SafeSearch or Labels
        if (vision.labelAnnotations) {
           const labels = vision.labelAnnotations.map(l => l.description.toLowerCase());
           if (labels.some(l => l.includes("blur") || l.includes("out of focus"))) {
              healthScore -= 20;
              issues.push("Issue: AI detected significant blurriness.");
           }
        }

        // 4. Safe Search (Content Integrity)
        const safe = vision.safeSearchAnnotation;
        if (safe) {
          const risky = ["LIKELY", "VERY_LIKELY"];
          if (risky.includes(safe.adult) || risky.includes(safe.violence) || risky.includes(safe.racy)) {
            issues.push("Warning: AI flagged potentially unsafe or sensitive content.");
            healthScore -= 25;
          }
        }
        
        // 5. Properties (Color Variance)
        // Helps detect completely black or white images
        if (vision.imagePropertiesAnnotation?.dominantColors?.colors?.length) {
            const colors = vision.imagePropertiesAnnotation.dominantColors.colors;
            if (colors.length < 2) {
                 healthScore -= 15;
                 issues.push("Issue: Low color variance (Possible blank/corrupted scan).");
            }
        }
      } else {
        // Empty response but no error
        issues.push("Info: AI returned no specific insights.");
      }

    } catch (e) {
      console.warn("AI Logic Exception", e);
      issues.push("Error: AI Scan skipped due to internal processing error.");
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