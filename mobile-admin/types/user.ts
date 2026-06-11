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

// Roles that can be assigned from the admin app (the API rejects others on update)
export const ASSIGNABLE_ROLES = ["admin", "manager", "sales"] as const;

export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export interface InsertUser {
    email: string;
    name: string;
    password: string;
    phone?: string;
    role?: AppRole;
    store_id?: number | null;
}

export interface UpdateUser {
    name?: string;
    email?: string;
    role?: AppRole;
    store_id?: number | null;
    is_active?: boolean;
}

export interface UpdateProfile {
    name?: string;
    email?: string;
}

export interface ChangePassword {
    currentPassword: string;
    newPassword: string;
}
