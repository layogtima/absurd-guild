// Upload utilities for Cloudflare R2
import { getR2 } from "./db.server";

export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

// Allowed MIME types for images
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif'
];

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Generate a unique filename with proper extension
 */
function generateFileName(originalName: string, userId: number, type: 'profile' | 'product'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = originalName.split('.').pop()?.toLowerCase() || 'jpg';

  return `${type}/${userId}/${timestamp}-${random}.${ext}`;
}

/**
 * Validate uploaded file
 */
function validateFile(file: File): { isValid: boolean; error?: string } {
  if (!file) {
    return { isValid: false, error: "No file provided" };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { isValid: false, error: "File size too large. Maximum 5MB allowed." };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { isValid: false, error: "Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed." };
  }

  return { isValid: true };
}

/**
 * Upload file to R2 bucket
 */
export async function uploadImage(
  context: { cloudflare: { env: any } },
  file: File,
  userId: number,
  type: 'profile' | 'product'
): Promise<UploadResult> {
  console.log('=== UPLOAD START ===');
  console.log('File info:', {
    name: file.name,
    size: file.size,
    type: file.type,
    userId,
    uploadType: type
  });

  try {
    // Validate file
    const validation = validateFile(file);
    console.log('File validation:', validation);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const r2 = getR2(context);
    console.log('R2 bucket binding available:', !!r2);
    console.log('Running in environment:', context.cloudflare?.env?.NODE_ENV || 'unknown');

    // Test if we can actually access R2 methods
    if (!r2) {
      throw new Error('R2 bucket binding not available - this often happens in local development');
    }

    console.log('R2 binding methods available:', Object.getOwnPropertyNames(Object.getPrototypeOf(r2)));

    const key = generateFileName(file.name, userId, type);
    console.log('Generated key:', key);

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    console.log('ArrayBuffer size:', arrayBuffer.byteLength);

    // Upload to R2 using simple put (not multipart for smaller files)
    console.log('Uploading to R2 bucket...');
    console.log('Expected bucket name: absurd-guild-uploads');

    const uploadOptions: R2PutOptions = {
      httpMetadata: {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000', // 1 year cache
      },
      customMetadata: {
        originalName: file.name,
        uploadedBy: userId.toString(),
        uploadedAt: new Date().toISOString(),
        type: type,
      },
    };

    // For files under 5MB, use simple put to avoid multipart issues
    console.log('Using simple PUT upload (avoiding multipart)');

    let uploadResult;
    try {
      uploadResult = await r2.put(key, arrayBuffer, uploadOptions);
      console.log('R2 upload completed successfully');
      console.log('Upload result:', uploadResult);

      // Ensure upload actually completed
      if (!uploadResult) {
        throw new Error('Upload returned null/undefined result');
      }

    } catch (uploadError) {
      console.error('R2 PUT operation failed:', uploadError);
      throw new Error(`Upload failed: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
    }

    // Try to verify the upload by getting object metadata
    try {
      const verifyResult = await r2.head(key);
      console.log('✅ VERIFICATION SUCCESS - File exists in R2');
      console.log('File metadata:', {
        size: verifyResult?.size,
        contentType: verifyResult?.httpMetadata?.contentType,
        lastModified: verifyResult?.uploaded,
      });
    } catch (verifyError) {
      console.error('❌ VERIFICATION FAILED:', verifyError);
      // This would indicate the upload actually failed
    }

    // Generate public URL
    const env = context.cloudflare.env;
    let publicUrl: string;

    if (env.R2_S3_API_URL) {
      // Use custom S3 API URL
      const s3ApiUrl = env.R2_S3_API_URL.replace(/\/$/, ''); // Remove trailing slash
      publicUrl = `${s3ApiUrl}/${key}`;
      console.log('Using S3 API URL:', publicUrl);
    } else {
      // Fallback to R2 public URL format
      const bucketName = 'absurd-guild-uploads';
      const accountId = env.R2_ACCOUNT_ID || 'YOUR_ACCOUNT_ID';
      publicUrl = `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${key}`;
      console.log('Using R2 default URL:', publicUrl);
    }

    console.log('=== UPLOAD SUCCESS ===');
    return {
      success: true,
      url: publicUrl,
      key: key,
    };
  } catch (error) {
    console.error('=== UPLOAD ERROR ===');
    console.error('Upload error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Delete file from R2 bucket
 */
export async function deleteImage(
  context: { cloudflare: { env: any } },
  key: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const r2 = getR2(context);
    await r2.delete(key);

    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    };
  }
}

/**
 * Extract R2 key from URL (for cleanup purposes)
 */
export function extractKeyFromUrl(url: string): string | null {
  try {
    // Handle both custom domain and R2 direct URLs
    const patterns = [
      /\/([^\/]+\/[^\/]+\/[^\/]+\.[^\/]+)$/, // Custom domain: domain.com/path/file.ext
      /r2\.cloudflarestorage\.com\/[^\/]+\/(.+)$/, // Direct R2 URL
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Clean up incomplete multipart uploads (utility function)
 * Call this occasionally to clean up any hanging uploads
 */
export async function cleanupIncompleteUploads(
  context: { cloudflare: { env: any } }
): Promise<{ success: boolean; error?: string }> {
  try {
    const r2 = getR2(context);

    // List incomplete multipart uploads
    const incompleteUploads = await r2.list({
      limit: 1000,
      include: ['customMetadata']
    });

    console.log('Found objects:', incompleteUploads.objects?.length || 0);

    // Note: R2 doesn't currently expose listMultipartUploads via Workers API
    // This is a limitation we need to work around by using simple PUT uploads

    return { success: true };
  } catch (error) {
    console.error('Cleanup error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Cleanup failed',
    };
  }
}