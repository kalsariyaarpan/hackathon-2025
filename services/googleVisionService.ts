import { supabase } from './supabaseClient';

export interface GoogleVisionResponse {
  imagePropertiesAnnotation?: {
    dominantColors?: {
      colors?: Array<{
        color: { red: number; green: number; blue: number };
        score: number;
        pixelFraction: number;
      }>;
    };
  };
  fullTextAnnotation?: {
    text: string;
  };
  safeSearchAnnotation?: {
    adult: string;
    spoof: string;
    medical: string;
    violence: string;
    racy: string;
  };
  labelAnnotations?: Array<{
    description: string;
    score: number;
  }>;
  error?: {
    message: string;
    code?: number;
    status?: string;
    details?: any[];
  };
}

export const analyzeImageWithGoogleVision = async (fileUrl: string, fileId: string): Promise<GoogleVisionResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke("vision-analyze", {
      body: { fileUrl }
    });

    if (error) {
      // Detect if the function is missing/undeployed
      const isConnectionError = error.message && (
         error.message.includes("Failed to send a request") || 
         error.message.includes("relay") ||
         error.message.includes("TypeError")
      );

      if (isConnectionError) {
         console.warn("Edge Function unreachable (Local/Undeployed environment).");
         return { 
           error: { 
             message: "Connection Failed: AI Service (Edge Function) is not deployed." 
           } 
         };
      }

      return { 
        error: { message: `Edge Function Error: ${error.message}` } 
      };
    }

    // Pass through Google API errors returned by the function
    if (data && data.error) {
       return { error: data.error };
    }

    // Return the first image response
    if (data && data.responses && data.responses[0]) {
      return data.responses[0];
    }

    return {};

  } catch (err: any) {
    console.error("Client Service Error:", err);
    return { 
      error: { 
        message: err.message || "Unknown client error" 
      } 
    };
  }
};