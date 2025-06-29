import { create } from "zustand";
import { api } from "@/lib/api";
import type { User, InsertUser } from "@/types/schema";

interface UserState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (userData: InsertUser) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useUser = create<UserState>((set) => ({
  user: null,
  isLoading: false,
  error: null,
  setUser: (user) => set({ user }),

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post("/api/auth/login", credentials);
      set({ user: response.data.data, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Login failed",
        isLoading: false,
      });
      throw error;
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post("/api/auth/register", userData);
      set({ user: response.data.data, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Registration failed",
        isLoading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await api.post("/api/auth/logout");
      set({ user: null, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Logout failed",
        isLoading: false,
      });
      throw error;
    }
  },

  checkSession: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get("/api/auth/me");
      set({ user: response.data.data, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Session check failed",
        isLoading: false,
        user: null,
      });
    }
  },
}));
