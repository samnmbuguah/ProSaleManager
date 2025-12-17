import React, { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { z } from "zod";
import { Product, productSchema } from "@/types/product";
import Suppliers from "@/components/inventory/Suppliers";
import { PurchaseOrders } from "@/components/inventory/PurchaseOrders";
import ProductList from "@/components/inventory/ProductList";
import ProductFormDialog from "@/components/inventory/ProductFormDialog";
import ProductSearchBar from "@/components/inventory/ProductSearchBar";
import TabsNav from "@/components/inventory/TabsNav";
import ProductFiltersComponent from "@/components/inventory/ProductFilters";
import { filterProducts } from "@/utils/productFilters";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import Swal from "sweetalert2";
import { usePurchaseOrders } from "@/hooks/use-purchase-orders";
import StockTake from "@/components/inventory/StockTake";
import { useQueryClient } from "@tanstack/react-query";
import {
  useProductsQuery,
  type ProductFilters,
} from "@/hooks/use-products-query";
import { useStoreContext } from "@/contexts/StoreContext";

const InventoryPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentStore } = useStoreContext();

  // React Query for products data
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(100);
  const { products, pagination } = useProductsQuery(page, limit);

  // Local UI state (replaces Redux UI state)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("products");
  const [filters, setFilters] = useState<ProductFilters>({
    categoryId: null,
    stockStatus: "all",
    priceRange: { min: null, max: null },
    quantityRange: { min: null, max: null },
    isActive: null,
    stockUnit: "all",
  });
  const [formData, setFormData] = useState<z.infer<typeof productSchema>>({
    name: "",
    description: "",
    sku: "",
    barcode: "",
    category_id: 1,
    piece_buying_price: 0,
    piece_selling_price: 0,
    pack_buying_price: 0,
    pack_selling_price: 0,
    dozen_buying_price: 0,
    dozen_selling_price: 0,
    quantity: 0,
    min_quantity: 0,
    image_url: "",
    is_active: true,
    stock_unit: "piece",
  });

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[] | null>(null);

  // File validation function
  const validateImageFiles = (files: File[]): string | null => {
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const maxFiles = 10;

    if (files.length > maxFiles) {
      return `Maximum ${maxFiles} files allowed`;
    }

    for (const file of files) {
      if (file.size > maxFileSize) {
        return `File "${file.name}" is too large. Maximum size is 5MB`;
      }
      if (!allowedTypes.includes(file.type)) {
        return `File "${file.name}" has an unsupported format. Please use JPEG, PNG, or WebP`;
      }
    }

    return null;
  };

  // Use React Query hook for purchase orders
  const { purchaseOrders, isLoading: purchaseOrdersLoading } = usePurchaseOrders();

  // Display products - either search results or filtered products
  const displayProducts = searchResults || products;

  // Filter products based on current filters
  const filteredProducts = React.useMemo(() => {
    if (searchQuery && searchResults) {
      // If searching, show search results
      return searchResults;
    }
    return filterProducts(displayProducts, filters);
  }, [displayProducts, filters, searchQuery, searchResults]);

  // Filter handlers
  const handleFiltersChange = (newFilters: Partial<ProductFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleClearFilters = () => {
    setFilters({
      categoryId: null,
      stockStatus: "all",
      priceRange: { min: null, max: null },
      quantityRange: { min: null, max: null },
      isActive: null,
      stockUnit: "all",
    });
  };

  const initialFormData: z.infer<typeof productSchema> = {
    name: "",
    description: "",
    sku: "",
    barcode: "",
    category_id: 1,
    piece_buying_price: 0,
    piece_selling_price: 0,
    pack_buying_price: 0,
    pack_selling_price: 0,
    dozen_buying_price: 0,
    dozen_selling_price: 0,
    quantity: 0,
    min_quantity: 0,
    image_url: "",
    is_active: true,
    stock_unit: "piece",
  };

  // Helper function to build clean payload (only allowed fields)
  const buildCleanPayload = () => {
    const allowedFields = [
      "name",
      "description",
      "sku",
      "barcode",
      "category_id",
      "piece_buying_price",
      "piece_selling_price",
      "pack_buying_price",
      "pack_selling_price",
      "dozen_buying_price",
      "dozen_selling_price",
      "quantity",
      "min_quantity",
      "image_url",
      "is_active",
      "stock_unit",
    ] as const;

    const cleanPayload: Record<string, unknown> = {};
    allowedFields.forEach((field) => {
      if (formData[field] !== undefined) {
        cleanPayload[field] = formData[field];
      }
    });

    return cleanPayload;
  };

  const invalidateProducts = () => {
    queryClient.invalidateQueries({ queryKey: ["products", currentStore?.id] });
  };

  const handleSubmit = async (_unused: unknown, localImageFiles?: File[], onProgress?: (progress: number) => void, removedImages?: string[]) => {
    try {
      let response;
      if (localImageFiles && localImageFiles.length > 0) {
        // Validate files before upload
        const validationError = validateImageFiles(localImageFiles);
        if (validationError) {
          toast({
            title: "Invalid Files",
            description: validationError,
            variant: "destructive",
          });
          return;
        }

        // Use FormData if uploading images
        const formDataToSend = new FormData();
        const cleanPayload = buildCleanPayload();
        Object.entries(cleanPayload).forEach(([key, value]) => {
          if (typeof value === "number" || typeof value === "boolean") {
            formDataToSend.append(key, value.toString());
          } else {
            formDataToSend.append(key, Array.isArray(value) ? value.join(",") : String(value ?? ""));
          }
        });
        // Append all image files
        localImageFiles.forEach((file) => {
          formDataToSend.append("images", file);
        });

        // Append removed images if any
        if (removedImages && removedImages.length > 0) {
          formDataToSend.append("removedImages", JSON.stringify(removedImages));
        }

        const config = {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent: { loaded: number; total?: number }) => {
            if (progressEvent.total && onProgress) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              onProgress(percentCompleted);
            }
          },
        };

        if (selectedProduct) {
          response = await api.put(
            API_ENDPOINTS.products.update(selectedProduct.id),
            formDataToSend,
            config
          );
        } else {
          response = await api.post(API_ENDPOINTS.products.create, formDataToSend, config);
        }
      } else if (removedImages && removedImages.length > 0) {
        // No new files but there are removed images - still need to send update
        const formDataToSend = new FormData();
        const cleanPayload = buildCleanPayload();
        Object.entries(cleanPayload).forEach(([key, value]) => {
          if (typeof value === "number" || typeof value === "boolean") {
            formDataToSend.append(key, value.toString());
          } else {
            formDataToSend.append(key, Array.isArray(value) ? value.join(",") : String(value ?? ""));
          }
        });
        formDataToSend.append("removedImages", JSON.stringify(removedImages));

        if (selectedProduct) {
          response = await api.put(API_ENDPOINTS.products.update(selectedProduct.id), formDataToSend, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }
      } else {
        // Only include the correct fields for the backend
        const allowedFields = [
          "name",
          "description",
          "sku",
          "barcode",
          "category_id",
          "piece_buying_price",
          "piece_selling_price",
          "pack_buying_price",
          "pack_selling_price",
          "dozen_buying_price",
          "dozen_selling_price",
          "quantity",
          "min_quantity",
          "image_url",
          "is_active",
          "stock_unit",
        ] as const;
        const payload: Partial<z.infer<typeof productSchema>> = {};
        allowedFields.forEach((field) => {
          if (formData[field] !== undefined) {
            (payload as Record<string, unknown>)[field] = formData[field];
          }
        });
        if (selectedProduct) {
          response = await api.put(API_ENDPOINTS.products.update(selectedProduct.id), payload);
        } else {
          response = await api.post(API_ENDPOINTS.products.create, payload);
        }
      }
      if (!response || response.status < 200 || response.status >= 300)
        throw new Error("Failed to save product");
      toast({
        title: "Success",
        description: `Product ${selectedProduct ? "updated" : "created"} successfully`,
      });
      setFormData(initialFormData);
      setIsAddDialogOpen(false);
      setIsEditDialogOpen(false);
      invalidateProducts();
    } catch (error: unknown) {
      console.error("Error:", error);

      // Handle specific error cases
      let errorMessage = `Failed to ${selectedProduct ? "update" : "create"} product`;
      let errorTitle = "Error";
      let isRetryable = false;

      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { data?: { message?: string; error?: string }; status?: number };
        };
        const serverMessage = axiosError.response?.data?.message;
        const serverError = axiosError.response?.data?.error;
        const status = axiosError.response?.status;

        // Check if error is retryable (network issues, server errors)
        if (status && (status >= 500 || status === 408 || status === 429)) {
          isRetryable = true;
        }

        if (serverMessage) {
          if (serverMessage.includes("SKU") && serverMessage.includes("already exists")) {
            errorTitle = "SKU Already Exists";
            errorMessage = "A product with this SKU already exists. Please use a unique SKU.";

            // Generate a suggested unique SKU
            const currentSku = formData.sku;
            if (currentSku) {
              const timestamp = Date.now().toString().slice(-4);
              const suggestedSku = `${currentSku}-${timestamp}`;
              errorMessage += `\n\nSuggested SKU: ${suggestedSku}`;
            }
          } else if (serverMessage.includes("category") && serverMessage.includes("not found")) {
            errorTitle = "Invalid Category";
            errorMessage = "The selected category does not exist. Please select a valid category.";
          } else if (serverMessage.includes("required") || serverMessage.includes("missing")) {
            errorTitle = "Missing Required Fields";
            errorMessage = serverMessage;
          } else if (serverMessage.includes("Image upload failed")) {
            errorTitle = "Image Upload Failed";
            errorMessage =
              "Failed to upload images. Please check your internet connection and try again.";
            isRetryable = true;
          } else {
            errorMessage = serverMessage;
          }
        } else if (serverError) {
          errorMessage = serverError;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
        // Check for network errors
        if (error.message.includes("Network Error") || error.message.includes("timeout")) {
          isRetryable = true;
          errorTitle = "Network Error";
          errorMessage = "Connection failed. Please check your internet connection and try again.";
        }
      }

      // For SKU errors, show a more detailed toast with action
      if (errorTitle === "SKU Already Exists" && formData.sku) {
        const timestamp = Date.now().toString().slice(-4);
        const suggestedSku = `${formData.sku}-${timestamp}`;

        toast({
          title: errorTitle,
          description:
            "A product with this SKU already exists. Click 'Use Suggested SKU' to automatically update the form.",
          variant: "destructive",
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFormData({ ...formData, sku: suggestedSku });
                toast({
                  title: "SKU Updated",
                  description: `SKU updated to: ${suggestedSku}`,
                });
              }}
            >
              Use Suggested SKU
            </Button>
          ),
        });
      } else {
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive",
          action: isRetryable ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                handleSubmit(_unused, localImageFiles);
              }}
            >
              Retry
            </Button>
          ) : undefined,
        });
      }
    }
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      sku: product.sku || "",
      barcode: product.barcode || "",
      category_id: product.category_id,
      piece_buying_price: product.piece_buying_price || 0,
      piece_selling_price: product.piece_selling_price || 0,
      pack_buying_price: product.pack_buying_price || 0,
      pack_selling_price: product.pack_selling_price || 0,
      dozen_buying_price: product.dozen_buying_price || 0,
      dozen_selling_price: product.dozen_selling_price || 0,
      quantity: product.quantity,
      min_quantity: product.min_quantity,
      image_url: product.image_url || "",
      is_active: product.is_active,
      stock_unit: product.stock_unit || "piece",
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to delete this product?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(API_ENDPOINTS.products.delete(id));
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      invalidateProducts();
    } catch (error: unknown) {
      // Show SweetAlert2 error dialog for backend error
      let message = "Failed to delete product";
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        (error as { response?: { data?: { message?: string } } }).response
      ) {
        message =
          (
            error as {
              response?: { data?: { message?: string } };
              message?: string;
            }
          ).response?.data?.message ||
          (error as { message?: string }).message ||
          message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      Swal.fire({
        title: "Error",
        text: message,
        icon: "error",
      });
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults(null);
      setSearchQuery("");
      return;
    }
    try {
      const response = await api.get(API_ENDPOINTS.products.search(query));
      setSearchResults(response.data.data);
      setSearchQuery(query);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to search products",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-4 mt-16">
      <TabsNav activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex justify-between items-center mb-4">
        {activeTab === "products" && (
          <>
            <div className="flex items-center gap-4">
              <ProductSearchBar
                searchQuery={searchQuery}
                setSearchQuery={(q) => {
                  setSearchQuery(q);
                  if (!q) setSearchResults(null);
                }}
                onSearch={handleSearch}
              />
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Showing {filteredProducts.length} of {products.length} products
                </span>
                {filteredProducts.length !== products.length && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Filtered
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                Filters
              </Button>
              {filteredProducts.length !== products.length && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Clear Filters
                </Button>
              )}
            </div>
            <Button
              onClick={() => {
                setFormData(initialFormData);
                setSelectedProduct(null);
                setIsAddDialogOpen(true);
              }}
            >
              Add Product
            </Button>
          </>
        )}
      </div>
      {activeTab === "products" && (
        <>
          {/* Filter Panel */}
          {showFilters && (
            <div className="mb-6">
              <ProductFiltersComponent
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onClearFilters={handleClearFilters}
                onClose={() => setShowFilters(false)}
              />
            </div>
          )}

          {/* Results Summary */}
          <div className="mb-4 text-sm text-gray-600">
            {searchQuery ? (
              <span>
                Search results for "{searchQuery}" ({displayProducts.length} products)
              </span>
            ) : (
              <span>
                Showing {filteredProducts.length} of {products.length} products
              </span>
            )}
          </div>

          <ProductList products={filteredProducts} onEdit={handleEdit} onDelete={handleDelete} />
          {/* Pagination Controls */}
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                {pagination.total} products
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Show:</span>
                <Select
                  value={limit.toString()}
                  onValueChange={(value) => {
                    const newLimit = parseInt(value);
                    setLimit(newLimit);
                    setPage(1);
                  }}
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
            {pagination.totalPages > 1 && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </>
      )}
      <ProductFormDialog
        open={isAddDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setFormData(initialFormData);
            setSelectedProduct(null);
          }
          setIsAddDialogOpen(open);
          setIsEditDialogOpen(open);
        }}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        selectedProduct={selectedProduct}
      />
      {activeTab === "suppliers" && <Suppliers />}
      {activeTab === "purchase-orders" && (
        <PurchaseOrders purchaseOrders={purchaseOrders || []} loading={purchaseOrdersLoading} />
      )}
      {activeTab === "stock-take" && <StockTake />}
    </div>
  );
};

export default InventoryPage;
