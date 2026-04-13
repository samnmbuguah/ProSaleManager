import { orderService } from '../orderService';
import { api } from '../api';
import { Sale } from '../../types/sale';

jest.mock('../api');

const mockSale: Sale = {
  id: 1,
  customer_name: 'Test Customer',
  total: 500,
  payment_method: 'cash',
  status: 'completed',
  created_at: '2026-04-11T10:00:00Z',
} as Sale;

describe('Order Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrders', () => {
    it('should fetch orders with default pagination', async () => {
      const mockResponse = {
        data: {
          orders: [mockSale],
        },
      };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await orderService.getOrders();

      expect(api.get).toHaveBeenCalledWith('/orders?page=1&pageSize=10');
      expect(result.orders).toEqual([mockSale]);
    });

    it('should fetch orders with custom pagination', async () => {
      const mockResponse = {
        data: {
          orders: [mockSale, { ...mockSale, id: 2 }],
        },
      };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await orderService.getOrders(2, 20);

      expect(api.get).toHaveBeenCalledWith('/orders?page=2&pageSize=20');
      expect(result.orders).toHaveLength(2);
    });

    it('should handle empty orders list', async () => {
      const mockResponse = {
        data: {
          orders: [],
        },
      };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await orderService.getOrders();

      expect(result.orders).toEqual([]);
    });

    it('should handle API errors', async () => {
      (api.get as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(orderService.getOrders()).rejects.toThrow('Network error');
    });

    it('should handle different order statuses', async () => {
      const orders = [
        { ...mockSale, status: 'pending' },
        { ...mockSale, status: 'completed' },
        { ...mockSale, status: 'cancelled' },
      ];
      const mockResponse = {
        data: {
          orders,
        },
      };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await orderService.getOrders();

      expect(result.orders).toHaveLength(3);
      expect(result.orders[0].status).toBe('pending');
      expect(result.orders[1].status).toBe('completed');
      expect(result.orders[2].status).toBe('cancelled');
    });
  });
});
