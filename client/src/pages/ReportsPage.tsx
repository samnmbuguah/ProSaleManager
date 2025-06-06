import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductPerformance from "../components/reports/ProductPerformance";
import InventoryStatus from "../components/reports/InventoryStatus";
import { useInventory } from "@/hooks/use-inventory";

export default function ReportsPage() {
  const { products, isLoading } = useInventory();

  const handleDateRangeChange = () => {
    // Implementation of handleDateRangeChange
  };

  const handleSortChange = () => {
    // Implementation of handleSortChange
  };

  const handleSearch = async (query: string) => {
    try {
      const response = await fetch(
        `/api/products/search?q=${encodeURIComponent(query)}`,
      );
      if (!response.ok) throw new Error("Failed to search products");
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
    <div className="container mx-auto p-4 mt-16">
      <Tabs defaultValue="inventory">
        <TabsList>
          <TabsTrigger value="inventory">Inventory Status</TabsTrigger>
          <TabsTrigger value="performance">Product Performance</TabsTrigger>
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
      </Tabs>
    </div>
  );
}
