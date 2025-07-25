import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { api, API_ENDPOINTS } from "@/lib/api";
import type { Product } from "@/types/product";

export function useInventory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: productsRaw, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.products.list);
      return response.data;
    },
  });

  // Ensure products is always an array
  const products = Array.isArray(productsRaw) ? productsRaw : [];

  const createProductMutation = useMutation({
    mutationFn: async (product: Omit<Product, "id" | "created_at" | "updated_at">) => {
      const response = await api.post(API_ENDPOINTS.products.create, product);
      return response.data;
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
    mutationFn: async (product: Partial<Product> & { id: number }) => {
      const response = await api.put(API_ENDPOINTS.products.update(product.id), product);
      return response.data;
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
