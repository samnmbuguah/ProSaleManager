import { reportService, getPeriodRange } from '../reportService';
import { api } from '../api';
import { ExpensesSummary, ProductPerformance, SalesSummaryResponse } from '../../types/report';

jest.mock('../api');

// The API wraps report payloads in { success, data }
const wrap = <T,>(data: T) => ({ data: { success: true, data } });

const mockSalesSummary: SalesSummaryResponse = {
  current: {
    totalSales: 120,
    totalRevenue: 50000,
    totalProfit: 15000,
    totalDeliveryFees: 2000,
    totalItems: 400,
    paymentMethods: { cash: 30000, mpesa: 20000 },
    salesByDay: [
      {
        date: '2026-04-11',
        revenue: 10000,
        profit: 3000,
        sales: 20,
        orders: 25,
        deliveryFees: 400,
      },
    ],
  },
  compare: null,
};

const mockExpensesSummary: ExpensesSummary = {
  expenses: [
    {
      id: 1,
      description: 'Stock purchase',
      amount: 5000,
      category: 'inventory',
      date: '2026-04-11',
      payment_method: 'cash',
    },
  ],
  totalExpenses: 5000,
  count: 1,
  categoryBreakdown: [
    { category: 'inventory', amount: 5000, count: 1, percentage: 100 },
  ],
};

const mockProductPerformance: ProductPerformance = {
  products: [
    {
      productId: 1,
      productName: 'Product A',
      productSku: 'SKU-A',
      categoryId: 1,
      categoryName: 'Category A',
      quantity: 50,
      revenue: 10000,
      profit: 3000,
      lastSold: '2026-04-10T09:00:00Z',
      averagePrice: 200,
      totalSales: 50,
    },
  ],
  summary: {
    totalRevenue: 10000,
    totalProfit: 3000,
    totalQuantity: 50,
    totalProducts: 1,
    averageRevenue: 10000,
    averageProfit: 3000,
  },
};

describe('Report Service (Mobile Admin)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPeriodRange', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      // Saturday, April 11 2026, 10:30 local time
      jest.setSystemTime(new Date(2026, 3, 11, 10, 30, 0));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return today from midnight to tomorrow for "today"', () => {
      const { startDate, endDate } = getPeriodRange('today');

      expect(startDate.getDate()).toBe(11);
      expect(startDate.getHours()).toBe(0);
      expect(startDate.getMinutes()).toBe(0);
      expect(endDate.getDate()).toBe(12);
      expect(endDate.getTime() - startDate.getTime()).toBe(24 * 60 * 60 * 1000);
    });

    it('should start on Monday for "this_week"', () => {
      const { startDate, endDate } = getPeriodRange('this_week');

      expect(startDate.getDay()).toBe(1); // Monday
      expect(startDate.getDate()).toBe(6);
      expect(endDate.getDate()).toBe(12);
    });

    it('should start on the first of the month for "this_month"', () => {
      const { startDate, endDate } = getPeriodRange('this_month');

      expect(startDate.getDate()).toBe(1);
      expect(startDate.getMonth()).toBe(3);
      expect(endDate.getDate()).toBe(12);
    });

    it('should always return an end date after the start date', () => {
      (['today', 'this_week', 'this_month'] as const).forEach((period) => {
        const { startDate, endDate } = getPeriodRange(period);
        expect(endDate.getTime()).toBeGreaterThan(startDate.getTime());
      });
    });
  });

  describe('getSalesSummary', () => {
    it('should fetch the sales summary for a period', async () => {
      (api.get as jest.Mock).mockResolvedValue(wrap(mockSalesSummary));

      const result = await reportService.getSalesSummary('this_month');

      expect(api.get).toHaveBeenCalledWith('/reports/sales-summary', {
        params: { period: 'this_month' },
      });
      expect(result).toEqual(mockSalesSummary);
    });

    it('should support the "today" period', async () => {
      (api.get as jest.Mock).mockResolvedValue(wrap(mockSalesSummary));

      await reportService.getSalesSummary('today');

      expect(api.get).toHaveBeenCalledWith('/reports/sales-summary', {
        params: { period: 'today' },
      });
    });

    it('should handle API errors', async () => {
      (api.get as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(reportService.getSalesSummary('today')).rejects.toThrow('Network error');
    });
  });

  describe('getExpensesSummary', () => {
    const startDate = new Date('2026-04-01T00:00:00Z');
    const endDate = new Date('2026-04-11T00:00:00Z');

    it('should fetch the expenses summary for the date range', async () => {
      (api.get as jest.Mock).mockResolvedValue(wrap(mockExpensesSummary));

      const result = await reportService.getExpensesSummary(startDate, endDate);

      expect(api.get).toHaveBeenCalledWith('/reports/expenses-summary', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });
      expect(result).toEqual(mockExpensesSummary);
    });

    it('should handle an empty expenses summary', async () => {
      const empty: ExpensesSummary = {
        expenses: [],
        totalExpenses: 0,
        count: 0,
        categoryBreakdown: [],
      };
      (api.get as jest.Mock).mockResolvedValue(wrap(empty));

      const result = await reportService.getExpensesSummary(startDate, endDate);

      expect(result.expenses).toEqual([]);
      expect(result.totalExpenses).toBe(0);
    });

    it('should handle API errors', async () => {
      (api.get as jest.Mock).mockRejectedValue(new Error('Request failed'));

      await expect(reportService.getExpensesSummary(startDate, endDate)).rejects.toThrow(
        'Request failed'
      );
    });
  });

  describe('getProductPerformance', () => {
    const startDate = new Date('2026-04-01T00:00:00Z');
    const endDate = new Date('2026-04-11T00:00:00Z');

    it('should fetch product performance for the date range', async () => {
      (api.get as jest.Mock).mockResolvedValue(wrap(mockProductPerformance));

      const result = await reportService.getProductPerformance(startDate, endDate);

      expect(api.get).toHaveBeenCalledWith('/reports/product-performance', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });
      expect(result).toEqual(mockProductPerformance);
    });

    it('should handle no products', async () => {
      const empty: ProductPerformance = {
        products: [],
        summary: {
          totalRevenue: 0,
          totalProfit: 0,
          totalQuantity: 0,
          totalProducts: 0,
          averageRevenue: 0,
          averageProfit: 0,
        },
      };
      (api.get as jest.Mock).mockResolvedValue(wrap(empty));

      const result = await reportService.getProductPerformance(startDate, endDate);

      expect(result.products).toEqual([]);
    });

    it('should handle API errors', async () => {
      (api.get as jest.Mock).mockRejectedValue(new Error('Server error'));

      await expect(reportService.getProductPerformance(startDate, endDate)).rejects.toThrow(
        'Server error'
      );
    });
  });
});
