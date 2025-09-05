import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Heart, ShoppingCart, Plus, Minus, Package } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useFavoriteStatus, useToggleFavorite } from "@/hooks/use-favorites";
import { useAuth } from "@/hooks/use-auth";
import { getImageUrl } from "@/lib/api-endpoints";
import type { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
  onImageError: (productId: number) => void;
  imageError: boolean;
  viewMode: "grid" | "list";
}

export default function ProductCard({
  product,
  onImageError,
  imageError,
  viewMode,
}: ProductCardProps) {
  const { addToCart } = useCart();
  const [selectedUnit, setSelectedUnit] = useState<"piece" | "pack" | "dozen">("piece");
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const { isAuthenticated } = useAuth();
  const { data: favoriteStatus } = useFavoriteStatus(product.id);
  const toggleFavorite = useToggleFavorite();

  const handleToggleFavorite = () => {
    if (!isAuthenticated) {
      // You could show a login prompt here
      return;
    }
    toggleFavorite.mutate(product.id);
  };

  // Get price based on selected unit
  const getPrice = (unit: "piece" | "pack" | "dozen") => {
    switch (unit) {
      case "piece":
        return product.piece_selling_price;
      case "pack":
        return product.pack_selling_price;
      case "dozen":
        return product.dozen_selling_price;
      default:
        return product.piece_selling_price;
    }
  };

  // Get unit label
  const getUnitLabel = (unit: "piece" | "pack" | "dozen") => {
    switch (unit) {
      case "piece":
        return "per piece";
      case "pack":
        return "per pack";
      case "dozen":
        return "per dozen";
      default:
        return "per piece";
    }
  };

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    try {
      const unitPrice = getPrice(selectedUnit);
      // Add multiple quantities at once
      for (let i = 0; i < quantity; i++) {
        addToCart(product, selectedUnit, unitPrice);
      }

      // Show success feedback
      const button = document.getElementById(`add-to-cart-${product.id}`);
      if (button) {
        button.textContent = "Added!";
        button.classList.add("bg-green-600");
        setTimeout(() => {
          button.textContent = "Add to Cart";
          button.classList.remove("bg-green-600");
        }, 1500);
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const incrementQuantity = () => {
    setQuantity((prev) => Math.min(prev + 1, 99));
  };

  const decrementQuantity = () => {
    setQuantity((prev) => Math.max(prev - 1, 1));
  };

  const handleQuantityChange = (value: string) => {
    const num = parseInt(value);
    if (!isNaN(num) && num >= 1 && num <= 99) {
      setQuantity(num);
    }
  };

  const currentPrice = getPrice(selectedUnit);
  const hasMultipleUnits = product.pack_selling_price > 0 || product.dozen_selling_price > 0;

  if (viewMode === "list") {
    return (
      <Card className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 hover:shadow-lg transition-shadow">
        {/* Product Image */}
        <div className="w-32 sm:w-40 md:w-48 h-32 sm:h-32 md:h-36 flex-shrink-0">
          {!imageError ? (
            product.images && product.images.length > 1 ? (
              <Carousel className="w-full h-full">
                <CarouselContent>
                  {product.images.map((img, idx) => (
                    <CarouselItem key={idx}>
                      <img
                        src={getImageUrl(img)}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-lg"
                        onError={() => onImageError(product.id)}
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-1 top-1/2 -translate-y-1/2 h-6 w-6 sm:h-8 sm:w-8 bg-white/80 hover:bg-white shadow-md" />
                <CarouselNext className="right-1 top-1/2 -translate-y-1/2 h-6 w-6 sm:h-8 sm:w-8 bg-white/80 hover:bg-white shadow-md" />
              </Carousel>
            ) : (
              <img
                src={getImageUrl(product.images?.[0] || product.image_url || "/placeholder-product.jpg")}
                alt={product.name}
                className="w-full h-full object-cover rounded-lg"
                onError={() => onImageError(product.id)}
              />
            )
          ) : (
            <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2 line-clamp-2">{product.name}</h3>
            <p className="text-gray-600 text-xs sm:text-sm mb-1 sm:mb-2 line-clamp-2">{product.description}</p>
            <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
              <Badge variant="secondary" className="text-xs px-1 py-0">
                {product.Category?.name || "Uncategorized"}
              </Badge>
              <Badge variant="outline" className="text-xs px-1 py-0">
                SKU: {product.sku}
              </Badge>
            </div>
          </div>

          {/* Price and Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">
                KSh {currentPrice.toLocaleString()}
              </span>
              <span className="text-xs sm:text-sm text-gray-500">{getUnitLabel(selectedUnit)}</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Unit Selection */}
              {hasMultipleUnits && (
                <Select
                  value={selectedUnit}
                  onValueChange={(value: "piece" | "pack" | "dozen") => setSelectedUnit(value)}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="piece">Piece</SelectItem>
                    {product.pack_selling_price > 0 && <SelectItem value="pack">Pack</SelectItem>}
                    {product.dozen_selling_price > 0 && (
                      <SelectItem value="dozen">Dozen</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}

              {/* Quantity Controls */}
              <div className="flex items-center border rounded-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={decrementQuantity}
                  disabled={quantity <= 1}
                  className="h-8 w-8 p-0"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  className="w-16 h-8 text-center border-0 focus:ring-0"
                  min="1"
                  max="99"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={incrementQuantity}
                  disabled={quantity >= 99}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Wishlist Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className={`flex items-center gap-2 ${favoriteStatus?.isFavorite ? "text-red-500 border-red-500" : ""
                    }`}
                  onClick={handleToggleFavorite}
                  disabled={toggleFavorite.isPending}
                >
                  <Heart
                    className={`w-4 h-4 ${favoriteStatus?.isFavorite ? "fill-current" : ""}`}
                  />
                </Button>

                {/* Add to Cart Button */}
                <Button
                  id={`add-to-cart-${product.id}`}
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add to Cart
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Grid view
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div className="relative">
        {/* Product Image */}
        <div className="aspect-square overflow-hidden relative">
          {!imageError ? (
            product.images && product.images.length > 1 ? (
              <Carousel className="w-full h-full">
                <CarouselContent>
                  {product.images.map((img, idx) => (
                    <CarouselItem key={idx}>
                      <img
                        src={getImageUrl(img)}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={() => onImageError(product.id)}
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-1 top-1/2 -translate-y-1/2 h-6 w-6 sm:h-8 sm:w-8 bg-white/80 hover:bg-white shadow-md" />
                <CarouselNext className="right-1 top-1/2 -translate-y-1/2 h-6 w-6 sm:h-8 sm:w-8 bg-white/80 hover:bg-white shadow-md" />
              </Carousel>
            ) : (
              <img
                src={getImageUrl(product.images?.[0] || product.image_url || "/placeholder-product.jpg")}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={() => onImageError(product.id)}
              />
            )
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <Package className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>

        {/* Wishlist Button */}
        <Button
          variant="ghost"
          size="sm"
          className={`absolute top-1 right-1 sm:top-2 sm:right-2 bg-white/80 hover:bg-white h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 p-0 ${favoriteStatus?.isFavorite ? "text-red-500" : "text-gray-600"
            }`}
          onClick={handleToggleFavorite}
          disabled={toggleFavorite.isPending}
        >
          <Heart className={`w-3 h-3 sm:w-4 sm:h-4 ${favoriteStatus?.isFavorite ? "fill-current" : ""}`} />
        </Button>

        {/* Stock Badge */}
        {product.quantity <= product.min_quantity && (
          <Badge variant="destructive" className="absolute top-1 left-1 sm:top-2 sm:left-2 text-xs px-1 py-0">
            Low Stock
          </Badge>
        )}
      </div>

      <CardContent className="p-2 sm:p-3 md:p-4">
        {/* Product Info */}
        <div className="mb-2 sm:mb-3">
          <h3 className="font-semibold text-sm sm:text-base md:text-lg mb-1 line-clamp-2">{product.name}</h3>
          <p className="text-gray-600 text-xs sm:text-sm mb-1 sm:mb-2 line-clamp-2">{product.description}</p>
          <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
            <Badge variant="secondary" className="text-xs px-1 py-0">
              {product.Category?.name || "Uncategorized"}
            </Badge>
          </div>
        </div>

        {/* Price */}
        <div className="mb-2 sm:mb-4">
          <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
            <span className="text-sm sm:text-lg md:text-2xl font-bold text-green-600">
              KSh {currentPrice.toLocaleString()}
            </span>
            <span className="text-xs sm:text-sm text-gray-500">{getUnitLabel(selectedUnit)}</span>
          </div>

          {/* Unit Selection */}
          {hasMultipleUnits && (
            <Select
              value={selectedUnit}
              onValueChange={(value: "piece" | "pack" | "dozen") => setSelectedUnit(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="piece">
                  Piece - KSh {product.piece_selling_price.toLocaleString()}
                </SelectItem>
                {product.pack_selling_price > 0 && (
                  <SelectItem value="pack">
                    Pack - KSh {product.pack_selling_price.toLocaleString()}
                  </SelectItem>
                )}
                {product.dozen_selling_price > 0 && (
                  <SelectItem value="dozen">
                    Dozen - KSh {product.dozen_selling_price.toLocaleString()}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Quantity and Add to Cart */}
        <div className="space-y-2 sm:space-y-3">
          {/* Quantity Controls */}
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium">Qty:</span>
            <div className="flex items-center border rounded-lg">
              <Button
                variant="ghost"
                size="sm"
                onClick={decrementQuantity}
                disabled={quantity <= 1}
                className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 p-0"
              >
                <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                className="w-10 sm:w-12 md:w-16 h-6 sm:h-7 md:h-8 text-center border-0 focus:ring-0 text-xs sm:text-sm"
                min="1"
                max="99"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={incrementQuantity}
                disabled={quantity >= 99}
                className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 p-0"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>

          {/* Add to Cart Button */}
          <Button
            id={`add-to-cart-${product.id}`}
            onClick={handleAddToCart}
            disabled={isAddingToCart}
            className="w-full flex items-center gap-1 sm:gap-2 bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm h-7 sm:h-8 md:h-10"
          >
            <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">{isAddingToCart ? "Adding..." : "Add to Cart"}</span>
            <span className="xs:hidden">{isAddingToCart ? "..." : "Add"}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
