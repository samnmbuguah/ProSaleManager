import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface CategoryData {
  category: string;
  revenue: number;
  profit: number;
  quantity: number;
  products: number;
}

interface CategoryPerformanceChartProps {
  data: CategoryData[];
  title?: string;
  height?: number;
  showProfit?: boolean;
}

export function CategoryPerformanceChart({ 
  data, 
  title = "Category Performance", 
  height = 300,
  showProfit = true 
}: CategoryPerformanceChartProps) {
  const formatCurrency = (value: number) => {
    return `KSh ${value.toLocaleString('en-KE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
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
        No category data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="category" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              tickFormatter={(value) => value.toLocaleString()}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="revenue" 
              fill="#8884d8" 
              name="Revenue"
              radius={[2, 2, 0, 0]}
            />
            {showProfit && (
              <Bar 
                dataKey="profit" 
                fill="#82ca9d" 
                name="Profit"
                radius={[2, 2, 0, 0]}
              />
            )}
            <Bar 
              dataKey="quantity" 
              fill="#ffc658" 
              name="Quantity Sold"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
