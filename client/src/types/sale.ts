export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total: number;
  unit_type: string;
  createdAt: string;
  updatedAt: string;
  Product: {
    id: number;
    name: string;
    sku?: string;
  };
}

export interface Sale {
  id: number;
  customer_id: number | null;
  user_id: number;
  total_amount: number;
  payment_method: string;
  amount_paid: number;
  status: string;
  payment_status: string;
  delivery_fee: number;
  receipt_status?: {
    whatsapp?: boolean;
    sms?: boolean;
    last_sent_at?: Date;
  };
  createdAt: string;
  updatedAt: string;
  Customer?: {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
  };
  User: {
    id: number;
    name: string;
    email: string;
  };
  items: SaleItem[];
}

export interface CreateSaleRequest {
  items: {
    product_id: number;
    quantity: number;
    unit_price: number;
    total: number;
    unit_type: string;
  }[];
  total: number;
  delivery_fee: number;
  customer_id: number | null;
  payment_method: string;
  status: string;
  payment_status: string;
  amount_paid: number;
  change_amount: number;
  created_at?: string;
}
