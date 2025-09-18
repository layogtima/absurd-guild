import {
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  redirect,
  Form,
  useSearchParams,
  Link,
} from "react-router";
import { requireAuth, createAuthService } from "~/lib/auth.server";
import { getDB, getKV, getEnv } from "~/lib/db.server";
import {
  getFullMakerProfile,
  updateMakerProfile,
  addProfileLink,
  deleteProfileLink,
} from "~/lib/makers.server";
import { useLoaderData, useActionData } from "react-router";
import { Layout } from "~/components/Layout";
import { Navigation } from "~/components/Navigation";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const db = getDB(context);
  const kv = getKV(context);
  const env = getEnv(context);
  const authService = createAuthService(db, kv, env);

  const user = await requireAuth(request, authService);

  // Get user profile with links
  const profile = await getFullMakerProfile(db, user.id);

  if (!profile) {
    return redirect("/profile/setup");
  }

  return { profile, user };
}

export async function action({ request, context }: ActionFunctionArgs) {
  try {
    // console.log("=== ACTION START ===");

    const db = getDB(context);
    const kv = getKV(context);
    const env = getEnv(context);
    const authService = createAuthService(db, kv, env);

    const user = await requireAuth(request, authService);
    const formData = await request.formData();
    // console.log("FormData entries:", Array.from(formData.entries()));

    const action = formData.get("_action") as string;

    // console.log("Parsed values:", { action });

    if (action === "updateProfile") {
      // console.log("Handling updateProfile action");
      const displayName = formData.get("displayName") as string;
      const bio = formData.get("bio") as string;
      const avatarUrl = formData.get("avatarUrl") as string;

      try {
        await updateMakerProfile(db, user.id, {
          displayName,
          bio,
          avatarUrl,
        });

        // console.log("Profile updated successfully, redirecting...");
        // Redirect to profile with success message (removes edit-profile automatically)
        return redirect("/profile?success=Profile+updated+successfully");
      } catch (error) {
        console.error("Error updating profile:", error);
        return {
          error:
            error instanceof Error ? error.message : "Failed to update profile",
        };
      }
    }

    if (action === "addLink") {
      // console.log("Handling addLink action");
      const title = formData.get("linkTitle") as string;
      const linkUrl = formData.get("linkUrl") as string;

      // console.log("Link data:", { title, linkUrl });

      if (!title?.trim() || !linkUrl?.trim()) {
        // console.log("Validation failed: missing title or URL");
        return { error: "Both title and URL are required" };
      }

      try {
        await addProfileLink(db, user.id, title, linkUrl);
        // console.log("Link added successfully, redirecting...");
        // Redirect to profile with success message (removes add-link automatically)
        return redirect("/profile?success=Link+added+successfully");
      } catch (error) {
        console.error("Error adding link:", error);
        return {
          error: error instanceof Error ? error.message : "Failed to add link",
        };
      }
    }

    if (action === "deleteLink") {
      // console.log("Handling deleteLink action");
      const linkId = parseInt(formData.get("linkId") as string);
      // console.log("Deleting link ID:", linkId);

      try {
        await deleteProfileLink(db, user.id, linkId);
        // console.log("Link deleted successfully");
        return { success: "Link deleted successfully" };
      } catch (error) {
        console.error("Error deleting link:", error);
        return {
          error:
            error instanceof Error ? error.message : "Failed to delete link",
        };
      }
    }

    // console.log("No action matched, returning invalid action error");
    return { error: "Invalid action" };
  } catch (error) {
    console.error("=== UNEXPECTED ERROR IN ACTION ===", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack"
    );
    return {
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export default function Profile() {
  const { profile, user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const [searchParams] = useSearchParams();
  const editingProfile = searchParams.get("edit-profile") === "true";
  const addingLink = searchParams.get("add-link") === "true";
  const successMessage = searchParams.get("success");
  const errorMessage = searchParams.get("error");

  return (
    <Layout>
      <Navigation user={user} />
      <div className="min-h-screen bg-primary py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Success/Error Messages */}
          {(successMessage || actionData?.success) && (
            <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-300 px-4 py-3 rounded mb-4 flex items-center justify-between">
              <span>{successMessage || actionData?.success}</span>
              <Link
                to="/profile"
                className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 font-medium text-sm"
              >
                ✕
              </Link>
            </div>
          )}
          {(errorMessage || actionData?.error) && (
            <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4 flex items-center justify-between">
              <span>{errorMessage || actionData?.error}</span>
              <Link
                to="/profile"
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 font-medium text-sm"
              >
                ✕
              </Link>
            </div>
          )}

          {/* Header */}
          <div className="bg-secondary rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 w-20 h-20 bg-tertiary rounded-full flex items-center justify-center overflow-hidden">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={
                        profile.display_name || profile.maker_name || "Profile"
                      }
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-secondary text-2xl">👤</span>
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-primary">
                    {profile.display_name || profile.maker_name}
                  </h1>
                  <p className="text-secondary">@{profile.maker_name}</p>
                  {profile.bio && (
                    <p className="text-primary mt-2">{profile.bio}</p>
                  )}
                </div>
              </div>
              {editingProfile ? (
                <Link
                  to="/profile"
                  className="border px-4 py-2 rounded-md hover:bg-orange-600"
                >
                  Cancel
                </Link>
              ) : (
                <Link
                  to="?edit-profile=true"
                  className="accent-orange text-on-accent px-4 py-2 rounded-md hover:bg-orange-600 flex-shrink-0"
                >
                  Edit Profile
                </Link>
              )}
            </div>
          </div>

          {/* Profile Form */}
          {editingProfile && (
            <div className="bg-secondary rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4 text-primary">
                Edit Profile
              </h2>
              <Form method="post" className="space-y-4">
                <input type="hidden" name="_action" value="updateProfile" />

                <div>
                  <label className="block text-sm font-medium text-primary mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    name="displayName"
                    defaultValue={profile.display_name || ""}
                    className="w-full px-3 py-2 border border-theme rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-primary text-primary"
                    placeholder="Your full name or brand name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-1">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    defaultValue={profile.bio || ""}
                    rows={3}
                    className="w-full px-3 py-2 border border-theme rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-primary text-primary"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-1">
                    Profile Photo URL
                  </label>
                  <input
                    type="url"
                    name="avatarUrl"
                    defaultValue={profile.avatar_url || ""}
                    className="w-full px-3 py-2 border border-theme rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-primary text-primary"
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="accent-orange text-on-accent px-4 py-2 rounded-md hover:bg-orange-600"
                  >
                    Save Changes
                  </button>
                  <Link
                    to="/profile"
                    className="border acc0ent-orange  px-4 py-2 rounded-md hover:bg-orange-600"
                  >
                    Cancel
                  </Link>
                </div>
              </Form>
            </div>
          )}

          {/* Profile Links */}
          <div className="bg-secondary rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-primary">
                Profile Links
              </h2>
              {addingLink ? (
                <Link
                  to="/profile"
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Cancel
                </Link>
              ) : (
                <Link
                  to="?add-link=true"
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Add Link
                </Link>
              )}
            </div>

            {/* Add Link Form */}
            {addingLink && (
              <Form method="post" className="bg-tertiary p-4 rounded-md mb-4">
                <input type="hidden" name="_action" value="addLink" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      name="linkTitle"
                      className="w-full px-3 py-2 border border-theme rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-primary text-primary"
                      placeholder="e.g., Website, GitHub, Instagram"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1">
                      URL
                    </label>
                    <input
                      type="url"
                      name="linkUrl"
                      className="w-full px-3 py-2 border border-theme rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-primary text-primary"
                      placeholder="https://example.com"
                      required
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                  >
                    Add Link
                  </button>
                </div>
              </Form>
            )}

            {/* Links List */}
            <div className="space-y-2">
              {profile.links && profile.links.length > 0 ? (
                profile.links.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-3 bg-tertiary rounded-md"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-primary">
                        {link.title}
                      </span>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="accent-orange-text hover:text-orange-600 text-sm"
                      >
                        {link.url}
                      </a>
                    </div>
                    <form method="post" className="inline">
                      <input type="hidden" name="_action" value="deleteLink" />
                      <input type="hidden" name="linkId" value={link.id} />
                      <button
                        type="submit"
                        className="text-red-600 hover:text-red-800 text-sm"
                        onClick={(e) => {
                          if (
                            !confirm(
                              "Are you sure you want to delete this link?"
                            )
                          ) {
                            e.preventDefault();
                          }
                        }}
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                ))
              ) : (
                <div className="text-sm text-secondary">
                  No links added yet. Add some links to showcase your work!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
