import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/card";

interface SalesChartProps {
  data: Record<string, number>;
  compareData?: Record<string, number>;
}

// Format number as KSh currency
function formatCurrency(amount: number): string {
  return `KSh ${amount.toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function SalesChart({ data = {}, compareData = {} }: SalesChartProps) {
  // Prepare chart data: merge dates from both periods
  const allDates = Array.from(new Set([...Object.keys(data), ...Object.keys(compareData)])).sort();
  const chartData = allDates.map((date) => ({
    date,
    current: data[date] || 0,
    compare: compareData[date] || 0,
  }));

  if (chartData.length === 0) {
    return (
      <Card className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Sales Performance</h2>
        </div>
        <div className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">No sales data available for this period</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Sales Performance</h2>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis tickFormatter={(value) => value.toLocaleString("en-KE")} />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="current"
              name="Current Period"
              stroke="#6366f1"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="compare"
              name="Previous Period"
              stroke="#10b981"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
