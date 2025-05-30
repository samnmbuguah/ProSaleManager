import { z } from "zod";
import { PRODUCT_CATEGORIES } from "@/constants/categories";

export const STOCK_UNITS = ["piece", "pack", "dozen"] as const;

export type StockUnitType = (typeof STOCK_UNITS)[number];

// Define type for product unit strings
export type ProductUnitString = "per_unit" | "per_kg" | "per_liter";

const priceUnitSchema = z.object({
  unit_type: z.string(),
  quantity: z.number().min(0, "Quantity per unit cannot be negative"),
  buying_price: z.string().min(0, "Buying price cannot be negative"),
  selling_price: z.string().min(0, "Selling price cannot be negative"),
  manual: z.boolean().optional(),
  is_default: z.boolean().optional(),
});

export interface ProductPriceUnit {
  unit_type: string;
  buying_price: string;
  selling_price: string;
  manual?: boolean;
  is_default?: boolean;
  quantity: number;
}

export const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  product_code: z.string().optional(),
  category: z.enum(PRODUCT_CATEGORIES as unknown as [string, ...string[]]),
  stock_unit: z.enum(STOCK_UNITS),
  stock: z.number().min(0, "Stock cannot be negative"),
  min_stock: z.number().min(0, "Minimum stock cannot be negative"),
  max_stock: z.number().min(0, "Maximum stock cannot be negative").optional(),
  reorder_point: z
    .number()
    .min(0, "Reorder point cannot be negative")
    .optional(),
  buying_price: z.string().min(0, "Buying price is required"),
  selling_price: z.string().min(0, "Selling price is required"),
  image: z.instanceof(File).optional(),
  price_units: z.array(priceUnitSchema),
});

// Define ProductFormData explicitly to ensure consistent type for react-hook-form
export type ProductFormData = {
  name: string;
  product_code?: string;
  category: z.infer<typeof productSchema.shape.category>; // Use z.infer for enum types
  stock_unit: z.infer<typeof productSchema.shape.stock_unit>; // Use z.infer for enum types
  stock: number;
  min_stock: number;
  max_stock?: number;
  reorder_point?: number;
  buying_price: string;
  selling_price: string;
  image?: File;
  price_units: ProductPriceUnit[];
};

export interface Product {
  id: number;
  name: string;
  sku?: string | null;
  product_code: string | null;
  category: string;
  stock_unit: (typeof STOCK_UNITS)[number];
  stock: number;
  available_units: number;
  min_stock: number;
  max_stock?: number;
  reorder_point?: number;
  buying_price: string;
  selling_price: string;
  image_url: string | null;
  createdAt: string;
  updatedAt: string;
  price_units?: ProductPriceUnit[];
  price: number;
  unit: ProductUnitString;
  low_stock_threshold: number;
}

export type ProductInsert = Omit<Product, "id">;

export type ProductUpdate = Partial<ProductInsert>;
