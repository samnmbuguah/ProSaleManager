import { Expense } from '@/types/expense'
import { api } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/api-endpoints'

interface ExpenseResponse {
  expenses: Expense[]
}

interface CreateExpenseData {
  description: string
  amount: number
  date: string
  payment_method?: string
}

export const expenseService = {
  getAll: async (): Promise<Expense[]> => {
    const response = await api.get<ExpenseResponse>(API_ENDPOINTS.expenses.list)
    return response.data.expenses
  },

  create: async (data: CreateExpenseData): Promise<Expense> => {
    const response = await api.post(API_ENDPOINTS.expenses.create, {
      ...data,
      payment_method: data.payment_method || 'cash'
    })
    return response.data.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(API_ENDPOINTS.expenses.delete(id))
  }
}
