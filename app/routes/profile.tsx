import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from "react-router";
import { requireAuth, createAuthService } from "~/lib/auth.server";
import { getDB, getKV } from "~/lib/db.server";
import {
  getFullMakerProfile,
  updateMakerProfile,
  addProfileLink,
  deleteProfileLink,
} from "~/lib/makers.server";
import { useState } from "react";
import { useLoaderData, useActionData } from "react-router";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const db = getDB(context);
  const kv = getKV(context);
  const authService = createAuthService(db, kv);

  const user = await requireAuth(request, authService);

  // Get user profile with links
  const profile = await getFullMakerProfile(db, user.id);

  if (!profile) {
    return redirect("/profile/setup");
  }

  return { profile };
}

export async function action({ request, context }: ActionFunctionArgs) {
  const db = getDB(context);
  const kv = getKV(context);
  const authService = createAuthService(db, kv);

  const user = await requireAuth(request, authService);
  const formData = await request.formData();

  const action = formData.get("_action") as string;

  if (action === "updateProfile") {
    const displayName = formData.get("displayName") as string;
    const bio = formData.get("bio") as string;
    const avatarUrl = formData.get("avatarUrl") as string;

    try {
      await updateMakerProfile(db, user.id, {
        displayName,
        bio,
        avatarUrl,
      });

      return { success: "Profile updated successfully" };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Failed to update profile",
      };
    }
  }

  if (action === "addLink") {
    const title = formData.get("linkTitle") as string;
    const url = formData.get("linkUrl") as string;

    if (!title?.trim() || !url?.trim()) {
      return { error: "Both title and URL are required" };
    }

    try {
      await addProfileLink(db, user.id, title, url);
      return { success: "Link added successfully" };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Failed to add link",
      };
    }
  }

  if (action === "deleteLink") {
    const linkId = parseInt(formData.get("linkId") as string);

    try {
      await deleteProfileLink(db, user.id, linkId);
      return { success: "Link deleted successfully" };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Failed to delete link",
      };
    }
  }

  return { error: "Invalid action" };
}

export default function Profile() {
  const { profile } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [editing, setEditing] = useState(false);
  const [addingLink, setAddingLink] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Success/Error Messages */}
        {actionData?.success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {actionData.success}
          </div>
        )}
        {actionData?.error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {actionData.error}
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={
                      profile.display_name || profile.maker_name || "Profile"
                    }
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-500 text-2xl">👤</span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile.display_name || profile.maker_name}
                </h1>
                <p className="text-gray-600">@{profile.maker_name}</p>
                {profile.bio && (
                  <p className="text-gray-700 mt-2">{profile.bio}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setEditing(!editing)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              {editing ? "Cancel" : "Edit Profile"}
            </button>
          </div>
        </div>

        {/* Profile Form */}
        {editing && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Edit Profile</h2>
            <form method="post" className="space-y-4">
              <input type="hidden" name="_action" value="updateProfile" />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  name="displayName"
                  defaultValue={profile.display_name || ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your full name or brand name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  name="bio"
                  defaultValue={profile.bio || ""}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profile Photo URL
                </label>
                <input
                  type="url"
                  name="avatarUrl"
                  defaultValue={profile.avatar_url || ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/photo.jpg"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Profile Links */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Profile Links</h2>
            <button
              onClick={() => setAddingLink(!addingLink)}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              {addingLink ? "Cancel" : "Add Link"}
            </button>
          </div>

          {/* Add Link Form */}
          {addingLink && (
            <form method="post" className="bg-gray-50 p-4 rounded-md mb-4">
              <input type="hidden" name="_action" value="addLink" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    name="linkTitle"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Website, GitHub, Instagram"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL
                  </label>
                  <input
                    type="url"
                    name="linkUrl"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            </form>
          )}

          {/* Links List */}
          <div className="space-y-2">
            {profile.links && profile.links.length > 0 ? (
              profile.links.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-900">
                      {link.title}
                    </span>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
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
                          !confirm("Are you sure you want to delete this link?")
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
              <div className="text-sm text-gray-500">
                No links added yet. Add some links to showcase your work!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
