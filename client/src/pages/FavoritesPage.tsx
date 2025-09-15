import { useState } from "react";
import { useFavorites } from "@/hooks/use-favorites";
import { useAuth } from "@/hooks/use-auth";
import type { Product } from "@/types/product";
import ProductCard from "@/components/shop/ProductCard";
import { Button } from "@/components/ui/button";

export default function FavoritesPage() {
  const { isAuthenticated } = useAuth();
  const { data: favorites = [], isLoading, isError } = useFavorites(isAuthenticated);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const handleImageError = (productId: number) => {
    setImageErrors((prev) => ({ ...prev, [productId]: true }));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-semibold mb-4">Favorites</h1>
        <p>Loading favorites...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-semibold mb-4">Favorites</h1>
        <p className="text-red-600">Failed to load favorites.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Favorites</h1>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            onClick={() => setViewMode("grid")}
          >
            Grid
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            onClick={() => setViewMode("list")}
          >
            List
          </Button>
        </div>
      </div>

      {favorites.length === 0 ? (
        <p className="text-gray-600">You have no favorites yet.</p>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              : "space-y-4"
          }
        >
          {favorites.map((product: Product) => (
            <ProductCard
              key={product.id}
              product={product}
              onImageError={handleImageError}
              imageError={!!imageErrors[product.id]}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}
    </div>
  );
}
