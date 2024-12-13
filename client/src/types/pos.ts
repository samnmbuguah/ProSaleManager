import type { PriceUnit, UnitTypeValues } from "../../../db/schema";

export interface CartItem {
  id: number;
  name: string;
  quantity: number;
  selectedUnit: UnitTypeValues;
  unitPrice: number;
  total: number;
  price_units: PriceUnit[];
}

export interface SaleItem {
  product_id: number;
  quantity: number;
  price: number;
  name: string;
  unit_pricing_id: number | null;
}

export interface PaymentDetails {
  amountPaid: number;
  change: number;
  items: CartItem[];
}

export type { UnitTypeValues };
