import type { Request, Response } from "express";
import net from "node:net";
import { renderTextReceiptToCanvas, canvasToEscPosRaster } from "../services/escpos-raster.js";
import { buildEscPosReceiptBuffer } from "../services/escpos-text.js";
import { printSaleAsPdfToCups } from "../services/pdf-print.js";

async function sendToPrinter(ip: string, port: number, data: Buffer) {
    await new Promise<void>((resolve, reject) => {
        const socket = new net.Socket();
        socket.setTimeout(8000);
        socket.once("timeout", () => reject(new Error("Printer connection timed out")));
        socket.once("error", reject);
        socket.connect(port, ip, () => {
            socket.write(data);
            socket.end();
        });
        socket.once("close", () => resolve());
    });
}

export const PrintingController = {
    async printSaleToLan(req: Request, res: Response) {
        const { saleId, ip: ipFromBody, port } = req.body as { saleId: number; ip?: string; port?: number };
        const envIp = process.env.LAN_PRINTER_IP;
        const ip = ipFromBody || envIp;
        if (!saleId || !ip) {
            return res.status(400).json({ message: "saleId and ip are required (or set LAN_PRINTER_IP)" });
        }
        const targetPort = port ?? Number(process.env.LAN_PRINTER_PORT || 9100);
        const columnsEnv = Number(process.env.LAN_PRINTER_COLUMNS || 32);
        const columns = (columnsEnv === 42 ? 42 : 32) as 32 | 42;
        try {
            const payload = await buildEscPosReceiptBuffer(Number(saleId), { columns });
            await sendToPrinter(ip, targetPort, payload);
            return res.json({ success: true });
        } catch (err: any) {
            return res.status(500).json({ message: err?.message || "Failed to print" });
        }
    },

    async printSaleRaster(req: Request, res: Response) {
        const { saleId, ip: ipFromBody, port } = req.body as { saleId: number; ip?: string; port?: number };
        const envIp = process.env.LAN_PRINTER_IP;
        const ip = ipFromBody || envIp;
        if (!saleId || !ip) {
            return res.status(400).json({ message: "saleId and ip are required (or set LAN_PRINTER_IP)" });
        }
        const targetPort = port ?? Number(process.env.LAN_PRINTER_PORT || 9100);
        const columnsEnv = Number(process.env.LAN_PRINTER_COLUMNS || 32);
        const columns = (columnsEnv === 42 ? 42 : 32) as 32 | 42;
        const pixelWidth = Number(process.env.LAN_PRINTER_PIXEL_WIDTH || (columns === 42 ? 576 : 384));
        try {
            const lines = ["Raster printing placeholder line"]; // legacy path retained
            const canvas = renderTextReceiptToCanvas(lines, { pixelWidth });
            const data = canvasToEscPosRaster(canvas);
            await sendToPrinter(ip, targetPort, data);
            return res.json({ success: true });
        } catch (err: any) {
            return res.status(500).json({ message: err?.message || "Failed to print" });
        }
    },

    async printSalePdf(req: Request, res: Response) {
        const { saleId } = req.body as { saleId: number };
        if (!saleId) {
            return res.status(400).json({ message: "saleId is required" });
        }
        try {
            await printSaleAsPdfToCups(Number(saleId));
            return res.json({ success: true });
        } catch (err: any) {
            return res.status(500).json({ message: err?.message || "Failed to print PDF" });
        }
    },
};
