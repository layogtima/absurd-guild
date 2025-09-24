// Image URL generation utilities for R2 storage
// Handles custom domain configuration and fallback URLs

/**
 * Generate a public URL for an R2 storage key
 * Uses custom domain if configured, otherwise falls back to R2 direct URL
 */
export function generateImageUrl(
  key: string,
  env: {
    R2_CUSTOM_DOMAIN?: string;
    R2_ACCOUNT_ID?: string;
    R2_S3_API_URL?: string;
  }
): string {
  if (!key) {
    throw new Error('Image key is required');
  }

  // Use custom domain if configured
  if (env.R2_CUSTOM_DOMAIN) {
    const customDomain = env.R2_CUSTOM_DOMAIN.replace(/\/$/, ''); // Remove trailing slash
    return `${customDomain}/${key}`;
  }

  // Use S3 API URL if configured (same as current upload.server.ts logic)
  if (env.R2_S3_API_URL) {
    const s3ApiUrl = env.R2_S3_API_URL.replace(/\/$/, ''); // Remove trailing slash
    return `${s3ApiUrl}/${key}`;
  }

  // Fallback to R2 default URL format
  const bucketName = 'absurd-guild-uploads';
  const accountId = env.R2_ACCOUNT_ID || 'YOUR_ACCOUNT_ID';
  return `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${key}`;
}

/**
 * Get image URL from database fields with fallback logic
 * Prioritizes key-based URL generation, falls back to stored URL for backwards compatibility
 */
export function getImageUrl(
  key: string | null,
  url: string | null,
  env: {
    R2_CUSTOM_DOMAIN?: string;
    R2_ACCOUNT_ID?: string;
    R2_S3_API_URL?: string;
  }
): string | null {
  // If we have a key, generate URL from it (preferred method)
  if (key) {
    try {
      return generateImageUrl(key, env);
    } catch (error) {
      console.warn('Failed to generate URL from key, falling back to stored URL:', error);
    }
  }

  // Fallback to stored URL for backwards compatibility
  return url || null;
}

/**
 * Extract R2 key from existing URL for migration purposes
 * Handles both custom domain and R2 direct URLs
 */
export function extractKeyFromUrl(url: string): string | null {
  if (!url) return null;

  try {
    // Handle different URL patterns
    const patterns = [
      // Custom domain: domain.com/path/file.ext
      /\/([^\/]+\/[^\/]+\/[^\/]+\.[^\/]+)$/,
      // R2 direct URL: bucket.account.r2.cloudflarestorage.com/path/file.ext
      /r2\.cloudflarestorage\.com\/[^\/]+\/(.+)$/,
      // S3 API URL pattern
      /\/([^\/]+\/[^\/]+\/[^\/]+\.[^\/]+)$/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  } catch (error) {
    console.warn('Failed to extract key from URL:', url, error);
    return null;
  }
}

/**
 * Validate that a key follows the expected R2 storage pattern
 * Expected format: type/userId/timestamp-random.ext
 */
export function isValidImageKey(key: string): boolean {
  if (!key) return false;

  // Pattern: type/userId/timestamp-random.ext
  const keyPattern = /^(profile|product|campaign|asset)\/\d+\/\d+-[a-z0-9]+\.[a-z0-9]+$/i;
  return keyPattern.test(key);
}