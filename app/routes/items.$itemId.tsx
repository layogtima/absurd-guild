import {
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  Link,
  useLoaderData,
  useSearchParams,
  Form,
  redirect,
} from "react-router";
import { getDB, getKV, getEnv } from "~/lib/db.server";
import { createAuthService, getOptionalAuth } from "~/lib/auth.server";
import {
  getItemById,
  createItemResource,
  deleteItemResource,
} from "~/lib/items.server";
import { getImageUrl } from "~/lib/images.server";
import { Layout } from "~/components/Layout";
import { Navigation } from "~/components/Navigation";

export async function loader({ request, params, context }: LoaderFunctionArgs) {
  const db = getDB(context);
  const kv = getKV(context);
  const env = getEnv(context);
  const authService = createAuthService(db, kv, env);

  const itemId = parseInt(params.itemId || "", 10);
  if (isNaN(itemId)) {
    throw new Response("Invalid item ID", { status: 400 });
  }

  const user = await getOptionalAuth(request, authService);
  const itemData = await getItemById(db, itemId);

  if (!itemData) {
    throw new Response("Item not found", { status: 404 });
  }

  // Process image URL
  const item = {
    ...itemData.item,
    image_url: getImageUrl(itemData.item.image_key, itemData.item.image_url, env),
  };

  return {
    user,
    item,
    resources: itemData.resources,
  };
}

export async function action({ request, params, context }: ActionFunctionArgs) {
  const db = getDB(context);
  const kv = getKV(context);
  const env = getEnv(context);
  const authService = createAuthService(db, kv, env);

  const user = await getOptionalAuth(request, authService);
  if (!user) {
    return { error: "You must be logged in to perform this action" };
  }

  const itemId = parseInt(params.itemId || "", 10);
  const formData = await request.formData();
  const action = formData.get("_action");

  if (action === "add_resource") {
    const title = formData.get("title") as string;
    const url = formData.get("url") as string;
    const resource_type = formData.get("resource_type") as string;
    const price = formData.get("price") as string;
    const notes = formData.get("notes") as string;

    if (!title || !url) {
      return { error: "Title and URL are required" };
    }

    await createItemResource(db, {
      item_id: itemId,
      title,
      url,
      resource_type: resource_type || undefined,
      price: price ? Math.round(parseFloat(price) * 100) : undefined,
      notes: notes || undefined,
      added_by_user_id: user.id,
    });

    return redirect(`/items/${itemId}?success=resource-added`);
  }

  if (action === "delete_resource") {
    const resourceId = parseInt(formData.get("resource_id") as string, 10);
    await deleteItemResource(db, resourceId);
    return redirect(`/items/${itemId}?success=resource-deleted`);
  }

  return { error: "Invalid action" };
}

export default function ItemDetailPage() {
  const { user, item, resources } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const success = searchParams.get("success");
  const addingResource = searchParams.get("add-resource") === "true";

  // Parse JSON fields
  const specifications = item.specifications
    ? JSON.parse(item.specifications)
    : null;
  const tags = item.tags ? JSON.parse(item.tags) : [];

  return (
    <Layout>
      <Navigation user={user} />
      <div className="min-h-screen bg-primary py-8">
        <div className="max-w-5xl mx-auto px-4">
          {/* Success Messages */}
          {success && (
            <div className="mb-6 bg-green-100 border-2 border-green-500 text-green-800 px-4 py-3 rounded-lg flex items-center justify-between">
              <span>
                {success === "created" && "Item created successfully!"}
                {success === "resource-added" && "Resource added successfully!"}
                {success === "resource-deleted" && "Resource deleted!"}
              </span>
              <Link to={`/items/${item.id}`} className="text-green-600 font-bold">
                ✕
              </Link>
            </div>
          )}

          {/* Back Link */}
          <div className="mb-6">
            <Link
              to="/items"
              className="text-secondary hover:text-orange-600 transition-colors"
            >
              ← Back to Items
            </Link>
          </div>

          {/* Item Details */}
          <div className="bg-secondary rounded-lg shadow-md overflow-hidden mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              {/* Image */}
              {item.image_url && (
                <div className="w-full h-64 bg-tertiary rounded-lg overflow-hidden">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Info */}
              <div className={item.image_url ? "" : "md:col-span-2"}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm px-3 py-1 rounded bg-accent-orange text-on-accent font-semibold uppercase">
                    {item.item_type}
                  </span>
                  {item.category && (
                    <span className="text-sm px-3 py-1 rounded bg-tertiary text-secondary">
                      {item.category}
                    </span>
                  )}
                </div>

                <h1 className="text-3xl font-bold text-primary mb-2">
                  {item.name}
                </h1>

                {(item.manufacturer || item.model_number) && (
                  <p className="text-secondary mb-4">
                    {item.manufacturer}
                    {item.model_number && ` - Model: ${item.model_number}`}
                  </p>
                )}

                {item.description && (
                  <p className="text-primary mb-4">{item.description}</p>
                )}

                {item.typical_unit_cost && (
                  <div className="mb-4">
                    <span className="text-sm text-secondary">Typical Cost: </span>
                    <span className="text-xl font-semibold text-orange-600">
                      ₹{(item.typical_unit_cost / 100).toFixed(2)}
                      {item.unit && ` / ${item.unit}`}
                    </span>
                  </div>
                )}

                {specifications && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-primary mb-2">
                      Specifications:
                    </h3>
                    <div className="bg-tertiary rounded p-3">
                      {Object.entries(specifications).map(([key, value]) => (
                        <div key={key} className="text-sm text-secondary">
                          <span className="font-medium">{key}:</span> {String(value)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag: string, i: number) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 rounded bg-primary text-secondary border border-theme"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Resources Section */}
          <div className="bg-secondary rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-primary">Resources</h2>
              {user && !addingResource && (
                <Link
                  to={`?add-resource=true`}
                  className="accent-orange text-on-accent px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors font-semibold text-sm"
                >
                  + Add Resource
                </Link>
              )}
            </div>

            {/* Add Resource Form */}
            {addingResource && (
              <div className="bg-tertiary rounded-lg p-4 mb-6 border-2 border-orange-500">
                <Form method="post" className="space-y-4">
                  <input type="hidden" name="_action" value="add_resource" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-primary mb-1">
                        Title *
                      </label>
                      <input
                        type="text"
                        name="title"
                        required
                        placeholder="e.g., Datasheet, Buy from DigiKey"
                        className="w-full px-3 py-2 border-2 border-theme rounded-lg bg-primary text-primary focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-primary mb-1">
                        URL *
                      </label>
                      <input
                        type="url"
                        name="url"
                        required
                        placeholder="https://..."
                        className="w-full px-3 py-2 border-2 border-theme rounded-lg bg-primary text-primary focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-primary mb-1">
                        Type
                      </label>
                      <select
                        name="resource_type"
                        className="w-full px-3 py-2 border-2 border-theme rounded-lg bg-primary text-primary focus:outline-none focus:border-orange-500"
                      >
                        <option value="">Select...</option>
                        <option value="datasheet">Datasheet</option>
                        <option value="supplier">Supplier</option>
                        <option value="guide">Guide</option>
                        <option value="video">Video</option>
                        <option value="alternative">Alternative</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-primary mb-1">
                        Price (₹, if supplier)
                      </label>
                      <input
                        type="number"
                        name="price"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="w-full px-3 py-2 border-2 border-theme rounded-lg bg-primary text-primary focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-primary mb-1">
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      rows={2}
                      className="w-full px-3 py-2 border-2 border-theme rounded-lg bg-primary text-primary focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="accent-orange text-on-accent px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
                    >
                      Add Resource
                    </button>
                    <Link
                      to={`/items/${item.id}`}
                      className="bg-secondary text-primary border-2 border-theme px-4 py-2 rounded-lg font-semibold transition-all duration-300 hover:border-orange-500"
                    >
                      Cancel
                    </Link>
                  </div>
                </Form>
              </div>
            )}

            {/* Resources List */}
            {resources.length > 0 ? (
              <div className="space-y-3">
                {resources.map((resource) => (
                  <div
                    key={resource.id}
                    className="bg-tertiary rounded-lg p-4 border border-theme"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-lg font-semibold text-primary hover:text-orange-600 transition-colors"
                          >
                            {resource.title} →
                          </a>
                          {resource.resource_type && (
                            <span className="text-xs px-2 py-1 rounded bg-primary text-secondary">
                              {resource.resource_type}
                            </span>
                          )}
                        </div>
                        {resource.price && (
                          <p className="text-sm font-semibold text-orange-600 mb-1">
                            ₹{(resource.price / 100).toFixed(2)}
                          </p>
                        )}
                        {resource.notes && (
                          <p className="text-sm text-secondary">{resource.notes}</p>
                        )}
                      </div>
                      {user && (
                        <Form method="post">
                          <input type="hidden" name="_action" value="delete_resource" />
                          <input type="hidden" name="resource_id" value={resource.id} />
                          <button
                            type="submit"
                            className="text-secondary hover:text-red-600 transition-colors text-sm"
                            onClick={(e) => {
                              if (!confirm("Delete this resource?")) {
                                e.preventDefault();
                              }
                            }}
                          >
                            Delete
                          </button>
                        </Form>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-secondary text-center py-8">
                No resources yet. Be the first to add one!
              </p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
