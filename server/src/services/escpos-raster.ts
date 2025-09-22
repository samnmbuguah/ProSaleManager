import { createCanvas, CanvasRenderingContext2D } from "canvas";

export interface RasterOptions {
    pixelWidth?: number; // e.g., 384 for 58mm, 576 for 80mm
    margin?: number; // left/right margin in pixels
    lineHeight?: number; // pixels
    fontFamily?: string;
    fontSize?: number; // px
}

export function renderTextReceiptToCanvas(textLines: string[], opts?: RasterOptions) {
    const pixelWidth = opts?.pixelWidth ?? 384;
    const margin = opts?.margin ?? 8;
    const envFontSize = Number(process.env.LAN_PRINTER_FONT_SIZE || 14);
    const envLineHeight = Number(process.env.LAN_PRINTER_LINE_HEIGHT || 18);
    const lineHeight = opts?.lineHeight ?? envLineHeight;
    const fontFamily = opts?.fontFamily ?? "Arial, sans-serif";
    const fontSize = opts?.fontSize ?? envFontSize;

    const contentWidth = pixelWidth - margin * 2;
    const height = Math.max(1, (textLines.length + 4) * lineHeight);
    const canvas = createCanvas(pixelWidth, height);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#000000";
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textBaseline = "top";

    let y = margin;
    for (const line of textLines) {
        let remaining = line;
        while (remaining.length > 0) {
            let i = remaining.length;
            while (i > 0 && ctx.measureText(remaining.slice(0, i)).width > contentWidth) {
                i--;
            }
            if (i === 0) break;
            const segment = remaining.slice(0, i);
            ctx.fillText(segment, margin, y);
            y += lineHeight;
            remaining = remaining.slice(i);
        }
    }

    return canvas;
}

export function canvasToEscPosRaster(canvas: ReturnType<typeof createCanvas>): Buffer {
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    const { width, height } = canvas;
    const imageData = ctx.getImageData(0, 0, width, height);
    const bytesPerRow = Math.ceil(width / 8);
    const raster = Buffer.alloc(bytesPerRow * height);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const r = imageData.data[idx];
            const g = imageData.data[idx + 1];
            const b = imageData.data[idx + 2];
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            const bit = gray < 160 ? 1 : 0; // slightly lighter threshold to reduce ink
            if (bit) {
                const byteIndex = y * bytesPerRow + (x >> 3);
                raster[byteIndex] |= 0x80 >> (x & 7);
            }
        }
    }

    const m = 0x00; // normal
    const xL = bytesPerRow & 0xff;
    const xH = (bytesPerRow >> 8) & 0xff;
    const yL = height & 0xff;
    const yH = (height >> 8) & 0xff;
    const header = Buffer.from([0x1d, 0x76, 0x30, m, xL, xH, yL, yH]);
    const init = Buffer.from([0x1b, 0x40]);
    const feed = Buffer.from("\n", "ascii");
    const cut = Buffer.from([0x1d, 0x56, 0x00]);
    return Buffer.concat([init, header, raster, feed, cut]);
}
