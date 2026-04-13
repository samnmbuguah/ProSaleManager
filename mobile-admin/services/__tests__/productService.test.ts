import { productService } from '../productService';
import { api } from '../api';
import { Product, ProductInsert, ProductUpdate } from '../../types/product';

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

describe('Product Service (Mobile Admin)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all products successfully', async () => {
      const mockResponse = {
        data: [mockProduct],
      };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const products = await productService.getAll();

      expect(api.get).toHaveBeenCalledWith('/products');
      expect(products).toEqual([mockProduct]);
    });

    it('should handle empty product list', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: [] });

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
        data: mockProduct,
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
        data: [mockProduct],
      };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const products = await productService.search('Test');

      expect(api.get).toHaveBeenCalledWith('/products/search?q=Test');
      expect(products).toEqual([mockProduct]);
    });

    it('should handle empty search results', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: [] });

      const products = await productService.search('Nonexistent');

      expect(products).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create a new product', async () => {
      const newProduct: ProductInsert = {
        name: 'New Product',
        piece_selling_price: 150,
        piece_buying_price: 100,
        stock: 100,
        min_stock: 20,
      };
      const mockResponse = {
        data: { ...newProduct, id: 2 },
      };
      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const product = await productService.create(newProduct);

      expect(api.post).toHaveBeenCalledWith('/products', newProduct);
      expect(product).toEqual({ ...newProduct, id: 2 });
    });

    it('should handle validation errors', async () => {
      const invalidProduct: ProductInsert = {
        name: '',
        piece_selling_price: -10,
        piece_buying_price: 0,
        stock: 0,
        min_stock: 0,
      };
      (api.post as jest.Mock).mockRejectedValue(new Error('Validation error'));

      await expect(productService.create(invalidProduct)).rejects.toThrow('Validation error');
    });
  });

  describe('update', () => {
    it('should update an existing product', async () => {
      const updates: ProductUpdate = {
        name: 'Updated Product',
        piece_selling_price: 200,
      };
      const mockResponse = {
        data: { ...mockProduct, ...updates },
      };
      (api.put as jest.Mock).mockResolvedValue(mockResponse);

      const product = await productService.update(1, updates);

      expect(api.put).toHaveBeenCalledWith('/products/1', updates);
      expect(product).toEqual({ ...mockProduct, ...updates });
    });

    it('should handle partial updates', async () => {
      const updates: ProductUpdate = {
        stock: 75,
      };
      const mockResponse = {
        data: { ...mockProduct, stock: 75 },
      };
      (api.put as jest.Mock).mockResolvedValue(mockResponse);

      const product = await productService.update(1, updates);

      expect(product.stock).toBe(75);
    });
  });

  describe('delete', () => {
    it('should delete a product', async () => {
      const mockResponse = {
        data: { message: 'Product deleted' },
      };
      (api.delete as jest.Mock).mockResolvedValue(mockResponse);

      await productService.delete(1);

      expect(api.delete).toHaveBeenCalledWith('/products/1');
    });

    it('should handle product not found on delete', async () => {
      (api.delete as jest.Mock).mockRejectedValue(new Error('Product not found'));

      await expect(productService.delete(999)).rejects.toThrow('Product not found');
    });
  });
});
