import { favoritesService } from '../favoritesService';
import { api } from '../api';
import { Product } from '../../types/product';

jest.mock('../api');

const mockProduct: Product = {
  id: 1,
  name: 'Test Product',
  piece_selling_price: 100,
} as Product;

describe('Favorites Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getFavorites', () => {
    it('should fetch favorite products successfully', async () => {
      const mockResponse = {
        data: {
          data: [mockProduct],
        },
      };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const favorites = await favoritesService.getFavorites();

      expect(api.get).toHaveBeenCalledWith('/favorites');
      expect(favorites).toEqual([mockProduct]);
    });

    it('should handle empty favorites list', async () => {
      const mockResponse = {
        data: {
          data: [],
        },
      };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const favorites = await favoritesService.getFavorites();

      expect(favorites).toEqual([]);
    });

    it('should handle API errors', async () => {
      (api.get as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(favoritesService.getFavorites()).rejects.toThrow('Network error');
    });
  });

  describe('checkFavoriteStatus', () => {
    it('should check if product is favorite', async () => {
      const mockResponse = {
        data: {
          data: { isFavorite: true },
        },
      };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const status = await favoritesService.checkFavoriteStatus(1);

      expect(api.get).toHaveBeenCalledWith('/favorites/check/1');
      expect(status).toEqual({ isFavorite: true });
    });

    it('should handle non-favorite status', async () => {
      const mockResponse = {
        data: {
          data: { isFavorite: false },
        },
      };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const status = await favoritesService.checkFavoriteStatus(1);

      expect(status).toEqual({ isFavorite: false });
    });
  });

  describe('toggleFavorite', () => {
    it('should toggle favorite status', async () => {
      const mockResponse = {
        data: {
          message: 'Favorite toggled',
          data: { isFavorite: true },
        },
      };
      (api.patch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await favoritesService.toggleFavorite(1);

      expect(api.patch).toHaveBeenCalledWith('/favorites/1/toggle');
      expect(result).toEqual(mockResponse);
    });

    it('should handle toggle to non-favorite', async () => {
      const mockResponse = {
        data: {
          message: 'Favorite toggled',
          data: { isFavorite: false },
        },
      };
      (api.patch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await favoritesService.toggleFavorite(1);

      expect(result.data.isFavorite).toBe(false);
    });

    it('should handle API errors', async () => {
      (api.patch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(favoritesService.toggleFavorite(1)).rejects.toThrow('Network error');
    });
  });
});
