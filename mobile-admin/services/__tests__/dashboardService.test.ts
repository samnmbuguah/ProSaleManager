import { dashboardService } from '../dashboardService';
import { api } from '../api';

jest.mock('../api');

describe('Dashboard Service (Mobile Admin)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardData', () => {
    const startDate = new Date('2026-03-01');
    const endDate = new Date('2026-04-11');

    it('should fetch dashboard data successfully', async () => {
      const mockPerformanceResponse = {
        data: {
          data: {
            summary: {
              totalRevenue: 50000,
              totalProfit: 15000,
              totalQuantity: 100,
            },
            products: [
              { productId: 1, productName: 'Product A', revenue: 10000, quantity: 50 },
              { productId: 2, productName: 'Product B', revenue: 8000, quantity: 40 },
            ],
          },
        },
      };

      const mockInventoryResponse = {
        data: {
          data: {
            totalProducts: 50,
            lowStockProducts: 5,
            outOfStockProducts: 2,
          },
        },
      };

      (api.get as jest.Mock)
        .mockResolvedValueOnce(mockPerformanceResponse)
        .mockResolvedValueOnce(mockInventoryResponse);

      const result = await dashboardService.getDashboardData(startDate, endDate);

      expect(api.get).toHaveBeenCalledWith('/reports/product-performance', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });
      expect(api.get).toHaveBeenCalledWith('/reports/inventory');

      expect(result.metrics.totalRevenue).toBe(50000);
      expect(result.metrics.totalProfit).toBe(15000);
      expect(result.metrics.totalSales).toBe(100);
      expect(result.metrics.totalProducts).toBe(50);
      expect(result.metrics.lowStockProducts).toBe(5);
      expect(result.metrics.outOfStockProducts).toBe(2);
      expect(result.topProducts).toHaveLength(2);
    });

    it('should calculate average order value correctly', async () => {
      const mockPerformanceResponse = {
        data: {
          data: {
            summary: {
              totalRevenue: 10000,
              totalProfit: 3000,
              totalQuantity: 50,
            },
            products: [],
          },
        },
      };

      const mockInventoryResponse = {
        data: {
          data: {
            totalProducts: 20,
            lowStockProducts: 0,
            outOfStockProducts: 0,
          },
        },
      };

      (api.get as jest.Mock)
        .mockResolvedValueOnce(mockPerformanceResponse)
        .mockResolvedValueOnce(mockInventoryResponse);

      const result = await dashboardService.getDashboardData(startDate, endDate);

      expect(result.metrics.averageOrderValue).toBe(200); // 10000 / 50
    });

    it('should handle zero sales without division by zero', async () => {
      const mockPerformanceResponse = {
        data: {
          data: {
            summary: {
              totalRevenue: 0,
              totalProfit: 0,
              totalQuantity: 0,
            },
            products: [],
          },
        },
      };

      const mockInventoryResponse = {
        data: {
          data: {
            totalProducts: 10,
            lowStockProducts: 0,
            outOfStockProducts: 0,
          },
        },
      };

      (api.get as jest.Mock)
        .mockResolvedValueOnce(mockPerformanceResponse)
        .mockResolvedValueOnce(mockInventoryResponse);

      const result = await dashboardService.getDashboardData(startDate, endDate);

      expect(result.metrics.averageOrderValue).toBe(0);
    });

    it('should sort top products by revenue', async () => {
      const mockPerformanceResponse = {
        data: {
          data: {
            summary: {
              totalRevenue: 30000,
              totalProfit: 9000,
              totalQuantity: 150,
            },
            products: [
              { productId: 1, productName: 'Product C', revenue: 5000, quantity: 30 },
              { productId: 2, productName: 'Product A', revenue: 15000, quantity: 80 },
              { productId: 3, productName: 'Product B', revenue: 10000, quantity: 40 },
            ],
          },
        },
      };

      const mockInventoryResponse = {
        data: {
          data: {
            totalProducts: 30,
            lowStockProducts: 2,
            outOfStockProducts: 1,
          },
        },
      };

      (api.get as jest.Mock)
        .mockResolvedValueOnce(mockPerformanceResponse)
        .mockResolvedValueOnce(mockInventoryResponse);

      const result = await dashboardService.getDashboardData(startDate, endDate);

      // Should be sorted by revenue descending
      expect(result.topProducts[0].revenue).toBe(15000);
      expect(result.topProducts[1].revenue).toBe(10000);
      expect(result.topProducts[2].revenue).toBe(5000);
    });

    it('should limit top products to 5', async () => {
      const mockPerformanceResponse = {
        data: {
          data: {
            summary: {
              totalRevenue: 100000,
              totalProfit: 30000,
              totalQuantity: 500,
            },
            products: Array.from({ length: 10 }, (_, i) => ({
              productId: i + 1,
              productName: `Product ${i + 1}`,
              revenue: 10000 - i * 1000,
              quantity: 50 - i * 5,
            })),
          },
        },
      };

      const mockInventoryResponse = {
        data: {
          data: {
            totalProducts: 100,
            lowStockProducts: 10,
            outOfStockProducts: 5,
          },
        },
      };

      (api.get as jest.Mock)
        .mockResolvedValueOnce(mockPerformanceResponse)
        .mockResolvedValueOnce(mockInventoryResponse);

      const result = await dashboardService.getDashboardData(startDate, endDate);

      expect(result.topProducts).toHaveLength(5);
    });

    it('should handle missing data gracefully', async () => {
      const mockPerformanceResponse = {
        data: {
          data: {},
        },
      };

      const mockInventoryResponse = {
        data: {
          data: {},
        },
      };

      (api.get as jest.Mock)
        .mockResolvedValueOnce(mockPerformanceResponse)
        .mockResolvedValueOnce(mockInventoryResponse);

      const result = await dashboardService.getDashboardData(startDate, endDate);

      expect(result.metrics.totalRevenue).toBe(0);
      expect(result.metrics.totalProfit).toBe(0);
      expect(result.metrics.totalSales).toBe(0);
      expect(result.topProducts).toEqual([]);
    });

    it('should handle API errors', async () => {
      (api.get as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(dashboardService.getDashboardData(startDate, endDate)).rejects.toThrow(
        'Network error'
      );
    });

    it('should handle partial API failures', async () => {
      const mockPerformanceResponse = {
        data: {
          data: {
            summary: {
              totalRevenue: 20000,
              totalProfit: 6000,
              totalQuantity: 80,
            },
            products: [],
          },
        },
      };

      (api.get as jest.Mock)
        .mockResolvedValueOnce(mockPerformanceResponse)
        .mockRejectedValueOnce(new Error('Inventory API failed'));

      await expect(dashboardService.getDashboardData(startDate, endDate)).rejects.toThrow(
        'Inventory API failed'
      );
    });
  });
});
