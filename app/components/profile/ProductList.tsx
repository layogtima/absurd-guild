import { useSearchParams } from "react-router";
import { type Product, isProject } from "~/types/product";
import { ProductCard } from "./ProductCard";
import { ProjectCard } from "./ProjectCard";

interface ProductListProps {
  products: Product[];
  showAdminActions?: boolean;
  mode?: 'profile' | 'showcase';
  gridCols?: 'md:grid-cols-2' | 'md:grid-cols-2 lg:grid-cols-3';
}

export function ProductList({
  products,
  showAdminActions = true,
  mode = 'profile',
  gridCols = 'md:grid-cols-2'
}: ProductListProps) {
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
    <div className={`grid grid-cols-1 ${gridCols} gap-8`}>
      {products.map((product) => {
        const isEditingThis = editingProductId === product.id.toString();

        if (isProject(product.status)) {
          return (
            <ProjectCard
              key={product.id}
              project={product}
              isEditing={isEditingThis}
              showAdminActions={showAdminActions}
              mode={mode}
            />
          );
        } else {
          return (
            <ProductCard
              key={product.id}
              product={product}
              isEditing={isEditingThis}
              showAdminActions={showAdminActions}
              mode={mode}
            />
          );
        }
      })}
    </div>
  );
}
