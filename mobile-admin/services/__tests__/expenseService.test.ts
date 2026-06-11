import { expenseService } from '../expenseService';
import { api } from '../api';
import { Expense, ExpensesResponse, InsertExpense } from '../../types/expense';

jest.mock('../api');

const mockExpense: Expense = {
  id: 1,
  description: 'Delivery Fee',
  amount: 500,
  category: 'Delivery',
  date: '2026-04-11',
  payment_method: 'Cash',
  user_id: 1,
  created_at: '2026-04-11T10:00:00Z',
};

const mockListResponse: ExpensesResponse = {
  expenses: [mockExpense],
  total: 1,
  totalPages: 1,
  currentPage: 1,
};

describe('Expense Service (Mobile Admin)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch paginated expenses successfully', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: mockListResponse });

      const result = await expenseService.getAll();

      expect(api.get).toHaveBeenCalledWith('/expenses', { params: { page: 1, limit: 20 } });
      expect(result.expenses).toEqual([mockExpense]);
      expect(result.total).toBe(1);
    });

    it('should pass custom pagination params', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: mockListResponse });

      await expenseService.getAll(3, 50);

      expect(api.get).toHaveBeenCalledWith('/expenses', { params: { page: 3, limit: 50 } });
    });

    it('should handle empty expenses list', async () => {
      (api.get as jest.Mock).mockResolvedValue({
        data: { expenses: [], total: 0, totalPages: 0, currentPage: 1 },
      });

      const result = await expenseService.getAll();

      expect(result.expenses).toEqual([]);
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
        payment_method: 'Cash',
        date: '2026-04-11',
      };
      const created = { ...newExpense, id: 2, user_id: 1, created_at: '2026-04-11T10:00:00Z' };
      (api.post as jest.Mock).mockResolvedValue({
        data: { message: 'Expense created successfully', data: created },
      });

      const expense = await expenseService.create(newExpense);

      expect(api.post).toHaveBeenCalledWith('/expenses', newExpense);
      expect(expense).toEqual(created);
    });

    it('should handle different expense categories', async () => {
      const categories = ['Lunch', 'Delivery', 'Marketing', 'New Stock', 'Transport', 'Salary', 'Other'];

      for (const category of categories) {
        const newExpense: InsertExpense = {
          description: `${category} Expense`,
          amount: 100,
          category: category as Expense['category'],
          payment_method: 'Cash',
          date: '2026-04-11',
        };
        (api.post as jest.Mock).mockResolvedValue({
          data: { message: 'Expense created successfully', data: { ...newExpense, id: 1, user_id: 1 } },
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
        payment_method: 'Cash',
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
