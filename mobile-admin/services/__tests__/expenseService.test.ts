import { expenseService } from '../expenseService';
import { api } from '../api';
import { Expense, InsertExpense } from '../../types/expense';

jest.mock('../api');

const mockExpense: Expense = {
  id: 1,
  description: 'Delivery Fee',
  amount: 500,
  category: 'Delivery',
  date: '2026-04-11',
  created_at: '2026-04-11T10:00:00Z',
};

describe('Expense Service (Mobile Admin)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all expenses successfully', async () => {
      const mockResponse = {
        data: [mockExpense],
      };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const expenses = await expenseService.getAll();

      expect(api.get).toHaveBeenCalledWith('/expenses');
      expect(expenses).toEqual([mockExpense]);
    });

    it('should handle empty expenses list', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: [] });

      const expenses = await expenseService.getAll();

      expect(expenses).toEqual([]);
    });

    it('should handle API errors', async () => {
      (api.get as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(expenseService.getAll()).rejects.toThrow('Network error');
    });
  });

  describe('create', () => {
    it('should create a new expense', async () => {
      const newExpense: InsertExpense = {
        description: 'Marketing Campaign',
        amount: 1000,
        category: 'Marketing',
        date: '2026-04-11',
      };
      const mockResponse = {
        data: { ...newExpense, id: 2, created_at: '2026-04-11T10:00:00Z' },
      };
      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const expense = await expenseService.create(newExpense);

      expect(api.post).toHaveBeenCalledWith('/expenses', newExpense);
      expect(expense).toEqual({ ...newExpense, id: 2, created_at: '2026-04-11T10:00:00Z' });
    });

    it('should handle different expense categories', async () => {
      const categories = ['Lunch', 'Delivery', 'Marketing', 'New Stock', 'Transport', 'Salary', 'Other'];
      
      for (const category of categories) {
        const newExpense: InsertExpense = {
          description: `${category} Expense`,
          amount: 100,
          category: category as any,
          date: '2026-04-11',
        };
        (api.post as jest.Mock).mockResolvedValue({
          data: { ...newExpense, id: 1 },
        });

        const expense = await expenseService.create(newExpense);

        expect(expense.category).toBe(category);
      }
    });

    it('should handle validation errors', async () => {
      const invalidExpense: InsertExpense = {
        description: '',
        amount: -100,
        category: 'Other',
        date: '2026-04-11',
      };
      (api.post as jest.Mock).mockRejectedValue(new Error('Validation error'));

      await expect(expenseService.create(invalidExpense)).rejects.toThrow('Validation error');
    });
  });

  describe('delete', () => {
    it('should delete an expense', async () => {
      (api.delete as jest.Mock).mockResolvedValue({ data: { message: 'Deleted' } });

      await expenseService.delete(1);

      expect(api.delete).toHaveBeenCalledWith('/expenses/1');
    });

    it('should handle expense not found on delete', async () => {
      (api.delete as jest.Mock).mockRejectedValue(new Error('Expense not found'));

      await expect(expenseService.delete(999)).rejects.toThrow('Expense not found');
    });
  });
});
