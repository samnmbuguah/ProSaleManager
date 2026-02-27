import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ClipboardList, BarChart3 } from "lucide-react";
import { generatePLReport, generateSalesHistoryReport } from "@/lib/pdfExport";
import { useStoreContext } from "@/contexts/StoreContext";

interface ReportCenterProps {
    salesSummary: any;
    expensesSummary: any;
    salesHistory: any[];
    periodLabel: string;
}

export default function ReportCenter({ salesSummary, expensesSummary, salesHistory, periodLabel }: ReportCenterProps) {
    const { currentStore } = useStoreContext();

    const handlePLDownload = () => {
        if (!salesSummary || !expensesSummary) return;

        const metrics = {
            revenue: salesSummary.totalRevenue || 0,
            cogs: salesSummary.totalProfit ? (salesSummary.totalRevenue - salesSummary.totalProfit) : 0,
            grossProfit: salesSummary.totalProfit || 0,
            expensesDetail: expensesSummary.categoryBreakdown || [],
            totalExpenses: expensesSummary.totalExpenses || 0,
            netProfit: (salesSummary.totalProfit || 0) - (expensesSummary.totalExpenses || 0),
            margin: ((salesSummary.totalProfit || 0) / (salesSummary.totalRevenue || 1)) * 100
        };

        generatePLReport(metrics, {
            title: "Profit & Loss Statement",
            period: periodLabel,
            storeName: currentStore?.name || "ProSaleManager"
        });
    };

    const handleSalesAuditDownload = () => {
        if (!salesHistory) return;
        generateSalesHistoryReport(salesHistory, {
            title: "Sales Audit Log",
            period: periodLabel,
            storeName: currentStore?.name || "ProSaleManager"
        });
    };

    return (
        <Card className="p-6 bg-gradient-to-br from-slate-50 to-white border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <BarChart3 className="text-primary" size={20} />
                        Business Report Center
                    </h2>
                    <p className="text-sm text-slate-500">Generate professional PDF reports for your business auditing.</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full w-fit">
                    <ClipboardList size={14} />
                    {periodLabel}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-3 bg-white hover:bg-primary/5 hover:border-primary/30 transition-all border-slate-200"
                    onClick={handlePLDownload}
                    disabled={!salesSummary || !expensesSummary}
                >
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <FileText size={24} />
                    </div>
                    <div className="text-center">
                        <span className="block font-bold">P&L Statement</span>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Financial Performance</span>
                    </div>
                </Button>

                <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-3 bg-white hover:bg-primary/5 hover:border-primary/30 transition-all border-slate-200"
                    onClick={handleSalesAuditDownload}
                    disabled={!salesHistory || salesHistory.length === 0}
                >
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                        <ClipboardList size={24} />
                    </div>
                    <div className="text-center">
                        <span className="block font-bold">Sales Audit Log</span>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Detailed Transactions</span>
                    </div>
                </Button>

                <Card className="md:col-span-1 border-dashed border-slate-300 bg-slate-50/50 p-4 flex flex-col justify-center items-center text-center">
                    <BarChart3 className="text-slate-300 mb-2" size={32} />
                    <p className="text-xs text-slate-400 leading-tight">
                        More professional reports <br /> coming soon (Tax, Inventory Val).
                    </p>
                </Card>
            </div>
        </Card>
    );
}
