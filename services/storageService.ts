import { supabase } from './supabaseClient';

const BUCKET_NAME = 'user-files';

// Helper to attempt bucket creation
const attemptCreateBucket = async () => {
  try {
    const { data, error } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 10485760, // 10MB
    });
    if (error) {
      console.warn("Auto-creation of bucket failed:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
};

export const uploadFileToStorage = async (file: File, userId: string): Promise<string> => {
  // Sanitize filename to prevent issues
  const sanitizedName = file.name.replace(/[^\x00-\x7F]/g, "");
  const filePath = `${userId}/${Date.now()}_${sanitizedName}`;
  
  let { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file);

  // If bucket not found, try to create it and retry upload
  if (error && ((error as any).statusCode === '404' || error.message.includes("Bucket not found"))) {
      console.log(`Bucket '${BUCKET_NAME}' not found. Attempting to create...`);
      const created = await attemptCreateBucket();
      
      if (created) {
        // Retry upload
        const retry = await supabase.storage.from(BUCKET_NAME).upload(filePath, file);
        data = retry.data;
        error = retry.error;
      } else {
        throw new Error(`Storage Bucket '${BUCKET_NAME}' missing. Please run the SQL setup script.`);
      }
  }

  if (error) {
    console.error("Storage upload error:", JSON.stringify(error, null, 2));
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return urlData.publicUrl;
};

export const createBackupCopy = async (
  originalUrl: string, 
  userId: string, 
  fileName: string
): Promise<string> => {
  // 1. Extract the path from the full public URL
  const pathParts = originalUrl.split(`${BUCKET_NAME}/`);
  if (pathParts.length < 2) throw new Error("Invalid file URL format");
  const originalPath = pathParts[1];

  // 2. Download the original file
  const { data: blob, error: downloadError } = await supabase.storage
    .from(BUCKET_NAME)
    .download(originalPath);

  if (downloadError) {
    if ((downloadError as any).statusCode === '404') {
         throw new Error("Original file not found in storage. It may have been deleted.");
    }
    throw new Error(`Backup failed (download): ${downloadError.message}`);
  }
  if (!blob) throw new Error("Downloaded file is empty");

  // 3. Upload to backup folder
  const backupPath = `backup/${userId}/${Date.now()}_${fileName}`;
  
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(backupPath, blob);

  if (uploadError) {
    throw new Error(`Backup failed (upload): ${uploadError.message}`);
  }

  // 4. Get Public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(backupPath);

  return urlData.publicUrl;
};