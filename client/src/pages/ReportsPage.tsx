import React, { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import ProductPerformance from "../components/reports/ProductPerformance";
import InventoryStatus from "../components/reports/InventoryStatus";
import ExpensesSummary from "../components/reports/ExpensesSummary";
import {
  useCategoryPerformance,
  useInventoryReport,
  useProductPerformanceReport,
  useSalesSummary,
  useExpensesSummary,
  useStockValueReport,
} from "@/hooks/use-reports";
import { getDatesFromPeriod } from "@/lib/utils";
import { SalesExpensesChart } from "../components/reports/SalesExpensesChart";
import { InventoryFilters, PerformanceFilters, ExpenseFilters } from "@/components/reports/ReportFilters";
import DashboardOverview from "../components/reports/DashboardOverview";
import { SalesTrendChart } from "../components/reports/SalesTrendChart";
import { CategoryPerformanceChart } from "../components/reports/CategoryPerformanceChart";
import StockValueReport from "../components/reports/StockValueReport";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  BarChart2,
} from "lucide-react";

// ─── ErrorBoundary ────────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) { console.error("ErrorBoundary caught:", error, info); }
  render() {
    if (this.state.hasError) {
      return <div className="text-center text-red-500 py-12">Something went wrong in the reports page.</div>;
    }
    return this.props.children;
  }
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
interface KpiCardProps {
  title: string;
  value: string;
  sub?: string;
  trend?: number; // positive = good, negative = bad
  icon: React.ReactNode;
  isLoading?: boolean;
  colorClass?: string;
}

function KpiCard({ title, value, sub, trend, icon, isLoading, colorClass = "text-primary" }: KpiCardProps) {
  if (isLoading) {
    return (
      <Card className="p-4">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-7 w-32 mb-1" />
        <Skeleton className="h-3 w-20" />
      </Card>
    );
  }

  const TrendIcon = trend === undefined ? null : trend >= 0 ? TrendingUp : TrendingDown;
  const trendColor = trend === undefined ? "" : trend >= 0 ? "text-emerald-500" : "text-red-500";

  return (
    <Card className="p-4 flex items-start gap-3">
      <div className={`mt-1 ${colorClass}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold truncate">{value}</p>
        {(sub || trend !== undefined) && (
          <div className="flex items-center gap-1 mt-0.5">
            {TrendIcon && <TrendIcon size={12} className={trendColor} />}
            {sub && <span className={`text-xs ${TrendIcon ? trendColor : "text-muted-foreground"}`}>{sub}</span>}
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Period Buttons ───────────────────────────────────────────────────────────
const PERIODS = ["today", "this_week", "last_week", "this_month", "last_month", "this_year"] as const;
type Period = typeof PERIODS[number] | "custom";

function formatPeriodLabel(p: string) {
  return p.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>("this_week");
  const [customDateRange, setCustomDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [tab, setTab] = useState("dashboard");

  // Per-tab filter states (isolated so changing one doesn't re-render siblings)
  const [inventoryFilters, setInventoryFilters] = useState<InventoryFilters>({
    search: "", category: "all", stockStatus: "all",
    priceRange: { min: null, max: null }, dateRange: { start: null, end: null },
  });
  const [performanceFilters, setPerformanceFilters] = useState<PerformanceFilters>({
    search: "", category: "all", paymentMethod: "all",
    priceRange: { min: null, max: null }, dateRange: { start: null, end: null },
  });
  const [expenseFilters, setExpenseFilters] = useState<ExpenseFilters>({
    category: "all", paymentMethod: "all", dateRange: { start: null, end: null },
  });

  // Derive date range from period
  const summaryFilters = useMemo<{ startDate: Date; endDate: Date } | undefined>(() => {
    if (period === "custom") {
      return customDateRange.start && customDateRange.end
        ? { startDate: customDateRange.start, endDate: customDateRange.end }
        : undefined;
    }
    return getDatesFromPeriod(period) || undefined;
  }, [period, customDateRange]);

  // ── Data fetching (all period-aware) ─────────────────────────────────────
  const { data: salesSummary, isLoading: salesLoading } = useSalesSummary(
    period === "custom" ? undefined : period,
    summaryFilters
  );

  // Pass summaryFilters so expenses reflect the selected period
  const { data: expensesSummary, isLoading: expensesLoading } = useExpensesSummary({
    startDate: summaryFilters?.startDate,
    endDate: summaryFilters?.endDate,
  });

  const { data: categoryPerformanceData } = useCategoryPerformance(summaryFilters);
  const { data: inventoryData, isLoading: inventoryLoading } = useInventoryReport(inventoryFilters);
  const { data: performanceData, isLoading: performanceLoading } = useProductPerformanceReport({
    ...performanceFilters,
    startDate: summaryFilters?.startDate,
    endDate: summaryFilters?.endDate,
  });
  const { data: stockValueData, isLoading: stockValueLoading } = useStockValueReport({
    startDate: summaryFilters?.startDate,
    endDate: summaryFilters?.endDate,
  });
  const { data: expensesTabData } = useExpensesSummary(expenseFilters as any);

  // ── Computed KPIs ─────────────────────────────────────────────────────────
  const totalRevenue = salesSummary?.current?.totalRevenue ?? salesSummary?.current?.total ?? 0;
  const totalExpenses = expensesSummary?.totalExpenses ?? 0;
  const netProfit = totalRevenue - totalExpenses;
  const grossMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : "0.0";
  const salesCount = salesSummary?.current?.count ?? 0;
  const isKpiLoading = salesLoading || expensesLoading;

  // ── Expenses by day (for chart) — group raw expense records by date ──────
  const expensesByDay: Record<string, number> = useMemo(() => {
    const raw: Array<{ date: string; amount: number }> = expensesSummary?.expenses ?? [];
    return raw.reduce((acc: Record<string, number>, exp) => {
      const day = exp.date ? new Date(exp.date).toISOString().slice(0, 10) : null;
      if (day) acc[day] = (acc[day] || 0) + (exp.amount || 0);
      return acc;
    }, {});
  }, [expensesSummary]);

  // Top sellers
  const topSellers = useMemo(() =>
    (performanceData?.products || [])
      .slice()
      .sort((a: { revenue: number }, b: { revenue: number }) => b.revenue - a.revenue)
      .slice(0, 3) as Array<{ productId: number; productName: string; revenue: number }>,
    [performanceData]
  );

  const dashboardMetrics = {
    totalRevenue,
    totalProfit: netProfit,
    totalSales: salesCount,
    totalProducts: inventoryData?.totalProducts || 0,
    lowStockProducts: inventoryData?.lowStockProducts || 0,
    outOfStockProducts: inventoryData?.outOfStockProducts || 0,
    totalCustomers: 0,
    averageOrderValue: salesCount > 0 ? totalRevenue / salesCount : 0,
    revenueGrowth: 0,
    profitGrowth: 0,
    salesGrowth: 0,
    topCategory: topSellers[0]?.productName || "N/A",
    topCategoryRevenue: topSellers[0]?.revenue || 0,
  };

  return (
    <ErrorBoundary>
      <div className="container mx-auto p-4 mt-16">
        {/* ── Period Selector ─────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 mb-6 items-center">
          <div className="flex gap-2 flex-wrap">
            {PERIODS.map((p) => (
              <button
                key={p}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${period === p
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                onClick={() => setPeriod(p)}
              >
                {formatPeriodLabel(p)}
              </button>
            ))}
            <button
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${period === "custom"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              onClick={() => setPeriod("custom")}
            >
              Custom Range
            </button>
          </div>

          {period === "custom" && (
            <div className="flex gap-2 items-center bg-white p-1.5 rounded-md border shadow-sm">
              <input
                type="date"
                className="border p-1 rounded text-sm"
                onChange={(e) =>
                  setCustomDateRange((prev) => ({ ...prev, start: e.target.value ? new Date(e.target.value) : null }))
                }
              />
              <span className="text-muted-foreground text-sm">to</span>
              <input
                type="date"
                className="border p-1 rounded text-sm"
                onChange={(e) =>
                  setCustomDateRange((prev) => ({ ...prev, end: e.target.value ? new Date(e.target.value) : null }))
                }
              />
            </div>
          )}
        </div>

        {/* ── KPI Row ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard
            title="Total Revenue"
            value={`KSh ${totalRevenue.toLocaleString("en-KE")}`}
            sub={`${salesCount} transactions`}
            icon={<DollarSign size={18} />}
            isLoading={isKpiLoading}
            colorClass="text-primary"
          />
          <KpiCard
            title="Total Expenses"
            value={`KSh ${totalExpenses.toLocaleString("en-KE")}`}
            sub={`${expensesSummary?.count ?? 0} records`}
            icon={<ShoppingCart size={18} />}
            isLoading={isKpiLoading}
            colorClass="text-rose-500"
          />
          <KpiCard
            title="Net Profit"
            value={`KSh ${netProfit.toLocaleString("en-KE")}`}
            trend={netProfit}
            sub={netProfit >= 0 ? "Profitable period" : "Loss this period"}
            icon={netProfit >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
            isLoading={isKpiLoading}
            colorClass={netProfit >= 0 ? "text-emerald-500" : "text-red-500"}
          />
          <KpiCard
            title="Gross Margin"
            value={`${grossMargin}%`}
            sub="Revenue minus expenses"
            icon={<BarChart2 size={18} />}
            isLoading={isKpiLoading}
            colorClass="text-amber-500"
          />
        </div>

        {/* ── Main Chart: Sales + Expenses ─────────────────────────────── */}
        <div className="mb-8">
          <SalesExpensesChart
            salesData={salesSummary?.current?.salesByDay ?? {}}
            expensesData={expensesByDay}
            compareData={salesSummary?.compare?.salesByDay ?? {}}
            isLoading={salesLoading || expensesLoading}
          />
        </div>

        {/* ── Summary Cards ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Sales by Payment Method */}
          <div className="bg-white rounded-lg border shadow-sm p-4">
            <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">
              Payment Methods
            </h3>
            {salesSummary?.current?.paymentMethods ? (
              <ul className="space-y-2">
                {Object.entries(salesSummary.current.paymentMethods).map(([method, amount]: [string, unknown]) => (
                  <li key={method} className="flex justify-between items-center">
                    <span className="capitalize text-sm font-medium">{method}</span>
                    <span className="text-sm font-semibold">KSh {Number(amount).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-sm text-muted-foreground">No data</span>
            )}
          </div>

          {/* Expenses by Category */}
          <div className="bg-white rounded-lg border shadow-sm p-4">
            <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">
              Expenses Breakdown
            </h3>
            {expensesSummary?.categoryBreakdown ? (
              <ul className="space-y-2">
                {(expensesSummary.categoryBreakdown as Array<{ category: string; amount: number }>)
                  .slice(0, 5)
                  .map(({ category: cat, amount: amt }) => (
                    <li key={cat} className="flex justify-between items-center">
                      <span className="capitalize text-sm font-medium">{cat}</span>
                      <span className="text-sm font-semibold">KSh {Number(amt).toLocaleString()}</span>
                    </li>
                  ))}
              </ul>
            ) : (
              <span className="text-sm text-muted-foreground">No data</span>
            )}
          </div>

          {/* Top Sellers */}
          <div className="bg-white rounded-lg border shadow-sm p-4">
            <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">
              Top Sellers
            </h3>
            {topSellers.length > 0 ? (
              <ol className="space-y-2">
                {topSellers.map((p, i) => (
                  <li key={p.productId} className="flex justify-between items-center gap-2">
                    <span className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-bold w-4">{i + 1}.</span>
                      <span className="text-sm font-medium truncate">{p.productName}</span>
                    </span>
                    <span className="text-sm font-semibold whitespace-nowrap">KSh {p.revenue.toLocaleString()}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <span className="text-sm text-muted-foreground">No data</span>
            )}
          </div>
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────────── */}
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
                <SalesTrendChart data={salesSummary?.current?.salesByDay || []} title="Sales Trend" />
              </div>
              <div className="bg-white p-6 rounded-lg border">
                <CategoryPerformanceChart data={categoryPerformanceData || []} title="Category Performance" />
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
              expenses={expensesTabData?.expenses || []}
              onFiltersChange={setExpenseFilters}
            />
          </TabsContent>

          <TabsContent value="stock-value">
            {stockValueLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
              </div>
            ) : (
              <StockValueReport data={stockValueData || { total_value: 0, logs: [] }} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ErrorBoundary>
  );
}
