import { type LoaderFunctionArgs, Link, useLoaderData } from "react-router";
import { getDB, getKV, getEnv } from "~/lib/db.server";
import { requireAuth, createAuthService } from "~/lib/auth.server";
import { getUserProjects } from "~/lib/workbench.server";
import { Layout } from "~/components/Layout";
import { Navigation } from "~/components/Navigation";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const db = getDB(context);
  const kv = getKV(context);
  const env = getEnv(context);
  const authService = createAuthService(db, kv, env);

  // Require authentication for workbench
  const user = await requireAuth(request, authService);

  // Get user's projects
  const projects = await getUserProjects(db, user.id);

  return {
    user,
    projects,
  };
}

export default function WorkbenchPage() {
  const { user, projects } = useLoaderData<typeof loader>();

  return (
    <Layout>
      <Navigation user={user} />
      <div className="min-h-screen bg-primary py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-primary">My Workbench</h1>
              <Link
                to="/workbench/new"
                className="accent-orange text-on-accent px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
              >
                + New Project
              </Link>
            </div>
            <p className="text-secondary">
              Manage your hardware projects from planning to completion
            </p>
          </div>

          {/* Projects Grid */}
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  to={`/workbench/${project.id}`}
                  className="bg-secondary rounded-lg overflow-hidden border-2 border-theme hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-orange-500"
                >
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`text-xs px-2 py-1 rounded font-semibold uppercase ${
                          project.status === "completed"
                            ? "bg-green-500 text-white"
                            : project.status === "prototyping"
                              ? "bg-blue-500 text-white"
                              : "bg-accent-orange text-on-accent"
                        }`}
                      >
                        {project.status}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          project.visibility === "public"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {project.visibility}
                      </span>
                      {project.category && (
                        <span className="text-xs px-2 py-1 rounded bg-tertiary text-secondary">
                          {project.category}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-semibold text-primary mb-2">
                      {project.title}
                    </h3>

                    {project.description && (
                      <p className="text-sm text-secondary line-clamp-3 mb-4">
                        {project.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-secondary">
                      <span>v{project.version}</span>
                      <span>
                        Updated{" "}
                        {new Date(project.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-secondary rounded-lg">
              <div className="text-6xl mb-4">🔧</div>
              <h3 className="text-xl font-semibold text-primary mb-2">
                No projects yet
              </h3>
              <p className="text-secondary mb-6">
                Start your first hardware project and track all your components
              </p>
              <Link
                to="/workbench/new"
                className="inline-block accent-orange text-on-accent px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
              >
                Create Your First Project
              </Link>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
