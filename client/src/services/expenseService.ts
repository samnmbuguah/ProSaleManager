import { Expense } from "@/types/expense";
import { api } from "@/lib/api";

interface CreateExpenseData {
  description: string;
  amount: number;
  category: string;
  date: string;
}

export const expenseService = {
  getAll: async (): Promise<Expense[]> => {
    const response = await api.get("/expenses");
    return response.data;
  },

  create: async (data: CreateExpenseData): Promise<Expense> => {
    const response = await api.post("/expenses", data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/expenses/${id}`);
  },
}; 