import { useQuery } from '@tanstack/react-query'
import type { Product } from '@/types/product'
import { api, API_ENDPOINTS } from '@/lib/api'

export function useProducts () {
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.products.list)
      // Always return the array of products
      return response.data.data
    }
  })

  return {
    products: data || [],
    isLoading,
    error,
    refetch
  }
}
