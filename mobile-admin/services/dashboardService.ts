import { api } from './api';
import { DashboardData, TopProduct } from '../types/dashboard';

export const dashboardService = {
    getDashboardData: async (startDate: Date, endDate: Date): Promise<DashboardData> => {
        try {
            const params = {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            };

            // Fetch parallel requests for performance and inventory data
            const [performanceRes, inventoryRes] = await Promise.all([
                api.get('/reports/product-performance', { params }),
                api.get('/reports/inventory'), // Inventory usually doesn't need date range for current status
            ]);

            const performance = performanceRes.data.data;
            const inventory = inventoryRes.data.data;

            // Process Top Sellers
            const topProducts: TopProduct[] = (performance.products || [])
                .sort((a: any, b: any) => b.revenue - a.revenue)
                .slice(0, 5)
                .map((p: any) => ({
                    productId: p.productId,
                    productName: p.productName,
                    revenue: p.revenue,
                    quantity: p.quantity,
                }));

            // Calculate Metrics
            const metrics = {
                totalRevenue: performance.summary?.totalRevenue || 0,
                totalProfit: performance.summary?.totalProfit || 0,
                totalSales: performance.summary?.totalQuantity || 0,
                totalProducts: inventory.totalProducts || 0,
                lowStockProducts: inventory.lowStockProducts || 0,
                outOfStockProducts: inventory.outOfStockProducts || 0,
                averageOrderValue:
                    performance.summary?.totalRevenue / (performance.summary?.totalQuantity || 1) || 0,
                topCategory: topProducts[0] ? topProducts[0].productName : 'N/A', // Using top product as proxy for now if cat not avail
                topCategoryRevenue: topProducts[0] ? topProducts[0].revenue : 0,
            };

            return {
                metrics,
                topProducts,
            };
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
            throw error;
        }
    },
};
