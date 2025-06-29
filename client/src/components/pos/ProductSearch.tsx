import React, { useState } from "react";
import type { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Package, ShoppingCart } from "lucide-react";

interface ProductSearchProps {
  products: Product[];
  onSelect: (product: Product) => void;
  searchProducts: (query: string) => Promise<void>;
}

export const ProductSearch: React.FC<ProductSearchProps> = ({
  products,
  onSelect,
  searchProducts,
}) => {
  const [search, setSearch] = useState("");

  const handleSearch = async () => {
    if (search.trim()) {
      await searchProducts(search);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const formatPrice = (price: number) => {
    return `KSh ${price.toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search products by name, SKU, or barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch} disabled={!search.trim()}>
          Search
        </Button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {products.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No products found</p>
            <p className="text-sm">Try searching for a product</p>
          </div>
        ) : (
          products.map((product) => (
            <Card
              key={product.id}
              className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-300"
              onClick={() => onSelect(product)}
            >
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
                      <p className="text-xs text-gray-500">{product.sku}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {product.Category?.name || "No Category"}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Piece:</span>
                      <span className="font-medium">{formatPrice(product.piece_selling_price)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Pack:</span>
                      <span className="font-medium">{formatPrice(product.pack_selling_price)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Dozen:</span>
                      <span className="font-medium">{formatPrice(product.dozen_selling_price)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-xs text-gray-500">
                      Stock: {product.quantity}
                    </div>
                    <Button
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(product);
                      }}
                    >
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
