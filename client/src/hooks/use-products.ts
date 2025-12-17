import { useQuery } from "@tanstack/react-query";
import type { Product } from "@/types/product";
import { api, API_ENDPOINTS } from "@/lib/api";
import { useStoreContext } from "@/contexts/StoreContext";

export function useProducts() {
  const { currentStore } = useStoreContext();

  const { data, isLoading, error, refetch } = useQuery<Product[]>({
    queryKey: ["products", currentStore?.id],
    queryFn: async () => {
      // Load all products by setting a high limit
      // The interceptor in api.ts should attach the x-store-id header based on localStorage
      const response = await api.get(`${API_ENDPOINTS.products.list}?limit=1000`);

      // Accept both { data: [...] } and [...] as valid responses
      if (Array.isArray(response.data)) return response.data;
      if (Array.isArray(response.data.data)) return response.data.data;
      return [];
    },
    enabled: !!currentStore, // Only fetch when store is defined
  });

  return {
    products: !isLoading && Array.isArray(data) ? data : [],
    isLoading,
    error,
    refetch,
  };
}
