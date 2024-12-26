import type { LoyaltyPoints, LoyaltyTransaction } from "@/types/schema";
import { create } from "zustand";

interface LoyaltyState {
  points: LoyaltyPoints | null;
  transactions: LoyaltyTransaction[];
  isLoading: boolean;
  error: string | null;
  fetchPoints: (customerId: number) => Promise<void>;
  fetchTransactions: (customerId: number) => Promise<void>;
  addPoints: (customerId: number, points: number) => Promise<void>;
  redeemPoints: (customerId: number, points: number) => Promise<void>;
}

export const useLoyalty = create<LoyaltyState>((set) => ({
  points: null,
  transactions: [],
  isLoading: false,
  error: null,

  fetchPoints: async (customerId: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/loyalty/points/${customerId}`);
      if (!response.ok) throw new Error("Failed to fetch loyalty points");
      const points = await response.json();
      set({ points, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  fetchTransactions: async (customerId: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/loyalty/transactions/${customerId}`);
      if (!response.ok) throw new Error("Failed to fetch loyalty transactions");
      const transactions = await response.json();
      set({ transactions, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addPoints: async (customerId: number, points: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/loyalty/points/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, points }),
      });
      if (!response.ok) throw new Error("Failed to add loyalty points");
      const updatedPoints = await response.json();
      set((state) => ({
        points: updatedPoints,
        transactions: [updatedPoints, ...state.transactions],
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  redeemPoints: async (customerId: number, points: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/loyalty/points/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, points }),
      });
      if (!response.ok) throw new Error("Failed to redeem loyalty points");
      const updatedPoints = await response.json();
      set((state) => ({
        points: updatedPoints,
        transactions: [updatedPoints, ...state.transactions],
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
}));
