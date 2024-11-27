import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Product, Sale, SaleItem, Customer } from '@db/schema';
import { useToast } from '@/hooks/use-toast';

interface CartItem extends Product {
  quantity: number;
}

interface SalePayload {
  items: {
    productId: number;
    quantity: number;
    price: number;
  }[];
  customerId?: number;
  total: number;
  paymentMethod: string;
}

export function usePos() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: products } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => fetch('/api/products').then(res => res.json()),
  });

  const createSaleMutation = useMutation<Sale, Error, SalePayload>({
    mutationFn: async (sale) => {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sale),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || 'Failed to create sale');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Sale completed",
        description: "Transaction has been processed successfully",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Sale failed",
        description: error.message,
      });
    },
  });

  const searchProducts = (query: string) => {
    if (!products) return [];
    return products.filter(p => 
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.sku.toLowerCase().includes(query.toLowerCase())
    );
  };

  const calculateTotal = (items: CartItem[]) => {
    return items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  };

  return {
    products,
    searchProducts,
    calculateTotal,
    createSale: createSaleMutation.mutateAsync,
    isProcessing: createSaleMutation.isPending,
  };
}
