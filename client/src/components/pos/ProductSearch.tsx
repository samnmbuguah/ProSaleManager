import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { Product } from "@db/schema";
import { Button } from "@/components/ui/button";

interface ProductSearchProps {
  products: Product[];
  onSelect: (product: Product) => void;
  searchProducts: (query: string) => Product[];
}

export function ProductSearch({ products, onSelect, searchProducts }: ProductSearchProps) {
  const [query, setQuery] = useState("");
  const filteredProducts = query ? searchProducts(query) : products;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredProducts.map((product) => (
          <Button
            key={product.id}
            variant="outline"
            className="h-24 flex flex-col items-center justify-center text-center"
            onClick={() => onSelect(product)}
          >
            <div className="font-bold">{product.name}</div>
            <div className="text-sm text-muted-foreground">
              {product.defaultUnitPricing ? (
                <>
                  KSh {Number(product.defaultUnitPricing.sellingPrice).toFixed(2)} per {product.defaultUnitPricing.quantity} {product.defaultUnitPricing.unitType}
                </>
              ) : (
                "Price not set"
              )}
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}
