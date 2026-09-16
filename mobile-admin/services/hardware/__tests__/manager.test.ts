jest.mock("../../api", () => ({
  api: { post: jest.fn() },
}));

import { api } from "../../api";
import { HardwareManager } from "../manager";
import { ServerRelayPrinterTransport } from "../transports";
import { NoopPrinterTransport } from "../transports";
import { BridgeScannerAdapter } from "../scanner";
import type { PrinterTransport, ReceiptData } from "../types";

const receipt: ReceiptData = {
  saleId: 7,
  receiptId: 7,
  date: "2026-09-16T10:00:00.000Z",
  items: [{ name: "Sugar", quantity: 1, unitPrice: 100, total: 100 }],
  paymentMethod: "cash",
  subtotal: 100,
  total: 100,
};

const fakePrinter = (
  overrides: Partial<PrinterTransport> = {},
): PrinterTransport => ({
  id: "fake",
  kind: "bluetooth",
  isAvailable: async () => true,
  print: jest.fn(async () => {}),
  ...overrides,
});

describe("HardwareManager", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("reports no printer when none are registered", async () => {
    const manager = new HardwareManager();
    const result = await manager.printReceipt(receipt);
    expect(result).toEqual({ printed: false, reason: "no-printer-available" });
  });

  it("prints through the first available transport", async () => {
    const manager = new HardwareManager();
    const printer = fakePrinter({ id: "good" });
    manager.registerPrinter(printer);

    const result = await manager.printReceipt(receipt);

    expect(result).toEqual({ printed: true, transport: "good" });
    expect(printer.print).toHaveBeenCalledWith(receipt);
  });

  it("skips unavailable transports", async () => {
    const manager = new HardwareManager();
    manager.registerPrinter(new NoopPrinterTransport());
    const usable = fakePrinter({ id: "usable" });
    manager.registerPrinter(usable);

    const result = await manager.printReceipt(receipt);

    expect(result.printed).toBe(true);
    expect(result.transport).toBe("usable");
  });

  it("returns a failure reason when the transport throws", async () => {
    const manager = new HardwareManager();
    manager.registerPrinter(
      fakePrinter({
        id: "broken",
        print: jest.fn(async () => {
          throw new Error("paper jam");
        }),
      }),
    );

    const result = await manager.printReceipt(receipt);

    expect(result).toEqual({ printed: false, transport: "broken", reason: "paper jam" });
  });

  it("opens the cash drawer when the transport supports it", async () => {
    const manager = new HardwareManager();
    const printer = fakePrinter({ id: "drawer", openCashDrawer: jest.fn(async () => {}) });
    manager.registerPrinter(printer);

    await expect(manager.openCashDrawer()).resolves.toBe(true);
    expect(printer.openCashDrawer).toHaveBeenCalled();
  });

  it("returns false for a drawer when no transport supports it", async () => {
    const manager = new HardwareManager();
    manager.registerPrinter(fakePrinter());
    await expect(manager.openCashDrawer()).resolves.toBe(false);
  });

  it("reports capabilities", async () => {
    const manager = new HardwareManager();
    manager.registerPrinter(fakePrinter({ id: "p", openCashDrawer: jest.fn(async () => {}) }));
    const bridge = {
      isAvailable: async () => true,
      subscribe: jest.fn(() => () => {}),
    };
    manager.registerScanner(new BridgeScannerAdapter("s", bridge));

    const caps = await manager.capabilities();
    expect(caps).toEqual({ printer: true, scanner: true, cashDrawer: true });
  });

  it("delivers scans emitted externally to active listeners", async () => {
    const manager = new HardwareManager();
    const received: string[] = [];
    const stop = await manager.startScanning((code) => received.push(code));

    manager.emitScan("12345");
    expect(received).toEqual(["12345"]);

    stop();
    manager.emitScan("67890");
    expect(received).toEqual(["12345"]);
  });

  it("starts registered scanner adapters and tears them down", async () => {
    const manager = new HardwareManager();
    const unsubscribe = jest.fn();
    const subscribe = jest.fn(() => unsubscribe);
    manager.registerScanner(
      new BridgeScannerAdapter("s", { isAvailable: async () => true, subscribe }),
    );

    const stop = await manager.startScanning(() => {});
    expect(subscribe).toHaveBeenCalledTimes(1);

    stop();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});

describe("ServerRelayPrinterTransport", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("posts the sale id (and optional ip/port) to the server", async () => {
    (api.post as jest.Mock).mockResolvedValue({ data: { success: true } });
    const transport = new ServerRelayPrinterTransport({ ip: "192.168.1.50", port: 9100 });

    await transport.print(receipt);

    expect(api.post).toHaveBeenCalledWith("/printing/print-sale", {
      saleId: 7,
      ip: "192.168.1.50",
      port: 9100,
    });
  });

  it("requires a saleId", async () => {
    const transport = new ServerRelayPrinterTransport();
    await expect(transport.print({ ...receipt, saleId: undefined })).rejects.toThrow(
      /saleId/,
    );
  });
});
