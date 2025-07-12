import { z } from 'zod'

export const supplierSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional()
})

export type SupplierFormData = z.infer<typeof supplierSchema>;

export interface Supplier {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  contact_person: string | null;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}
