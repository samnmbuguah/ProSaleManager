import { useState, useCallback } from 'react'
import { Product } from '@/types/product'
import { api } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/api-endpoints'

export function useProducts () {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.get(API_ENDPOINTS.products.list)
      setProducts(response.data.data)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { products, isLoading, error, fetchProducts, setProducts }
}
