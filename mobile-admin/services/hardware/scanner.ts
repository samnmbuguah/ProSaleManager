import type { ScannerAdapter, ScannerKind } from "./types";

export interface WedgeOptions {
  /** Gaps longer than this (ms) start a new scan. Default 80. */
  maxInterKeyMs?: number;
  /** Minimum length for a completed scan. Default 4. */
  minLength?: number;
}

/**
 * Detects barcode scans from a keyboard-wedge (HID) scanner.
 *
 * Many Android POS terminals can be configured to "type" the barcode followed
 * by Enter. This buffer reconstructs the value from individual keystrokes and
 * emits it once the terminator (Enter) arrives. Fully pure — pass `now` in
 * tests to simulate timing deterministically.
 */
export class BarcodeWedgeBuffer {
  private buffer = "";
  private lastKeyAt = 0;
  private readonly maxInterKeyMs: number;
  private readonly minLength: number;

  constructor(options: WedgeOptions = {}) {
    this.maxInterKeyMs = options.maxInterKeyMs ?? 80;
    this.minLength = options.minLength ?? 4;
  }

  feed(char: string, now: number = Date.now()): string | null {
    // A long pause means the previous attempt was abandoned.
    if (this.lastKeyAt !== 0 && now - this.lastKeyAt > this.maxInterKeyMs) {
      this.buffer = "";
    }
    this.lastKeyAt = now;

    if (char === "\n" || char === "\r") {
      return this.flush();
    }
    this.buffer += char;
    return null;
  }

  /** Feed a chunk of text (e.g. from a paste or a whole-string delivery). */
  feedText(text: string, now: number = Date.now()): string | null {
    let scanned: string | null = null;
    for (const char of text) {
      const result = this.feed(char, now);
      if (result) scanned = result;
    }
    return scanned;
  }

  flush(): string | null {
    const value = this.buffer;
    this.buffer = "";
    this.lastKeyAt = 0;
    return value.length >= this.minLength ? value : null;
  }

  reset(): void {
    this.buffer = "";
    this.lastKeyAt = 0;
  }
}

/**
 * Native scanner bridge. On Sunmi/iMin devices an Android BroadcastReceiver (or
 * vendor SDK callback) delivers barcodes; wrap it with this interface and
 * register it via `hardware.registerScanner(...)`.
 */
export interface ScannerBridge {
  isAvailable(): Promise<boolean>;
  subscribe(onScan: (barcode: string) => void): () => void;
}

export class BridgeScannerAdapter implements ScannerAdapter {
  constructor(
    readonly id: string,
    private readonly bridge: ScannerBridge,
    readonly kind: ScannerKind = "intent",
  ) {}

  async isAvailable(): Promise<boolean> {
    try {
      return await this.bridge.isAvailable();
    } catch {
      return false;
    }
  }

  async start(onScan: (barcode: string) => void): Promise<() => void> {
    return this.bridge.subscribe(onScan);
  }
}
