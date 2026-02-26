import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductPerformance from "../components/reports/ProductPerformance";
import InventoryStatus from "../components/reports/InventoryStatus";
import ExpensesSummary from "../components/reports/ExpensesSummary";
import {
  useCategoryPerformance,
  useInventoryReport,
  useProductPerformanceReport,
  useSalesSummary,
  useExpensesSummary,
} from "@/hooks/use-reports";
import { getDatesFromPeriod } from "@/lib/utils";
import { SalesChart } from "../components/reports/SalesChart";
import { InventoryFilters, PerformanceFilters, ExpenseFilters } from "@/components/reports/ReportFilters";
import DashboardOverview from "../components/reports/DashboardOverview";
import { SalesTrendChart } from "../components/reports/SalesTrendChart";
import { CategoryPerformanceChart } from "../components/reports/CategoryPerformanceChart";
import StockValueReport from "../components/reports/StockValueReport";
import { useStockValueReport } from "@/hooks/use-reports";

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
  // Filter states
  const [inventoryFilters, setInventoryFilters] = useState<InventoryFilters>({
    search: "",
    category: "all",
    stockStatus: "all",
    priceRange: { min: null, max: null },
    dateRange: { start: null, end: null },
  });

  const [performanceFilters, setPerformanceFilters] = useState<PerformanceFilters>({
    search: "",
    category: "all",
    paymentMethod: "all",
    priceRange: { min: null, max: null },
    dateRange: { start: null, end: null },
  });

  const [expenseFilters, setExpenseFilters] = useState<ExpenseFilters>({
    category: "all",
    paymentMethod: "all",
    dateRange: { start: null, end: null },
  });

  // Data fetching with filters
  const { data: inventoryData, isLoading: inventoryLoading } = useInventoryReport(inventoryFilters);
  const { data: performanceData, isLoading: performanceLoading } = useProductPerformanceReport(performanceFilters);
  const { data: expensesData } = useExpensesSummary(expenseFilters);

  const [period, setPeriod] = useState<
    "today" | "this_week" | "last_week" | "this_month" | "last_month" | "this_year" | "custom"
  >("this_week");

  const [customDateRange, setCustomDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null
  });

  const summaryFilters: { startDate: Date; endDate: Date } | undefined = period === "custom"
    ? (customDateRange.start && customDateRange.end ? { startDate: customDateRange.start, endDate: customDateRange.end } : undefined)
    : (getDatesFromPeriod(period) || undefined);

  // For Sales Summary (Trends), we can pass period string OR dates. 
  // If period is custom, we pass dates. If period is standard, we can pass period string OR dates.
  // Passing period string lets backend handle logic, but passing dates ensures consistency across all charts if we trust our frontend helper.
  // Let's pass dates if we have them, otherwise period.

  const { data: salesSummary, isLoading: salesSummaryLoading } = useSalesSummary(
    period === "custom" ? undefined : period,
    summaryFilters
  );

  // For Category Performance & Dashboard Overview, we MUST pass dates because they don't accept 'period' string in these specific hooks/endpoints (unless I updated them, which I didn't fully for all).
  const { data: categoryPerformanceData } = useCategoryPerformance(summaryFilters);

  // Fetch performance data specifically for the dashboard metrics using the global period
  const { data: dashboardPerformanceData } = useProductPerformanceReport({
    ...performanceFilters, // Keep other filters if needed, but mainly override dates
    startDate: summaryFilters?.startDate,
    endDate: summaryFilters?.endDate
  });

  const { data: expensesSummary, isLoading: expensesSummaryLoading } = useExpensesSummary();
  const { data: stockValueData, isLoading: stockValueLoading } = useStockValueReport({
    startDate: summaryFilters?.startDate,
    endDate: summaryFilters?.endDate
  });

  const [tab, setTab] = useState("dashboard");

  // Top sellers (top 3 by revenue) - use dashboardPerformanceData for the overview tab
  const topSellers = (dashboardPerformanceData?.products || [])
    .slice()
    .sort((a: { revenue: number }, b: { revenue: number }) => b.revenue - a.revenue)
    .slice(0, 3) as Array<{ productId: number; productName: string; revenue: number }>;

  // Calculate dashboard metrics using dashboardPerformanceData
  const dashboardMetrics = {
    totalRevenue: dashboardPerformanceData?.summary?.totalRevenue || 0,
    totalProfit: dashboardPerformanceData?.summary?.totalProfit || 0,
    totalSales: dashboardPerformanceData?.summary?.totalQuantity || 0,
    totalProducts: inventoryData?.totalProducts || 0,
    lowStockProducts: inventoryData?.lowStockProducts || 0,
    outOfStockProducts: inventoryData?.outOfStockProducts || 0,
    totalCustomers: 0,
    averageOrderValue: dashboardPerformanceData?.summary?.totalRevenue / (dashboardPerformanceData?.summary?.totalQuantity || 1) || 0,
    revenueGrowth: 0,
    profitGrowth: 0,
    salesGrowth: 0,
    topCategory: topSellers[0]?.productName || "N/A",
    topCategoryRevenue: topSellers[0]?.revenue || 0,
  };

  // salesTrendData and categoryPerformanceData mocks removed


  if (inventoryLoading || performanceLoading || salesSummaryLoading || expensesSummaryLoading || stockValueLoading) {
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
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <div className="flex gap-2">
            {(["today", "this_week", "last_week", "this_month", "last_month", "this_year"] as const).map((p) => (
              <button
                key={p}
                className={`px-3 py-1 rounded ${period === p ? "bg-primary text-white" : "bg-gray-200"}`}
                onClick={() => setPeriod(p)}
              >
                {p.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </button>
            ))}
            <button
              className={`px-3 py-1 rounded ${period === "custom" ? "bg-primary text-white" : "bg-gray-200"}`}
              onClick={() => setPeriod("custom")}
            >
              Custom Range
            </button>
          </div>

          {period === "custom" && (
            <div className="flex gap-2 items-center bg-white p-1 rounded border">
              <input
                type="date"
                className="border p-1 rounded"
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value ? new Date(e.target.value) : null }))}
              />
              <span>to</span>
              <input
                type="date"
                className="border p-1 rounded"
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value ? new Date(e.target.value) : null }))}
              />
            </div>
          )}
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
        <Tabs value={tab} onValueChange={setTab} defaultValue="dashboard">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="inventory">Inventory Status</TabsTrigger>
            <TabsTrigger value="performance">Product Performance</TabsTrigger>
            <TabsTrigger value="expenses">Expenses Summary</TabsTrigger>
            <TabsTrigger value="stock-value">Stock Value</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <DashboardOverview
              metrics={dashboardMetrics}
              period={period}
              isLoading={inventoryLoading || performanceLoading}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg border">
                <SalesTrendChart
                  data={salesSummary?.current?.salesByDay || []}
                  title="Sales Trend"
                />
              </div>
              <div className="bg-white p-6 rounded-lg border">
                <CategoryPerformanceChart
                  data={categoryPerformanceData || []}
                  title="Category Performance"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="inventory">
            <InventoryStatus
              products={inventoryData?.products || []}
              onFiltersChange={setInventoryFilters}
            />
          </TabsContent>

          <TabsContent value="performance">
            <ProductPerformance
              products={performanceData?.products || []}
              summary={performanceData?.summary}
              onFiltersChange={setPerformanceFilters}
            />
          </TabsContent>


          <TabsContent value="expenses">
            <ExpensesSummary
              expenses={expensesData?.expenses || []}
              onFiltersChange={setExpenseFilters}
            />
          </TabsContent>

          <TabsContent value="stock-value">
            <StockValueReport data={stockValueData || { total_value: 0, logs: [] }} />
          </TabsContent>
        </Tabs>
      </div>
    </ErrorBoundary>
  );
}
