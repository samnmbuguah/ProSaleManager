export interface EscPosFormatOptions {
    columns?: 32 | 42;
}

function stripNonAscii(input: string): string {
    return input.replace(/[^\x20-\x7E\n\r\t]/g, " ");
}

function padBoth(text: string, width: number): string {
    const trimmed = stripNonAscii(text);
    const len = trimmed.length;
    if (len >= width) return trimmed.slice(0, width);
    const left = Math.floor((width - len) / 2);
    const right = width - len - left;
    return " ".repeat(left) + trimmed + " ".repeat(right);
}

function padRight(text: string, width: number): string {
    const t = stripNonAscii(text);
    return t.length >= width ? t.slice(0, width) : t + " ".repeat(width - t.length);
}

function padLeft(text: string, width: number): string {
    const t = stripNonAscii(text);
    return t.length >= width ? t.slice(0, width) : " ".repeat(width - t.length) + t;
}

export function formatEscPosReceipt(params: {
    businessName: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    thankYouMessage?: string;
    receiptId: string;
    date: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    items: Array<{ name: string; quantity: number; unitPrice: number; total: number; unitType?: string }>;
    paymentMethod: string;
    subtotal: number;
    deliveryFee: number;
    total: number;
    amountPaid?: number;
    columns?: 32 | 42;
}): string {
    const width = params.columns || 32;
    const line = "-".repeat(width);
    const lines: string[] = [];

    lines.push(padBoth(params.businessName, width));
    if (params.address) lines.push(padBoth(params.address, width));
    if (params.phone) lines.push(padBoth(`Tel: ${params.phone}`, width));
    if (params.email) lines.push(padBoth(`Email: ${params.email}`, width));
    if (params.website) lines.push(padBoth(params.website, width));
    lines.push("");

    lines.push(padRight(`Receipt #${params.receiptId}`, width));
    lines.push(padRight(params.date, width));
    lines.push("");

    if (params.customerName) {
        lines.push(padRight(`Customer: ${params.customerName}`, width));
        if (params.customerPhone) lines.push(padRight(`Phone: ${params.customerPhone}`, width));
        if (params.customerEmail) lines.push(padRight(`Email: ${params.customerEmail}`, width));
        lines.push("");
    }

    lines.push(padBoth("ITEMS", width));
    for (const item of params.items) {
        const name = item.unitType ? `${item.name} (${item.unitType})` : item.name;
        lines.push(padRight(name, width));
        const qtyPrice = `${item.quantity} x ${item.unitPrice.toFixed(2)}`;
        const total = item.total.toFixed(2);
        const left = padRight(qtyPrice, Math.floor(width / 2));
        const right = padLeft(total, Math.ceil(width / 2));
        lines.push(left + right);
    }

    lines.push(line);
    lines.push(padRight("Subtotal", Math.floor(width / 2)) + padLeft(params.subtotal.toFixed(2), Math.ceil(width / 2)));
    if (params.deliveryFee > 0) {
        lines.push(padRight("Delivery", Math.floor(width / 2)) + padLeft(params.deliveryFee.toFixed(2), Math.ceil(width / 2)));
    }
    lines.push(padRight("TOTAL", Math.floor(width / 2)) + padLeft(params.total.toFixed(2), Math.ceil(width / 2)));
    lines.push(padRight(`Paid via ${params.paymentMethod}`, width));
    if (params.paymentMethod.toLowerCase() === "cash" && typeof params.amountPaid === "number") {
        const change = params.amountPaid - params.total;
        lines.push(padRight("Cash Tendered", Math.floor(width / 2)) + padLeft(params.amountPaid.toFixed(2), Math.ceil(width / 2)));
        lines.push(padRight("Change", Math.floor(width / 2)) + padLeft(change.toFixed(2), Math.ceil(width / 2)));
    }

    lines.push("");
    if (params.thankYouMessage) lines.push(padBoth(params.thankYouMessage, width));

    return lines.map((l) => stripNonAscii(l)).join("\n");
}
