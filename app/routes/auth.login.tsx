import { type ActionFunctionArgs, type LoaderFunctionArgs, redirect } from "react-router";
import { Form, useActionData, useNavigation, useSearchParams } from "react-router";
import { getDB, getKV } from "~/lib/db.server";
import { createAuthService, getOptionalAuth } from "~/lib/auth.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const db = getDB(context);
  const kv = getKV(context);
  const authService = createAuthService(db, kv);

  // If already logged in, redirect to home or intended destination
  const user = await getOptionalAuth(request, authService);
  if (user) {
    const url = new URL(request.url);
    const redirectTo = url.searchParams.get("redirectTo") || "/";
    return redirect(redirectTo);
  }

  return {};
}

export async function action({ request, context }: ActionFunctionArgs) {
  const db = getDB(context);
  const kv = getKV(context);
  const authService = createAuthService(db, kv);

  const formData = await request.formData();
  const email = formData.get("email") as string;

  if (!email) {
    return { error: "Email is required", success: false };
  }

  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  const result = await authService.sendMagicLink(email, baseUrl);

  return result;
}

export default function Login() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");

  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto accent-orange rounded-2xl flex items-center justify-center mb-6">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10">
              <defs>
                <radialGradient id="nucleusGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFB347" />
                  <stop offset="100%" stopColor="#FF6B35" />
                </radialGradient>
              </defs>
              <g transform="translate(100,100)">
                <ellipse cx="0" cy="0" rx="50" ry="15" fill="none" stroke="#40E0D0" strokeWidth="2" opacity="0.8"/>
                <ellipse cx="0" cy="0" rx="50" ry="15" fill="none" stroke="#40E0D0" strokeWidth="2" opacity="0.8" transform="rotate(60)"/>
                <ellipse cx="0" cy="0" rx="50" ry="15" fill="none" stroke="#40E0D0" strokeWidth="2" opacity="0.8" transform="rotate(120)"/>
              </g>
              <circle cx="100" cy="100" r="15" fill="url(#nucleusGradient)"/>
            </svg>
          </div>
          <h2 className="text-4xl font-bold text-primary mb-2">Welcome Back</h2>
          <p className="text-lg text-secondary">
            Sign in to join the Absurd Guild
          </p>
        </div>

        <div className="bg-secondary rounded-3xl border-2 border-theme p-8">
          {actionData?.success ? (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-primary mb-2">Check Your Email</h3>
                <p className="text-secondary">
                  {actionData.message}
                </p>
              </div>
              <div className="text-sm text-secondary bg-tertiary rounded-xl p-4">
                <strong>Didn't receive the email?</strong><br/>
                Check your spam folder or try signing in again.
              </div>
            </div>
          ) : (
            <Form method="post" className="space-y-6">
              {redirectTo && (
                <input type="hidden" name="redirectTo" value={redirectTo} />
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-bold text-primary mb-3">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full bg-tertiary border-2 border-theme rounded-xl p-4 text-primary focus:border-orange-300 outline-none transition-all"
                  placeholder="your@email.com"
                />
                {actionData?.error && (
                  <p className="mt-2 text-sm text-red-600">{actionData.error}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full accent-orange text-on-accent py-4 rounded-xl text-lg font-bold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending Magic Link...
                  </span>
                ) : (
                  "Send Magic Link"
                )}
              </button>

              <div className="text-center">
                <p className="text-sm text-secondary">
                  We'll send you a secure link to sign in instantly.
                  <br />
                  No passwords, no hassle.
                </p>
              </div>
            </Form>
          )}
        </div>

        <div className="text-center">
          <a
            href="/"
            className="text-secondary hover:text-primary transition-colors text-sm"
          >
            ← Back to Absurd Guild
          </a>
        </div>
      </div>
    </div>
  );
}