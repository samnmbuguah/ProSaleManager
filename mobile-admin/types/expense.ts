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
