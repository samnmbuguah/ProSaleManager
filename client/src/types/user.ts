export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: "super_admin" | "admin" | "manager" | "sales" | "client";
  store_id?: number | null;
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
  register: (data: { name: string; email: string; password: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export type AppRole = "admin" | "manager" | "user" | "super_admin" | "sales" | "client";
