// Maker profile management utilities

export interface User {
  id: number;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  tagline: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface MakerProfile {
  id: number;
  email: string;
  maker_name: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  avatar_key: string | null;
  is_maker: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileLink {
  id: number;
  user_id: number;
  title: string;
  url: string;
  created_at: string;
}

export interface CreateMakerData {
  makerName: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  avatarKey?: string;
}

export interface UpdateMakerData {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  makerName?: string;
  avatarKey?: string;
}

/**
 * Validate maker name format
 */
function isValidMakerName(makerName: string): {
  isValid: boolean;
  error?: string;
} {
  if (!makerName || typeof makerName !== "string") {
    return { isValid: false, error: "Maker name is required" };
  }

  // Check length (reasonable limits)
  if (makerName.length < 2) {
    return {
      isValid: false,
      error: "Maker name must be at least 2 characters long",
    };
  }

  if (makerName.length > 50) {
    return {
      isValid: false,
      error: "Maker name must be less than 50 characters",
    };
  }

  // Check format: only lowercase letters and hyphens, must start with letter
  const validPattern = /^[a-z][a-z\-]*$/;
  if (!validPattern.test(makerName)) {
    return {
      isValid: false,
      error:
        "Maker name can only contain lowercase letters and hyphens, and must start with a letter",
    };
  }

  // Check that it doesn't start or end with hyphen
  if (makerName.startsWith("-") || makerName.endsWith("-")) {
    return {
      isValid: false,
      error: "Maker name cannot start or end with a hyphen",
    };
  }

  // Check for consecutive hyphens
  if (makerName.includes("--")) {
    return {
      isValid: false,
      error: "Maker name cannot contain consecutive hyphens",
    };
  }

  return { isValid: true };
}

/**
 * Check if a maker name is available
 */
export async function isMakerNameAvailable(
  db: D1Database,
  makerName: string,
  excludeUserId?: number
): Promise<boolean> {
  const query = excludeUserId
    ? "SELECT id FROM users WHERE maker_name = ? AND id != ?"
    : "SELECT id FROM users WHERE maker_name = ?";

  const params = excludeUserId ? [makerName, excludeUserId] : [makerName];

  const result = await db
    .prepare(query)
    .bind(...params)
    .first();

  return !result;
}

/**
 * Convert user to maker with profile data
 */
export async function createMakerProfile(
  db: D1Database,
  userId: number,
  data: CreateMakerData
): Promise<MakerProfile> {
  // Validate format first
  const validation = isValidMakerName(data.makerName);
  if (!validation.isValid) {
    throw new Error(validation.error!);
  }

  // Check if maker name is available
  const isAvailable = await isMakerNameAvailable(db, data.makerName);
  if (!isAvailable) {
    throw new Error("Maker name is already taken");
  }

  const result = await db
    .prepare(
      `
    UPDATE users SET
      is_maker = 1,
      maker_name = ?,
      display_name = ?,
      bio = ?,
      avatar_url = ?,
      avatar_key = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    RETURNING *
  `
    )
    .bind(
      data.makerName,
      data.displayName || null,
      data.bio || null,
      data.avatarUrl || null,
      data.avatarKey || null,
      userId
    )
    .first<MakerProfile>();

  if (!result) {
    throw new Error("Failed to create maker profile");
  }

  return result;
}

/**
 * Update maker profile
 */
export async function updateMakerProfile(
  db: D1Database,
  userId: number,
  data: UpdateMakerData
): Promise<MakerProfile> {
  // If makerName is being updated, validate format and check availability
  if (data.makerName) {
    // Validate format first
    const validation = isValidMakerName(data.makerName);
    if (!validation.isValid) {
      throw new Error(validation.error!);
    }

    const currentProfile = await getMakerProfile(db, userId);
    if (currentProfile && currentProfile.maker_name !== data.makerName) {
      const isAvailable = await isMakerNameAvailable(db, data.makerName);
      if (!isAvailable) {
        throw new Error("Maker name is already taken");
      }
    }
  }

  const result = await db
    .prepare(
      `
    UPDATE users SET
      display_name = ?,
      bio = ?,
      avatar_url = ?,
      maker_name = ?,
      avatar_key = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND is_maker = 1
    RETURNING *
  `
    )
    .bind(
      data.displayName || null,
      data.bio || null,
      data.avatarUrl || null,
      data.makerName || null,
      data.avatarKey || null,
      userId
    )
    .first<MakerProfile>();

  if (!result) {
    throw new Error("Failed to update maker profile or user is not a maker");
  }

  return result;
}

/**
 * Get maker profile by user ID
 */
export async function getMakerProfile(
  db: D1Database,
  userId: number
): Promise<MakerProfile | null> {
  const result = await db
    .prepare(
      `
    SELECT * FROM users
    WHERE id = ? AND is_maker = 1
  `
    )
    .bind(userId)
    .first<MakerProfile>();

  return result || null;
}

/**
 * Get maker profile by maker name
 */
export async function getMakerByName(
  db: D1Database,
  makerName: string
): Promise<MakerProfile | null> {
  const result = await db
    .prepare(
      `
    SELECT * FROM users
    WHERE maker_name = ? AND is_maker = 1
  `
    )
    .bind(makerName)
    .first<MakerProfile>();

  return result || null;
}

/**
 * Get profile links for a maker
 */
export async function getProfileLinks(
  db: D1Database,
  userId: number
): Promise<ProfileLink[]> {
  const results = await db
    .prepare(
      `
    SELECT * FROM maker_profile_links
    WHERE user_id = ?
    ORDER BY created_at ASC
  `
    )
    .bind(userId)
    .all<ProfileLink>();

  return results.results;
}

/**
 * Add a profile link
 */
export async function addProfileLink(
  db: D1Database,
  userId: number,
  title: string,
  url: string
): Promise<ProfileLink> {
  const result = await db
    .prepare(
      `
    INSERT INTO maker_profile_links (user_id, title, url)
    VALUES (?, ?, ?)
    RETURNING *
  `
    )
    .bind(userId, title, url)
    .first<ProfileLink>();

  if (!result) {
    throw new Error("Failed to add profile link");
  }

  return result;
}

/**
 * Delete a profile link
 */
export async function deleteProfileLink(
  db: D1Database,
  userId: number,
  linkId: number
): Promise<void> {
  const result = await db
    .prepare(
      `
    DELETE FROM maker_profile_links
    WHERE id = ? AND user_id = ?
  `
    )
    .bind(linkId, userId)
    .run();

  if (result.meta.rows_written === 0) {
    throw new Error("Link not found or you don't have permission to delete it");
  }
}

/**
 * Get maker by ID or maker name for public viewing
 */
export async function getMakerByIdOrName(
  db: D1Database,
  idOrName: string | number
): Promise<User | null> {
  let query: string;
  let bindValue: string | number;

  if (typeof idOrName === "number") {
    // Search by ID
    query = `
      SELECT id, email, display_name, avatar_url, bio, tagline, created_at, updated_at, is_active
      FROM users
      WHERE id = ? AND is_active = TRUE AND is_maker = TRUE
    `;
    bindValue = idOrName;
  } else {
    // Search by maker_name
    query = `
      SELECT id, email, display_name, avatar_url, bio, tagline, created_at, updated_at, is_active
      FROM users
      WHERE maker_name = ? AND is_active = TRUE AND is_maker = TRUE
    `;
    bindValue = idOrName;
  }

  const result = await db.prepare(query).bind(bindValue).first();

  return (result as unknown as User) || null;
}

/**
 * Get full maker profile with links
 */
export async function getFullMakerProfile(db: D1Database, userId: number) {
  const profile = await getMakerProfile(db, userId);
  if (!profile) {
    return null;
  }

  const links = await getProfileLinks(db, userId);

  return {
    ...profile,
    links,
  };
}

/**
 * Generate unique maker name from display name
 */
export function generateMakerName(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
