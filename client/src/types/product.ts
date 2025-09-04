import { z } from "zod";

export const STOCK_UNITS = ["piece", "pack", "dozen"] as const;

export type StockUnitType = (typeof STOCK_UNITS)[number];

// Define type for product unit strings
export type ProductUnitString = "per_unit" | "per_kg" | "per_liter";

export const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  sku: z.string(),
  barcode: z.string(),
  category_id: z.number(),
  piece_buying_price: z.number().multipleOf(0.01, "Price must have at most 2 decimal places"),
  piece_selling_price: z.number().multipleOf(0.01, "Price must have at most 2 decimal places"),
  pack_buying_price: z.number().multipleOf(0.01, "Price must have at most 2 decimal places"),
  pack_selling_price: z.number().multipleOf(0.01, "Price must have at most 2 decimal places"),
  dozen_buying_price: z.number().multipleOf(0.01, "Price must have at most 2 decimal places"),
  dozen_selling_price: z.number().multipleOf(0.01, "Price must have at most 2 decimal places"),
  quantity: z.number(),
  min_quantity: z.number(),
  image_url: z.string().optional(),
  is_active: z.boolean(),
  stock_unit: z.enum(["piece", "pack", "dozen"]),
});

// Define ProductFormData explicitly to ensure consistent type for react-hook-form
export type ProductFormData = {
  name: string;
  description: string;
  sku: string;
  barcode: string;
  category_id?: number;
  piece_buying_price?: number;
  piece_selling_price?: number;
  pack_buying_price?: number;
  pack_selling_price?: number;
  dozen_buying_price?: number;
  dozen_selling_price?: number;
  quantity?: number;
  min_quantity?: number;
  image_url?: string;
  is_active: boolean;
  stock_unit: StockUnitType;
  [key: string]: string | number | boolean | string[] | undefined;
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
  images: string[]; // New field for multiple images
  stock_unit: StockUnitType;
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
