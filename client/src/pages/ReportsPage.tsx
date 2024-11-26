import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProductPerformance } from "../components/reports/ProductPerformance";
import { CustomerHistory } from "../components/reports/CustomerHistory";
import { InventoryStatus } from "../components/reports/InventoryStatus";
import { TopSelling } from "../components/reports/TopSelling";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCustomers } from "@/hooks/use-customers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ReportsPage() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>();
  const { customers } = useCustomers();

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

  const { data: topSelling } = useQuery({
    queryKey: ['reports', 'top-selling'],
    queryFn: () => fetch('/api/reports/top-selling').then(res => res.json()),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Reports & Analytics</h1>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Product Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductPerformance data={productPerformance || []} />
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
            </CardHeader>
            <CardContent>
              <TopSelling data={topSelling || []} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Inventory Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <InventoryStatus data={inventoryStatus || []} />
            </CardContent>
          </Card>
        </div>

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
      </div>
    </div>
  );
}
