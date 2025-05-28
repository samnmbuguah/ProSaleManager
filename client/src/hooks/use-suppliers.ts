import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Supplier, SupplierFormData } from "@/types/supplier";
import type {
  ProductSupplier,
  ProductSupplierFormData,
} from "@/types/product-supplier";
import { useToast } from "@/hooks/use-toast";

export function useSuppliers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: suppliers, isLoading } = useQuery<Supplier[]>({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const response = await fetch("/api/suppliers");
      if (!response.ok) {
        throw new Error("Failed to fetch suppliers");
      }
      return response.json();
    },
  });

  const createSupplierMutation = useMutation({
    mutationFn: async (data: SupplierFormData) => {
      const response = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        if (error.code === "23505") {
          throw new Error("This email is already registered");
        }
        throw new Error(error.message || "Failed to create supplier");
      }
      return response.json();
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
      // Let the error propagate to the form for field-level handling
      throw error;
    },
  });

  const linkProductToSupplierMutation = useMutation({
    mutationFn: async (data: ProductSupplierFormData) => {
      const response = await fetch("/api/product-suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to link product to supplier");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-suppliers"] });
      toast({
        title: "Success",
        description: "Product linked to supplier successfully",
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

  const { data: productSuppliers } = useQuery<ProductSupplier[]>({
    queryKey: ["product-suppliers"],
    queryFn: async () => {
      const response = await fetch("/api/product-suppliers");
      if (!response.ok) {
        throw new Error("Failed to fetch product suppliers");
      }
      return response.json();
    },
  });

  return {
    suppliers,
    isLoading,
    createSupplier: createSupplierMutation.mutateAsync,
    isCreating: createSupplierMutation.isPending,
    linkProductToSupplier: linkProductToSupplierMutation.mutateAsync,
    isLinking: linkProductToSupplierMutation.isPending,
    productSuppliers,
  };
}
