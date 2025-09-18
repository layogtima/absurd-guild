import { type LoaderFunctionArgs, redirect } from "react-router";
import { getDB, getKV, getEnv } from "~/lib/db.server";
import { createAuthService, createSessionCookie } from "~/lib/auth.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const db = getDB(context);
  const kv = getKV(context);
  const env = getEnv(context);
  const authService = createAuthService(db, kv, env);

  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return redirect("/auth/login?error=invalid-token");
  }

  // Verify the magic link
  const { user, sessionId } = await authService.verifyMagicLink(token);

  if (!user || !sessionId) {
    return redirect("/auth/login?error=expired-token");
  }

  // Get the redirect destination
  const redirectTo = url.searchParams.get("redirectTo") || "/";

  // Set session cookie and redirect
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": createSessionCookie(sessionId)
    }
  });
}

// This component shouldn't render since we always redirect
export default function Verify() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-primary">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto"></div>
        <p className="mt-4 text-xl text-primary">Verifying your magic link...</p>
      </div>
    </div>
  );
}