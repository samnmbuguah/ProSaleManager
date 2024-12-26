import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Product } from "@/types/product";
import type { ProductFormData } from "@/types/product";
import { useToast } from "@/hooks/use-toast";

export function useProducts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await fetch("/api/products");
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      return response.json();
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      if (data.price_units?.find(p => p.is_default)) {
        const defaultUnit = data.price_units.find(p => p.is_default);
        return {
          ...data,
          buying_price: defaultUnit?.buying_price || "0",
          selling_price: defaultUnit?.selling_price || "0",
        };
      }
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create product");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: "Success",
        description: "Product created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async (data: Partial<Product> & { id: number }) => {
      // First, update the unit pricing
      const defaultUnit = data.price_units?.find(p => p.is_default);
      if (defaultUnit) {
        const productData = {
          ...data,
          buying_price: defaultUnit.buying_price,
          selling_price: defaultUnit.selling_price,
        };

        const response = await fetch(`/api/products/${data.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (errorData.code === '23503') {
            throw new Error("Cannot update product that has associated sales records");
          }
          throw new Error("Failed to update product");
        }

        return response.json();
      }

      // Then update the product details
      const productData = {
        name: data.name,
        category: data.category,
        stock: data.stock,
        min_stock: data.min_stock,
        max_stock: data.max_stock,
        reorder_point: data.reorder_point,
        stock_unit: data.stock_unit,
      };

      const response = await fetch(`/api/products/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.code === '23503') {
          throw new Error("Cannot update product that has associated sales records");
        }
        throw new Error("Failed to update product");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  return {
    products,
    isLoading,
    createProduct: createProductMutation.mutateAsync,
    updateProduct: updateProductMutation.mutateAsync,
    isCreating: createProductMutation.isPending,
    isUpdating: updateProductMutation.isPending,
  };
} 