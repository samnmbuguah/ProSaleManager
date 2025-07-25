import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductPerformance from "../components/reports/ProductPerformance";
import InventoryStatus from "../components/reports/InventoryStatus";
import { useInventoryReport, useProductPerformanceReport, useSalesSummary, useExpensesSummary } from "@/hooks/use-reports";
import { Product } from "@/types/product";

// ErrorBoundary component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center text-red-500 py-12">
          Something went wrong in the reports page.
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ReportsPage() {
  const {
    data: inventoryData,
    isLoading: inventoryLoading,
    error: inventoryError,
  } = useInventoryReport();
  const {
    data: performanceData,
    isLoading: performanceLoading,
    error: performanceError,
  } = useProductPerformanceReport();
  const { data: salesSummary, isLoading: salesSummaryLoading } = useSalesSummary();
  const { data: expensesSummary, isLoading: expensesSummaryLoading } = useExpensesSummary();
  const [tab, setTab] = useState("inventory");

  const handleDateRangeChange = () => {
    // This will be implemented to refetch data with date filters
  };

  const handleSortChange = () => {
    // This will be implemented to sort the data
  };

  const handleSearch = async () => {
    // This will be implemented to search products
  };

  // Top sellers (top 3 by revenue)
  const topSellers = (performanceData?.products || [])
    .slice()
    .sort((a: any, b: any) => b.revenue - a.revenue)
    .slice(0, 3);

  if (inventoryLoading || performanceLoading || salesSummaryLoading || expensesSummaryLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
      </div>
    );
  }

  if (inventoryError || performanceError) {
    return <div className="text-center text-red-500 py-12">Failed to load reports data.</div>;
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto p-4 mt-16">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Total Sales by Payment Method */}
          <div className="bg-white rounded shadow p-4">
            <h3 className="font-semibold mb-2">Sales by Payment Method</h3>
            {salesSummary?.paymentMethods ? (
              <ul>
                {Object.entries(salesSummary.paymentMethods).map(([method, count]: [string, unknown]) => (
                  <li key={method} className="flex justify-between">
                    <span className="capitalize">{method}</span>
                    <span>{Number(count)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <span>No data</span>
            )}
          </div>
          {/* Total Expenses */}
          <div className="bg-white rounded shadow p-4">
            <h3 className="font-semibold mb-2">Total Expenses</h3>
            <div className="text-2xl font-bold">
              KSh {expensesSummary?.totalExpenses?.toLocaleString() ?? "0"}
            </div>
            <div className="text-sm text-muted-foreground">
              {expensesSummary?.count ?? 0} expense records
            </div>
          </div>
          {/* Top Sellers */}
          <div className="bg-white rounded shadow p-4">
            <h3 className="font-semibold mb-2">Top Sellers</h3>
            {topSellers.length > 0 ? (
              <ol className="list-decimal list-inside">
                {topSellers.map((p: any) => (
                  <li key={p.productId} className="flex justify-between">
                    <span>{p.productName}</span>
                    <span>KSh {p.revenue.toLocaleString()}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <span>No data</span>
            )}
          </div>
        </div>
        <Tabs value={tab} onValueChange={setTab} defaultValue="inventory">
          <TabsList>
            <TabsTrigger value="inventory">Inventory Status</TabsTrigger>
            <TabsTrigger value="performance">Product Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory">
            <InventoryStatus
              products={(inventoryData?.products || []).map((p: Product) => ({
                ...p,
                price: p.piece_selling_price,
              }))}
              onSearch={handleSearch}
            />
          </TabsContent>

          <TabsContent value="performance">
            <ProductPerformance
              products={performanceData?.products || []}
              summary={performanceData?.summary}
              onDateRangeChange={handleDateRangeChange}
              onSortChange={handleSortChange}
            />
          </TabsContent>
        </Tabs>
      </div>
    </ErrorBoundary>
  );
}
