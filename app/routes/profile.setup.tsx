import { type ActionFunctionArgs, type LoaderFunctionArgs, redirect } from "react-router";
import { requireAuth, createAuthService } from "~/lib/auth.server";
import { getDB, getKV, getEnv } from "~/lib/db.server";
import { getMakerProfile, createMakerProfile } from "~/lib/makers.server";
import { useSearchParams, Link, useLoaderData } from "react-router";
import { Layout } from "~/components/Layout";
import { Navigation } from "~/components/Navigation";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const db = getDB(context);
  const kv = getKV(context);
  const env = getEnv(context);
  const authService = createAuthService(db, kv, env);

  const user = await requireAuth(request, authService);

  // Check if user already has a profile
  const profile = await getMakerProfile(db, user.id);

  if (profile) {
    return redirect("/profile");
  }

  return { user };
}

export async function action({ request, context }: ActionFunctionArgs) {
  const db = getDB(context);
  const kv = getKV(context);
  const env = getEnv(context);
  const authService = createAuthService(db, kv, env);

  const user = await requireAuth(request, authService);
  const formData = await request.formData();

  const makerName = formData.get("makerName") as string;
  const displayName = formData.get("displayName") as string;
  const bio = formData.get("bio") as string;
  const avatarUrl = formData.get("avatarUrl") as string;

  if (!makerName?.trim()) {
    return redirect("/profile/setup?error=Maker name is required");
  }

  try {
    await createMakerProfile(db, user.id, {
      makerName,
      displayName,
      bio,
      avatarUrl,
    });

    return redirect("/profile?success=Profile created successfully");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to create profile";
    return redirect(`/profile/setup?error=${encodeURIComponent(errorMessage)}`);
  }
}

export default function ProfileSetup() {
  const { user } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const error = searchParams.get("error");
  const success = searchParams.get("success");

  return (
    <Layout>
      <Navigation user={user} />
      <div className="min-h-screen bg-primary py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Success/Error Messages */}
          {error && (
            <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4 flex items-center justify-between">
              <span>{error}</span>
              <Link
                to="/profile/setup"
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 font-medium text-sm"
              >
                ✕
              </Link>
            </div>
          )}

          {success && (
            <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-300 px-4 py-3 rounded mb-4 flex items-center justify-between">
              <span>{success}</span>
              <Link
                to="/profile/setup"
                className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 font-medium text-sm"
              >
                ✕
              </Link>
            </div>
          )}

          {/* Setup Form */}
          <div className="bg-secondary rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold text-primary mb-6">
              Setup Your Maker Profile
            </h1>

            <form method="post" className="space-y-6">
              <div>
                <label
                  htmlFor="makerName"
                  className="block text-sm font-medium text-primary mb-2"
                >
                  Maker Name *
                </label>
                <input
                  type="text"
                  id="makerName"
                  name="makerName"
                  defaultValue={searchParams.get("makerName") || ""}
                  required
                  className="w-full px-3 py-2 border border-tertiary rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-primary text-primary"
                  placeholder="Your unique maker username"
                />
                <p className="text-xs text-secondary mt-1">
                  This will be your public username (e.g., /maker/yourname)
                </p>
              </div>

              <div>
                <label
                  htmlFor="displayName"
                  className="block text-sm font-medium text-primary mb-2"
                >
                  Display Name
                </label>
                <input
                  type="text"
                  id="displayName"
                  name="displayName"
                  defaultValue={searchParams.get("displayName") || ""}
                  className="w-full px-3 py-2 border border-tertiary rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-primary text-primary"
                  placeholder="Your full name or brand name"
                />
              </div>

              <div>
                <label
                  htmlFor="bio"
                  className="block text-sm font-medium text-primary mb-2"
                >
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  defaultValue={searchParams.get("bio") || ""}
                  rows={3}
                  className="w-full px-3 py-2 border border-tertiary rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-primary text-primary"
                  placeholder="Tell us about yourself and what you make..."
                />
              </div>

              <div>
                <label
                  htmlFor="avatarUrl"
                  className="block text-sm font-medium text-primary mb-2"
                >
                  Profile Photo URL
                </label>
                <input
                  type="url"
                  id="avatarUrl"
                  name="avatarUrl"
                  defaultValue={searchParams.get("avatarUrl") || ""}
                  className="w-full px-3 py-2 border border-tertiary rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-primary text-primary"
                  placeholder="https://example.com/your-photo.jpg"
                />
                <p className="text-xs text-secondary mt-1">
                  Optional: Add a link to your profile photo
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
              >
                Create Profile
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
