import type { ReceiptData } from "./types";

/**
 * Pure ESC/POS command builder. Produces the raw byte stream a thermal
 * receipt printer expects. No native dependency, so it is fully unit-testable
 * and reusable by any transport (Bluetooth, USB, TCP, vendor SDK).
 */

export type Columns = 32 | 42;

const ESC = 0x1b;
const GS = 0x1d;

const stripNonAscii = (input: string): string => input.replace(/[^\x20-\x7E\n\r\t]/g, " ");

const padRight = (text: string, width: number): string => {
  const t = stripNonAscii(text);
  return t.length >= width ? t.slice(0, width) : t + " ".repeat(width - t.length);
};

const padLeft = (text: string, width: number): string => {
  const t = stripNonAscii(text);
  return t.length >= width ? t.slice(0, width) : " ".repeat(width - t.length) + t;
};

const center = (text: string, width: number): string => {
  const t = stripNonAscii(text);
  if (t.length >= width) return t.slice(0, width);
  const left = Math.floor((width - t.length) / 2);
  return " ".repeat(left) + t + " ".repeat(width - t.length - left);
};

const formatDateTime = (value: string | Date): string => {
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return stripNonAscii(String(value));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Incrementally accumulates bytes for an ESC/POS job. */
export class ByteWriter {
  private readonly bytes: number[] = [];

  raw(...values: number[]): this {
    for (const v of values) this.bytes.push(v & 0xff);
    return this;
  }

  ascii(text: string): this {
    const s = stripNonAscii(text);
    for (let i = 0; i < s.length; i++) this.bytes.push(s.charCodeAt(i) & 0xff);
    return this;
  }

  line(text = ""): this {
    return this.ascii(text).lf();
  }

  init(): this {
    return this.raw(ESC, 0x40);
  }

  align(a: 0 | 1 | 2): this {
    return this.raw(ESC, 0x61, a);
  }

  bold(on: boolean): this {
    return this.raw(ESC, 0x45, on ? 1 : 0);
  }

  size(widthMul: 1 | 2, heightMul: 1 | 2): this {
    return this.raw(GS, 0x21, ((heightMul - 1) << 4) | (widthMul - 1));
  }

  sizeNormal(): this {
    return this.raw(GS, 0x21, 0x00);
  }

  lf(): this {
    return this.raw(0x0a);
  }

  feed(lines = 1): this {
    return this.raw(ESC, 0x64, Math.max(0, Math.min(255, lines)));
  }

  cut(): this {
    return this.raw(GS, 0x56, 0x00);
  }

  /** ESC p m t1 t2 — pulse the drawer kick connector (RJ11 via printer). */
  drawerKick(pin: 0 | 1 = 0): this {
    return this.raw(ESC, 0x70, pin, 0x19, 0xfa);
  }

  toUint8Array(): Uint8Array {
    return Uint8Array.from(this.bytes);
  }
}

/** Standalone drawer-kick pulse, for transports that only need that command. */
export function openCashDrawerCommand(pin: 0 | 1 = 0): Uint8Array {
  return new ByteWriter().drawerKick(pin).toUint8Array();
}

/** Builds a complete receipt job (init → content → feed → cut). */
export function buildReceipt(data: ReceiptData, options: { columns?: Columns } = {}): Uint8Array {
  const width = options.columns ?? 32;
  const half = Math.floor(width / 2);
  const rightHalf = width - half;
  const w = new ByteWriter();

  const money = (label: string, amount: number) =>
    padRight(label, half) + padLeft(amount.toFixed(2), rightHalf);

  w.init();
  w.align(1);

  w.bold(true).size(2, 2);
  w.line(center(data.businessName || "PROSALE MANAGER", half));
  w.sizeNormal().bold(false);

  if (data.address) w.line(center(data.address, width));
  const contact = [data.phone && `Tel: ${data.phone}`, data.email && `Email: ${data.email}`]
    .filter(Boolean)
    .join("  ");
  if (contact) w.line(center(contact, width));
  if (data.website) w.line(center(data.website, width));
  w.lf();

  w.align(0);
  if (data.servedBy) {
    w.bold(true).line(padRight(`Served By: ${data.servedBy}`, width)).bold(false);
  }
  w.line(padRight(`Receipt #${String(data.receiptId).padStart(5, "0")}`, width));
  w.line(padRight(formatDateTime(data.date), width));
  if (data.customerName) w.line(padRight(`Customer: ${data.customerName}`, width));
  if (data.customerPhone) w.line(padRight(`Phone: ${data.customerPhone}`, width));
  w.line("-".repeat(width));

  w.bold(true);
  const nameWidth = Math.floor(width * 0.55);
  const qtyWidth = 4;
  const priceWidth = 8;
  const totalWidth = width - nameWidth - qtyWidth - priceWidth;
  w.line(
    padRight("Item", nameWidth) +
      padRight("Qty", qtyWidth) +
      padLeft("Price", priceWidth) +
      padLeft("Total", totalWidth),
  );
  w.bold(false);

  for (const item of data.items) {
    const label = item.unitType ? `${item.name} (${item.unitType})` : item.name;
    w.line(padRight(label, nameWidth) + padRight(String(item.quantity), qtyWidth));
    w.line(
      padRight(`${item.quantity} x ${item.unitPrice.toFixed(2)}`, half) +
        padLeft(item.total.toFixed(2), rightHalf),
    );
  }

  w.line("-".repeat(width));
  w.line(money("Subtotal", data.subtotal));
  if (data.deliveryFee && data.deliveryFee > 0) {
    w.line(money("Delivery", data.deliveryFee));
  }
  w.bold(true);
  w.line(money("TOTAL", data.total));
  w.bold(false);
  w.line(padRight(`Paid via ${data.paymentMethod}`, width));
  if (
    data.paymentMethod.toLowerCase() === "cash" &&
    typeof data.amountPaid === "number"
  ) {
    w.line(money("Cash Tendered", data.amountPaid));
    w.line(money("Change", data.amountPaid - data.total));
  }

  w.lf();
  w.align(1);
  w.line(center(data.thankYouMessage || "Thank you for your business!", width));
  w.align(0);
  w.feed(3);
  w.cut();

  return w.toUint8Array();
}

const BASE64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** Base64 encoder that does not depend on Buffer/btoa (Hermes-safe). */
export function bytesToBase64(bytes: Uint8Array): string {
  let result = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : undefined;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : undefined;

    result += BASE64_ALPHABET[b0 >> 2];
    result += BASE64_ALPHABET[((b0 & 0x03) << 4) | ((b1 ?? 0) >> 4)];
    result += b1 === undefined ? "=" : BASE64_ALPHABET[((b1 & 0x0f) << 2) | ((b2 ?? 0) >> 6)];
    result += b2 === undefined ? "=" : BASE64_ALPHABET[b2 & 0x3f];
  }
  return result;
}
