import { api } from './api';
import {
    ExpensesSummary,
    ProductPerformance,
    ReportPeriod,
    SalesSummaryResponse,
} from '../types/report';

// Compute a local date range matching the selected period (used for endpoints
// that only accept explicit startDate/endDate query params).
export const getPeriodRange = (period: ReportPeriod): { startDate: Date; endDate: Date } => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    if (period === 'this_week') {
        // Week starts on Monday
        const day = start.getDay();
        const diff = day === 0 ? 6 : day - 1;
        start.setDate(start.getDate() - diff);
    } else if (period === 'this_month') {
        start.setDate(1);
    }

    return { startDate: start, endDate: end };
};

export const reportService = {
    getSalesSummary: async (period: ReportPeriod) => {
        const response = await api.get<{ success: boolean; data: SalesSummaryResponse }>(
            '/reports/sales-summary',
            { params: { period } }
        );
        return response.data.data;
    },

    getExpensesSummary: async (startDate: Date, endDate: Date) => {
        const response = await api.get<{ success: boolean; data: ExpensesSummary }>(
            '/reports/expenses-summary',
            {
                params: {
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                },
            }
        );
        return response.data.data;
    },

    getProductPerformance: async (startDate: Date, endDate: Date) => {
        const response = await api.get<{ success: boolean; data: ProductPerformance }>(
            '/reports/product-performance',
            {
                params: {
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                },
            }
        );
        return response.data.data;
    },
};
