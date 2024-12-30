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
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface SalesData {
  date: string;
  mpesa: number;
  cash: number;
  total: number;
}

interface SalesChartProps {
  data: SalesData[];
  period: 'today' | 'week' | 'month' | 'year';
  onPeriodChange: (period: 'today' | 'week' | 'month' | 'year') => void;
}

// Format number as KSh currency
function formatCurrency(amount: number): string {
  return `KSh ${amount.toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function SalesChart({ data = [], period, onPeriodChange }: SalesChartProps) {
  const getDateFormat = (period: string) => {
    switch (period) {
      case 'today':
        return "HH:mm";
      case 'week':
        return "EEE";
      case 'month':
        return "MMM d";
      case 'year':
        return "MMM";
      default:
        return "HH:mm";
    }
  };

  // Add proper type checking and default value
  const chartData = Array.isArray(data) ? data.map((sale) => ({
    ...sale,
    date: format(new Date(sale.date), getDateFormat(period)),
  })) : [];

  if (chartData.length === 0) {
    return (
      <Card className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Sales Overview</h2>
          <div className="flex gap-2">
            <Button
              variant={period === 'today' ? 'default' : 'outline'}
              onClick={() => onPeriodChange('today')}
              size="sm"
            >
              Today
            </Button>
            <Button
              variant={period === 'week' ? 'default' : 'outline'}
              onClick={() => onPeriodChange('week')}
              size="sm"
            >
              This Week
            </Button>
            <Button
              variant={period === 'month' ? 'default' : 'outline'}
              onClick={() => onPeriodChange('month')}
              size="sm"
            >
              This Month
            </Button>
            <Button
              variant={period === 'year' ? 'default' : 'outline'}
              onClick={() => onPeriodChange('year')}
              size="sm"
            >
              This Year
            </Button>
          </div>
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
        <h2 className="text-lg font-semibold">Sales Overview</h2>
        <div className="flex gap-2">
          <Button
            variant={period === 'today' ? 'default' : 'outline'}
            onClick={() => onPeriodChange('today')}
            size="sm"
          >
            Today
          </Button>
          <Button
            variant={period === 'week' ? 'default' : 'outline'}
            onClick={() => onPeriodChange('week')}
            size="sm"
          >
            This Week
          </Button>
          <Button
            variant={period === 'month' ? 'default' : 'outline'}
            onClick={() => onPeriodChange('month')}
            size="sm"
          >
            This Month
          </Button>
          <Button
            variant={period === 'year' ? 'default' : 'outline'}
            onClick={() => onPeriodChange('year')}
            size="sm"
          >
            This Year
          </Button>
        </div>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis tickFormatter={(value) => `KSh ${value.toLocaleString('en-KE')}`} />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="mpesa"
              name="M-Pesa"
              stroke="#10b981"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="cash"
              name="Cash"
              stroke="#6366f1"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="total"
              name="Total"
              stroke="#000000"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
