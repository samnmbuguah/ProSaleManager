import { useQuery } from "@tanstack/react-query";
import { SalesChart } from "../components/reports/SalesChart";
import { InventoryStatus } from "../components/reports/InventoryStatus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReportsPage() {
  const { data: salesData } = useQuery({
    queryKey: ['reports', 'sales'],
    queryFn: () => fetch('/api/reports/sales').then(res => res.json()),
  });

  const { data: inventoryStatus } = useQuery({
    queryKey: ['reports', 'low-stock'],
    queryFn: () => fetch('/api/reports/low-stock').then(res => res.json()),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Reports & Analytics</h1>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Sales Trend (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesChart data={salesData || []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alert</CardTitle>
          </CardHeader>
          <CardContent>
            <InventoryStatus data={inventoryStatus || []} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
