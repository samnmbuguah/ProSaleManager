import { api } from './api';
import { Expense, ExpensesResponse, InsertExpense } from '../types/expense';

export const expenseService = {
    // The API paginates expenses: { expenses, total, totalPages, currentPage }
    getAll: async (page = 1, limit = 20) => {
        const response = await api.get<ExpensesResponse>('/expenses', {
            params: { page, limit },
        });
        return response.data;
    },

    create: async (data: InsertExpense) => {
        const response = await api.post<{ message: string; data: Expense }>('/expenses', data);
        return response.data.data;
    },

    delete: async (id: number) => {
        await api.delete(`/expenses/${id}`);
    }
};
