import { Expense } from '@/types'
import { api } from '@/lib/api'

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
  getAll: async (): Promise<Expense[]> => {
    const response = await api.get<ExpenseResponse>('/api/expenses')
    return response.data.expenses
  },

  create: async (data: CreateExpenseData): Promise<Expense> => {
    const response = await api.post('/api/expenses', {
      ...data,
      payment_method: data.payment_method || 'cash'
    })
    return response.data.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/expenses/${id}`)
  }
}
