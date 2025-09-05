import { useQuery } from "@tanstack/react-query";
import type { Product } from "@/types/product";
import { api, API_ENDPOINTS } from "@/lib/api";

export function useProducts() {
  const { data, isLoading, error, refetch } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      // Load all products by setting a high limit
      const response = await api.get(`${API_ENDPOINTS.products.list}?limit=1000`);
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
