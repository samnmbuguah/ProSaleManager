import { z } from "zod";

export const productSupplierSchema = z.object({
  product_id: z.string(),
  supplier_id: z.string(),
  cost_price: z.string().min(1, "Cost price is required"),
  is_preferred: z.string(),
});

export type ProductSupplierFormData = z.infer<typeof productSupplierSchema>;

export interface ProductSupplier extends Omit<ProductSupplierFormData, "is_preferred"> {
  id: number;
  is_preferred: boolean;
  last_supply_date?: Date | null;
  store_id: number;
  created_at: Date | null;
  updated_at: Date | null;
}
