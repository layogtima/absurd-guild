import { type ActionFunctionArgs, redirect } from "react-router";
import { getDB, getKV } from "~/lib/db.server";
import { createAuthService, getSessionFromCookie, clearSessionCookie } from "~/lib/auth.server";

export async function action({ request, context }: ActionFunctionArgs) {
  const db = getDB(context);
  const kv = getKV(context);
  const authService = createAuthService(db, kv);

  // Get session from cookie
  const sessionId = getSessionFromCookie(request.headers.get("Cookie"));

  if (sessionId) {
    await authService.logout(sessionId);
  }

  // Redirect to login with cleared cookie
  return redirect("/auth/login", {
    headers: {
      "Set-Cookie": clearSessionCookie()
    }
  });
}

export async function loader() {
  // If someone tries to GET this route, redirect to login
  return redirect("/auth/login");
}