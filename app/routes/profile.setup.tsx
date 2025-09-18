import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from "react-router";
import { requireAuth, createAuthService } from "~/lib/auth.server";
import { getDB, getKV } from "~/lib/db.server";
import { getMakerProfile, createMakerProfile } from "~/lib/makers.server";
import { useState } from "react";
import { useActionData } from "react-router";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const db = getDB(context);
  const kv = getKV(context);
  const authService = createAuthService(db, kv);

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
  const authService = createAuthService(db, kv);

  const user = await requireAuth(request, authService);
  const formData = await request.formData();

  const makerName = formData.get("makerName") as string;
  const displayName = formData.get("displayName") as string;
  const bio = formData.get("bio") as string;
  const avatarUrl = formData.get("avatarUrl") as string;

  if (!makerName?.trim()) {
    return { error: "Maker name is required" };
  }

  try {
    await createMakerProfile(db, user.id, {
      makerName,
      displayName,
      bio,
      avatarUrl,
    });

    return redirect("/profile");
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to create profile",
    };
  }
}

export default function ProfileSetup() {
  const actionData = useActionData<typeof action>();
  const [formData, setFormData] = useState({
    makerName: "",
    displayName: "",
    bio: "",
    avatarUrl: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Setup Your Maker Profile
        </h1>

        {actionData?.error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {actionData.error}
          </div>
        )}

        <form method="post" className="space-y-6">
          <div>
            <label
              htmlFor="makerName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Maker Name *
            </label>
            <input
              type="text"
              id="makerName"
              name="makerName"
              value={formData.makerName}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your unique maker username"
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be your public username (e.g., /maker/yourname)
            </p>
          </div>

          <div>
            <label
              htmlFor="displayName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Display Name
            </label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your full name or brand name"
            />
          </div>

          <div>
            <label
              htmlFor="bio"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tell us about yourself and what you make..."
            />
          </div>

          <div>
            <label
              htmlFor="avatarUrl"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Profile Photo URL
            </label>
            <input
              type="url"
              id="avatarUrl"
              name="avatarUrl"
              value={formData.avatarUrl}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/your-photo.jpg"
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional: Add a link to your profile photo
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            Create Profile
          </button>
        </form>
      </div>
    </div>
  );
}
