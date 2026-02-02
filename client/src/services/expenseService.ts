import { Expense } from "@/types/expense";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api-endpoints";

interface ExpenseResponse {
  expenses: Expense[];
}

interface CreateExpenseData {
  description: string;
  amount: number;
  date: string;
  payment_method?: string;
}

export const expenseService = {
  getAll: async (storeId?: number, filters?: { start_date?: string; end_date?: string }): Promise<Expense[]> => {
    const headers = storeId ? { "x-store-id": storeId.toString() } : {};
    const params = new URLSearchParams();
    if (filters?.start_date) params.append("start_date", filters.start_date);
    if (filters?.end_date) params.append("end_date", filters.end_date);

    const response = await api.get<ExpenseResponse>(`${API_ENDPOINTS.expenses.list}?${params.toString()}`, { headers });
    return response.data.expenses;
  },

  create: async (data: CreateExpenseData, storeId?: number): Promise<Expense> => {
    const headers = storeId ? { "x-store-id": storeId.toString() } : {};
    const response = await api.post(API_ENDPOINTS.expenses.create, {
      ...data,
      payment_method: data.payment_method || "cash",
    }, { headers });
    return response.data.data;
  },

  delete: async (id: number, storeId?: number): Promise<void> => {
    const headers = storeId ? { "x-store-id": storeId.toString() } : {};
    await api.delete(API_ENDPOINTS.expenses.delete(id), { headers });
  },
};
