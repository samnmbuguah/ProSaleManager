import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductPerformance from "../components/reports/ProductPerformance";
import InventoryStatus from "../components/reports/InventoryStatus";
import {
  useInventoryReport,
  useProductPerformanceReport,
  useSalesSummary,
  useExpensesSummary,
} from "@/hooks/use-reports";
import { Product } from "@/types/product";
import { SalesChart } from "../components/reports/SalesChart";
import { api } from "@/lib/api";

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
  const { data: inventoryData, isLoading: inventoryLoading } = useInventoryReport();
  const [performanceStartDate, setPerformanceStartDate] = useState<Date | undefined>(undefined);
  const [performanceEndDate, setPerformanceEndDate] = useState<Date | undefined>(undefined);
  const [performanceSortBy, setPerformanceSortBy] = useState<string | undefined>("revenue");
  const { data: performanceData, isLoading: performanceLoading } = useProductPerformanceReport(
    performanceStartDate,
    performanceEndDate,
    performanceSortBy
  );
  const [period, setPeriod] = useState<
    "today" | "this_week" | "last_week" | "this_month" | "last_month"
  >("this_week");
  const { data: salesSummary, isLoading: salesSummaryLoading } = useSalesSummary(period);
  const { data: expensesSummary, isLoading: expensesSummaryLoading } = useExpensesSummary();
  const [tab, setTab] = useState("inventory");
  const [searchResults, setSearchResults] = useState<Product[] | null>(null);

  const handleDateRangeChange = (start: Date, end: Date) => {
    setPerformanceStartDate(start);
    setPerformanceEndDate(end);
  };

  const handleSortChange = (sortBy: string) => {
    setPerformanceSortBy(sortBy);
  };

  const handleSearch = async (query: string) => {
    if (!query || query.trim() === "") {
      setSearchResults(null);
      return;
    }
    try {
      const res = await api.get("/products/search", { params: { q: query } });
      setSearchResults(res.data.data || []);
    } catch {
      setSearchResults([]);
    }
  };

  // Top sellers (top 3 by revenue)
  const topSellers = (performanceData?.products || [])
    .slice()
    .sort((a: { revenue: number }, b: { revenue: number }) => b.revenue - a.revenue)
    .slice(0, 3) as Array<{ productId: number; productName: string; revenue: number }>;

  if (inventoryLoading || performanceLoading || salesSummaryLoading || expensesSummaryLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto p-4 mt-16">
        {/* Period Selector */}
        <div className="flex gap-2 mb-4">
          {(["today", "this_week", "last_week", "this_month", "last_month"] as const).map((p) => (
            <button
              key={p}
              className={`px-3 py-1 rounded ${period === p ? "bg-primary text-white" : "bg-gray-200"}`}
              onClick={() => setPeriod(p)}
            >
              {p.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </button>
          ))}
        </div>
        {/* Sales Performance Chart */}
        <div className="mb-8">
          <SalesChart
            data={salesSummary?.current?.salesByDay || {}}
            compareData={salesSummary?.compare?.salesByDay || {}}
          />
        </div>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Total Sales by Payment Method */}
          <div className="bg-white rounded shadow p-4">
            <h3 className="font-semibold mb-2">Sales by Payment Method</h3>
            {salesSummary?.current?.paymentMethods ? (
              <ul>
                {Object.entries(salesSummary.current.paymentMethods).map(
                  ([method, amount]: [string, unknown]) => (
                    <li key={method} className="flex justify-between">
                      <span className="capitalize">{method}</span>
                      <span>KSh {Number(amount).toLocaleString()}</span>
                    </li>
                  )
                )}
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
                {topSellers.map((p) => (
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
              products={
                searchResults !== null
                  ? searchResults
                  : (inventoryData?.products || [])
              }
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
