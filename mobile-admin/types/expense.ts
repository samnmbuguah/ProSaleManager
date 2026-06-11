export const EXPENSE_CATEGORIES = [
    "Lunch",
    "Delivery",
    "Marketing",
    "New Stock",
    "Transport",
    "Salary",
    "Other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_PAYMENT_METHODS = ["Cash", "Card", "Mobile Money", "Other"] as const;

export type ExpensePaymentMethod = (typeof EXPENSE_PAYMENT_METHODS)[number];

export interface Expense {
    id: number;
    description: string;
    amount: number;
    category: ExpenseCategory;
    date: string;
    payment_method: string;
    user_id: number;
    store_id?: number;
    created_at?: string;
    user?: {
        id: number;
        name: string;
    };
}

export interface InsertExpense {
    description: string;
    amount: number;
    category: ExpenseCategory;
    payment_method: string;
    date?: string;
}

export interface ExpensesResponse {
    expenses: Expense[];
    total: number;
    totalPages: number;
    currentPage: number;
}
