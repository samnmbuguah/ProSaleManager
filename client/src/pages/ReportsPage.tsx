import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import ProductPerformance from "../components/reports/ProductPerformance";
import CustomerHistory from "../components/reports/CustomerHistory";
import InventoryStatus from "../components/reports/InventoryStatus";
import type { Product, Customer } from "@/types/schema";
import { useInventory } from "@/hooks/use-inventory";

export default function ReportsPage() {
  const { products, isLoading } = useInventory();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);
  const [sortBy, setSortBy] = useState<string>("revenue");

  const handleDateRangeChange = (start: Date, end: Date) => {
    setDateRange({ start, end });
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
  };

  const handleSearch = async (query: string) => {
    try {
      const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error("Failed to search products");
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error searching products:", error);
    }
  };

  const handleFilter = async (category: string) => {
    try {
      const url = category
        ? `/api/products?category=${encodeURIComponent(category)}`
        : "/api/products";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to filter products");
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error filtering products:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Tabs defaultValue="inventory">
        <TabsList>
          <TabsTrigger value="inventory">Inventory Status</TabsTrigger>
          <TabsTrigger value="performance">Product Performance</TabsTrigger>
          <TabsTrigger value="customers">Customer History</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          <InventoryStatus
            products={products || []}
            onSearch={handleSearch}
            onFilter={handleFilter}
          />
        </TabsContent>

        <TabsContent value="performance">
          <ProductPerformance
            products={products || []}
            sales={[]} // Add your sales data here
            onDateRangeChange={handleDateRangeChange}
            onSortChange={handleSortChange}
          />
        </TabsContent>

        <TabsContent value="customers">
          {selectedCustomer ? (
            <CustomerHistory
              customer={selectedCustomer}
              transactions={[]} // Add your transaction data here
              onDateRangeChange={handleDateRangeChange}
            />
          ) : (
            <div className="text-center py-8">
              <p>Select a customer to view their history</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
