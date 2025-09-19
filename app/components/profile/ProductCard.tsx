import { Form, Link } from "react-router";
import { type Product, getStatusDisplayName, isProject } from "~/types/product";
import { formatPrice } from "~/lib/utils/format-price";

interface ProductCardProps {
  product: Product;
  isEditing?: boolean;
  showAdminActions?: boolean; // New prop to control admin actions
  mode?: 'profile' | 'showcase'; // New prop to control display mode
}

export function ProductCard({
  product,
  isEditing = false,
  showAdminActions = true,
  mode = 'profile'
}: ProductCardProps) {
  return (
    <div className="bg-secondary border-2 border-theme rounded-3xl overflow-hidden hover-lift transition-all flex flex-col">
      {/* Product Image */}
      <div className="aspect-square relative overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-tertiary flex items-center justify-center text-6xl">
            📦
          </div>
        )}
        <div className="absolute top-4 right-4 flex gap-2">
          <div className="bg-gray-900/50 text-white px-3 py-1 rounded-full text-sm font-bold">
            {getStatusDisplayName(product.status)}
          </div>
          {product.is_open_source && (
            <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              Open Source
            </div>
          )}
        </div>
      </div>

      {/* Product Details */}
      <div className="p-6 flex flex-col">
        <h3 className="font-jura text-2xl font-bold text-primary mb-2">
          {product.title}
        </h3>

        {product.description && (
          <p className="text-secondary leading-relaxed mb-4">
            {product.description}
          </p>
        )}

        {/* Features */}
        {product.features && (() => {
          try {
            const features = JSON.parse(product.features);
            return features.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-1">
                  {features.slice(0, 3).map((feature: string, index: number) => (
                    <span
                      key={index}
                      className="inline-block px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                  {features.length > 3 && (
                    <span className="text-xs text-secondary">
                      +{features.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          } catch (e) {
            return null;
          }
        })()}

        {product.category && (
          <div className="mb-4">
            <span className="inline-block px-3 py-1 text-sm bg-tertiary text-secondary rounded-full">
              {product.category}
            </span>
          </div>
        )}

        {/* Spacer to push content to bottom */}
        <div className="flex-1"></div>

        <div className="flex justify-between items-center mb-4">
          {product.price > 0 && (
            <div className="text-2xl font-bold accent-orange-text">
              {formatPrice(product.price)}
            </div>
          )}
          {product.price === 0 && (
            <div className="text-sm text-secondary">
              {product.status === 'active' ? 'Ready for sale' : 'In development'}
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* Secondary action buttons */}
            {mode === 'showcase' && (product.github_repo || product.documentation_url) && (
              <div className="flex gap-1">
                {product.github_repo && (
                  <a
                    href={product.github_repo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-secondary text-primary px-3 py-2 rounded-lg hover-lift transition-all border border-theme"
                    title="View Source"
                  >
                    <i className="fab fa-github text-sm"></i>
                  </a>
                )}
                {product.documentation_url && (
                  <a
                    href={product.documentation_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-secondary text-primary px-3 py-2 rounded-lg hover-lift transition-all border border-theme"
                    title="View Docs"
                  >
                    <i className="fas fa-book text-sm"></i>
                  </a>
                )}
              </div>
            )}

            {/* Primary action button */}
            {product.shopify_url && product.shopify_url.trim() && (
              <a
                href={product.shopify_url}
                target="_blank"
                rel="noopener noreferrer"
                className="accent-orange text-on-accent px-6 py-3 rounded-xl font-bold hover-lift transition-all"
              >
                <i className="fas fa-shopping-cart mr-2"></i>
                GET ONE
              </a>
            )}
          </div>
        </div>

        {/* Admin Actions - Only show in profile mode */}
        {showAdminActions && (
          <div className="flex space-x-2 pt-4 border-t border-theme">
            {isEditing ? (
              <Link
                to="/profile"
                className="flex-1 text-center bg-tertiary text-primary px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </Link>
            ) : (
              <Link
                to={`?edit-product=${product.id}`}
                className="flex-1 text-center bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Edit
              </Link>
            )}

            <Form method="post" className="flex-1">
              <input type="hidden" name="_action" value="deleteProduct" />
              <input type="hidden" name="productId" value={product.id} />
              <button
                type="submit"
                className="w-full text-red-600 hover:text-red-800 border px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
                onClick={(e) => {
                  if (
                    !confirm(
                      `Are you sure you want to delete "${product.title}"?`
                    )
                  ) {
                    e.preventDefault();
                  }
                }}
              >
                Delete
              </button>
            </Form>
          </div>
        )}
      </div>
    </div>
  );
}
