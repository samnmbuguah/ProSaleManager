import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Product } from "@/types/product";

interface UseLowStockProductsProps {
  threshold: number;
  enabled?: boolean;
}

export function useLowStockProducts({ threshold, enabled = true }: UseLowStockProductsProps) {
  return useQuery({
    queryKey: ["low-stock-products", threshold],
    queryFn: async (): Promise<Product[]> => {
      const response = await api.get(`/products/low-stock?threshold=${threshold}`);
      return response.data.data;
    },
    enabled: enabled && threshold > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for manually fetching low stock products
export function useFetchLowStockProducts() {
  const fetchLowStockProducts = async (threshold: number): Promise<Product[]> => {
    const response = await api.get(`/products/low-stock?threshold=${threshold}`);
    return response.data.data;
  };

  return { fetchLowStockProducts };
}
