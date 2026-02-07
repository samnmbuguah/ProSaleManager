import { api } from './api';
import { Expense, InsertExpense } from '../types/expense';

export const expenseService = {
    getAll: async () => {
        const response = await api.get<Expense[]>('/expenses');
        return response.data;
    },

    create: async (data: InsertExpense) => {
        const response = await api.post<Expense>('/expenses', data);
        return response.data;
    },

    delete: async (id: number) => {
        await api.delete(`/expenses/${id}`);
    }
};
