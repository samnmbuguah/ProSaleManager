import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Product, Sale, SaleItem, Customer } from '@db/schema';
import { useToast } from '@/hooks/use-toast';

interface CartItem extends Product {
  quantity: number;
  // Use sellingPrice for calculations
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

export interface ReceiptData {
  id: number;
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  customer?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  total: number;
  paymentMethod: string;
  timestamp: string;
  transactionId: string;
  receiptStatus?: {
    sms?: boolean;
    whatsapp?: boolean;
    lastSentAt?: string;
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

  const { data: products } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => fetch('/api/products').then(res => res.json()),
  });

  const createSaleMutation = useMutation<{ sale: Sale; receipt: ReceiptData }, Error, SalePayload>({
    mutationFn: async (sale) => {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sale),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to process sale');
      }
      
      const data = await response.json();
      if (!data.receipt || !data.sale) {
        throw new Error('Invalid response format from server');
      }
      
      return {
        sale: {
          id: data.sale.id,
          customerId: data.sale.customerId,
          userId: data.sale.userId,
          total: data.sale.total,
          paymentMethod: data.sale.paymentMethod,
          paymentStatus: data.sale.paymentStatus,
          createdAt: data.sale.createdAt,
          updatedAt: data.sale.updatedAt,
        },
        receipt: data.receipt,
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      if (window._setReceiptState) {
        window._setReceiptState(data.receipt);
      }
      toast({
        title: "Sale completed",
        description: "Transaction has been processed successfully",
      });
      return data;
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
    return items.reduce((sum, item) => sum + Number(item.sellingPrice) * item.quantity, 0);
  };

  // Function to send receipt via WhatsApp or SMS
  const sendReceipt = async (saleId: number, method: 'whatsapp' | 'sms', phoneNumber?: string) => {
    try {
      const response = await fetch(`/api/sales/${saleId}/receipt/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, phoneNumber }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to send receipt via ${method}`);
      }
      
      toast({
        title: "Receipt sent",
        description: `Receipt has been sent via ${method}`,
      });

      return true;
    } catch (error) {
      toast({
        variant: "destructive",
        title: `Failed to send receipt via ${method}`,
        description: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  };

  return {
    products,
    searchProducts,
    calculateTotal,
    createSale: createSaleMutation.mutateAsync,
    isProcessing: createSaleMutation.isPending,
    sendReceipt,
  };
}
