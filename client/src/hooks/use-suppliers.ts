import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { api, API_ENDPOINTS } from "@/lib/api";
import type { Supplier } from "@/types/supplier";

export function useSuppliers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: suppliersRaw, isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.suppliers.list);
      return response.data;
    },
  });

  // Always return an array for suppliers
  const suppliers = Array.isArray(suppliersRaw) ? suppliersRaw : (suppliersRaw?.data ?? []);

  const createSupplierMutation = useMutation({
    mutationFn: async (data: Omit<Supplier, "id" | "created_at" | "updated_at">) => {
      const response = await api.post(API_ENDPOINTS.suppliers.create, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast({
        title: "Success",
        description: "Supplier created successfully",
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

  const createProductSupplierMutation = useMutation({
    mutationFn: async (data: { product_id: number; supplier_id: number; price: number }) => {
      const response = await api.post(API_ENDPOINTS.productSuppliers.create, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-suppliers"] });
      toast({
        title: "Success",
        description: "Product supplier created successfully",
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

  const { data: productSuppliers } = useQuery({
    queryKey: ["product-suppliers"],
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.productSuppliers.list);
      return response.data;
    },
  });

  return {
    suppliers,
    productSuppliers,
    isLoading,
    createSupplier: createSupplierMutation.mutateAsync,
    createProductSupplier: createProductSupplierMutation.mutateAsync,
    isCreating: createSupplierMutation.isPending,
    isCreatingProductSupplier: createProductSupplierMutation.isPending,
  };
}
