export interface DashboardMetrics {
    totalRevenue: number;
    totalProfit: number;
    totalSales: number;
    totalProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    averageOrderValue: number;
    topCategory: string;
    topCategoryRevenue: number;
}

export interface TopProduct {
    productId: number;
    productName: string;
    revenue: number;
    quantity: number;
}

export interface DashboardData {
    metrics: DashboardMetrics;
    topProducts: TopProduct[];
}
