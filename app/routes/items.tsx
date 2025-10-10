import { type LoaderFunctionArgs, Link, useLoaderData } from "react-router";
import { getDB, getEnv, getKV } from "~/lib/db.server";
import { getAllItems } from "~/lib/items.server";
import { getImageUrl } from "~/lib/images.server";
import { Layout } from "~/components/Layout";
import { Navigation } from "~/components/Navigation";
import { createAuthService, getOptionalAuth } from "~/lib/auth.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const db = getDB(context);
  const kv = getKV(context);
  const env = getEnv(context);
  const authService = createAuthService(db, kv, env);

  // Get current user (optional for browsing items)
  const user = await getOptionalAuth(request, authService);

  // Get URL search params for filtering
  const url = new URL(request.url);
  const itemType = url.searchParams.get("type") as
    | "part"
    | "tool"
    | "supply"
    | null;
  const category = url.searchParams.get("category");
  const search = url.searchParams.get("search");

  // Get all items with filters
  const items = await getAllItems(db, {
    item_type: itemType || undefined,
    category: category || undefined,
    search: search || undefined,
  });

  // Process image URLs
  const itemsWithImages = items.map((item) => ({
    ...item,
    image_url: getImageUrl(item.image_key, item.image_url, env),
  }));

  return {
    user,
    items: itemsWithImages,
    filters: {
      type: itemType,
      category,
      search,
    },
  };
}

export default function ItemsPage() {
  const { user, items, filters } = useLoaderData<typeof loader>();

  return (
    <Layout>
      <Navigation user={user} />
      <div className="min-h-screen bg-primary py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-primary">
                Global Item Library
              </h1>
              {user ? (
                <Link
                  to="/items/new"
                  className="accent-orange text-on-accent px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
                >
                  + Add Item
                </Link>
              ) : (
                <Link
                  to="/auth/login"
                  className="bg-secondary text-primary border-2 border-theme px-6 py-2 rounded-lg font-semibold transition-all duration-300 hover:border-orange-500 hover:-translate-y-1"
                >
                  Login to Add Items
                </Link>
              )}
            </div>
            <p className="text-secondary">
              Browse and search parts, tools, and supplies contributed by the
              maker community
            </p>
          </div>

          {/* Filters */}
          <div className="bg-secondary rounded-lg shadow-md p-6 mb-6">
            <form method="get" className="flex flex-wrap gap-4">
              {/* Search */}
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  name="search"
                  defaultValue={filters.search || ""}
                  placeholder="Search items..."
                  className="w-full px-4 py-2 border-2 border-theme rounded-lg bg-primary text-primary focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Type Filter */}
              <div>
                <select
                  name="type"
                  defaultValue={filters.type || ""}
                  className="px-4 py-2 border-2 border-theme rounded-lg bg-primary text-primary focus:outline-none focus:border-orange-500"
                >
                  <option value="">All Types</option>
                  <option value="part">Parts</option>
                  <option value="tool">Tools</option>
                  <option value="supply">Supplies</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <input
                  type="text"
                  name="category"
                  defaultValue={filters.category || ""}
                  placeholder="Category..."
                  className="px-4 py-2 border-2 border-theme rounded-lg bg-primary text-primary focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="bg-secondary text-primary border-2 border-theme px-6 py-2 rounded-lg font-semibold transition-all duration-300 hover:border-orange-500 hover:-translate-y-1"
              >
                Filter
              </button>

              {/* Clear Filters */}
              {(filters.search || filters.type || filters.category) && (
                <Link
                  to="/items"
                  className="bg-secondary text-secondary border-2 border-theme px-6 py-2 rounded-lg font-semibold transition-all duration-300 hover:border-orange-500 hover:-translate-y-1"
                >
                  Clear
                </Link>
              )}
            </form>
          </div>

          {/* Items Grid */}
          {items.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map((item) => (
                <Link
                  key={item.id}
                  to={`/items/${item.id}`}
                  className="bg-secondary rounded-lg overflow-hidden border-2 border-theme hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-orange-500"
                >
                  {item.image_url && (
                    <div className="w-full h-48 bg-tertiary overflow-hidden">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-1 rounded bg-accent-orange text-on-accent font-semibold uppercase">
                        {item.item_type}
                      </span>
                      {item.category && (
                        <span className="text-xs px-2 py-1 rounded bg-tertiary text-secondary">
                          {item.category}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-primary mb-1">
                      {item.name}
                    </h3>
                    {item.manufacturer && (
                      <p className="text-sm text-secondary mb-1">
                        {item.manufacturer}
                        {item.model_number && ` - ${item.model_number}`}
                      </p>
                    )}
                    {item.description && (
                      <p className="text-sm text-secondary line-clamp-2 mb-2">
                        {item.description}
                      </p>
                    )}
                    {item.typical_unit_cost && (
                      <p className="text-sm font-semibold text-orange-600">
                        ~₹{(item.typical_unit_cost / 100).toFixed(2)}
                        {item.unit && ` / ${item.unit}`}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-secondary rounded-lg">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-primary mb-2">
                No items found
              </h3>
              <p className="text-secondary mb-6">
                {filters.search || filters.type || filters.category
                  ? "Try adjusting your filters"
                  : "Be the first to add an item to the library!"}
              </p>
              {user &&
                !filters.search &&
                !filters.type &&
                !filters.category && (
                  <Link
                    to="/items/new"
                    className="inline-block accent-orange text-on-accent px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
                  >
                    Add First Item
                  </Link>
                )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
