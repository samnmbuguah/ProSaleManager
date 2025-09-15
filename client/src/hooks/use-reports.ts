import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useInventoryReport(filters?: {
  search?: string;
  category?: string;
  stockStatus?: string;
  minPrice?: number;
  maxPrice?: number;
  startDate?: Date;
  endDate?: Date;
}) {
  return useQuery({
    queryKey: ["inventory-report", filters],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters?.search) params.search = filters.search;
      if (filters?.category && filters.category !== "all") params.category = filters.category;
      if (filters?.stockStatus && filters.stockStatus !== "all") params.stockStatus = filters.stockStatus;
      if (filters?.minPrice) params.minPrice = filters.minPrice.toString();
      if (filters?.maxPrice) params.maxPrice = filters.maxPrice.toString();
      if (filters?.startDate) params.startDate = filters.startDate.toISOString();
      if (filters?.endDate) params.endDate = filters.endDate.toISOString();

      const res = await api.get("/reports/inventory", { params });
      return res.data.data;
    },
  });
}

export function useProductPerformanceReport(filters?: {
  startDate?: Date;
  endDate?: Date;
  sortBy?: string;
  category?: string;
  paymentMethod?: string;
  minPrice?: number;
  maxPrice?: number;
}) {
  return useQuery({
    queryKey: [
      "product-performance-report",
      filters?.startDate?.toISOString(),
      filters?.endDate?.toISOString(),
      filters?.sortBy,
      filters?.category,
      filters?.paymentMethod,
      filters?.minPrice,
      filters?.maxPrice,
    ],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters?.startDate) params.startDate = filters.startDate.toISOString();
      if (filters?.endDate) params.endDate = filters.endDate.toISOString();
      if (filters?.sortBy) params.sortBy = filters.sortBy;
      if (filters?.category && filters.category !== "all") params.category = filters.category;
      if (filters?.paymentMethod && filters.paymentMethod !== "all") params.paymentMethod = filters.paymentMethod;
      if (filters?.minPrice) params.minPrice = filters.minPrice.toString();
      if (filters?.maxPrice) params.maxPrice = filters.maxPrice.toString();

      const res = await api.get("/reports/product-performance", { params });
      return res.data.data;
    },
  });
}

export function useSalesSummary(period?: string) {
  return useQuery({
    queryKey: ["sales-summary", period],
    queryFn: async () => {
      const params = period ? { period } : {};
      const res = await api.get("/reports/sales-summary", { params });
      return res.data.data;
    },
  });
}

export function useExpensesSummary(filters?: {
  startDate?: Date;
  endDate?: Date;
  category?: string;
  paymentMethod?: string;
}) {
  return useQuery({
    queryKey: ["expenses-summary", filters],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters?.startDate) params.startDate = filters.startDate.toISOString();
      if (filters?.endDate) params.endDate = filters.endDate.toISOString();
      if (filters?.category && filters.category !== "all") params.category = filters.category;
      if (filters?.paymentMethod && filters.paymentMethod !== "all") params.paymentMethod = filters.paymentMethod;

      const res = await api.get("/reports/expenses-summary", { params });
      return res.data.data;
    },
  });
}
