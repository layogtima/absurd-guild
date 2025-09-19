import { Form, useActionData, useSearchParams } from "react-router";
import { type Product, type ProductStatus, PROJECT_STATUSES, SHOP_STATUSES, getStatusDisplayName } from "~/types/product";

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
            Price (₹)
          </label>
          <input
            type="number"
            id="price"
            name="price"
            defaultValue={displayPrice || searchParams.get("price") || ""}
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-theme rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-primary text-primary"
            placeholder="999.00"
          />
          <p className="text-xs text-secondary mt-1">
            Enter price in rupees (optional for development projects)
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

        {/* Status */}
        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-primary mb-2"
          >
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={
              product?.status || searchParams.get("status") || "active"
            }
            className="w-full px-3 py-2 border border-theme rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-primary text-primary"
          >
            <optgroup label="Ready for Sale">
              <option value="active">In Stock</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="discontinued">Discontinued</option>
            </optgroup>
            <optgroup label="Project Status">
              <option value="concept">Concept</option>
              <option value="development">Development</option>
              <option value="prototype">Prototype</option>
              <option value="testing">Testing</option>
            </optgroup>
          </select>
          <p className="text-xs text-secondary mt-1">
            Choose 'Project Status' for items in development, 'Ready for Sale' for completed products
          </p>
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

        {/* Advanced Details - Expandable Section */}
        <div className="border-t border-theme pt-6">
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer text-primary font-medium mb-4 hover:text-orange-500">
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Advanced Product Details
              </span>
              <span className="text-xs text-secondary">Optional</span>
            </summary>

            <div className="space-y-4 pl-6">
              {/* Stock Quantity */}
              <div>
                <label
                  htmlFor="stockQuantity"
                  className="block text-sm font-medium text-primary mb-2"
                >
                  Stock Quantity
                </label>
                <input
                  type="number"
                  id="stockQuantity"
                  name="stockQuantity"
                  defaultValue={product?.stock_quantity?.toString() || ""}
                  min="0"
                  className="w-full px-3 py-2 border border-theme rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-primary text-primary"
                  placeholder="e.g., 50"
                />
              </div>

              {/* Shipping Weight */}
              <div>
                <label
                  htmlFor="shippingWeight"
                  className="block text-sm font-medium text-primary mb-2"
                >
                  Shipping Weight (grams)
                </label>
                <input
                  type="number"
                  id="shippingWeight"
                  name="shippingWeight"
                  defaultValue={product?.shipping_weight?.toString() || ""}
                  min="0"
                  className="w-full px-3 py-2 border border-theme rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-primary text-primary"
                  placeholder="e.g., 250"
                />
              </div>

              {/* Features */}
              <div>
                <label
                  htmlFor="features"
                  className="block text-sm font-medium text-primary mb-2"
                >
                  Features
                </label>
                <textarea
                  id="features"
                  name="features"
                  defaultValue={
                    product?.features ? JSON.parse(product.features).join('\n') : ""
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-theme rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-primary text-primary"
                  placeholder="Enter each feature on a new line&#10;e.g., Wireless connectivity&#10;USB-C charging&#10;RGB lighting"
                />
                <p className="text-xs text-secondary mt-1">
                  Enter each feature on a new line
                </p>
              </div>

              {/* Open Source */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isOpenSource"
                  name="isOpenSource"
                  defaultChecked={product?.is_open_source || false}
                  className="rounded border-theme focus:ring-2 focus:ring-orange-500"
                />
                <label
                  htmlFor="isOpenSource"
                  className="text-sm font-medium text-primary"
                >
                  This is an open source project
                </label>
              </div>

              {/* GitHub Repository */}
              <div>
                <label
                  htmlFor="githubRepo"
                  className="block text-sm font-medium text-primary mb-2"
                >
                  GitHub Repository
                </label>
                <input
                  type="url"
                  id="githubRepo"
                  name="githubRepo"
                  defaultValue={product?.github_repo || ""}
                  className="w-full px-3 py-2 border border-theme rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-primary text-primary"
                  placeholder="https://github.com/username/repo"
                />
              </div>

              {/* Documentation URL */}
              <div>
                <label
                  htmlFor="documentationUrl"
                  className="block text-sm font-medium text-primary mb-2"
                >
                  Documentation URL
                </label>
                <input
                  type="url"
                  id="documentationUrl"
                  name="documentationUrl"
                  defaultValue={product?.documentation_url || ""}
                  className="w-full px-3 py-2 border border-theme rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-primary text-primary"
                  placeholder="https://docs.example.com"
                />
              </div>
            </div>
          </details>
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
