import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import type { Product, UnitTypeValues } from "@/types/product";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProductSearchProps {
  products: Product[];
  onSelect: (product: Product, selectedUnit: UnitTypeValues) => void;
  searchProducts: (query: string) => void;
}

export function ProductSearch({
  products,
  onSelect,
  searchProducts,
}: ProductSearchProps) {
  const [query, setQuery] = useState("");
  const [selectedUnits, setSelectedUnits] = useState<
    Record<number, UnitTypeValues>
  >({});

  const handleSearch = () => {
    searchProducts(query);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleProductSelect = (product: Product) => {
    const selectedUnit =
      selectedUnits[product.id!] ||
      (product.price_units?.[0]?.unit_type as UnitTypeValues);
    if (selectedUnit) {
      onSelect(product, selectedUnit);
    }
  };

  const handleUnitChange = (productId: number, value: UnitTypeValues) => {
    setSelectedUnits((prev) => ({ ...prev, [productId]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Search products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <Button onClick={handleSearch}>
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-card rounded-lg border p-4 space-y-2"
          >
            {product.image_url && (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-32 object-cover rounded-md"
              />
            )}
            <h3 className="font-semibold">{product.name}</h3>
            <div className="flex flex-col gap-2">
              <Select
                value={
                  selectedUnits[product.id!] ||
                  (product.price_units?.[0]?.unit_type as string)
                }
                onValueChange={(value) =>
                  handleUnitChange(product.id!, value as UnitTypeValues)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {product.price_units?.map((unit) => (
                    <SelectItem key={unit.id} value={unit.unit_type}>
                      {unit.unit_type} - {unit.selling_price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => handleProductSelect(product)}>
                Add to Cart
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
