// Campaign management utilities
import { parseVideoUrl } from "./video-utils.server";

export interface Campaign {
  id: number;
  creator_id: number;
  title: string;
  slug: string;
  description?: string;
  short_description?: string;
  hero_video_url?: string;
  hero_video_embed?: string;
  hero_video_thumbnail?: string;
  story_content?: string;
  funding_goal: number;
  current_funding: number;
  commitment_percentage: number;
  status: "draft" | "active" | "funded" | "shipped" | "cancelled";
  category?: string;
  estimated_shipping_date?: string;
  ends_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCampaignData {
  title: string;
  slug: string;
  description?: string;
  short_description?: string;
  hero_video_url?: string;
  story_content?: string;
  funding_goal: number;
  commitment_percentage?: number;
  category?: string;
  estimated_shipping_date?: string;
  ends_at?: string;
}

export interface UpdateCampaignData extends Partial<CreateCampaignData> {
  id: number;
}

/**
 * Create a new campaign
 */
export async function createCampaign(
  db: D1Database,
  creatorId: number,
  data: CreateCampaignData
): Promise<Campaign> {
  let heroVideoEmbed = null;
  let heroVideoThumbnail = null;

  // Process video URL if provided
  if (data.hero_video_url) {
    const videoData = parseVideoUrl(data.hero_video_url);
    if (videoData) {
      heroVideoEmbed = videoData.embedUrl;
      heroVideoThumbnail = videoData.thumbnailUrl;
    }
  }

  const result = await db
    .prepare(
      `
    INSERT INTO campaigns (
      creator_id, title, slug, description, short_description,
      hero_video_url, hero_video_embed, hero_video_thumbnail,
      story_content, funding_goal, commitment_percentage,
      category, estimated_shipping_date, ends_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING *
  `
    )
    .bind(
      creatorId,
      data.title,
      data.slug,
      data.description || null,
      data.short_description || null,
      data.hero_video_url || null,
      heroVideoEmbed,
      heroVideoThumbnail,
      data.story_content || null,
      data.funding_goal,
      data.commitment_percentage || 40,
      data.category || null,
      data.estimated_shipping_date || null,
      data.ends_at || null
    )
    .first<Campaign>();

  if (!result) {
    throw new Error("Failed to create campaign");
  }

  return result;
}

/**
 * Update an existing campaign
 */
export async function updateCampaign(
  db: D1Database,
  data: UpdateCampaignData
): Promise<Campaign> {
  const { id, ...updateData } = data;

  // Build dynamic update query
  const updateFields: string[] = [];
  const updateValues: any[] = [];

  Object.entries(updateData).forEach(([key, value]) => {
    if (value !== undefined) {
      updateFields.push(`${key} = ?`);
      updateValues.push(value);
    }
  });

  // Process video URL if it's being updated
  if (data.hero_video_url !== undefined) {
    let heroVideoEmbed = null;
    let heroVideoThumbnail = null;

    if (data.hero_video_url) {
      const videoData = parseVideoUrl(data.hero_video_url);
      if (videoData) {
        heroVideoEmbed = videoData.embedUrl;
        heroVideoThumbnail = videoData.thumbnailUrl;
      }
    }

    // Add or update video embed fields
    const embedIndex = updateFields.findIndex((field) =>
      field.startsWith("hero_video_embed")
    );
    const thumbnailIndex = updateFields.findIndex((field) =>
      field.startsWith("hero_video_thumbnail")
    );

    if (embedIndex === -1) {
      updateFields.push("hero_video_embed = ?");
      updateValues.push(heroVideoEmbed);
    } else {
      updateValues[embedIndex] = heroVideoEmbed;
    }

    if (thumbnailIndex === -1) {
      updateFields.push("hero_video_thumbnail = ?");
      updateValues.push(heroVideoThumbnail);
    } else {
      updateValues[thumbnailIndex] = heroVideoThumbnail;
    }
  }

  // Always update the updated_at timestamp
  updateFields.push("updated_at = CURRENT_TIMESTAMP");

  const query = `
    UPDATE campaigns
    SET ${updateFields.join(", ")}
    WHERE id = ?
    RETURNING *
  `;

  const result = await db
    .prepare(query)
    .bind(...updateValues, id)
    .first<Campaign>();

  if (!result) {
    throw new Error("Campaign not found or update failed");
  }

  return result;
}

/**
 * Get campaign by ID
 */
export async function getCampaignById(
  db: D1Database,
  id: number
): Promise<Campaign | null> {
  const result = await db
    .prepare("SELECT * FROM campaigns WHERE id = ?")
    .bind(id)
    .first<Campaign>();

  return result || null;
}

/**
 * Get campaign by slug
 */
export async function getCampaignBySlug(
  db: D1Database,
  slug: string
): Promise<Campaign | null> {
  const result = await db
    .prepare("SELECT * FROM campaigns WHERE slug = ?")
    .bind(slug)
    .first<Campaign>();

  return result || null;
}

/**
 * Get campaigns by creator
 */
export async function getCampaignsByCreator(
  db: D1Database,
  creatorId: number,
  limit: number = 10,
  offset: number = 0
): Promise<Campaign[]> {
  const results = await db
    .prepare(
      `
    SELECT * FROM campaigns
    WHERE creator_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `
    )
    .bind(creatorId, limit, offset)
    .all<Campaign>();

  return results.results;
}

/**
 * Get active campaigns
 */
export async function getActiveCampaigns(
  db: D1Database,
  limit: number = 10,
  offset: number = 0
): Promise<Campaign[]> {
  const results = await db
    .prepare(
      `
    SELECT * FROM campaigns
    WHERE status = 'active'
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `
    )
    .bind(limit, offset)
    .all<Campaign>();

  return results.results;
}

/**
 * Generate unique slug from title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Check if slug is available
 */
export async function isSlugAvailable(
  db: D1Database,
  slug: string,
  excludeId?: number
): Promise<boolean> {
  const query = excludeId
    ? "SELECT id FROM campaigns WHERE slug = ? AND id != ?"
    : "SELECT id FROM campaigns WHERE slug = ?";

  const params = excludeId ? [slug, excludeId] : [slug];

  const result = await db
    .prepare(query)
    .bind(...params)
    .first();

  return !result;
}

/**
 * Increment campaign views
 */
export async function incrementCampaignViews(
  db: D1Database,
  campaignId: number
): Promise<void> {
  await db
    .prepare(
      `
    UPDATE campaigns
    SET views_count = views_count + 1
    WHERE id = ?
  `
    )
    .bind(campaignId)
    .run();
}
