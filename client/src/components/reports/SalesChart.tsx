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

interface SalesChartProps {
  data: Sale[];
}

export function SalesChart({ data }: SalesChartProps) {
  const chartData = data.map((sale) => ({
    date: format(new Date(sale.createdAt!), "MMM d"),
    amount: Number(sale.total),
  }));

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
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="hsl(215 25% 27%)"
              fillOpacity={1}
              fill="url(#colorSales)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
