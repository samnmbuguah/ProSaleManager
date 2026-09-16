import { api } from "../api";
import { buildReceipt, openCashDrawerCommand, type Columns } from "./escpos";
import type { PrinterTransport, ReceiptData } from "./types";

/**
 * Low-level handle a vendor SDK adapter (Sunmi, iMin, Pax, generic Bluetooth)
 * implements. Only `write` is required; the rest are optional capabilities.
 */
export interface VendorPrinterWriter {
  isAvailable?(): Promise<boolean>;
  write(bytes: Uint8Array): Promise<void>;
  openDrawer?(): Promise<void>;
}

/**
 * Prints by asking the ProSaleManager server to send the receipt to a LAN
 * thermal printer (TCP :9100, ESC/POS). Works today out of the box, but only
 * for printers the *server* can reach — not a device-local printer.
 */
export class ServerRelayPrinterTransport implements PrinterTransport {
  readonly id = "server-relay";
  readonly kind = "server-relay" as const;

  constructor(private readonly options: { ip?: string; port?: number } = {}) {}

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async print(data: ReceiptData): Promise<void> {
    if (!data.saleId) {
      throw new Error("ServerRelayPrinterTransport requires receipt.saleId");
    }
    await api.post("/printing/print-sale", {
      saleId: data.saleId,
      ...(this.options.ip ? { ip: this.options.ip } : {}),
      ...(this.options.port ? { port: this.options.port } : {}),
    });
  }
}

/**
 * Bridges the HAL to any vendor SDK or Bluetooth library. The POS builds the
 * ESC/POS bytes and hands them to the injected writer.
 *
 * Example (pseudo):
 *   hardware.registerPrinter(new VendorSdkPrinterTransport("sunmi", {
 *     write: (bytes) => sunmiPrinter.sendBase64(bytesToBase64(bytes)),
 *     openDrawer: () => sunmiPrinter.openDrawer(),
 *   }));
 */
export class VendorSdkPrinterTransport implements PrinterTransport {
  constructor(
    readonly id: string,
    private readonly writer: VendorPrinterWriter,
    private readonly columns: Columns = 32,
  ) {}

  readonly kind = "bluetooth" as const;

  async isAvailable(): Promise<boolean> {
    if (!this.writer.isAvailable) return true;
    try {
      return await this.writer.isAvailable();
    } catch {
      return false;
    }
  }

  async print(data: ReceiptData): Promise<void> {
    await this.writer.write(buildReceipt(data, { columns: this.columns }));
  }

  async openCashDrawer(): Promise<void> {
    if (this.writer.openDrawer) {
      await this.writer.openDrawer();
      return;
    }
    await this.writer.write(openCashDrawerCommand());
  }
}

/** Explicit "no printer" transport, useful as a placeholder or in tests. */
export class NoopPrinterTransport implements PrinterTransport {
  readonly id = "noop";
  readonly kind = "network" as const;

  async isAvailable(): Promise<boolean> {
    return false;
  }

  async print(): Promise<void> {
    throw new Error("No printer transport is available");
  }
}
