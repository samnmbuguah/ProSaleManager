import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useStoreContext } from "@/contexts/StoreContext";

export function useInventoryReport(filters?: {
  search?: string;
  category?: string;
  stockStatus?: string;
  minPrice?: number;
  maxPrice?: number;
  startDate?: Date;
  endDate?: Date;
}) {
  const { currentStore, isLoading: isStoreLoading } = useStoreContext();

  return useQuery({
    queryKey: ["inventory-report", currentStore?.id, filters],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters?.search) params.search = filters.search;
      if (filters?.category && filters.category !== "all") params.category = filters.category;
      if (filters?.stockStatus && filters.stockStatus !== "all") params.stockStatus = filters.stockStatus;
      if (filters?.minPrice) params.minPrice = filters.minPrice.toString();
      if (filters?.maxPrice) params.maxPrice = filters.maxPrice.toString();
      if (filters?.startDate) params.startDate = filters.startDate.toISOString();
      if (filters?.endDate) params.endDate = filters.endDate.toISOString();

      const headers = currentStore?.id ? { "x-store-id": currentStore.id.toString() } : {};
      const res = await api.get("/reports/inventory", { params, headers });
      return res.data.data;
    },
    enabled: !!currentStore && !isStoreLoading,
    staleTime: 60_000,
    gcTime: 300_000,
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
  const { currentStore, isLoading: isStoreLoading } = useStoreContext();

  return useQuery({
    queryKey: [
      "product-performance-report",
      currentStore?.id,
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

      const headers = currentStore?.id ? { "x-store-id": currentStore.id.toString() } : {};
      const res = await api.get("/reports/product-performance", { params, headers });
      return res.data.data;
    },
    enabled: !!currentStore && !isStoreLoading,
    staleTime: 60_000,
    gcTime: 300_000,
  });
}

export function useSalesSummary(
  period?: string,
  filters?: { startDate?: Date; endDate?: Date }
) {
  const { currentStore, isLoading: isStoreLoading } = useStoreContext();

  return useQuery({
    queryKey: ["sales-summary", currentStore?.id, period, filters?.startDate?.toISOString(), filters?.endDate?.toISOString()],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (period) params.period = period;
      if (filters?.startDate) params.startDate = filters.startDate.toISOString();
      if (filters?.endDate) params.endDate = filters.endDate.toISOString();

      const headers = currentStore?.id ? { "x-store-id": currentStore.id.toString() } : {};
      const res = await api.get("/reports/sales-summary", { params, headers });
      return res.data.data;
    },
    enabled: !!currentStore && !isStoreLoading,
    staleTime: 30_000,
    gcTime: 180_000,
  });
}

export function useCategoryPerformance(filters?: {
  startDate?: Date;
  endDate?: Date;
}) {
  const { currentStore, isLoading: isStoreLoading } = useStoreContext();

  return useQuery({
    queryKey: ["category-performance", currentStore?.id, filters?.startDate?.toISOString(), filters?.endDate?.toISOString()],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters?.startDate) params.startDate = filters.startDate.toISOString();
      if (filters?.endDate) params.endDate = filters.endDate.toISOString();

      const headers = currentStore?.id ? { "x-store-id": currentStore.id.toString() } : {};
      const res = await api.get("/reports/category-performance", { params, headers });
      return res.data.data;
    },
    enabled: !!currentStore && !isStoreLoading,
    staleTime: 60_000,
    gcTime: 300_000,
  });
}

export function useExpensesSummary(filters?: {
  startDate?: Date;
  endDate?: Date;
  category?: string;
  paymentMethod?: string;
}) {
  const { currentStore, isLoading: isStoreLoading } = useStoreContext();

  return useQuery({
    queryKey: ["expenses-summary", currentStore?.id, filters?.startDate?.toISOString(), filters?.endDate?.toISOString(), filters?.category, filters?.paymentMethod],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters?.startDate) params.startDate = filters.startDate.toISOString();
      if (filters?.endDate) params.endDate = filters.endDate.toISOString();
      if (filters?.category && filters.category !== "all") params.category = filters.category;
      if (filters?.paymentMethod && filters.paymentMethod !== "all") params.paymentMethod = filters.paymentMethod;

      const headers = currentStore?.id ? { "x-store-id": currentStore.id.toString() } : {};
      const res = await api.get("/reports/expenses-summary", { params, headers });
      return res.data.data;
    },
    enabled: !!currentStore && !isStoreLoading,
    staleTime: 30_000,
    gcTime: 180_000,
  });
}

import { stockService } from "@/services/stockService";

export function useStockValueReport(filters?: {
  startDate?: Date;
  endDate?: Date;
}) {
  const { currentStore, isLoading: isStoreLoading } = useStoreContext();

  return useQuery({
    queryKey: ["stock-value-report", currentStore?.id, filters?.startDate?.toISOString(), filters?.endDate?.toISOString()],
    queryFn: async () => {
      const apiFilters = {
        start_date: filters?.startDate?.toISOString(),
        end_date: filters?.endDate?.toISOString()
      };
      return stockService.getValueReport(currentStore?.id, apiFilters);
    },
    enabled: !!currentStore && !isStoreLoading,
  });
}

export function useSalesHistory(filters?: {
  startDate?: Date;
  endDate?: Date;
  customerId?: string;
  userId?: string;
  paymentMethod?: string;
}) {
  const { currentStore, isLoading: isStoreLoading } = useStoreContext();

  return useQuery({
    queryKey: ["sales-history", currentStore?.id, filters],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters?.startDate) params.startDate = filters.startDate.toISOString();
      if (filters?.endDate) params.endDate = filters.endDate.toISOString();
      if (filters?.customerId && filters.customerId !== "all") params.customerId = filters.customerId;
      if (filters?.userId && filters.userId !== "all") params.userId = filters.userId;
      if (filters?.paymentMethod && filters.paymentMethod !== "all") params.paymentMethod = filters.paymentMethod;

      const headers = currentStore?.id ? { "x-store-id": currentStore.id.toString() } : {};
      const res = await api.get("/reports/sales-history", { params, headers });
      return res.data.data;
    },
    enabled: !!currentStore && !isStoreLoading,
    staleTime: 60_000,
  });
}

