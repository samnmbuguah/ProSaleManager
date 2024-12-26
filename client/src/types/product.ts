import { z } from 'zod';
import { PRODUCT_CATEGORIES } from '@/constants/categories';

export const UnitTypes = ['per_piece', 'three_piece', 'dozen'] as const;
export type UnitTypeValues = typeof UnitTypes[number];

export const defaultUnitQuantities: Record<UnitTypeValues, number> = {
  per_piece: 1,
  three_piece: 3,
  dozen: 12,
};

export interface PriceUnit {
  id?: number;
  product_id?: number;
  unit_type: string;
  quantity: number;
  buying_price: string;
  selling_price: string;
  is_default: boolean;
}

export const priceUnitSchema = z.object({
  unit_type: z.enum(UnitTypes),
  quantity: z.number().min(1),
  buying_price: z.string(),
  selling_price: z.string(),
  is_default: z.boolean(),
});

export const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().optional(),
  category: z.enum(PRODUCT_CATEGORIES),
  stock: z.number().min(0, "Stock cannot be negative"),
  min_stock: z.number().min(0).optional(),
  max_stock: z.number().min(0).optional(),
  reorder_point: z.number().min(0).optional(),
  stock_unit: z.enum(UnitTypes),
  price_units: z.array(priceUnitSchema),
  image_url: z.string().optional().nullable(),
  buying_price: z.string().optional(),
  selling_price: z.string().optional(),
});

export type ProductFormData = z.infer<typeof productSchema> & {
  image?: File;
};

export interface Product {
  id?: number;
  name: string;
  sku: string;
  category: string;
  stock: number;
  min_stock: number;
  max_stock: number;
  reorder_point: number;
  stock_unit: string;
  buying_price: string;
  selling_price: string;
  image_url?: string | null;
  default_unit_pricing_id?: number | null;
  price_units?: PriceUnit[];
  createdAt?: Date;
  updatedAt?: Date;
} 