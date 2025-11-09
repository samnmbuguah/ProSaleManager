import { useState, FC } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Heart, ShoppingCart, Plus, Minus, Package } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useFavoriteStatus, useToggleFavorite } from "@/hooks/use-favorites";
import { useAuth } from "@/hooks/use-auth";
import { getImageUrl } from "@/lib/api-endpoints";
import { parseProductImages } from "@/lib/utils";
import type { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
  onImageError: (productId: number) => void;
  imageError: boolean;
  viewMode: "grid" | "list";
}

const ProductCard: FC<ProductCardProps> = ({ product, onImageError, imageError, viewMode }) => {
  const { addToCart } = useCart();
  const [selectedUnit, setSelectedUnit] = useState<"piece" | "pack" | "dozen">("piece");
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { isAuthenticated } = useAuth();
  const { data: favoriteStatus } = useFavoriteStatus(product.id, isAuthenticated);
  const toggleFavorite = useToggleFavorite();

  const handleToggleFavorite = () => {
    if (!isAuthenticated) return;
    toggleFavorite.mutate(product.id);
  };

  const getPrice = (unit: "piece" | "pack" | "dozen"): number => {
    const price = {
      piece: product.piece_selling_price,
      pack: product.pack_selling_price,
      dozen: product.dozen_selling_price,
    }[unit] || product.piece_selling_price;
    
    // Convert to number and handle any potential string values
    return typeof price === 'string' ? parseFloat(price) : Number(price);
  };

  const getUnitLabel = (unit: "piece" | "pack" | "dozen") => {
    switch (unit) {
      case "piece": return "per piece";
      case "pack": return "per pack";
      case "dozen": return "per dozen";
      default: return "per piece";
    }
  };

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    try {
      const unitPrice = getPrice(selectedUnit);
      // Ensure we're passing a number to addToCart
      const priceAsNumber = Number(unitPrice);
      for (let i = 0; i < quantity; i++) {
        addToCart(product, selectedUnit, priceAsNumber);
      }
      const button = document.getElementById(`add-to-cart-${product.id}`);
      if (button) {
        button.textContent = "Added!";
        button.classList.add("bg-green-600");
        setTimeout(() => {
          if (button) {
            button.textContent = "Add to Cart";
            button.classList.remove("bg-green-600");
          }
        }, 1500);
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const incrementQuantity = () => setQuantity((prev) => Math.min(prev + 1, 99));
  const decrementQuantity = () => setQuantity((prev) => Math.max(prev - 1, 1));
  
  const handleQuantityChange = (value: string) => {
    const num = parseInt(value);
    if (!isNaN(num) && num >= 1 && num <= 99) setQuantity(num);
  };

  const currentPrice = getPrice(selectedUnit);
  const hasMultipleUnits = product.pack_selling_price > 0 || product.dozen_selling_price > 0;
  // Safely parse images - handles corrupted/malformed data from backend
  const images = parseProductImages(product.images);
  // Fallback to image_url if no images in array
  const displayImages = images.length > 0 ? images : (product.image_url ? [product.image_url] : []);

  if (viewMode === "grid") {
    return (
      <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
        <div className="relative">
          <div className="aspect-square overflow-hidden relative">
            {!imageError ? (
              displayImages.length > 0 ? (
                displayImages.length > 1 ? (
                  <Carousel className="w-full h-full">
                    <CarouselContent>
                      {displayImages.map((img, idx) => (
                        <CarouselItem key={idx}>
                          <img
                            src={getImageUrl(img)}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={() => onImageError(product.id)}
                          />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-1 top-1/2 -translate-y-1/2 h-6 w-6 sm:h-8 sm:w-8 bg-white/80 hover:bg-white shadow-md" />
                    <CarouselNext className="right-1 top-1/2 -translate-y-1/2 h-6 w-6 sm:h-8 sm:w-8 bg-white/80 hover:bg-white shadow-md" />
                  </Carousel>
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <img
                      src={getImageUrl(displayImages[0])}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={() => onImageError(product.id)}
                    />
                  </div>
                )
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                  <Package className="w-8 h-8" />
                </div>
              )
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                <Package className="w-8 h-8" />
              </div>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className={`absolute top-2 right-2 bg-white/80 hover:bg-white h-8 w-8 p-0 ${
              favoriteStatus?.isFavorite ? "text-red-500" : "text-gray-600"
            }`}
            onClick={handleToggleFavorite}
            disabled={toggleFavorite.isPending}
          >
            <Heart className={`w-4 h-4 ${favoriteStatus?.isFavorite ? "fill-current" : ""}`} />
          </Button>
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-sm sm:text-base mb-1 line-clamp-2 h-10">
            {product.name}
          </h3>
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-green-600">
                KSh {currentPrice.toLocaleString()}
              </span>
              {hasMultipleUnits && (
                <span className="text-xs text-gray-500">{getUnitLabel(selectedUnit)}</span>
              )}
            </div>
          </div>

          <Button 
            className="w-full mt-3"
            onClick={handleAddToCart}
            disabled={isAddingToCart}
            id={`add-to-cart-${product.id}`}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Add to Cart
          </Button>
        </div>
      </Card>
    );
  }

  // List view
  return (
    <Card className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 hover:shadow-lg transition-shadow">
      {/* Product Image */}
      <div className="w-32 sm:w-40 md:w-48 h-32 sm:h-32 md:h-36 flex-shrink-0">
        {!imageError ? (
          displayImages.length > 0 ? (
            displayImages.length > 1 ? (
              <Carousel className="w-full h-full">
                <CarouselContent>
                  {displayImages.map((img, idx) => (
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
              <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                <img
                  src={getImageUrl(displayImages[0])}
                  alt={product.name}
                  className="w-full h-full object-cover rounded-lg"
                  onError={() => onImageError(product.id)}
                />
              </div>
            )
          ) : (
            <div className="w-full h-full bg-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-400 p-4 text-center">
              <Package className="w-8 h-8 mb-2" />
              <span className="text-xs">No image available</span>
            </div>
          )
        ) : (
          <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="flex flex-col items-center text-gray-400">
              <Package className="w-8 h-8 mb-1" />
              <span className="text-xs">Image failed to load</span>
            </div>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2 line-clamp-2">
            {product.name}
          </h3>
          <p className="text-gray-600 text-xs sm:text-sm mb-1 sm:mb-2 line-clamp-2">
            {product.description}
          </p>
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
            {hasMultipleUnits && (
              <span className="text-xs sm:text-sm text-gray-500">{getUnitLabel(selectedUnit)}</span>
            )}
          </div>

          {hasMultipleUnits && (
            <Select
              value={selectedUnit}
              onValueChange={(value: "piece" | "pack" | "dozen") => setSelectedUnit(value)}
            >
              <SelectTrigger className="w-24 sm:w-28 h-8 sm:h-9 text-xs sm:text-sm">
                <SelectValue placeholder="Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="piece">Per Piece</SelectItem>
                {product.pack_selling_price > 0 && (
                  <SelectItem value="pack">Per Pack</SelectItem>
                )}
                {product.dozen_selling_price > 0 && (
                  <SelectItem value="dozen">Per Dozen</SelectItem>
                )}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex items-center gap-2 mt-2 sm:mt-3">
          <div className="flex items-center border rounded-md">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-r-none"
              onClick={decrementQuantity}
              disabled={quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              min="1"
              max="99"
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              className="w-12 h-8 text-center p-0 border-0 rounded-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-l-none"
              onClick={incrementQuantity}
              disabled={quantity >= 99}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <Button
            className="flex-1 h-8 sm:h-9 text-xs sm:text-sm"
            onClick={handleAddToCart}
            disabled={isAddingToCart}
            id={`add-to-cart-${product.id}`}
          >
            <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
            Add to Cart
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9"
            onClick={handleToggleFavorite}
            disabled={toggleFavorite.isPending}
          >
            <Heart
              className={`h-4 w-4 sm:h-5 sm:w-5 ${
                favoriteStatus?.isFavorite ? "text-red-500 fill-current" : "text-gray-600"
              }`}
            />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ProductCard;
