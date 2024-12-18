export type ExpenseCategory =
  | "Food"
  | "Transportation"
  | "Housing"
  | "Utilities"
  | "Entertainment"
  | "Other";

export interface Expense {
  id: number;
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
} 