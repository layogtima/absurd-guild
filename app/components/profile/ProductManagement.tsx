import { Link, useSearchParams } from "react-router";
import { type Product } from "~/types/product";
import { ProductList } from "./ProductList";
import { ProductForm } from "./ProductForm";

interface ProductManagementProps {
  products: Product[];
}

export function ProductManagement({ products }: ProductManagementProps) {
  const [searchParams] = useSearchParams();
  const addingProduct = searchParams.get("add-product") === "true";
  const editingProductId = searchParams.get("edit-product");
  const editingProduct = editingProductId
    ? products.find((p) => p.id.toString() === editingProductId)
    : undefined;

  return (
    <div className="bg-secondary rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-primary">My Products</h2>
        {addingProduct || editingProduct ? (
          <Link
            to="/profile"
            className="border px-4 py-2 rounded-md hover:bg-orange-600"
          >
            Cancel
          </Link>
        ) : (
          <Link
            to="?add-product=true"
            className="accent-orange text-on-accent px-4 py-2 rounded-md hover:bg-orange-600"
          >
            Add Product
          </Link>
        )}
      </div>

      {/* Add Product Form */}
      {addingProduct && <ProductForm />}

      {/* Edit Product Form */}
      {editingProduct && (
        <ProductForm product={editingProduct} isEditing={true} />
      )}

      {/* Products List */}
      {!addingProduct && !editingProduct && <ProductList products={products} />}
    </div>
  );
}
