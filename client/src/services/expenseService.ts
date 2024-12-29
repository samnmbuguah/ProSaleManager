import { Expense } from "@/types/expense";
import { api } from "@/lib/api";

interface CreateExpenseData {
  description: string;
  amount: number;
  category: string;
  date: string;
  payment_method?: string;
  user_id: number;
}

interface ExpenseResponse {
  expenses: Expense[];
  totalPages: number;
  currentPage: number;
  totalItems: number;
}

export const expenseService = {
  getAll: async (): Promise<Expense[]> => {
    const response = await api.get<ExpenseResponse>("/expenses");
    return response.data.expenses;
  },

  create: async (data: CreateExpenseData): Promise<Expense> => {
    const response = await api.post("/expenses", {
      ...data,
      payment_method: data.payment_method || 'cash'
    });
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/expenses/${id}`);
  },
}; 