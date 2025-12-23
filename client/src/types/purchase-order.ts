import { z } from "zod";

export interface PurchaseOrderItem {
  id?: number;
  product_id: number | string;
  purchase_order_id?: number;
  quantity: number;
  buying_price: number;
  selling_price: number;
  name?: string;
  product_name?: string;
  unit_type: string;
  unit_price?: number;
  Product?: {
    id: number;
    name: string;
    sku?: string;
    piece_selling_price?: number;
  };
}

// Define schema for PurchaseOrderItem used within the form
// Coerce numeric strings coming from APIs or inputs into numbers
const purchaseOrderItemSchema = z.object({
  product_id: z.union([z.number(), z.string()]),
  quantity: z.coerce.number().int().positive("Quantity must be at least 1"),
  buying_price: z.coerce.number().nonnegative("Buying price cannot be negative"),
  selling_price: z.coerce.number().nonnegative("Selling price cannot be negative"),
  name: z.string().optional(),
  unit_type: z.string(),
});

// Define the schema for the entire purchase order form data
export const purchaseOrderSchema = z.object({
  supplier_id: z.string().min(1, "Please select a supplier"),
  expected_delivery_date: z.string().min(1, "Expected delivery date is required"),
  notes: z.string().optional(),
  items: z.array(purchaseOrderItemSchema).min(1, "At least one item is required"),
});

// Redefine PurchaseOrderFormData to match the schema for clarity
export type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>;

export interface PurchaseOrderSubmitData {
  supplier_id: number;
  items: PurchaseOrderItem[];
  total: string;
}

export interface PurchaseOrder {
  id: number;
  order_number?: string;
  supplier_id: number;
  total_amount: string;
  status: "pending" | "approved" | "rejected" | "completed" | "received";
  notes?: string | null;
  expected_delivery_date?: string | null;
  created_at: Date | null;
  updated_at: Date | null;
  supplier?: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    contact_person?: string;
    status?: string;
    created_at?: string;
    updated_at?: string;
  };
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderWithItems extends PurchaseOrder {
  items: PurchaseOrderItem[];
}
