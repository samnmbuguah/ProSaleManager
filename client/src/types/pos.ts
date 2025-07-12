import type { Product } from './product'

export interface CartItem {
  id: number;
  product: Product;
  quantity: number;
  unit_price: number;
  total: number;
  unit_type: string;
}

export interface Cart {
  items: CartItem[];
  total: number;
  customer_id?: number;
}
