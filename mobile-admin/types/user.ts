export type AppRole = "super_admin" | "admin" | "manager" | "sales" | "client";

export interface User {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    role: AppRole;
    store_id?: number | null;
    is_active: boolean;
    last_login?: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface InsertUser {
    email: string;
    name: string;
    password: string;
    phone?: string;
    role?: AppRole;
}
