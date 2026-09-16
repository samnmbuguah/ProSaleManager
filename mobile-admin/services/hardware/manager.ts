import type {
  HardwareCapabilities,
  PrinterTransport,
  PrintResult,
  ReceiptData,
  ScannerAdapter,
} from "./types";

/**
 * Central coordinator for POS hardware. Register transports/adapters once and
 * the POS screen can print receipts and receive scans without knowing which
 * vendor or connection is in use. Everything degrades gracefully when no
 * hardware is present.
 */
export class HardwareManager {
  private printers: PrinterTransport[] = [];
  private scanners: ScannerAdapter[] = [];
  private readonly scanListeners = new Set<(barcode: string) => void>();

  registerPrinter(transport: PrinterTransport): this {
    this.printers = this.printers.filter((p) => p.id !== transport.id);
    this.printers.push(transport);
    return this;
  }

  registerScanner(adapter: ScannerAdapter): this {
    this.scanners = this.scanners.filter((s) => s.id !== adapter.id);
    this.scanners.push(adapter);
    return this;
  }

  unregisterPrinter(id: string): this {
    this.printers = this.printers.filter((p) => p.id !== id);
    return this;
  }

  unregisterScanner(id: string): this {
    this.scanners = this.scanners.filter((s) => s.id !== id);
    return this;
  }

  /** Deliver a barcode from an external source (HID wedge hook, native intent). */
  emitScan(barcode: string): void {
    if (!barcode) return;
    this.scanListeners.forEach((listener) => listener(barcode));
  }

  private async firstAvailablePrinter(): Promise<PrinterTransport | null> {
    for (const printer of this.printers) {
      try {
        if (await printer.isAvailable()) return printer;
      } catch {
        // treat a throwing probe as unavailable and continue
      }
    }
    return null;
  }

  async printReceipt(data: ReceiptData): Promise<PrintResult> {
    const printer = await this.firstAvailablePrinter();
    if (!printer) {
      return { printed: false, reason: "no-printer-available" };
    }
    try {
      await printer.print(data);
      return { printed: true, transport: printer.id };
    } catch (error) {
      return {
        printed: false,
        transport: printer.id,
        reason: error instanceof Error ? error.message : "print-failed",
      };
    }
  }

  async openCashDrawer(): Promise<boolean> {
    const printer = await this.firstAvailablePrinter();
    if (!printer?.openCashDrawer) return false;
    try {
      await printer.openCashDrawer();
      return true;
    } catch {
      return false;
    }
  }

  async capabilities(): Promise<HardwareCapabilities> {
    const printer = await this.firstAvailablePrinter();
    let scanner = false;
    for (const adapter of this.scanners) {
      try {
        if (await adapter.isAvailable()) {
          scanner = true;
          break;
        }
      } catch {
        // ignore and continue
      }
    }
    return {
      printer: Boolean(printer),
      cashDrawer: Boolean(printer?.openCashDrawer),
      scanner: scanner || this.scanListeners.size > 0,
    };
  }

  /** Starts every available scanner adapter; resolves to a single cleanup fn. */
  async startScanning(onScan: (barcode: string) => void): Promise<() => void> {
    this.scanListeners.add(onScan);
    const cleanups: Array<() => void> = [];
    for (const adapter of this.scanners) {
      try {
        if (await adapter.isAvailable()) {
          cleanups.push(await adapter.start(onScan));
        }
      } catch {
        // ignore adapters that fail to start
      }
    }
    return () => {
      this.scanListeners.delete(onScan);
      for (const cleanup of cleanups) {
        try {
          cleanup();
        } catch {
          // ignore
        }
      }
    };
  }

  /** Test helper: clears all registered hardware. */
  reset(): void {
    this.printers = [];
    this.scanners = [];
    this.scanListeners.clear();
  }
}

/** Shared singleton used by the app. */
export const hardware = new HardwareManager();
