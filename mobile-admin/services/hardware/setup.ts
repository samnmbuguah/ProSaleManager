import { hardware } from "./manager";
import { ServerRelayPrinterTransport } from "./transports";

let initialized = false;

/**
 * Registers the transports that ship with the app. Vendor SDK adapters
 * (Sunmi/iMin/Pax printer + scanner) should also be registered here so there
 * is a single wiring point.
 *
 * Only the server-relay transport is available out of the box: it prints via
 * the ProSaleManager server to a LAN thermal printer. Set
 * EXPO_PUBLIC_LAN_PRINTER_IP to enable it.
 */
export function setupDefaultHardware(): void {
  if (initialized) return;
  initialized = true;

  const ip = process.env.EXPO_PUBLIC_LAN_PRINTER_IP;
  if (ip) {
    const port = process.env.EXPO_PUBLIC_LAN_PRINTER_PORT
      ? Number(process.env.EXPO_PUBLIC_LAN_PRINTER_PORT)
      : undefined;
    hardware.registerPrinter(new ServerRelayPrinterTransport({ ip, port }));
  }
}
