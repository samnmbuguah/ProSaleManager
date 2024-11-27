import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import type { Sale } from "@db/schema";

interface SalesData {
  date: string;
  total: string;
  cost: number;
  count: number;
}

interface SalesChartProps {
  data: SalesData[];
  period: string;
}

// Format number as KSh currency
function formatCurrency(amount: number): string {
  return `KSh ${amount.toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Custom tooltip formatter
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg p-2 shadow-lg">
        <p className="font-semibold">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function SalesChart({ data = [], period }: SalesChartProps) {
  const getDateFormat = (period: string) => {
    switch (period) {
      case 'daily':
        return "MMM d";
      case 'weekly':
        return "'Week' w, MMM";
      case 'monthly':
        return "MMM yyyy";
      case 'yearly':
        return "yyyy";
      default:
        return "MMM d";
    }
  };

  // Add proper type checking and default value
  const chartData = Array.isArray(data) ? data.map((sale) => ({
    date: format(new Date(sale.date), getDateFormat(period)),
    amount: Number(sale.total) || 0,
    cost: Number(sale.cost) || 0,
    count: sale.count || 0,
  })) : [];

  if (chartData.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center bg-card rounded-lg border">
        <p className="text-muted-foreground">No sales data available for this period</p>
      </div>
    );
  }

  return (
    <div className="h-[300px]" style={{
      backgroundImage: 'url(https://images.unsplash.com/photo-1441986300917-64674bd600d8)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      borderRadius: '0.5rem',
      padding: '1rem',
    }}>
      <div className="h-full w-full bg-white/90 rounded-lg p-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(215 25% 27%)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(215 25% 27%)"
                  stopOpacity={0}
                />
              </linearGradient>
              <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(0 62% 50%)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(0 62% 50%)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="amount"
              name="Revenue"
              stroke="hsl(215 25% 27%)"
              fillOpacity={1}
              fill="url(#colorSales)"
            />
            <Area
              type="monotone"
              dataKey="cost"
              name="Cost"
              stroke="hsl(0 62% 50%)"
              fillOpacity={0.5}
              fill="url(#colorCost)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
