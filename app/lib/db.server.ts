// Database utilities for Cloudflare D1
type CloudflareEnv = {
  DB: D1Database;
  absurd_guild_sessions: KVNamespace;
};

export function getDB(context: { cloudflare: { env: CloudflareEnv } }) {
  return context.cloudflare.env.DB;
}

export function getKV(context: { cloudflare: { env: CloudflareEnv } }) {
  return context.cloudflare.env.absurd_guild_sessions;
}

// User types
export interface User {
  id: number;
  email: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  tagline?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface MagicLink {
  id: number;
  email: string;
  token: string;
  expires_at: string;
  used_at?: string;
  created_at: string;
}

export interface UserSession {
  id: string;
  user_id: number;
  expires_at: string;
  created_at: string;
}

// Database queries
export async function getUserByEmail(
  db: D1Database,
  email: string
): Promise<User | null> {
  const result = await db
    .prepare("SELECT * FROM users WHERE email = ? AND is_active = 1")
    .bind(email)
    .first<User>();

  return result || null;
}

export async function createUser(
  db: D1Database,
  email: string,
  displayName?: string
): Promise<User> {
  const result = await db
    .prepare(
      `
    INSERT INTO users (email, display_name)
    VALUES (?, ?)
    RETURNING *
  `
    )
    .bind(email, displayName || null)
    .first<User>();

  if (!result) {
    throw new Error("Failed to create user");
  }

  return result;
}

export async function createMagicLink(
  db: D1Database,
  email: string,
  token: string,
  expiryMinutes: number = 15
): Promise<MagicLink> {
  const expiresAt = new Date(
    Date.now() + expiryMinutes * 60 * 1000
  ).toISOString();

  const result = await db
    .prepare(
      `
    INSERT INTO magic_links (email, token, expires_at)
    VALUES (?, ?, ?)
    RETURNING *
  `
    )
    .bind(email, token, expiresAt)
    .first<MagicLink>();

  if (!result) {
    throw new Error("Failed to create magic link");
  }

  return result;
}

export async function validateMagicLink(
  db: D1Database,
  token: string
): Promise<{ email: string; isValid: boolean }> {
  const magicLink = await db
    .prepare(
      `
    SELECT * FROM magic_links
    WHERE token = ? AND expires_at > datetime('now') AND used_at IS NULL
  `
    )
    .bind(token)
    .first<MagicLink>();

  if (!magicLink) {
    return { email: "", isValid: false };
  }

  // Mark the magic link as used
  await db
    .prepare(
      `
    UPDATE magic_links
    SET used_at = datetime('now')
    WHERE token = ?
  `
    )
    .bind(token)
    .run();

  return { email: magicLink.email, isValid: true };
}

export async function createUserSession(
  db: D1Database,
  kv: KVNamespace,
  userId: number,
  sessionId: string,
  expiryDays: number = 30
): Promise<UserSession> {
  const expiresAt = new Date(
    Date.now() + expiryDays * 24 * 60 * 60 * 1000
  ).toISOString();

  // Store in D1 as backup
  const session = await db
    .prepare(
      `
    INSERT INTO user_sessions (id, user_id, expires_at)
    VALUES (?, ?, ?)
    RETURNING *
  `
    )
    .bind(sessionId, userId, expiresAt)
    .first<UserSession>();

  if (!session) {
    throw new Error("Failed to create session");
  }

  // Store in KV for fast access
  await kv.put(
    `session:${sessionId}`,
    JSON.stringify({
      userId,
      expiresAt,
    }),
    {
      expirationTtl: expiryDays * 24 * 60 * 60, // TTL in seconds
    }
  );

  return session;
}

export async function getUserFromSession(
  db: D1Database,
  kv: KVNamespace,
  sessionId: string
): Promise<User | null> {
  // Try KV first for speed
  let sessionData = (await kv.get(`session:${sessionId}`, "json")) as {
    userId: number;
    expiresAt: string;
  } | null;

  if (!sessionData) {
    // Fallback to D1
    const session = await db
      .prepare(
        `
      SELECT * FROM user_sessions
      WHERE id = ? AND expires_at > datetime('now')
    `
      )
      .bind(sessionId)
      .first<UserSession>();

    if (!session) {
      return null;
    }

    sessionData = { userId: session.user_id, expiresAt: session.expires_at };
  }

  // Check if session is expired
  if (new Date(sessionData.expiresAt) < new Date()) {
    await deleteSession(db, kv, sessionId);
    return null;
  }

  // Get user
  const user = await db
    .prepare("SELECT * FROM users WHERE id = ? AND is_active = 1")
    .bind(sessionData.userId)
    .first<User>();

  return user || null;
}

export async function deleteSession(
  db: D1Database,
  kv: KVNamespace,
  sessionId: string
): Promise<void> {
  // Remove from KV
  await kv.delete(`session:${sessionId}`);

  // Remove from D1
  await db
    .prepare("DELETE FROM user_sessions WHERE id = ?")
    .bind(sessionId)
    .run();
}

export async function cleanupExpiredMagicLinks(db: D1Database): Promise<void> {
  await db
    .prepare("DELETE FROM magic_links WHERE expires_at < datetime('now')")
    .run();
}

export async function cleanupExpiredSessions(db: D1Database): Promise<void> {
  await db
    .prepare("DELETE FROM user_sessions WHERE expires_at < datetime('now')")
    .run();
}
