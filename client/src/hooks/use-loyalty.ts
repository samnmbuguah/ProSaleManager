import type { LoyaltyPoints, LoyaltyTransaction } from "@/types/schema";
import { create } from "zustand";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { api } from "@/lib/api";

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
      const response = await api.get(API_ENDPOINTS.loyalty.points(customerId));
      const points = response.data;
      set({ points, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  fetchTransactions: async (customerId: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(API_ENDPOINTS.loyalty.transactions(customerId));
      const transactions = response.data;
      set({ transactions, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addPoints: async (customerId: number, points: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(API_ENDPOINTS.loyalty.addPoints, { customerId, points });
      const updatedPoints = response.data;
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
      const response = await api.post(API_ENDPOINTS.loyalty.redeemPoints, { customerId, points });
      const updatedPoints = response.data;
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
