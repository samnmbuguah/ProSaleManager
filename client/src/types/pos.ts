import type { PriceUnit as SchemaPriceUnit } from "../../../db/schema";
import type { UnitTypeValues as SchemaUnitTypeValues } from "../../../db/schema";

export type UnitTypeValues = SchemaUnitTypeValues;

export interface PriceUnit {
  id: number;
  product_id: number;
  unit_type: UnitTypeValues;
  quantity: number;
  buying_price: string;
  selling_price: string;
  is_default: boolean;
  created_at?: Date;
  updated_at?: Date;
}

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
  unit_pricing_id: number;
}

export interface PaymentDetails {
  amountPaid: number;
  change: number;
  items: CartItem[];
}
