import { z } from 'zod';
import { PRODUCT_CATEGORIES } from '@/constants/categories';

export const STOCK_UNITS = ['piece', 'pack', 'dozen'] as const;

export const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  product_code: z.string().optional(),
  category: z.enum(PRODUCT_CATEGORIES as [string, ...string[]]),
  stock_unit: z.enum(STOCK_UNITS),
  quantity: z.number().min(0, "Quantity cannot be negative"),
  min_stock: z.number().min(0, "Minimum stock cannot be negative"),
  buying_price: z.string().min(1, "Buying price is required"),
  selling_price: z.string().min(1, "Selling price is required"),
  image: z.instanceof(File).optional()
});

export type ProductFormData = z.infer<typeof productSchema> & {
  image?: File;
};

export interface Product {
  id: number;
  name: string;
  product_code: string | null;
  category: string;
  stock_unit: typeof STOCK_UNITS[number];
  quantity: number;
  available_units: number;
  min_stock: number;
  buying_price: string;
  selling_price: string;
  image_url: string | null;
  createdAt: string;
  updatedAt: string;
} 