import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Supplier, InsertSupplier, PurchaseOrder, InsertSupplierProduct } from '@db/schema';
import { useToast } from '@/hooks/use-toast';

export function useSuppliers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: suppliers, isLoading } = useQuery<Supplier[]>({
    queryKey: ['suppliers'],
    queryFn: () => fetch('/api/suppliers').then(res => res.json()),
  });
  const { data: reorderSuggestions } = useQuery({
    queryKey: ['reorder-suggestions'],
    queryFn: () => fetch('/api/inventory/reorder-suggestions').then(res => res.json()),
  });

  const createSupplierMutation = useMutation<Supplier, Error, InsertSupplier>({
    mutationFn: (supplier) =>
      fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplier),
        credentials: 'include',
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({
        title: "Supplier created",
        description: "New supplier has been added successfully",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to create supplier",
        description: error.message,
      });
    },
  });

  const { data: purchaseOrders, isLoading: isLoadingOrders } = useQuery<PurchaseOrder[]>({
    queryKey: ['purchase-orders'],
    queryFn: () => fetch('/api/purchase-orders').then(res => res.json()),
  });

  const createPurchaseOrderMutation = useMutation({
    mutationFn: (data: { 
      supplierId: number;
      items: Array<{
        productId: number;
        quantity: number;
        unitPrice: number;
      }>;
      expectedDeliveryDate?: string;
    }) =>
      fetch('/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast({
        title: "Purchase order created",
        description: "New purchase order has been created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to create purchase order",
        description: error.message,
      });
    },
  });

  const receivePurchaseOrderMutation = useMutation({
    mutationFn: (data: { 
      id: number;
      items: Array<{
        id: number;
        productId: number;
        quantity: number;
      }>;
    }) =>
      fetch(`/api/purchase-orders/${data.id}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: data.items }),
        credentials: 'include',
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Items received",
        description: "Purchase order items have been received successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to receive items",
        description: error.message,
      });
    },
  });

  const updateSupplierQualityMutation = useMutation({
    mutationFn: (data: { id: number; rating: number }) =>
      fetch(`/api/suppliers/${data.id}/quality-rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: data.rating }),
        credentials: 'include',
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({
        title: "Quality rating updated",
        description: "Supplier quality rating has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to update quality rating",
        description: error.message,
      });
    },
  });

  const getSupplierProducts = (supplierId?: number) => useQuery({
    queryKey: ['supplier-products', supplierId],
    queryFn: () =>
      supplierId
        ? fetch(`/api/supplier-products/${supplierId}`).then((res) => res.json())
        : Promise.resolve([]),
    enabled: !!supplierId,
  });

  const addSupplierProductMutation = useMutation({
    mutationFn: (data: InsertSupplierProduct) =>
      fetch('/api/supplier-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-products'] });
      toast({
        title: 'Product added',
        description: 'Product has been added to supplier successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to add product',
        description: error.message,
      });
    },
  });

  const updateSupplierProductMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<InsertSupplierProduct>) =>
      fetch(`/api/supplier-products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Product updated',
        description: 'Supplier product has been updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to update product',
        description: error.message,
      });
    },
  });

  return {
    suppliers,
    isLoading,
    createSupplier: createSupplierMutation.mutateAsync,
    isCreatingSupplier: createSupplierMutation.isPending,
    purchaseOrders,
    isLoadingOrders,
    createPurchaseOrder: createPurchaseOrderMutation.mutateAsync,
    isCreatingOrder: createPurchaseOrderMutation.isPending,
    receivePurchaseOrder: receivePurchaseOrderMutation.mutateAsync,
    isReceivingOrder: receivePurchaseOrderMutation.isPending,
    updateSupplierQuality: updateSupplierQualityMutation.mutateAsync,
    isUpdatingQuality: updateSupplierQualityMutation.isPending,
    reorderSuggestions,
    getSupplierProducts,
    addSupplierProduct: addSupplierProductMutation.mutateAsync,
    isAddingProduct: addSupplierProductMutation.isPending,
    updateSupplierProduct: updateSupplierProductMutation.mutateAsync,
    isUpdatingProduct: updateSupplierProductMutation.isPending,
  };
}
