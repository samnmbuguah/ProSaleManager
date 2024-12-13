import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Product } from "@db/schema";
import type { UnitTypeValues } from "@/types/pos";
import type { PriceUnit } from "@/components/inventory/ProductForm";
import { Card, CardContent } from "@/components/ui/card";

interface ProductSearchProps {
  products: Product[];
  onSelect: (product: Product, selectedUnit: UnitTypeValues) => void;
  searchProducts: (query: string) => Promise<Product[]>;
}

export function ProductSearch({ products, onSelect, searchProducts }: ProductSearchProps) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUnits, setSelectedUnits] = useState<Record<number, UnitTypeValues>>({});

  const handleSearch = async (value: string) => {
    setQuery(value);
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Ensure proper encoding of search query
      const encodedQuery = encodeURIComponent(value.trim());
      const response = await fetch(`/api/products/search?q=${encodedQuery}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Search response error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const results = await response.json();
      console.log('Search results:', results);
      
      // If the server returns an error object
      if (results.error) {
        throw new Error(results.error);
      }
      
      // Ensure we have an array of products
      if (!Array.isArray(results)) {
        console.error('Unexpected response format:', results);
        throw new Error('Invalid response format from server');
      }
      
      setSearchResults(results);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUnitChange = (productId: number, stockUnit: UnitTypeValues) => {
    setSelectedUnits(prev => ({
      ...prev,
      [productId]: stockUnit
    }));
  };

  const handleAddToCart = (product: Product) => {
    const selectedUnit = selectedUnits[product.id] || (product.stock_unit as UnitTypeValues);
    if (!selectedUnit) {
      console.error("No unit selected");
      return;
    }

    // Find the complete price unit that matches the selected unit type
    const priceUnits = product.price_units;
    if (!priceUnits || !Array.isArray(priceUnits)) {
      console.error("Product has no price units");
      return;
    }

    const selectedPriceUnit = priceUnits.find(p => p.unit_type === selectedUnit);
    if (!selectedPriceUnit) {
      console.error("Selected unit not found in price units:", {
        selectedUnit,
        availableUnits: priceUnits.map(p => p.unit_type)
      });
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
                (p: PriceUnit) => {
                  // Ensure price unit has all required fields
                  if (!p.id || !p.product_id) {
                    console.error('Invalid price unit:', p);
                    return false;
                  }
                  return p.unit_type === selectedUnit;
                }
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
                      onValueChange={(value) => handleUnitChange(product.id, value as UnitTypeValues)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select unit">
                          {selectedPrice && 
                            `${formatPrice(selectedPrice.selling_price)} per ${selectedPrice.unit_type}`
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {product.price_units?.map((pricing) => (
                          <SelectItem key={pricing.unit_type} value={pricing.unit_type}>
                            {formatPrice(pricing.selling_price)} per {pricing.unit_type.replace('_', ' ')}
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