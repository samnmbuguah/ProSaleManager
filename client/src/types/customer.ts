import { z } from 'zod'

export const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format').nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  notes: z.string().optional()
})

export interface Customer {
  id: number
  name: string
  email: string | null
  phone: string | null
  address: string | null
  notes?: string
  created_at: string
  updated_at: string
}

export type CustomerInsert = Omit<Customer, 'id' | 'created_at' | 'updated_at'>
export type CustomerUpdate = Partial<CustomerInsert>
