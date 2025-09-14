import React, { useState } from "react";
import type { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Package, ShoppingCart, ChevronLeft, ChevronRight, Grid3X3, List } from "lucide-react";
import { getImageUrl } from "@/lib/api-endpoints";

interface ProductSearchProps {
  products: Product[];
  onSelect: (product: Product) => void;
  searchProducts: (query: string) => Promise<void>;
  isLoading?: boolean;
}

// Custom Product Image Carousel Component
const ProductImageCarousel: React.FC<{
  images: string[];
  productName: string;
  onImageClick?: (e: React.MouseEvent) => void;
}> = ({ images, productName, onImageClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  if (images.length === 0) {
    return (
      <img
        src={getImageUrl("https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=80&q=80")}
        alt={productName}
        className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 object-cover rounded-md border"
        onClick={onImageClick}
      />
    );
  }

  return (
    <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32">
      <img
        src={getImageUrl(images[currentIndex])}
        alt={`${productName} - Image ${currentIndex + 1}`}
        className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 object-cover rounded-md border mx-auto"
        onClick={onImageClick}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = getImageUrl("https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=80&q=80");
        }}
      />
      {images.length > 1 && (
        <>
          <button
            className="absolute -left-2 top-1/2 -translate-y-1/2 h-6 w-6 bg-white/90 hover:bg-white border shadow-md rounded-full flex items-center justify-center z-20"
            onClick={goToPrevious}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            className="absolute -right-2 top-1/2 -translate-y-1/2 h-6 w-6 bg-white/90 hover:bg-white border shadow-md rounded-full flex items-center justify-center z-20"
            onClick={goToNext}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
};

export const ProductSearch: React.FC<ProductSearchProps> = ({
  products,
  onSelect,
  searchProducts,
}) => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(100);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const totalPages = Math.ceil(products.length / productsPerPage);
  const paginatedProducts = products.slice(
    (page - 1) * productsPerPage,
    page * productsPerPage
  );

  // Debounce search
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchProducts(value);
      setPage(1);
    }, 300);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      searchProducts(search);
      setPage(1);
    }
  };

  const handleProductsPerPageChange = (value: string) => {
    const newLimit = parseInt(value);
    setProductsPerPage(newLimit);
    setPage(1); // Reset to first page when changing limit
  };

  const formatPrice = (price: number) => {
    return `KSh ${price.toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // List view component for products
  const ProductListView = ({ product }: { product: Product }) => (
    <Card
      key={product.id}
      className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-300"
      onClick={() => onSelect(product)}
    >
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          {/* Product Image */}
          <div className="flex-shrink-0">
            <ProductImageCarousel
              images={product.images || []}
              productName={product.name}
              onImageClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Product Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-sm line-clamp-1">{product.name}</h3>
                <p className="text-xs text-gray-500">{product.sku}</p>
              </div>
              <Badge variant="outline" className="text-xs ml-2">
                {product.Category?.name || "No Category"}
              </Badge>
            </div>

            <div className="flex items-center justify-between mt-2">
              <div className="flex space-x-4 text-xs">
                <div>
                  <span className="text-gray-600">Piece:</span>
                  <span className="font-medium ml-1">{formatPrice(product.piece_selling_price)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Pack:</span>
                  <span className="font-medium ml-1">{formatPrice(product.pack_selling_price)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Dozen:</span>
                  <span className="font-medium ml-1">{formatPrice(product.dozen_selling_price)}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">Stock: {product.quantity}</span>
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
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Search Bar and Controls */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search products by name, SKU, or barcode..."
            value={search}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            className="pl-10"
          />
        </div>

        {/* View Toggle and Pagination Controls */}
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-r-none"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-l-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>

          {/* Pagination Limit Dropdown */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Show:</span>
            <Select
              value={productsPerPage.toString()}
              onValueChange={handleProductsPerPageChange}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="500">500</SelectItem>
                <SelectItem value="1000">1000</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Products Display */}
      {false ? (
        <div className="text-center py-8 text-gray-500">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p>Searching products...</p>
        </div>
      ) : paginatedProducts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No products found</p>
          <p className="text-sm">Try searching for a product</p>
        </div>
      ) : viewMode === "list" ? (
        /* List View */
        <div className="space-y-2">
          {paginatedProducts.map((product) => (
            <ProductListView key={product.id} product={product} />
          ))}
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {paginatedProducts.map((product) => (
            <Card
              key={product.id}
              className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-300"
              onClick={() => onSelect(product)}
            >
              <CardContent className="p-4">
                <div className="space-y-2">
                  {/* Product Image Carousel */}
                  <div className="w-full flex justify-center items-center pb-2">
                    <ProductImageCarousel
                      images={product.images || []}
                      productName={product.name}
                      onImageClick={(e) => e.stopPropagation()}
                    />
                  </div>
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
                      <span className="font-medium">
                        {formatPrice(product.piece_selling_price)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Pack:</span>
                      <span className="font-medium">{formatPrice(product.pack_selling_price)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Dozen:</span>
                      <span className="font-medium">
                        {formatPrice(product.dozen_selling_price)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-xs text-gray-500">Stock: {product.quantity}</div>
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
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">
          Showing {((page - 1) * productsPerPage) + 1} to {Math.min(page * productsPerPage, products.length)} of {products.length} products
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
