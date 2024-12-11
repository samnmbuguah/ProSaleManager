import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Product } from '@db/schema';
import { useToast } from '@/hooks/use-toast';

interface SaleItem {
  product_id: number;
  quantity: number;
  price: number;
  unit_pricing_id?: number | null;
}

interface SaleData {
  items: SaleItem[];
  customerId?: number;
  total: string;
  paymentMethod: string;
  paymentStatus: string;
  amountPaid: string;
  changeAmount: string;
  cashAmount?: number;
}

export interface ReceiptData {
  id: number;
  items: {
    name: string;
    quantity: number;
    unit_price: number;
    total: number;
  }[];
  customer?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  total: number;
  payment_method: string;
  timestamp: string;
  transaction_id: string;
  cash_amount?: number;
  receipt_status?: {
    sms?: boolean;
    whatsapp?: boolean;
    last_sent_at?: string;
  };
}

declare global {
  interface Window {
    _setReceiptState?: (receipt: ReceiptData | null) => void;
  }
}

export function usePos() {
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

  const searchProducts = async (query: string) => {
    const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error("Failed to search products");
    }
    return response.json();
  };

  const createSaleMutation = useMutation({
    mutationFn: async (data: SaleData) => {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to create sale");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: "Success",
        description: "Sale completed successfully",
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

  const calculateTotal = (items: Array<{ quantity: number; selected_unit_price: { selling_price: string | number } }>) => {
    return Number(items.reduce((sum, item) => {
      return sum + (item.quantity * Number(item.selected_unit_price.selling_price));
    }, 0).toFixed(2));
  };

  return {
    products,
    isLoading,
    searchProducts,
    createSale: createSaleMutation.mutateAsync,
    isProcessing: createSaleMutation.isPending,
    calculateTotal,
  };
}
