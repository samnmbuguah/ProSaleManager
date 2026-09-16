import { saleToReceipt } from "../receipt";
import type { Sale } from "@/types/sale";

const sale = {
  id: 101,
  customer_id: 5,
  user_id: 2,
  total_amount: "1250.00",
  payment_method: "cash",
  amount_paid: "1500.00",
  status: "completed",
  payment_status: "paid",
  delivery_fee: "50.00",
  store_id: 1,
  createdAt: "2026-09-16T09:15:00.000Z",
  updatedAt: "2026-09-16T09:15:00.000Z",
  User: { id: 2, name: "Alice", email: "alice@example.com" },
  Customer: { id: 5, name: "Bob", phone: "0700000000" },
  items: [
    {
      id: 1,
      sale_id: 101,
      product_id: 9,
      quantity: 2,
      unit_price: "600.00",
      total: "1200.00",
      unit_type: "piece",
      Product: { id: 9, name: "Shoes", sku: "SH-9" },
    },
  ],
} as unknown as Sale;

describe("saleToReceipt", () => {
  it("maps costs from decimal strings to numbers", () => {
    const receipt = saleToReceipt(sale);
    expect(receipt.total).toBe(1250);
    expect(receipt.deliveryFee).toBe(50);
    expect(receipt.subtotal).toBe(1200);
    expect(receipt.amountPaid).toBe(1500);
  });

  it("carries identifiers, staff and customer details", () => {
    const receipt = saleToReceipt(sale);
    expect(receipt.saleId).toBe(101);
    expect(receipt.receiptId).toBe(101);
    expect(receipt.servedBy).toBe("Alice");
    expect(receipt.customerName).toBe("Bob");
    expect(receipt.customerPhone).toBe("0700000000");
  });

  it("maps line items", () => {
    const receipt = saleToReceipt(sale);
    expect(receipt.items).toEqual([
      { name: "Shoes", quantity: 2, unitPrice: 600, total: 1200, unitType: "piece" },
    ]);
  });

  it("applies branding overrides", () => {
    const receipt = saleToReceipt(sale, {
      businessName: "Eltee Store",
      thankYouMessage: "Karibu tena!",
    });
    expect(receipt.businessName).toBe("Eltee Store");
    expect(receipt.thankYouMessage).toBe("Karibu tena!");
  });
});
