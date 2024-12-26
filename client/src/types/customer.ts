import { z } from 'zod';

export const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().nullable(),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().nullable(),
  notes: z.string().nullable(),
});

export type CustomerInsert = z.infer<typeof customerSchema>;

export interface Customer extends CustomerInsert {
  id: number;
  created_at: Date | null;
  updated_at: Date | null;
} 