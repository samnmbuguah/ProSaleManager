export type ExpenseCategory =
  | 'Food'
  | 'Transportation'
  | 'Housing'
  | 'Utilities'
  | 'Entertainment'
  | 'Other';

export interface Expense {
  id: number;
  description: string;
  amount: number;
  category: string;
  date: string;
  payment_method: string;
  user_id: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    name: string;
  };
}
