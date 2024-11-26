import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SalesChart } from "../components/reports/SalesChart";
import { InventoryStatus } from "../components/reports/InventoryStatus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ReportsPage() {
  const [period, setPeriod] = useState<string>("monthly");

  const { data: salesData } = useQuery({
    queryKey: ['reports', 'sales', period],
    queryFn: () => fetch(`/api/reports/sales?period=${period}`).then(res => res.json()),
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
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>Sales Trend</CardTitle>
            <Select onValueChange={setPeriod} defaultValue={period}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <SalesChart data={salesData || []} period={period} />
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
