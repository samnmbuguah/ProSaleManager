import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

interface ReportData {
    title: string;
    period: string;
    storeName: string;
}

export const generatePLReport = (
    metrics: {
        revenue: number;
        cogs: number;
        grossProfit: number;
        expensesDetail: Array<{ category: string; amount: number }>;
        totalExpenses: number;
        netProfit: number;
        margin: number;
    },
    meta: ReportData
) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(40);
    doc.text(meta.storeName, 14, 22);

    doc.setFontSize(16);
    doc.setTextColor(100);
    doc.text(meta.title, 14, 32);

    doc.setFontSize(10);
    doc.text(`Period: ${meta.period}`, 14, 40);
    doc.text(`Generated: ${format(new Date(), "yyyy-MM-dd HH:mm")}`, 14, 46);

    // Divider
    doc.setDrawColor(200);
    doc.line(14, 52, pageWidth - 14, 52);

    // 1. Revenue & COGS
    let currentY = 65;
    doc.setFontSize(12);
    doc.setTextColor(40);
    doc.setFont("helvetica", "bold");
    doc.text("1. Trading Account", 14, currentY);

    autoTable(doc, {
        startY: currentY + 5,
        head: [["Description", "Amount (KSh)"]],
        body: [
            ["Total Sales Revenue", metrics.revenue.toLocaleString()],
            ["Cost of Goods Sold (COGS)", `(${metrics.cogs.toLocaleString()})`],
            [{ content: "Gross Profit", styles: { fontStyle: "bold" } }, { content: metrics.grossProfit.toLocaleString(), styles: { fontStyle: "bold" } }],
        ],
        theme: "striped",
        headStyles: { fillColor: [63, 81, 181] },
    });

    // 2. Expenses
    currentY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFont("helvetica", "bold");
    doc.text("2. Operating Expenses", 14, currentY);

    autoTable(doc, {
        startY: currentY + 5,
        head: [["Category", "Amount (KSh)"]],
        body: [
            ...metrics.expensesDetail.map(e => [e.category, e.amount.toLocaleString()]),
            [{ content: "Total Operating Expenses", styles: { fontStyle: "bold" } }, { content: metrics.totalExpenses.toLocaleString(), styles: { fontStyle: "bold" } }],
        ],
        theme: "striped",
        headStyles: { fillColor: [244, 67, 54] },
    });

    // 3. Summary
    currentY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFont("helvetica", "bold");
    doc.text("3. Net Summary", 14, currentY);

    const netColor: [number, number, number] = metrics.netProfit >= 0 ? [76, 175, 80] : [244, 67, 54];

    autoTable(doc, {
        startY: currentY + 5,
        body: [
            ["Gross Margin", `${metrics.margin.toFixed(2)}%`],
            [{ content: "NET PROFIT", styles: { fontStyle: "bold", textColor: netColor, fontSize: 14 } },
            { content: `KSh ${metrics.netProfit.toLocaleString()}`, styles: { fontStyle: "bold", textColor: netColor, fontSize: 14 } }],
        ],
        theme: "plain",
        styles: { fontSize: 11 },
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount} - ProSaleManager Business Intelligence`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });
    }

    doc.save(`${meta.title.replace(/\s+/g, "_")}_${format(new Date(), "yyyy-MM-dd")}.pdf`);
};

export const generateSalesHistoryReport = (
    sales: Array<{
        id: number;
        date: string;
        customerName: string;
        staffName: string;
        paymentMethod: string;
        totalAmount: number;
        profit: number;
    }>,
    meta: ReportData
) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.text(meta.storeName, 14, 22);
    doc.setFontSize(16);
    doc.setTextColor(100);
    doc.text(meta.title, 14, 32);
    doc.setFontSize(10);
    doc.text(`Period: ${meta.period}`, 14, 40);

    autoTable(doc, {
        startY: 50,
        head: [["ID", "Date", "Customer", "Staff", "Method", "Total (KSh)", "Profit (KSh)"]],
        body: sales.map(s => [
            s.id,
            format(new Date(s.date), "yyyy-MM-dd HH:mm"),
            s.customerName,
            s.staffName,
            s.paymentMethod,
            s.totalAmount.toLocaleString(),
            s.profit.toLocaleString()
        ]),
        headStyles: { fillColor: [40, 40, 40] },
        styles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    doc.save(`Sales_Audit_Log_${format(new Date(), "yyyy-MM-dd")}.pdf`);
};
