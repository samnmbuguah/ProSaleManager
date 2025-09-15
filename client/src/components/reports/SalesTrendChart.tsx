import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface SalesDataPoint {
  date: string;
  revenue: number;
  profit: number;
  sales: number;
  orders: number;
}

interface SalesTrendChartProps {
  data: SalesDataPoint[];
  title?: string;
  height?: number;
}

export function SalesTrendChart({ data, title = "Sales Trend", height = 300 }: SalesTrendChartProps) {
  const formatCurrency = (value: number) => {
    return `KSh ${value.toLocaleString('en-KE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      month: 'short',
      day: 'numeric'
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{formatDate(label)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('Revenue') || entry.name.includes('Profit') 
                ? formatCurrency(entry.value) 
                : entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No sales data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tickFormatter={(value) => value.toLocaleString()}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#8884d8" 
              strokeWidth={2}
              name="Revenue"
              dot={{ r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="profit" 
              stroke="#82ca9d" 
              strokeWidth={2}
              name="Profit"
              dot={{ r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="sales" 
              stroke="#ffc658" 
              strokeWidth={2}
              name="Sales Count"
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
