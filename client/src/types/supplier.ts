import { z } from "zod";

export const supplierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export type SupplierFormData = z.infer<typeof supplierSchema>;

export interface Supplier extends SupplierFormData {
  id: number;
  created_at: Date | null;
  updated_at: Date | null;
}
