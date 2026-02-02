import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { StockValueReportResponse } from "@/services/stockService";

interface StockValueReportProps {
    data: StockValueReportResponse;
}

export default function StockValueReport({ data }: StockValueReportProps) {
    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString() + " " + new Date(dateString).toLocaleTimeString();
    };

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat("en-KE", {
            style: "currency",
            currency: "KES",
        }).format(amount);
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Value Received
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(data.total_value || 0)}</div>
                        <p className="text-xs text-muted-foreground">
                            For selected period
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Stock Receipt Logs</CardTitle>
                    <CardDescription>
                        History of stock added to inventory.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Qty Added</TableHead>
                                <TableHead className="text-right">Unit Cost</TableHead>
                                <TableHead className="text-right">Total Cost</TableHead>
                                <TableHead>Notes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.logs && data.logs.length > 0 ? (
                                data.logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell>{formatDate(log.date)}</TableCell>
                                        <TableCell>{log.product?.name || "N/A"}</TableCell>
                                        <TableCell>{log.user?.name || "N/A"}</TableCell>
                                        <TableCell>{log.quantity_added}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(Number(log.unit_cost))}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(Number(log.total_cost))}</TableCell>
                                        <TableCell>{log.notes}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        No stock logs found for this period.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
