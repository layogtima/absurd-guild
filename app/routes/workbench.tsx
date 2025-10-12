import { type LoaderFunctionArgs, Link, useLoaderData } from "react-router";
import { requireAuth, createAuthService } from "~/lib/auth.server";
import { getDB, getKV, getEnv } from "~/lib/db.server";
import { getUserProjects } from "~/lib/workbench.server";
import { Layout } from "~/components/Layout";
import { Navigation } from "~/components/Navigation";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const db = getDB(context);
  const kv = getKV(context);
  const env = getEnv(context);
  const authService = createAuthService(db, kv, env);

  const user = await requireAuth(request, authService);

  // Get user projects from workbench
  const projects = await getUserProjects(db, user.id);

  return {
    user,
    projects,
  };
}

export default function Dashboard() {
  const { user, projects } = useLoaderData<typeof loader>();

  // Calculate stats
  const totalProjects = projects.length;
  const privateProjects = projects.filter((p) => p.visibility === "private").length;
  const publicProjects = projects.filter((p) => p.visibility === "public").length;
  const completedProjects = projects.filter((p) => p.status === "completed").length;

  return (
    <Layout>
      <Navigation user={user} />
      <div className="min-h-screen bg-primary py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Dashboard Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">Workbench</h1>
            <p className="text-secondary">Manage your hardware projects from conception to completion</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-secondary rounded-lg shadow-md p-6 text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {totalProjects}
              </div>
              <div className="text-sm text-secondary">Total Projects</div>
            </div>
            <div className="bg-secondary rounded-lg shadow-md p-6 text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {projects.filter((p) => ["planning", "prototyping", "testing"].includes(p.status)).length}
              </div>
              <div className="text-sm text-secondary">In Progress</div>
            </div>
            <div className="bg-secondary rounded-lg shadow-md p-6 text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {completedProjects}
              </div>
              <div className="text-sm text-secondary">Completed</div>
            </div>
            <div className="bg-secondary rounded-lg shadow-md p-6 text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {publicProjects}
              </div>
              <div className="text-sm text-secondary">Public</div>
            </div>
          </div>

          {/* Projects Section */}
          <div className="bg-secondary rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-primary">Your Projects</h2>
              <Link
                to="/workbench/new"
                className="accent-orange text-on-accent px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
              >
                + New Project
              </Link>
            </div>

            {projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <Link
                    key={project.id}
                    to={`/workbench/${project.id}`}
                    className="bg-tertiary rounded-lg overflow-hidden border border-theme hover:shadow-lg transition-all hover:-translate-y-1"
                  >
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`text-xs px-2 py-1 rounded font-semibold uppercase ${
                            project.status === "completed"
                              ? "bg-green-500 text-white"
                              : "bg-accent-orange text-on-accent"
                          }`}
                        >
                          {project.status}
                        </span>
                        <span className="text-xs px-2 py-1 rounded bg-tertiary text-secondary">
                          {project.visibility}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-primary mb-2">
                        {project.title}
                      </h3>
                      {project.description && (
                        <p className="text-secondary text-sm mb-3 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                      <div className="text-xs text-secondary">
                        {project.category && (
                          <span className="inline-block bg-primary px-2 py-1 rounded mr-2">
                            {project.category}
                          </span>
                        )}
                        {project.is_open_source && (
                          <span className="inline-block bg-primary px-2 py-1 rounded">
                            Open Source
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔧</div>
                <h3 className="text-xl font-semibold text-primary mb-2">
                  No projects yet
                </h3>
                <p className="text-secondary mb-6">
                  Start building by creating your first project in the workbench.
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

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <Link
              to="/items"
              className="bg-secondary rounded-lg shadow-md p-6 hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <h3 className="text-xl font-bold text-primary mb-2">Browse Items Library</h3>
              <p className="text-secondary text-sm">
                Explore community-contributed parts, tools, and supplies for your projects.
              </p>
            </Link>
            <Link
              to="/items/new"
              className="bg-secondary rounded-lg shadow-md p-6 hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <h3 className="text-xl font-bold text-primary mb-2">Add New Item</h3>
              <p className="text-secondary text-sm">
                Contribute to the library by adding parts, tools, or supplies you've discovered.
              </p>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
