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

export function useProductPerformanceReport() {
  return useQuery({
    queryKey: ["product-performance-report"],
    queryFn: async () => {
      const res = await api.get("/reports/product-performance");
      return res.data.data;
    },
  });
}

export function useSalesSummary() {
  return useQuery({
    queryKey: ["sales-summary"],
    queryFn: async () => {
      const res = await api.get("/reports/sales-summary");
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
