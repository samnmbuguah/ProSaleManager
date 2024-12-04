import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProductPerformance } from "../components/reports/ProductPerformance";
import { CustomerHistory } from "../components/reports/CustomerHistory";
import { InventoryStatus } from "../components/reports/InventoryStatus";
import { SalesChart } from "../components/reports/SalesChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCustomers } from "@/hooks/use-customers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Period = 'today' | 'week' | 'month' | 'year';

export default function ReportsPage() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>();
  const [period, setPeriod] = useState<Period>('today');
  const { customers } = useCustomers();

  const { data: salesData } = useQuery({
    queryKey: ['reports', 'sales-chart', period],
    queryFn: () => fetch(`/api/sales/chart?period=${period}`).then(res => res.json()),
  });

  const { data: productPerformance } = useQuery({
    queryKey: ['reports', 'product-performance'],
    queryFn: () => fetch('/api/reports/product-performance').then(res => res.json()),
  });

  const { data: customerHistory } = useQuery({
    queryKey: ['reports', 'customer-history', selectedCustomerId],
    queryFn: () => selectedCustomerId 
      ? fetch(`/api/reports/customer-history/${selectedCustomerId}`).then(res => res.json())
      : Promise.resolve([]),
    enabled: !!selectedCustomerId,
  });

  const { data: inventoryStatus } = useQuery({
    queryKey: ['reports', 'low-stock'],
    queryFn: () => fetch('/api/reports/low-stock').then(res => res.json()),
  });

  const selectedCustomer = customers?.find(c => c.id === Number(selectedCustomerId)) || null;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Reports & Analytics</h1>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesChart 
              data={salesData || []} 
              period={period}
              onPeriodChange={setPeriod}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductPerformance data={productPerformance || []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>Customer Purchase History</CardTitle>
            <Select
              value={selectedCustomerId}
              onValueChange={setSelectedCustomerId}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers?.map((customer) => (
                  <SelectItem key={customer.id} value={String(customer.id)}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <CustomerHistory 
              data={customerHistory || []} 
              customer={selectedCustomer}
            />
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
