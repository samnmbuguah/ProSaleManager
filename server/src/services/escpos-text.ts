import { Sale, User, Product, SaleItem, ReceiptSettings, Store } from "../models/index.js";

function esc(bytes: number[]) {
	return Buffer.from(bytes);
}

function textAscii(s: string) {
	return Buffer.from(s.replace(/[^\x20-\x7E\n\r\t]/g, " "), "ascii");
}

const CMD = {
	init: () => esc([0x1b, 0x40]), // ESC @
	align: (n: 0 | 1 | 2) => esc([0x1b, 0x61, n]), // ESC a n (0 left,1 center,2 right)
	boldOn: () => esc([0x1b, 0x45, 0x01]), // ESC E 1
	boldOff: () => esc([0x1b, 0x45, 0x00]), // ESC E 0
	fontA: () => esc([0x1b, 0x4d, 0x00]), // ESC M 0 (Font A)
	fontB: () => esc([0x1b, 0x4d, 0x01]), // ESC M 1 (Font B smaller)
	// GS ! n => bit 0-3: height multiplier-1, bit 4-7: width multiplier-1
	size: (widthMul: 1 | 2 | 3 | 4, heightMul: 1 | 2 | 3 | 4) => esc([0x1d, 0x21, ((heightMul - 1) << 4) | (widthMul - 1)]),
	sizeNormal: () => esc([0x1d, 0x21, 0x00]),
	sizeDouble: () => esc([0x1d, 0x21, 0x11]), // 2x width, 2x height
	underlineOn: () => esc([0x1b, 0x2d, 0x01]),
	underlineOff: () => esc([0x1b, 0x2d, 0x00]),
	cut: () => esc([0x1d, 0x56, 0x00]), // GS V 0
	lf: () => textAscii("\n"),
};

function padLeft(text: string, width: number) {
	const t = text.replace(/[^\x20-\x7E]/g, " ");
	return t.length >= width ? t.slice(0, width) : " ".repeat(width - t.length) + t;
}

function padRight(text: string, width: number) {
	const t = text.replace(/[^\x20-\x7E]/g, " ");
	return t.length >= width ? t.slice(0, width) : t + " ".repeat(width - t.length);
}

function center(text: string, width: number) {
	const t = text.replace(/[^\x20-\x7E]/g, " ");
	if (t.length >= width) return t.slice(0, width);
	const left = Math.floor((width - t.length) / 2);
	const right = width - t.length - left;
	return " ".repeat(left) + t + " ".repeat(right);
}

export async function buildEscPosReceiptBuffer(saleId: number, options?: { columns?: 32 | 42 }) {
	const columns = options?.columns ?? 32;
	const sale = await Sale.findByPk(saleId, {
		include: [
			{ model: User, as: "Customer" },
			{ model: SaleItem, as: "items", include: [{ model: Product }] },
			{ model: Store, as: "store", required: false, include: [{ model: ReceiptSettings, as: "receiptSettings", required: false }] },
		],
	});
	if (!sale) throw new Error("Sale not found");

	const sAny = sale as any;
	const settings: ReceiptSettings | null = sAny.store?.receiptSettings || null;

	const headerTitle = "Purchase Slip";
	const businessName = settings?.business_name || "PROSALE MANAGER";
	const address = settings?.address || "";
	const phone = settings?.phone || "";
	const email = settings?.email || "";
	const website = settings?.website || "";
	const thankYou = settings?.thank_you_message || "Thank you for your business!";

	const lines: Buffer[] = [];
	lines.push(CMD.init());
	lines.push(CMD.fontA());
	lines.push(CMD.align(1)); // center
	// Small header line (like "Purchase Slip")
	lines.push(CMD.size(1, 1));
	lines.push(textAscii(center(headerTitle, columns)));
	lines.push(CMD.lf());
	// Big business name
	lines.push(CMD.boldOn());
	lines.push(CMD.sizeDouble());
	lines.push(textAscii(center(businessName, Math.floor(columns / 2))));
	lines.push(CMD.lf());
	lines.push(CMD.boldOff());
	lines.push(CMD.sizeNormal());
	if (address) { lines.push(textAscii(center(address, columns))); lines.push(CMD.lf()); }
	if (phone || email) { lines.push(textAscii(center([phone && `Tel: ${phone}`, email && `Email: ${email}`].filter(Boolean).join("  "), columns))); lines.push(CMD.lf()); }
	if (website) { lines.push(textAscii(center(website, columns))); lines.push(CMD.lf()); }

	lines.push(CMD.align(0)); // left
	const receiptNo = `Sales Receipt #${String(sale.id).padStart(5, "0")}`;
	const dateStr = new Date((sale as any).createdAt).toLocaleString("en-KE", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
	lines.push(CMD.boldOn());
	lines.push(textAscii(padRight(`Served By: ${sAny?.User?.name || "N/A"}`, columns)));
	lines.push(CMD.boldOff());
	lines.push(CMD.lf());
	lines.push(textAscii(padRight(receiptNo, columns)));
	lines.push(CMD.lf());
	lines.push(textAscii(padRight(`Date: ${dateStr}`, columns)));
	lines.push(CMD.lf());

	// Table header
	lines.push(CMD.boldOn());
	lines.push(textAscii(padRight("Item Name", Math.floor(columns * 0.55)) + padRight("Qty", 4) + padLeft("Price", 8) + padLeft("Total", columns - Math.floor(columns * 0.55) - 4 - 8)));
	lines.push(CMD.boldOff());
	lines.push(CMD.underlineOn());
	lines.push(textAscii(" ".repeat(columns)));
	lines.push(CMD.underlineOff());

	const items: SaleItem[] = sAny.items || [];
	for (const item of items) {
		const prod = (item as any).Product as any;
		if (!prod) continue;
		const name = (prod.name as string) || "Item";
		const leftName = padRight(name, Math.floor(columns * 0.55));
		const qty = padRight(String(item.quantity), 4);
		const unit = padLeft(item.unit_price.toFixed(2), 8);
		const total = padLeft(item.total.toFixed(2), columns - Math.floor(columns * 0.55) - 4 - 8);
		lines.push(textAscii(leftName + qty + unit + total));
		lines.push(CMD.lf());
	}

	// Subtotal / Total section
	lines.push(CMD.align(2)); // right align for money rows
	const subtotal = (sale as any).total_amount - ((sale as any).delivery_fee || 0);
	lines.push(textAscii(padLeft("Subtotal:", Math.floor(columns / 2)) + padLeft(subtotal.toFixed(2), Math.ceil(columns / 2))));
	lines.push(CMD.lf());
	lines.push(CMD.align(1));
	lines.push(CMD.boldOn());
	lines.push(CMD.size(2, 2)); // Larger for RECEIPT TOTAL
	const totalLine = `RECEIPT TOTAL   ${Number((sale as any).total_amount).toFixed(2)}`;
	lines.push(textAscii(center(totalLine, columns)));
	lines.push(CMD.sizeNormal());
	lines.push(CMD.boldOff());
	lines.push(CMD.align(0));
	lines.push(CMD.lf());

	// Payments breakdown (left)
	const pm = (sale as any).payment_method || "";
	if (pm.toLowerCase() === "cash" && (sale as any).amount_paid) {
		const amountPaid = (sale as any).amount_paid as number;
		const change = amountPaid - (sale as any).total_amount;
		lines.push(CMD.boldOn());
		lines.push(textAscii(padRight("Amount Tendered:", Math.floor(columns / 2)) + padLeft(amountPaid.toFixed(2), Math.ceil(columns / 2))));
		lines.push(CMD.boldOff());
		lines.push(CMD.lf());
		lines.push(textAscii(padRight("Change Given:", Math.floor(columns / 2)) + padLeft(change.toFixed(2), Math.ceil(columns / 2))));
		lines.push(CMD.lf());
	}
	if (pm) {
		lines.push(textAscii(padRight("Cash:", Math.floor(columns / 2)) + padLeft(((sale as any).amount_paid || 0).toFixed(2), Math.ceil(columns / 2))));
		lines.push(CMD.lf());
	}

	// Footer note centered
	lines.push(CMD.align(1));
	lines.push(CMD.lf());
	lines.push(CMD.underlineOn());
	lines.push(textAscii(center("Dealers in: All types of Shoes, Inner Wear etc", columns)));
	lines.push(CMD.underlineOff());
	lines.push(CMD.lf());
	lines.push(textAscii(center("Thanks for shopping with us!", columns)));
	lines.push(CMD.lf());
	lines.push(CMD.boldOn());
	lines.push(textAscii(center("GOODS ONCE SOLD ARE NON-REFUNDABLE.", columns)));
	lines.push(CMD.boldOff());
	lines.push(CMD.align(0));

	lines.push(CMD.lf());
	lines.push(CMD.cut());

	return Buffer.concat(lines);
}
