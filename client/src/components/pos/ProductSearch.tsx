import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Product } from "../../../../db/schema";
import { Card, CardContent } from "@/components/ui/card";

interface PriceUnit {
  id?: number;
  unit_type: string;
  quantity: number;
  selling_price: string;
  buying_price: string;
  is_default: boolean;
}

interface ExtendedProduct extends Product {
  price_units?: PriceUnit[];
  default_unit_pricing?: PriceUnit | null;
}

interface ProductSearchProps {
  products: ExtendedProduct[];
  onSelect: (product: ExtendedProduct, selectedUnit: string) => void;
  searchProducts: (query: string) => Promise<ExtendedProduct[]>;
}

export function ProductSearch({ products, onSelect, searchProducts }: ProductSearchProps) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ExtendedProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUnits, setSelectedUnits] = useState<Record<number, string>>({});

  const handleSearch = async (value: string) => {
    setQuery(value);
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchProducts(value);
      setSearchResults(results);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUnitChange = (productId: number, stockUnit: string) => {
    setSelectedUnits(prev => ({
      ...prev,
      [productId]: stockUnit
    }));
  };

  const handleAddToCart = (product: ExtendedProduct) => {
    const selectedUnit = selectedUnits[product.id] || product.stock_unit;
    if (!selectedUnit) {
      console.error("No unit selected");
      return;
    }
    onSelect(product, selectedUnit);
  };

  const displayProducts = query ? searchResults : products;

  const formatPrice = (price: string | number) => {
    return `KSh ${Number(price).toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="space-y-4">
      <Input
        type="search"
        placeholder="Search products..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full"
      />

      <ScrollArea className="h-[calc(100vh-15rem)] rounded-md border p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isSearching ? (
            <div>Searching...</div>
          ) : displayProducts.length === 0 ? (
            <div>No products found</div>
          ) : (
            displayProducts.map((product) => {
              const selectedUnit = selectedUnits[product.id] || (product.price_units?.[0]?.unit_type);
              const selectedPrice = product.price_units?.find(
                (p: PriceUnit) => p.unit_type === selectedUnit
              );

              return (
                <Card key={product.id} className="overflow-hidden">
                  <CardContent className="p-4 space-y-4">
                    <div className="font-semibold">{product.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Stock: {product.stock} {selectedUnit || 'units'}
                    </div>
                    <Select
                      value={selectedUnit}
                      onValueChange={(value) => handleUnitChange(product.id, value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select unit">
                          {selectedPrice && 
                            `${formatPrice(selectedPrice.selling_price)} per ${selectedPrice.unit_type}`
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {product.price_units?.map((pricing: PriceUnit) => (
                          <SelectItem key={pricing.unit_type} value={pricing.unit_type}>
                            {formatPrice(pricing.selling_price)} per {pricing.unit_type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => handleAddToCart(product)}
                      disabled={!selectedUnit}
                    >
                      Add to Cart
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
