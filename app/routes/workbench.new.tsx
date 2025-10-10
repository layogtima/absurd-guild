import {
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  redirect,
  Form,
  useLoaderData,
  useNavigation,
  Link,
} from "react-router";
import { getDB, getKV, getEnv } from "~/lib/db.server";
import { requireAuth, createAuthService } from "~/lib/auth.server";
import { createProject } from "~/lib/workbench.server";
import { Layout } from "~/components/Layout";
import { Navigation } from "~/components/Navigation";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const db = getDB(context);
  const kv = getKV(context);
  const env = getEnv(context);
  const authService = createAuthService(db, kv, env);

  const user = await requireAuth(request, authService);

  return { user };
}

export async function action({ request, context }: ActionFunctionArgs) {
  const db = getDB(context);
  const kv = getKV(context);
  const env = getEnv(context);
  const authService = createAuthService(db, kv, env);

  const user = await requireAuth(request, authService);

  const formData = await request.formData();

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const category = formData.get("category") as string;
  const status = formData.get("status") as string;
  const visibility = formData.get("visibility") as string;

  // Basic validation
  if (!title) {
    return { error: "Title is required" };
  }

  // Create the project
  const project = await createProject(db, {
    user_id: user.id,
    title,
    description: description || undefined,
    category: category || undefined,
    status: status || "planning",
    visibility: visibility || "private",
  });

  // Redirect to the project page
  return redirect(`/workbench/${project.id}`);
}

export default function NewProjectPage() {
  const { user } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <Layout>
      <Navigation user={user} />
      <div className="min-h-screen bg-primary py-8">
        <div className="max-w-3xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">
              Create New Project
            </h1>
            <p className="text-secondary">
              Start a new hardware project and track your components
            </p>
          </div>

          {/* Form */}
          <div className="bg-secondary rounded-lg shadow-md p-6">
            <Form method="post" className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-primary mb-2">
                  Project Title <span className="text-orange-600">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g., Arduino Temperature Monitor, LED Cube"
                  className="w-full px-4 py-2 border-2 border-theme rounded-lg bg-primary text-primary focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-primary mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Brief description of your project..."
                  className="w-full px-4 py-2 border-2 border-theme rounded-lg bg-primary text-primary focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-primary mb-2">
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  placeholder="e.g., IoT, Robotics, Audio, Lighting"
                  className="w-full px-4 py-2 border-2 border-theme rounded-lg bg-primary text-primary focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Status & Visibility */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-primary mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    defaultValue="planning"
                    className="w-full px-4 py-2 border-2 border-theme rounded-lg bg-primary text-primary focus:outline-none focus:border-orange-500"
                  >
                    <option value="planning">Planning</option>
                    <option value="prototyping">Prototyping</option>
                    <option value="testing">Testing</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-primary mb-2">
                    Visibility
                  </label>
                  <select
                    name="visibility"
                    defaultValue="private"
                    className="w-full px-4 py-2 border-2 border-theme rounded-lg bg-primary text-primary focus:outline-none focus:border-orange-500"
                  >
                    <option value="private">Private</option>
                    <option value="unlisted">Unlisted</option>
                    <option value="public">Public</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="accent-orange text-on-accent px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Creating Project..." : "Create Project"}
                </button>
                <Link
                  to="/workbench"
                  className="bg-secondary text-primary border-2 border-theme px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:border-orange-500 hover:-translate-y-1"
                >
                  Cancel
                </Link>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
