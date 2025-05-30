export interface Sale {
  id: number;
  customer_id: number | null;
  total_amount: string;
  payment_method: string;
  status: string;
  createdAt: string;
  customer?: {
    name: string;
    email: string | null;
    phone: string | null;
  };
  user: {
    name: string;
    email: string;
  };
  items: SaleItem[];
  receiptStatus?: {
    sms?: boolean;
    whatsapp?: boolean;
  };
  change_amount?: string | number;
}

export interface SaleItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: string;
  total: string;
  product: {
    name: string;
    product_number: string;
  };
} 