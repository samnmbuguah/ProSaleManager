import { categoryService } from '../categoryService';
import { api } from '../api';
import { Category } from '../../types/category';

jest.mock('../api');

const mockCategories: Category[] = [
  { id: 1, name: 'Beverages', description: 'Drinks', is_active: true },
  { id: 2, name: 'Snacks', description: 'Crisps and biscuits', is_active: true },
];

// The API wraps category payloads in { success, data }
const wrap = <T,>(data: T) => ({ data: { success: true, data } });

describe('Category Service (Mobile Admin)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all categories', async () => {
      (api.get as jest.Mock).mockResolvedValue(wrap(mockCategories));

      const categories = await categoryService.getAll();

      expect(api.get).toHaveBeenCalledWith('/categories');
      expect(categories).toEqual(mockCategories);
    });

    it('should handle an empty category list', async () => {
      (api.get as jest.Mock).mockResolvedValue(wrap([]));

      const categories = await categoryService.getAll();

      expect(categories).toEqual([]);
    });

    it('should handle API errors', async () => {
      (api.get as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(categoryService.getAll()).rejects.toThrow('Network error');
    });
  });
});
