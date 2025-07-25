import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PurchaseOrder, PurchaseOrderSubmitData } from "@/types/purchase-order";
import { useToast } from "@/hooks/use-toast";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { api } from "@/lib/api";

export function usePurchaseOrders() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: purchaseOrders, isLoading } = useQuery<PurchaseOrder[]>({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.purchaseOrders.list);
      return response.data;
    },
  });

  const createPurchaseOrderMutation = useMutation({
    mutationFn: async (data: PurchaseOrderSubmitData) => {
      const response = await api.post(API_ENDPOINTS.purchaseOrders.create, data);
      return response.data;
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
      const response = await api.put(`${API_ENDPOINTS.purchaseOrders.update(id)}/status`, {
        status,
      });
      return response.data;
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
