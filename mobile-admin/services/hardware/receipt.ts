import type { Sale } from "@/types/sale";
import type { ReceiptData } from "./types";

export interface ReceiptBranding {
  businessName?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  thankYouMessage?: string;
}

/** Maps a server `Sale` payload onto the transport-agnostic receipt shape. */
export function saleToReceipt(sale: Sale, branding: ReceiptBranding = {}): ReceiptData {
  const items = (sale.items ?? []).map((item) => ({
    name: item.Product?.name ?? `Product #${item.product_id}`,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unit_price),
    total: Number(item.total),
    unitType: item.unit_type,
  }));

  const total = Number(sale.total_amount);
  const deliveryFee = Number(sale.delivery_fee ?? 0);
  const amountPaid = sale.amount_paid != null ? Number(sale.amount_paid) : undefined;

  return {
    saleId: sale.id,
    receiptId: sale.id,
    date: sale.createdAt ?? new Date().toISOString(),
    servedBy: sale.User?.name,
    customerName: sale.Customer?.name ?? undefined,
    customerPhone: sale.Customer?.phone ?? undefined,
    customerEmail: sale.Customer?.email ?? undefined,
    items,
    paymentMethod: sale.payment_method,
    subtotal: Number((total - deliveryFee).toFixed(2)),
    deliveryFee,
    total,
    amountPaid,
    ...branding,
  };
}
