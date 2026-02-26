import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DayEntry = { date: string; revenue: number } | Record<string, number>;

interface SalesExpensesChartProps {
    salesData: DayEntry[] | Record<string, number>;
    expensesData?: Record<string, number>;
    compareData?: DayEntry[] | Record<string, number>;
    isLoading?: boolean;
}

// Normalise both array-of-objects and plain Record formats to Record<string, number>
function toKv(data: DayEntry[] | Record<string, number> | undefined): Record<string, number> {
    if (!data) return {};
    if (Array.isArray(data)) {
        return Object.fromEntries(
            (data as Array<{ date: string; revenue: number }>).map((d) => [d.date, d.revenue ?? 0])
        );
    }
    return data as Record<string, number>;
}

function formatKSh(amount: number) {
    return `KSh ${amount.toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDateLabel(date: string) {
    try {
        return new Date(date).toLocaleDateString("en-KE", { month: "short", day: "numeric" });
    } catch {
        return date;
    }
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm">
            <p className="font-semibold text-gray-700 mb-2">{formatDateLabel(label)}</p>
            {payload.map((entry: any) => (
                <div key={entry.name} className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-gray-600">{entry.name}:</span>
                    <span className="font-medium">{formatKSh(entry.value)}</span>
                </div>
            ))}
        </div>
    );
};

export function SalesExpensesChart({
    salesData = [],
    expensesData = {},
    compareData = [],
    isLoading = false,
}: SalesExpensesChartProps) {
    const salesKv = toKv(salesData);
    const compareKv = toKv(compareData);

    const allDates = Array.from(
        new Set([
            ...Object.keys(salesKv),
            ...Object.keys(expensesData),
            ...Object.keys(compareKv),
        ])
    ).sort();

    const chartData = allDates.map((date) => {
        const sales = salesKv[date] || 0;
        const expenses = expensesData[date] || 0;
        return {
            date,
            Sales: sales,
            Expenses: expenses,
            "Net Profit": Math.max(sales - expenses, 0),
            "Prev. Sales": compareKv[date] || 0,
        };
    });

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Sales & Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] flex items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (chartData.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Sales & Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] flex items-center justify-center">
                        <p className="text-muted-foreground">No data available for this period</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Sales & Expenses</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={formatDateLabel}
                                tick={{ fontSize: 11 }}
                                tickLine={false}
                            />
                            <YAxis
                                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                                tick={{ fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Bar dataKey="Sales" fill="#6366f1" opacity={0.85} radius={[3, 3, 0, 0]} />
                            <Bar dataKey="Expenses" fill="#f43f5e" opacity={0.75} radius={[3, 3, 0, 0]} />
                            <Line
                                type="monotone"
                                dataKey="Net Profit"
                                stroke="#10b981"
                                strokeWidth={2}
                                dot={false}
                            />
                            <Line
                                type="monotone"
                                dataKey="Prev. Sales"
                                stroke="#a3a3a3"
                                strokeWidth={1.5}
                                strokeDasharray="4 4"
                                dot={false}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
