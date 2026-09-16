import { buildReceipt, openCashDrawerCommand, bytesToBase64 } from "../escpos";
import type { ReceiptData } from "../types";

const decode = (bytes: Uint8Array): string => Array.from(bytes, (b) => String.fromCharCode(b)).join("");

const baseReceipt: ReceiptData = {
  saleId: 42,
  receiptId: 42,
  date: "2026-09-16T10:30:00.000Z",
  businessName: "Eltee Store",
  items: [
    { name: "Sugar", quantity: 2, unitPrice: 150, total: 300, unitType: "piece" },
    { name: "Rice", quantity: 1, unitPrice: 220, total: 220 },
  ],
  paymentMethod: "cash",
  subtotal: 520,
  deliveryFee: 0,
  total: 520,
  amountPaid: 600,
};

describe("buildReceipt", () => {
  it("initialises the printer then cuts at the end", () => {
    const bytes = buildReceipt(baseReceipt);
    expect(Array.from(bytes.slice(0, 2))).toEqual([0x1b, 0x40]); // ESC @
    expect(Array.from(bytes.slice(-3))).toEqual([0x1d, 0x56, 0x00]); // GS V 0 cut
  });

  it("renders business name, items and totals as ASCII text", () => {
    const text = decode(buildReceipt(baseReceipt));
    expect(text).toContain("Eltee Store");
    expect(text).toContain("Sugar");
    expect(text).toContain("Rice");
    expect(text).toContain("TOTAL");
    expect(text).toContain("Paid via cash");
  });

  it("includes cash tendered and change for cash payments", () => {
    const text = decode(buildReceipt(baseReceipt));
    expect(text).toContain("Cash Tendered");
    expect(text).toContain("Change");
    expect(text).toContain("80.00"); // 600 - 520
  });

  it("omits cash lines for non-cash payments", () => {
    const text = decode(buildReceipt({ ...baseReceipt, paymentMethod: "mpesa" }));
    expect(text).not.toContain("Cash Tendered");
  });

  it("sanitises non-ASCII characters", () => {
    const text = decode(buildReceipt({ ...baseReceipt, businessName: "Café ☕" }));
    expect(text).toContain("Caf");
    expect(text).not.toContain("é");
    expect(text).not.toContain("☕");
  });

  it("respects the 42-column width", () => {
    const text = decode(buildReceipt(baseReceipt, { columns: 42 }));
    // Extract just the printable header row (command bytes like ESC E can leave
    // a stray printable character in the decoded stream).
    const header = text.match(/Item +Qty +Price +Total/);
    expect(header?.[0].length).toBe(42);
  });

  it("uses the default thank-you message when none is provided", () => {
    const text = decode(buildReceipt(baseReceipt));
    expect(text).toContain("Thank you for your business!");
  });
});

describe("openCashDrawerCommand", () => {
  it("emits the ESC p drawer-kick pulse", () => {
    expect(Array.from(openCashDrawerCommand())).toEqual([0x1b, 0x70, 0x00, 0x19, 0xfa]);
  });

  it("supports the secondary pin", () => {
    expect(Array.from(openCashDrawerCommand(1))).toEqual([0x1b, 0x70, 0x01, 0x19, 0xfa]);
  });
});

describe("bytesToBase64", () => {
  it("encodes with correct padding", () => {
    const enc = (s: string) => bytesToBase64(Uint8Array.from(s, (c) => c.charCodeAt(0)));
    expect(enc("Man")).toBe("TWFu");
    expect(enc("Ma")).toBe("TWE=");
    expect(enc("M")).toBe("TQ==");
    expect(enc("")).toBe("");
  });

  it("round-trips against Node's Buffer for arbitrary bytes", () => {
    const bytes = Uint8Array.from([0, 1, 2, 253, 254, 255, 128, 64]);
    expect(bytesToBase64(bytes)).toBe(Buffer.from(bytes).toString("base64"));
  });
});
