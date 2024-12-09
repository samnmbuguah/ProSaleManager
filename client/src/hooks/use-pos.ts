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
  cashAmount?: number;
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
  cashAmount?: number;
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

      // Ensure all receipt fields are properly formatted
      const formattedReceipt: ReceiptData = {
        id: data.sale.id,
        items: data.receipt.items.map((item: any) => ({
          name: item.name || 'Unknown Product',
          quantity: Number(item.quantity) || 0,
          unitPrice: Number(item.unitPrice || item.price) || 0,
          total: Number(item.total) || (Number(item.quantity) || 0) * (Number(item.unitPrice || item.price) || 0),
        })),
        customer: data.receipt.customer ? {
          name: data.receipt.customer.name || '',
          phone: data.receipt.customer.phone || '',
          email: data.receipt.customer.email || '',
        } : undefined,
        total: Number(data.sale.total) || 0,
        paymentMethod: data.sale.paymentMethod || 'cash',
        timestamp: data.sale.createdAt || new Date().toISOString(),
        transactionId: `TXN-${data.sale.id}`,
        cashAmount: data.sale.cashAmount ? Number(data.sale.cashAmount) : undefined,
        receiptStatus: {
          sms: Boolean(data.receipt.receiptStatus?.sms),
          whatsapp: Boolean(data.receipt.receiptStatus?.whatsapp),
          lastSentAt: data.receipt.receiptStatus?.lastSentAt,
        },
      };
      
      return {
        sale: data.sale,
        receipt: formattedReceipt,
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      if (window._setReceiptState) {
        window._setReceiptState(data.receipt);
      }
      toast({
        title: "Sale completed",
        description: "Transaction has been processed successfully. Receipt is ready.",
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
    return items.reduce((sum, item) => sum + Number(item.sellingPrice) * item.quantity, 0);
  };

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
