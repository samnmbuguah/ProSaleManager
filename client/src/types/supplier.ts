import { z } from 'zod'

export const supplierSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string(),
  address: z.string(),
  contact_person: z.string(),
  status: z.enum(['active', 'inactive'])
})

export interface Supplier {
  id: number
  name: string
  email: string
  phone: string | null
  address: string | null
  contact_person: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export type SupplierInsert = Omit<Supplier, 'id' | 'created_at' | 'updated_at'>
export type SupplierUpdate = Partial<SupplierInsert>

export interface SupplierFormData {
  name: string
  email: string
  phone: string
  address: string
  contact_person: string
  status: 'active' | 'inactive'
}
