export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: "super_admin" | "admin" | "manager" | "sales" | "client";
  store_id?: number | null;
  is_active: boolean;
  last_login?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export type AppRole = "super_admin" | "admin" | "manager" | "sales" | "client";

export interface InsertUser {
  email: string;
  name: string;
  password: string;
  phone?: string;
  role?: AppRole;
}
