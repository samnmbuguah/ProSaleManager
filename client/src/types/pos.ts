import type { PriceUnit } from "./product";

export interface CartItem {
  id: number;
  name: string;
  quantity: number;
  selectedUnit: string;
  unitPrice: number;
  total: number;
  price_units: PriceUnit[];
}

export interface SaleItem {
  product_id: number;
  quantity: number;
  price: number;
  name: string;
  unit_type: string;
  unit_price: number;
  total: number;
  unit_pricing_id: number;
}

export interface PaymentDetails {
  paymentMethod: string;
  amountPaid: number;
  change: number;
}
