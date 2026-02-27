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
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ComposedChart,
    Bar,
    Line
} from "recharts";
import { Package, TrendingUp, DollarSign, Layers } from "lucide-react";

interface StockValueReportProps {
    data: StockValueReportResponse;
}

export default function StockValueReport({ data }: StockValueReportProps) {
    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString() + " " + new Date(dateString).toLocaleTimeString();
    };

    const formatDateShort = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString("en-KE", { month: "short", day: "numeric" });
    };

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat("en-KE", {
            style: "currency",
            currency: "KES",
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="space-y-6 pb-12">
            {/* KPI Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Received Value</CardTitle>
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(data.total_value || 0)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Total spend on new stock</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Quantity Added</CardTitle>
                        <Package className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{(data.total_quantity || 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">Total pieces received</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unique Products</CardTitle>
                        <Layers className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{(data.unique_products || 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">Different items restocked</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Restock Frequency</CardTitle>
                        <TrendingUp className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{(data.count || 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">Individual receipt logs</p>
                    </CardContent>
                </Card>
            </div>

            {/* Trends Section */}
            <div className="grid gap-4 md:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Stock Value Trend</CardTitle>
                        <CardDescription>Daily value of stock additions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={data.byDay || []}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={formatDateShort}
                                        tick={{ fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        tickFormatter={(v) => `Ksh ${v / 1000}k`}
                                        tick={{ fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        formatter={(value: number) => [formatCurrency(value), "Value"]}
                                        labelFormatter={formatDateShort}
                                    />
                                    <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                                    <Line type="monotone" dataKey="value" stroke="#059669" strokeWidth={2} dot={{ r: 4 }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Top Restocked Products</CardTitle>
                        <CardDescription>By total value added</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {(data.topProducts || []).slice(0, 6).map((product, index) => (
                                <div key={product.id} className="flex items-center gap-4">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted font-bold text-sm">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium leading-none truncate">{product.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{product.sku}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold">{formatCurrency(product.value)}</p>
                                        <p className="text-xs text-muted-foreground">{product.quantity} units</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Logs Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Receipt Logs</CardTitle>
                    <CardDescription>Detailed history of stock additions</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead className="text-right">Qty Added</TableHead>
                                <TableHead className="text-right">Unit Cost</TableHead>
                                <TableHead className="text-right">Total Cost</TableHead>
                                <TableHead>Notes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.logs && data.logs.length > 0 ? (
                                data.logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="font-medium">{formatDate(log.date)}</TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-semibold">{log.product?.name || "N/A"}</div>
                                                <div className="text-xs text-muted-foreground">{log.product?.sku}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{log.user?.name || "N/A"}</TableCell>
                                        <TableCell className="text-right font-bold">{log.quantity_added}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(Number(log.unit_cost))}</TableCell>
                                        <TableCell className="text-right font-bold">{formatCurrency(Number(log.total_cost))}</TableCell>
                                        <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">{log.notes}</TableCell>
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
