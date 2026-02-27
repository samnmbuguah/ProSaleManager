import React, { useState } from "react";
import { format } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, ChevronRight, User, CreditCard, Banknote } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SaleTransaction {
    id: number;
    date: string;
    totalAmount: number;
    deliveryFee: number;
    paymentMethod: string;
    customerName: string;
    staffName: string;
    itemsCount: number;
    profit: number;
    items: Array<{
        name: string;
        quantity: number;
        unitPrice: number;
        total: number;
    }>;
}

interface SalesHistoryTableProps {
    sales: SaleTransaction[];
    isLoading: boolean;
}

export default function SalesHistoryTable({ sales, isLoading }: SalesHistoryTableProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

    const toggleRow = (id: number) => {
        const newExpandedRows = new Set(expandedRows);
        if (newExpandedRows.has(id)) {
            newExpandedRows.delete(id);
        } else {
            newExpandedRows.add(id);
        }
        setExpandedRows(newExpandedRows);
    };

    const filteredSales = sales.filter((sale) =>
        sale.id.toString().includes(searchTerm) ||
        sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.staffName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getPaymentIcon = (method: string) => {
        switch (method.toLowerCase()) {
            case "mpesa": return <CreditCard size={14} className="text-blue-500" />;
            case "cash": return <Banknote size={14} className="text-emerald-500" />;
            default: return <CreditCard size={14} className="text-slate-400" />;
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-slate-500">Loading transactions...</div>;
    }

    return (
        <Card className="overflow-hidden">
            <div className="p-4 border-b bg-slate-50/50 flex items-center justify-between">
                <h3 className="font-semibold text-slate-700">Detailed Sales Audit Log</h3>
                <div className="relative w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        type="search"
                        placeholder="Search Sale ID, Customer..."
                        className="pl-8 h-9 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/30">
                            <TableHead className="w-10"></TableHead>
                            <TableHead>Sale ID</TableHead>
                            <TableHead>Date & Time</TableHead>
                            <TableHead>Customer / Staff</TableHead>
                            <TableHead>Payment</TableHead>
                            <TableHead className="text-right">Total (KSh)</TableHead>
                            <TableHead className="text-right">Profit (KSh)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredSales.length > 0 ? (
                            filteredSales.map((sale) => (
                                <React.Fragment key={sale.id}>
                                    <TableRow
                                        className="cursor-pointer hover:bg-slate-50 transition-colors"
                                        onClick={() => toggleRow(sale.id)}
                                    >
                                        <TableCell>
                                            {expandedRows.has(sale.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                        </TableCell>
                                        <TableCell className="font-mono font-medium text-slate-600">#{sale.id}</TableCell>
                                        <TableCell className="text-slate-500">
                                            {format(new Date(sale.date), "MMM dd, HH:mm")}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-900">{sale.customerName}</span>
                                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                    <User size={10} /> Sold by {sale.staffName}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="gap-1 font-normal capitalize py-0">
                                                {getPaymentIcon(sale.paymentMethod)}
                                                {sale.paymentMethod}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-slate-900">
                                            {sale.totalAmount.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-emerald-600">
                                            +{sale.profit.toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                    {expandedRows.has(sale.id) && (
                                        <TableRow className="bg-slate-50/50">
                                            <TableCell colSpan={7} className="p-4">
                                                <div className="bg-white rounded-lg border shadow-sm p-3 max-w-2xl mx-auto">
                                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Itemized Breakdown</h4>
                                                    <div className="space-y-2">
                                                        {sale.items.map((item, idx) => (
                                                            <div key={idx} className="flex justify-between items-center text-sm border-b border-dashed pb-1 last:border-0">
                                                                <div>
                                                                    <span className="text-slate-900 font-medium">{item.name}</span>
                                                                    <span className="text-slate-400 ml-2">x{item.quantity}</span>
                                                                </div>
                                                                <span className="text-slate-600 font-mono">KSh {item.total.toLocaleString()}</span>
                                                            </div>
                                                        ))}
                                                        {sale.deliveryFee > 0 && (
                                                            <div className="flex justify-between items-center text-sm pt-1">
                                                                <span className="text-slate-500 italic">Delivery Fee</span>
                                                                <span className="text-slate-600 font-mono">KSh {sale.deliveryFee.toLocaleString()}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </React.Fragment>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-slate-400">
                                    No transactions found for the selected period.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </Card>
    );
}
