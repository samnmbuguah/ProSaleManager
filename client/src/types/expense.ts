export type ExpenseCategory =
  | "Lunch"
  | "Delivery"
  | "Marketing"
  | "New Stock"
  | "Transport"
  | "Salary"
  | "Other";

export interface Expense {
  id: number;
  description: string;
  amount: number;
  category: string;
  date: string;
  payment_method: string;
  user_id: number;
  store_id?: number;  // Set server-side
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    name: string;
  };
}
