import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format").nullable(),
  phone: z.string().nullable(),
  // address and notes removed; client users use User fields
});

export interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type CustomerInsert = Omit<Customer, "id" | "createdAt" | "updatedAt">;
export type CustomerUpdate = Partial<CustomerInsert>;
