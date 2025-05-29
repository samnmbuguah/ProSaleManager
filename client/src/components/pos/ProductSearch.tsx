import React, { useState } from "react";
import type { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ProductSearchProps {
  products: Product[];
  onSelect: (product: Product, unitType: string, price: number) => void;
  searchProducts: (query: string) => Promise<void>;
}

export const ProductSearch: React.FC<ProductSearchProps> = ({
  products,
  onSelect,
  searchProducts,
}) => {
  const [search, setSearch] = useState("");

  const handleSearch = async () => {
    await searchProducts(search);
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Button onClick={handleSearch}>Search</Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {products.map((product) => (
          <button
            key={product.id}
            className="border rounded p-2 cursor-pointer hover:bg-gray-100 text-left w-full"
            onClick={() =>
              onSelect(
                product,
                product.stock_unit,
                Number(product.selling_price),
              )
            }
          >
            <div className="font-bold">{product.name}</div>
            <div className="text-sm text-gray-500">{product.category}</div>
            <div className="text-sm">KSh {product.selling_price}</div>
          </button>
        ))}
      </div>
    </div>
  );
};
