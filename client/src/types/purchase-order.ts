import { z } from "zod";

export interface PurchaseOrderItem {
  product_id: number;
  purchase_order_id?: number;
  quantity: number;
  buying_price: number;
  selling_price: number;
  name?: string;
}

export const purchaseOrderSchema = z.object({
  supplier_id: z.string().min(1, "Please select a supplier"),
});

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
  status: "pending" | "approved" | "rejected" | "completed";
  notes?: string | null;
  created_at: Date | null;
  updated_at: Date | null;
}

export interface PurchaseOrderWithItems extends PurchaseOrder {
  items: PurchaseOrderItem[];
}
