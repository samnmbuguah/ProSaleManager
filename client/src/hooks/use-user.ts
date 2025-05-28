import { create } from "zustand";
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
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Login failed" }));
        throw new Error(errorData.message || "Login failed");
      }

      const data = await response.json();
      set({ user: data.data, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Login failed",
        isLoading: false,
      });
      throw error;
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Registration failed" }));
        throw new Error(errorData.message || "Registration failed");
      }

      const data = await response.json();
      set({ user: data.data, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Registration failed",
        isLoading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      set({ user: null, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Logout failed",
        isLoading: false,
      });
      throw error;
    }
  },

  checkSession: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        set({ user: data.data, isLoading: false });
      } else {
        set({ user: null, isLoading: false });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Session check failed",
        isLoading: false,
        user: null,
      });
    }
  },
}));
