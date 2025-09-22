import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { exec as _exec } from "node:child_process";
import { promisify } from "node:util";
import puppeteer from "puppeteer";
import { ReceiptService } from "./receipt.service.js";

const exec = promisify(_exec);

function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(value);
}

export async function printSaleAsPdfToCups(saleId: number) {
    const printer = process.env.CUPS_PRINTER || "Thermal";
    const media = process.env.PDF_MEDIA || "Custom.80x200mm"; // or Custom.58x200mm
    const pageWidthMm = media.includes("80") ? 80 : 58;

    const html = await buildReceiptHtml(saleId, pageWidthMm);
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "psm-receipt-"));
    const htmlPath = path.join(tmpDir, "receipt.html");
    const pdfPath = path.join(tmpDir, "receipt.pdf");
    await fs.writeFile(htmlPath, html, "utf8");

    const browser = await puppeteer.launch({ args: ["--no-sandbox", "--font-render-hinting=none"] });
    try {
        const page = await browser.newPage();
        await page.goto("file://" + htmlPath, { waitUntil: "networkidle0" });
        await page.pdf({
            path: pdfPath,
            printBackground: true,
            width: `${pageWidthMm}mm`,
            margin: { top: "4mm", right: "0mm", bottom: "4mm", left: "0mm" },
        });
    } finally {
        await browser.close();
    }

    // Send to CUPS
    const cmd = `lp -d ${printer} -o media=${media} -o page-left=0 -o page-right=0 -o page-top=0 -o page-bottom=0 -o fit-to-page ${pdfPath}`;
    await exec(cmd);

    // cleanup
    try { await fs.unlink(htmlPath); } catch { }
    try { await fs.unlink(pdfPath); } catch { }
    try { await fs.rmdir(tmpDir); } catch { }
}

async function buildReceiptHtml(saleId: number, widthMm: number) {
    const text = await ReceiptService.formatReceiptText(saleId);
    // Use the text version for now; could render the exact React markup in the future
    const safe = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");
    return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  @page { size: ${widthMm}mm auto; margin: 4mm 0; }
  body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; margin: 0; }
  .wrap { width: ${widthMm}mm; margin: 0 auto; padding: 0 2mm; }
  .content { font-size: 12px; line-height: 1.25; white-space: normal; }
  .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="content mono">${safe}</div>
  </div>
</body>
</html>`;
}
