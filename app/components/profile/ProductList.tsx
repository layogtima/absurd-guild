import { useSearchParams } from "react-router";
import { type Product } from "~/types/product";
import { ProductCard } from "./ProductCard";

interface ProductListProps {
  products: Product[];
}

export function ProductList({ products }: ProductListProps) {
  const [searchParams] = useSearchParams();
  const editingProductId = searchParams.get("edit-product");

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📦</div>
        <p className="text-xl text-secondary mb-2">No products yet</p>
        <p className="text-sm text-secondary">
          Add your first product to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          isEditing={editingProductId === product.id.toString()}
        />
      ))}
    </div>
  );
}
