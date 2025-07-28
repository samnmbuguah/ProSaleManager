import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useInventoryReport() {
  return useQuery({
    queryKey: ["inventory-report"],
    queryFn: async () => {
      const res = await api.get("/reports/inventory");
      return res.data.data;
    },
  });
}

export function useProductPerformanceReport(startDate?: Date, endDate?: Date, sortBy?: string) {
  return useQuery({
    queryKey: [
      "product-performance-report",
      startDate?.toISOString(),
      endDate?.toISOString(),
      sortBy,
    ],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate.toISOString();
      if (endDate) params.endDate = endDate.toISOString();
      if (sortBy) params.sortBy = sortBy;
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

export function useExpensesSummary() {
  return useQuery({
    queryKey: ["expenses-summary"],
    queryFn: async () => {
      const res = await api.get("/reports/expenses-summary");
      return res.data.data;
    },
  });
}
