import { type LoaderFunctionArgs, Link, useLoaderData } from "react-router";
import { requireAuth, createAuthService } from "~/lib/auth.server";
import { getDB, getKV, getEnv } from "~/lib/db.server";
import { getFullMakerProfile } from "~/lib/makers.server";
import { getUserProducts } from "~/lib/products.server";
import { getImageUrl } from "~/lib/images.server";
import { Layout } from "~/components/Layout";
import { Navigation } from "~/components/Navigation";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const db = getDB(context);
  const kv = getKV(context);
  const env = getEnv(context);
  const authService = createAuthService(db, kv, env);

  const user = await requireAuth(request, authService);

  // Get user profile
  const profile = await getFullMakerProfile(db, user.id);

  // Get user products
  const products = await getUserProducts(db, user.id);

  // Process profile avatar URL
  const profileWithImageUrl = profile
    ? {
        ...profile,
        avatar_url: getImageUrl(
          profile.avatar_key || null,
          profile.avatar_url,
          env
        ),
      }
    : null;

  // Process product image URLs
  const productsWithImageUrls = products.map((product) => ({
    ...product,
    image_url: getImageUrl(product.image_key || null, product.image_url, env),
  }));

  return {
    profile: profileWithImageUrl,
    user,
    products: productsWithImageUrls,
  };
}

export default function Dashboard() {
  const { profile, user, products } = useLoaderData<typeof loader>();

  return (
    <Layout>
      <Navigation user={user} />
      <div className="min-h-screen bg-primary py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Dashboard Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">Dashboard</h1>
          </div>

          {/* Projects/Products Section */}
          <div className="bg-secondary rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-primary">Your Projects</h2>
              <Link
                to="/profile?add-product=true"
                className="accent-orange text-on-accent px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
              >
                + Add Project
              </Link>
            </div>

            {products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-tertiary rounded-lg overflow-hidden border border-theme hover:shadow-lg transition-shadow"
                  >
                    {product.image_url && (
                      <div className="w-full h-48 bg-primary overflow-hidden">
                        <img
                          src={product.image_url}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-primary mb-2">
                        {product.title}
                      </h3>
                      {product.description && (
                        <p className="text-secondary text-sm mb-3 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-secondary">
                          Status:{" "}
                          <span className="font-medium text-primary capitalize">
                            {product.status}
                          </span>
                        </span>
                        {product.price > 0 && (
                          <span className="text-sm font-semibold text-orange-600">
                            ₹{(product.price / 100).toFixed(2)}
                          </span>
                        )}
                      </div>
                      <div className="mt-4 flex space-x-2">
                        <Link
                          to={`/profile?edit-product=${product.id}`}
                          className="flex-1 text-center text-sm border border-theme px-3 py-2 rounded-md hover:bg-primary transition-colors text-primary"
                        >
                          Edit
                        </Link>
                        {product.is_open_source && product.github_repo && (
                          <a
                            href={product.github_repo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm border border-theme px-3 py-2 rounded-md hover:bg-primary transition-colors text-primary"
                          >
                            GitHub
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🚀</div>
                <h3 className="text-xl font-semibold text-primary mb-2">
                  No projects yet
                </h3>
                <p className="text-secondary mb-6">
                  Start showcasing your work by adding your first project.
                </p>
                <Link
                  to="/profile?add-product=true"
                  className="inline-block accent-orange text-on-accent px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
                >
                  Add Your First Project
                </Link>
              </div>
            )}
          </div>

          {/* Quick Stats (placeholder for future enhancement) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="bg-secondary rounded-lg shadow-md p-6 text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {products.length}
              </div>
              <div className="text-sm text-secondary">Total Projects</div>
            </div>
            <div className="bg-secondary rounded-lg shadow-md p-6 text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {products.filter((p) => p.status === "active").length}
              </div>
              <div className="text-sm text-secondary">Active Products</div>
            </div>
            <div className="bg-secondary rounded-lg shadow-md p-6 text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {products.filter((p) => p.is_open_source).length}
              </div>
              <div className="text-sm text-secondary">Open Source</div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
