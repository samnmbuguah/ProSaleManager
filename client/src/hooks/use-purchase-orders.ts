import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PurchaseOrder, InsertPurchaseOrder, PurchaseOrderItem, InsertPurchaseOrderItem } from "@db/schema";
import { useToast } from "@/hooks/use-toast";

export function usePurchaseOrders() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: purchaseOrders, isLoading } = useQuery<PurchaseOrder[]>({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const response = await fetch("/api/purchase-orders");
      if (!response.ok) {
        throw new Error("Failed to fetch purchase orders");
      }
      return response.json();
    },
  });

  const createPurchaseOrderMutation = useMutation({
    mutationFn: async (data: InsertPurchaseOrder) => {
      const response = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to create purchase order");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast({
        title: "Success",
        description: "Purchase order created successfully",
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

  const updatePurchaseOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await fetch(`/api/purchase-orders/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error("Failed to update purchase order status");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast({
        title: "Success",
        description: "Purchase order status updated successfully",
      });
    },
  });

  return {
    purchaseOrders,
    isLoading,
    createPurchaseOrder: createPurchaseOrderMutation.mutateAsync,
    isCreating: createPurchaseOrderMutation.isPending,
    updatePurchaseOrderStatus: updatePurchaseOrderStatusMutation.mutateAsync,
    isUpdating: updatePurchaseOrderStatusMutation.isPending,
  };
}
