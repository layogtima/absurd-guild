// Authentication utilities
import { redirect } from "react-router";
import {
  getUserByEmail,
  createUser,
  createMagicLink,
  validateMagicLink,
  createUserSession,
  getUserFromSession,
  deleteSession,
  type User
} from "./db.server";

// Generate a secure random token
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Generate session ID
function generateSessionId(): string {
  return generateToken();
}

// Email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Send magic link email (placeholder - implement with your email service)
async function sendMagicLinkEmail(email: string, magicLink: string): Promise<void> {
  // TODO: Implement with your email service (SendGrid, Resend, etc.)
  console.log(`Magic link for ${email}: ${magicLink}`);

  // For development, you might want to log this or use a service like Mailtrap
  // In production, replace with actual email sending logic
}

export interface AuthService {
  sendMagicLink: (email: string, baseUrl: string) => Promise<{ success: boolean; message: string }>;
  verifyMagicLink: (token: string) => Promise<{ user: User | null; sessionId: string | null }>;
  getCurrentUser: (sessionId: string | null) => Promise<User | null>;
  logout: (sessionId: string) => Promise<void>;
}

export function createAuthService(
  db: D1Database,
  kv: KVNamespace
): AuthService {
  return {
    async sendMagicLink(email: string, baseUrl: string) {
      if (!isValidEmail(email)) {
        return { success: false, message: "Please enter a valid email address" };
      }

      try {
        // Generate magic link token
        const token = generateToken();

        // Create magic link in database
        await createMagicLink(db, email, token, 15); // 15 minutes expiry

        // Construct magic link URL
        const magicLinkUrl = `${baseUrl}/auth/verify?token=${token}`;

        // Send email
        await sendMagicLinkEmail(email, magicLinkUrl);

        return {
          success: true,
          message: "Magic link sent! Check your email and click the link to sign in."
        };
      } catch (error) {
        console.error("Error sending magic link:", error);
        return {
          success: false,
          message: "Failed to send magic link. Please try again."
        };
      }
    },

    async verifyMagicLink(token: string) {
      try {
        const { email, isValid } = await validateMagicLink(db, token);

        if (!isValid) {
          return { user: null, sessionId: null };
        }

        // Get or create user
        let user = await getUserByEmail(db, email);
        if (!user) {
          user = await createUser(db, email);
        }

        // Create session
        const sessionId = generateSessionId();
        await createUserSession(db, kv, user.id, sessionId, 30); // 30 days

        return { user, sessionId };
      } catch (error) {
        console.error("Error verifying magic link:", error);
        return { user: null, sessionId: null };
      }
    },

    async getCurrentUser(sessionId: string | null) {
      if (!sessionId) {
        return null;
      }

      try {
        return await getUserFromSession(db, kv, sessionId);
      } catch (error) {
        console.error("Error getting current user:", error);
        return null;
      }
    },

    async logout(sessionId: string) {
      try {
        await deleteSession(db, kv, sessionId);
      } catch (error) {
        console.error("Error during logout:", error);
      }
    }
  };
}

// Cookie management
const SESSION_COOKIE_NAME = "absurd_session";

export function createSessionCookie(sessionId: string): string {
  return `${SESSION_COOKIE_NAME}=${sessionId}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${30 * 24 * 60 * 60}`; // 30 days
}

export function getSessionFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map(c => c.trim());
  const sessionCookie = cookies.find(c => c.startsWith(`${SESSION_COOKIE_NAME}=`));

  if (!sessionCookie) return null;

  return sessionCookie.split('=')[1];
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

// Higher-order function to require authentication
export async function requireAuth(
  request: Request,
  authService: AuthService
): Promise<User> {
  const sessionId = getSessionFromCookie(request.headers.get("Cookie"));
  const user = await authService.getCurrentUser(sessionId);

  if (!user) {
    const url = new URL(request.url);
    const redirectTo = url.pathname + url.search;
    throw redirect(`/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  return user;
}

// Optional auth - doesn't redirect if not authenticated
export async function getOptionalAuth(
  request: Request,
  authService: AuthService
): Promise<User | null> {
  const sessionId = getSessionFromCookie(request.headers.get("Cookie"));
  return await authService.getCurrentUser(sessionId);
}