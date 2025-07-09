import { z } from "zod";
import { PRODUCT_CATEGORIES } from "@/constants/categories";

export const STOCK_UNITS = ["piece", "pack", "dozen"] as const;

export type StockUnitType = (typeof STOCK_UNITS)[number];

// Define type for product unit strings
export type ProductUnitString = "per_unit" | "per_kg" | "per_liter";

const priceUnitSchema = z.object({
  unit_type: z.string(),
  price: z.number().min(0, "Price cannot be negative"),
  is_default: z.boolean().optional(),
});

export interface ProductPriceUnit {
  id: number;
  product_id: number;
  unit_type: string;
  price: number;
  is_default: boolean;
}

export const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  category_id: z.number(),
  quantity: z.number().min(0, "Quantity cannot be negative"),
  min_quantity: z.number().min(0, "Minimum quantity cannot be negative"),
  image_url: z.string().optional(),
  is_active: z.boolean().default(true),
});

// Define ProductFormData explicitly to ensure consistent type for react-hook-form
export type ProductFormData = {
  name: string;
  description: string;
  sku: string;
  barcode: string;
  category_id: number;
  piece_buying_price: number;
  piece_selling_price: number;
  pack_buying_price: number;
  pack_selling_price: number;
  dozen_buying_price: number;
  dozen_selling_price: number;
  quantity: number;
  min_quantity: number;
  image_url: string;
  is_active: boolean;
};

export interface Product {
  id: number;
  name: string;
  description: string;
  sku: string;
  barcode: string;
  category_id: number;
  piece_buying_price: number;
  piece_selling_price: number;
  pack_buying_price: number;
  pack_selling_price: number;
  dozen_buying_price: number;
  dozen_selling_price: number;
  quantity: number;
  min_quantity: number;
  image_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  Category?: {
    id: number;
    name: string;
  };
}

export type ProductInsert = Omit<Product, "id" | "created_at" | "updated_at">;
export type ProductUpdate = Partial<ProductInsert>;

export interface UnitType {
  unit_type: string;
  price: number;
  is_default: boolean;
}
