import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ExpenseCategoryData {
    category: string;
    amount: number;
    count: number;
    percentage: number;
}

interface ExpensePieChartProps {
    data: ExpenseCategoryData[];
    totalAmount: number;
}

const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'
];

export function ExpensePieChart({ data, totalAmount }: ExpensePieChartProps) {
    const formatCurrency = (amount: number) => {
        return `KSh ${amount.toLocaleString('en-KE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-3 border rounded-lg shadow-lg">
                    <p className="font-medium">{data.category}</p>
                    <p className="text-sm text-muted-foreground">
                        Amount: {formatCurrency(data.amount)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Count: {data.count} expenses
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Percentage: {data.percentage.toFixed(1)}%
                    </p>
                </div>
            );
        }
        return null;
    };

    const CustomLegend = ({ payload }: any) => {
        return (
            <div className="flex flex-wrap gap-2 mt-4">
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span>{entry.value}</span>
                        <span className="text-muted-foreground">
                            ({formatCurrency(entry.payload.amount)})
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
                No expense data available
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="text-center">
                <h3 className="text-lg font-semibold">Expense Categories</h3>
                <p className="text-sm text-muted-foreground">
                    Total: {formatCurrency(totalAmount)}
                </p>
            </div>

            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ category, percentage }) => `${category} (${percentage.toFixed(1)}%)`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="amount"
                        >
                            {data.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend content={<CustomLegend />} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
