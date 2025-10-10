import {
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  redirect,
  Form,
  useLoaderData,
  useNavigation,
} from "react-router";
import { getDB, getKV, getEnv } from "~/lib/db.server";
import { requireAuth, createAuthService } from "~/lib/auth.server";
import { createItem } from "~/lib/items.server";
import { Layout } from "~/components/Layout";
import { Navigation } from "~/components/Navigation";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const db = getDB(context);
  const kv = getKV(context);
  const env = getEnv(context);
  const authService = createAuthService(db, kv, env);

  // Require authentication to add items
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

  const name = formData.get("name") as string;
  const item_type = formData.get("item_type") as "part" | "tool" | "supply";
  const category = formData.get("category") as string;
  const description = formData.get("description") as string;
  const manufacturer = formData.get("manufacturer") as string;
  const model_number = formData.get("model_number") as string;
  const typical_unit_cost = formData.get("typical_unit_cost") as string;
  const unit = formData.get("unit") as string;
  const image_url = formData.get("image_url") as string;

  // Basic validation
  if (!name || !item_type) {
    return { error: "Name and type are required" };
  }

  // Create the item
  const item = await createItem(db, {
    name,
    item_type,
    category: category || undefined,
    description: description || undefined,
    manufacturer: manufacturer || undefined,
    model_number: model_number || undefined,
    typical_unit_cost: typical_unit_cost
      ? Math.round(parseFloat(typical_unit_cost) * 100)
      : undefined,
    unit: unit || undefined,
    image_url: image_url || undefined,
    added_by_user_id: user.id,
  });

  // Redirect to the item detail page
  return redirect(`/items/${item.id}?success=created`);
}

export default function NewItemPage() {
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
              Add New Item
            </h1>
            <p className="text-secondary">
              Add a part, tool, or supply to the global library
            </p>
          </div>

          {/* Form */}
          <div className="bg-secondary rounded-lg shadow-md p-6">
            <Form method="post" className="space-y-6">
              {/* Item Type */}
              <div>
                <label className="block text-sm font-semibold text-primary mb-2">
                  Item Type <span className="text-orange-600">*</span>
                </label>
                <select
                  name="item_type"
                  required
                  className="w-full px-4 py-2 border-2 border-theme rounded-lg bg-primary text-primary focus:outline-none focus:border-orange-500"
                >
                  <option value="">Select type...</option>
                  <option value="part">Part</option>
                  <option value="tool">Tool</option>
                  <option value="supply">Supply</option>
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-primary mb-2">
                  Item Name <span className="text-orange-600">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g., Arduino Uno R3, Soldering Iron, Solder Wire"
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
                  placeholder="e.g., electronics, mechanical, fasteners"
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
                  placeholder="Brief description of the item..."
                  className="w-full px-4 py-2 border-2 border-theme rounded-lg bg-primary text-primary focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Manufacturer & Model Number */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-primary mb-2">
                    Manufacturer
                  </label>
                  <input
                    type="text"
                    name="manufacturer"
                    placeholder="e.g., Arduino, Hakko"
                    className="w-full px-4 py-2 border-2 border-theme rounded-lg bg-primary text-primary focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-primary mb-2">
                    Model Number
                  </label>
                  <input
                    type="text"
                    name="model_number"
                    placeholder="e.g., A000066"
                    className="w-full px-4 py-2 border-2 border-theme rounded-lg bg-primary text-primary focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Typical Cost & Unit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-primary mb-2">
                    Typical Unit Cost (₹)
                  </label>
                  <input
                    type="number"
                    name="typical_unit_cost"
                    step="0.01"
                    min="0"
                    placeholder="e.g., 250.00"
                    className="w-full px-4 py-2 border-2 border-theme rounded-lg bg-primary text-primary focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-primary mb-2">
                    Unit
                  </label>
                  <input
                    type="text"
                    name="unit"
                    placeholder="e.g., piece, meter, gram"
                    className="w-full px-4 py-2 border-2 border-theme rounded-lg bg-primary text-primary focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-semibold text-primary mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  name="image_url"
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-2 border-2 border-theme rounded-lg bg-primary text-primary focus:outline-none focus:border-orange-500"
                />
                <p className="text-xs text-secondary mt-1">
                  Direct link to an image of the item
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="accent-orange text-on-accent px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Adding Item..." : "Add Item"}
                </button>
                <a
                  href="/items"
                  className="bg-secondary text-primary border-2 border-theme px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:border-orange-500 hover:-translate-y-1"
                >
                  Cancel
                </a>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
