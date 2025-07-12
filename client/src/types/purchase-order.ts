import { z } from 'zod'

export interface PurchaseOrderItem {
  product_id: number;
  purchase_order_id?: number;
  quantity: number;
  buying_price: number;
  selling_price: number;
  name?: string;
}

// Define schema for PurchaseOrderItem used within the form
const purchaseOrderItemSchema = z.object({
  product_id: z.number().int().positive(),
  quantity: z.number().int().positive('Quantity must be at least 1'),
  buying_price: z.number().nonnegative('Buying price cannot be negative'),
  selling_price: z.number().nonnegative('Selling price cannot be negative'),
  name: z.string().optional()
})

// Define the schema for the entire purchase order form data
export const purchaseOrderSchema = z.object({
  supplier_id: z.string().min(1, 'Please select a supplier'),
  expected_delivery_date: z
    .string()
    .min(1, 'Expected delivery date is required'),
  notes: z.string().optional(),
  items: z
    .array(purchaseOrderItemSchema)
    .min(1, 'At least one item is required')
})

// Redefine PurchaseOrderFormData to match the schema for clarity
export type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>;

export interface PurchaseOrderSubmitData {
  supplier_id: number;
  items: PurchaseOrderItem[];
  total: string;
}

export interface PurchaseOrder {
  id: number;
  supplier_id: number;
  total_amount: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  notes?: string | null;
  expected_delivery_date?: string | null;
  created_at: Date | null;
  updated_at: Date | null;
}

export interface PurchaseOrderWithItems extends PurchaseOrder {
  items: PurchaseOrderItem[];
}
