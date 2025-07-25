import { useQuery } from "@tanstack/react-query";
import type { Product } from "@/types/product";
import { api, API_ENDPOINTS } from "@/lib/api";

export function useProducts() {
  const { data, isLoading, error, refetch } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.products.list);
      // Accept both { data: [...] } and [...] as valid responses
      if (Array.isArray(response.data)) return response.data;
      if (Array.isArray(response.data.data)) return response.data.data;
      return [];
    },
  });

  return {
    products: !isLoading && Array.isArray(data) ? data : [],
    isLoading,
    error,
    refetch,
  };
}
