export type ReportPeriod = 'today' | 'this_week' | 'this_month';

export interface SalesByDay {
    date: string;
    revenue: number;
    profit: number;
    sales: number;
    orders: number;
    deliveryFees: number;
}

export interface SalesSummary {
    totalSales: number; // total orders
    totalRevenue: number;
    totalProfit: number;
    totalDeliveryFees: number;
    totalItems: number;
    paymentMethods: Record<string, number>;
    salesByDay: SalesByDay[];
}

export interface SalesSummaryResponse {
    current: SalesSummary;
    compare: SalesSummary | null;
}

export interface ExpenseCategoryBreakdown {
    category: string;
    amount: number;
    count: number;
    percentage: number;
}

export interface ExpensesSummaryEntry {
    id: number | string;
    description: string;
    amount: number;
    category: string;
    date: string;
    payment_method: string;
    user?: { id?: number; name: string };
}

export interface ExpensesSummary {
    expenses: ExpensesSummaryEntry[];
    totalExpenses: number;
    count: number;
    categoryBreakdown: ExpenseCategoryBreakdown[];
}

export interface ProductPerformanceItem {
    productId: number;
    productName: string;
    productSku: string;
    categoryId: number | null;
    categoryName: string;
    quantity: number;
    revenue: number;
    profit: number;
    lastSold: string | null;
    averagePrice: number;
    totalSales: number;
}

export interface ProductPerformanceSummary {
    totalRevenue: number;
    totalProfit: number;
    totalQuantity: number;
    totalProducts: number;
    averageRevenue: number;
    averageProfit: number;
}

export interface ProductPerformance {
    products: ProductPerformanceItem[];
    summary: ProductPerformanceSummary;
}
