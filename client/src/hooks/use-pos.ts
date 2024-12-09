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
    name: string;
    phone?: string;
    email?: string;
  };
  total: number;
  paymentMethod: string;
  timestamp: string;
  transactionId: string;
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
      
      const { id: saleId } = await response.json();
      
      // Fetch receipt data with retries
      let retries = 3;
      let receipt;
      
      while (retries > 0) {
        try {
          const receiptResponse = await fetch(`/api/sales/${saleId}/receipt`);
          if (!receiptResponse.ok) {
            const errorData = await receiptResponse.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to generate receipt');
          }
          
          receipt = await receiptResponse.json();
          break;
        } catch (error) {
          retries--;
          if (retries === 0) {
            throw error;
          }
          // Wait for 1 second before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      return { sale: { id: saleId }, receipt };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
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
  const sendReceipt = async (saleId: number, method: 'whatsapp' | 'sms') => {
    try {
      const response = await fetch(`/api/sales/${saleId}/receipt/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to send receipt via ${method}`);
      }
      
      toast({
        title: "Receipt sent",
        description: `Receipt has been sent via ${method}`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: `Failed to send receipt via ${method}`,
        description: error instanceof Error ? error.message : 'Unknown error',
      });
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
