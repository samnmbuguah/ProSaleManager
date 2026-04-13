import { productService } from '../productService';
import { api } from '../api';
import { Product } from '../../types/product';

jest.mock('../api');

const mockProduct: Product = {
  id: 1,
  name: 'Test Product',
  piece_selling_price: 100,
  pack_selling_price: 1100,
  dozen_selling_price: 1200,
  piece_buying_price: 80,
  stock: 50,
  min_stock: 10,
} as Product;

describe('Product Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all products successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [mockProduct],
        },
      };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const products = await productService.getAll();

      expect(api.get).toHaveBeenCalledWith('/products');
      expect(products).toEqual([mockProduct]);
    });

    it('should handle empty product list', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [],
        },
      };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const products = await productService.getAll();

      expect(products).toEqual([]);
    });

    it('should handle API errors', async () => {
      (api.get as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(productService.getAll()).rejects.toThrow('Network error');
    });
  });

  describe('getById', () => {
    it('should fetch a single product by ID', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: mockProduct,
        },
      };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const product = await productService.getById(1);

      expect(api.get).toHaveBeenCalledWith('/products/1');
      expect(product).toEqual(mockProduct);
    });

    it('should handle product not found', async () => {
      (api.get as jest.Mock).mockRejectedValue(new Error('Product not found'));

      await expect(productService.getById(999)).rejects.toThrow('Product not found');
    });
  });

  describe('search', () => {
    it('should search products by query', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [mockProduct],
        },
      };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const products = await productService.search('Test');

      expect(api.get).toHaveBeenCalledWith('/products/search?q=Test');
      expect(products).toEqual([mockProduct]);
    });

    it('should handle special characters in search query', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [],
        },
      };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      await productService.search('Test & Product');

      expect(api.get).toHaveBeenCalledWith('/products/search?q=Test%20%26%20Product');
    });

    it('should handle empty search results', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [],
        },
      };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const products = await productService.search('Nonexistent');

      expect(products).toEqual([]);
    });
  });
});
