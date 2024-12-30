import { z } from 'zod';
import { PRICE_UNITS } from '@/constants/priceUnits';
import { PRODUCT_CATEGORIES } from '@/constants/categories';

export const priceUnitSchema = z.object({
  unit_type: z.enum(PRICE_UNITS.map(unit => unit.value) as [string, ...string[]]),
  quantity: z.number(),
  buying_price: z.string(),
  selling_price: z.string(),
  is_default: z.boolean()
});

export const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  product_number: z.string().min(1, "Product number is required"),
  category: z.enum(PRODUCT_CATEGORIES as [string, ...string[]]),
  stock: z.number().min(0, "Stock cannot be negative"),
  min_stock: z.number().min(0, "Minimum stock cannot be negative"),
  max_stock: z.number().min(0, "Maximum stock cannot be negative"),
  reorder_point: z.number().min(0, "Reorder point cannot be negative"),
  stock_unit: z.enum(PRICE_UNITS.map(unit => unit.value) as [string, ...string[]]),
  price_units: z.array(priceUnitSchema).min(1, "At least one price unit is required")
});

export type PriceUnit = z.infer<typeof priceUnitSchema>;
export type ProductFormData = z.infer<typeof productSchema>;

export interface Product {
  id: number;
  name: string;
  product_number: string;
  category: string;
  stock: number;
  min_stock: number;
  max_stock: number;
  reorder_point: number;
  stock_unit: string;
  price_units?: PriceUnit[];
  createdAt: string;
  updatedAt: string;
} 