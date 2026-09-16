import { saleService } from '../saleService';
import { api } from '../api';
import { SaleItem, SalesResponse } from '../../types/sale';

jest.mock('../api');

const mockSalesResponse: SalesResponse = {
  sales: [
    {
      id: 1,
      customer_id: 1,
      user_id: 2,
      total_amount: 500,
      payment_method: 'cash',
      amount_paid: 500,
      status: 'completed',
      payment_status: 'paid',
      delivery_fee: 0,
      store_id: 1,
      createdAt: '2026-04-11T10:00:00Z',
      updatedAt: '2026-04-11T10:00:00Z',
    },
  ],
  total: 1,
  totalPages: 1,
  currentPage: 1,
};

const mockSaleItems: SaleItem[] = [
  {
    id: 1,
    sale_id: 1,
    product_id: 10,
    quantity: 2,
    unit_price: '250.00',
    buying_price: '200.00',
    total: '500.00',
    unit_type: 'piece',
    Product: { id: 10, name: 'Product A', sku: 'SKU-A' },
  },
];

describe('Sale Service (Mobile Admin)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSales', () => {
    it('should fetch sales with default pagination', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: mockSalesResponse });

      const result = await saleService.getSales();

      expect(api.get).toHaveBeenCalledWith('/sales', {
        params: { page: 1, pageSize: 20 },
      });
      expect(result).toEqual(mockSalesResponse);
    });

    it('should fetch sales with custom pagination', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: mockSalesResponse });

      const result = await saleService.getSales(3, 50);

      expect(api.get).toHaveBeenCalledWith('/sales', {
        params: { page: 3, pageSize: 50 },
      });
      expect(result.sales).toEqual(mockSalesResponse.sales);
    });

    it('should handle an empty sales list', async () => {
      const empty: SalesResponse = {
        sales: [],
        total: 0,
        totalPages: 0,
        currentPage: 1,
      };
      (api.get as jest.Mock).mockResolvedValue({ data: empty });

      const result = await saleService.getSales();

      expect(result.sales).toEqual([]);
    });

    it('should handle API errors', async () => {
      (api.get as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(saleService.getSales()).rejects.toThrow('Network error');
    });
  });

  describe('getSaleItems', () => {
    it('should fetch the items for a sale', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: mockSaleItems });

      const items = await saleService.getSaleItems(1);

      expect(api.get).toHaveBeenCalledWith('/sales/1/items');
      expect(items).toEqual(mockSaleItems);
    });

    it('should handle a sale with no items', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: [] });

      const items = await saleService.getSaleItems(42);

      expect(api.get).toHaveBeenCalledWith('/sales/42/items');
      expect(items).toEqual([]);
    });

    it('should handle API errors', async () => {
      (api.get as jest.Mock).mockRejectedValue(new Error('Sale not found'));

      await expect(saleService.getSaleItems(999)).rejects.toThrow('Sale not found');
    });
  });
});
