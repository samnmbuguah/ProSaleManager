/**
 * Hardware abstraction layer (HAL) for the mobile POS.
 *
 * The goal is to keep the POS screen free of vendor-specific code. Handheld
 * Android POS terminals (Sunmi, iMin, Pax, ...) expose their printer/scanner
 * through different SDKs; those are plugged in as transports/adapters here.
 *
 * Nothing in this module depends on a native package, so the app builds and
 * runs on a plain Android device. Capabilities simply report as unavailable
 * until a transport or adapter is registered.
 */

export type ConnectionKind = "bluetooth" | "usb" | "network" | "server-relay";

export type ScannerKind = "intent" | "hid-wedge" | "camera" | "manual";

export interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  unitType?: string;
}

export interface ReceiptData {
  /** Optional server sale id — required by the server-relay transport. */
  saleId?: number;
  receiptId: string | number;
  date: string | Date;
  servedBy?: string;
  businessName?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  thankYouMessage?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  items: ReceiptItem[];
  paymentMethod: string;
  subtotal: number;
  deliveryFee?: number;
  total: number;
  amountPaid?: number;
  currency?: string;
}

export interface PrinterTransport {
  readonly id: string;
  readonly kind: ConnectionKind;
  /** Whether this transport can currently reach its printer. */
  isAvailable(): Promise<boolean>;
  print(data: ReceiptData): Promise<void>;
  openCashDrawer?(): Promise<void>;
}

export interface ScannerAdapter {
  readonly id: string;
  readonly kind: ScannerKind;
  isAvailable(): Promise<boolean>;
  /** Begin listening; resolves to an unsubscribe function. */
  start(onScan: (barcode: string) => void): Promise<() => void>;
}

export interface HardwareCapabilities {
  printer: boolean;
  scanner: boolean;
  cashDrawer: boolean;
}

export interface PrintResult {
  printed: boolean;
  transport?: string;
  reason?: string;
}
