import { z } from "zod";

export interface PurchaseOrderItem {
  id?: number;
  product_id: number | string;  // Allow string for form input
  purchase_order_id?: number;
  quantity: number;
  unit_price?: number;
  buying_price?: number;  // Legacy field name - alias for unit_price
  selling_price?: number | null;
  total_price?: number;
  unit_type: string;
  store_id?: number;
  name?: string;  // For display purposes
  product_name?: string;  // For display purposes
  Product?: {
    id: number;
    name: string;
    sku?: string;
    piece_selling_price?: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

// Define schema for PurchaseOrderItem used within the form
// Coerce numeric strings coming from APIs or inputs into numbers
const purchaseOrderItemSchema = z.object({
  product_id: z.union([z.number(), z.string()]),
  quantity: z.coerce.number().int().positive("Quantity must be at least 1"),
  buying_price: z.coerce.number().nonnegative("Buying price cannot be negative").optional(),
  unit_price: z.coerce.number().nonnegative("Unit price cannot be negative").optional(),
  selling_price: z.coerce.number().nonnegative("Selling price cannot be negative").optional(),
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
  total: number | string;
}

export type PurchaseOrderStatus = "pending" | "approved" | "ordered" | "received" | "cancelled" | "rejected" | "completed";

export interface PurchaseOrder {
  id: number;
  order_number?: string;
  supplier_id: number;
  total_amount: number | string;
  status: PurchaseOrderStatus;
  notes?: string | null;
  order_date?: string | null;
  expected_delivery_date?: string | null;
  store_id?: number;
  // Support both naming conventions for timestamps
  createdAt?: string | null;
  updatedAt?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
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
