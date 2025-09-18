// Video utilities for handling YouTube/Vimeo URLs

interface VideoData {
  embedUrl: string;
  thumbnailUrl: string;
  videoId: string;
  platform: "youtube" | "vimeo" | "unknown";
}

/**
 * Extract video ID from YouTube URL
 * Supports various YouTube URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 */
function extractYouTubeId(url: string): string | null {
  const regex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

/**
 * Extract video ID from Vimeo URL
 * Supports formats like:
 * - https://vimeo.com/VIDEO_ID
 * - https://player.vimeo.com/video/VIDEO_ID
 */
function extractVimeoId(url: string): string | null {
  const regex =
    /(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/[^\/]*\/videos\/|album\/\d+\/video\/|video\/|))(\d+)(?:$|\/|\?)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

/**
 * Parse video URL and generate embed data
 */
export function parseVideoUrl(url: string): VideoData | null {
  if (!url || typeof url !== "string") {
    return null;
  }

  // Clean up the URL
  const cleanUrl = url.trim();

  // Try YouTube first
  const youtubeId = extractYouTubeId(cleanUrl);
  if (youtubeId) {
    return {
      embedUrl: `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`,
      thumbnailUrl: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
      videoId: youtubeId,
      platform: "youtube",
    };
  }

  // Try Vimeo
  const vimeoId = extractVimeoId(cleanUrl);
  if (vimeoId) {
    return {
      embedUrl: `https://player.vimeo.com/video/${vimeoId}?title=0&byline=0&portrait=0`,
      thumbnailUrl: `https://vumbnail.com/${vimeoId}.jpg`, // Vimeo thumbnail service
      videoId: vimeoId,
      platform: "vimeo",
    };
  }

  return null;
}

/**
 * Generate iframe HTML for video embed
 */
export function generateVideoIframe(
  videoData: VideoData,
  className?: string
): string {
  const classAttr = className ? ` class="${className}"` : "";

  return `<iframe${classAttr} src="${videoData.embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
}

/**
 * Validate if a URL is a supported video platform
 */
export function isValidVideoUrl(url: string): boolean {
  return parseVideoUrl(url) !== null;
}

/**
 * Get video platform from URL
 */
export function getVideoPlatform(url: string): "youtube" | "vimeo" | "unknown" {
  const videoData = parseVideoUrl(url);
  return videoData ? videoData.platform : "unknown";
}

// Database helper functions
export async function updateCampaignVideo(
  db: D1Database,
  campaignId: number,
  videoUrl: string
): Promise<void> {
  const videoData = parseVideoUrl(videoUrl);

  if (!videoData) {
    throw new Error(
      "Invalid video URL. Please provide a valid YouTube or Vimeo URL."
    );
  }

  await db
    .prepare(
      `
    UPDATE campaigns
    SET
      hero_video_url = ?,
      hero_video_embed = ?,
      hero_video_thumbnail = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `
    )
    .bind(videoUrl, videoData.embedUrl, videoData.thumbnailUrl, campaignId)
    .run();
}

// Example usage and supported formats
export const SUPPORTED_VIDEO_FORMATS = {
  youtube: [
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://youtu.be/dQw4w9WgXcQ",
    "https://www.youtube.com/embed/dQw4w9WgXcQ",
    "https://m.youtube.com/watch?v=dQw4w9WgXcQ",
  ],
  vimeo: [
    "https://vimeo.com/123456789",
    "https://player.vimeo.com/video/123456789",
  ],
};
