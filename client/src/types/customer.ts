import { z } from 'zod'

export interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string;
  address: string | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerInsert {
  name: string;
  email: string | null;
  phone: string;
  address: string | null;
  notes: string | null;
}

export const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().nullable(),
  phone: z.string().min(1, 'Phone is required'),
  address: z.string().nullable(),
  notes: z.string().nullable()
})
