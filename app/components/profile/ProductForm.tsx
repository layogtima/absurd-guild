import { Form, useActionData, useSearchParams } from "react-router";
import { type Product } from "~/types/product";

interface ProductFormProps {
  product?: Product;
  isEditing?: boolean;
}

export function ProductForm({ product, isEditing = false }: ProductFormProps) {
  const actionData = useActionData();
  const [searchParams] = useSearchParams();

  // Convert price from paise to rupees for display
  const displayPrice = product ? (product.price / 100).toString() : "";

  return (
    <div className="bg-tertiary rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4 text-primary">
        {isEditing ? "Edit Product" : "Add New Product"}
      </h3>

      <Form method="post" className="space-y-4">
        <input
          type="hidden"
          name="_action"
          value={isEditing ? "updateProduct" : "createProduct"}
        />
        {isEditing && product && (
          <input type="hidden" name="productId" value={product.id} />
        )}

        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-primary mb-2"
          >
            Product Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            defaultValue={product?.title || searchParams.get("title") || ""}
            required
            className="w-full px-3 py-2 border border-theme rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-primary text-primary"
            placeholder="e.g., LED Table Lamp"
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-primary mb-2"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            defaultValue={
              product?.description || searchParams.get("description") || ""
            }
            rows={4}
            className="w-full px-3 py-2 border border-theme rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-primary text-primary"
            placeholder="Describe your product..."
          />
        </div>

        {/* Price */}
        <div>
          <label
            htmlFor="price"
            className="block text-sm font-medium text-primary mb-2"
          >
            Price (₹) *
          </label>
          <input
            type="number"
            id="price"
            name="price"
            defaultValue={displayPrice || searchParams.get("price") || ""}
            required
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-theme rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-primary text-primary"
            placeholder="999.00"
          />
          <p className="text-xs text-secondary mt-1">
            Enter price in rupees (e.g., 999.99)
          </p>
        </div>

        {/* Category */}
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-primary mb-2"
          >
            Category
          </label>
          <input
            type="text"
            id="category"
            name="category"
            defaultValue={
              product?.category || searchParams.get("category") || ""
            }
            className="w-full px-3 py-2 border border-theme rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-primary text-primary"
            placeholder="e.g., Lighting, Electronics, Accessories"
          />
        </div>

        {/* Image URL */}
        <div>
          <label
            htmlFor="imageUrl"
            className="block text-sm font-medium text-primary mb-2"
          >
            Product Image URL
          </label>
          <input
            type="url"
            id="imageUrl"
            name="imageUrl"
            defaultValue={
              product?.image_url || searchParams.get("imageUrl") || ""
            }
            className="w-full px-3 py-2 border border-theme rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-primary text-primary"
            placeholder="https://example.com/product-image.jpg"
          />
          <p className="text-xs text-secondary mt-1">
            Add a link to your product image
          </p>
        </div>

        {/* Shopify URL */}
        <div>
          <label
            htmlFor="shopifyUrl"
            className="block text-sm font-medium text-primary mb-2"
          >
            Shop URL
          </label>
          <input
            type="url"
            id="shopifyUrl"
            name="shopifyUrl"
            defaultValue={
              product?.shopify_url || searchParams.get("shopifyUrl") || ""
            }
            className="w-full px-3 py-2 border border-theme rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-primary text-primary"
            placeholder="https://shop.example.com/product"
          />
          <p className="text-xs text-secondary mt-1">
            Link to where customers can purchase this product
          </p>
        </div>

        {/* Error Display */}
        {actionData?.error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded">
            {actionData.error}
          </div>
        )}

        {/* Form Actions */}
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            className="accent-orange text-on-accent px-6 py-2 rounded-md hover:bg-orange-600 font-medium"
          >
            {isEditing ? "Save Changes" : "Add Product"}
          </button>
          {isEditing ? (
            <a
              href="/profile"
              className="border border-theme px-6 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 text-primary"
            >
              Cancel
            </a>
          ) : (
            <a
              href="/profile"
              className="border border-theme px-6 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 text-primary"
            >
              Cancel
            </a>
          )}
        </div>
      </Form>
    </div>
  );
}
