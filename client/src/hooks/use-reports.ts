import { useQuery } from '@tanstack/react-query'
import { api, API_ENDPOINTS } from '@/lib/api'

export function useInventoryReport() {
  return useQuery({
    queryKey: ['reports', 'inventory'],
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.reports.inventory)
      return response.data.data
    }
  })
}

export function useProductPerformanceReport(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['reports', 'product-performance', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      
      const response = await api.get(`${API_ENDPOINTS.reports.productPerformance}?${params.toString()}`)
      return response.data.data
    }
  })
}

export function useSalesSummaryReport(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['reports', 'sales-summary', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      
      const response = await api.get(`${API_ENDPOINTS.reports.salesSummary}?${params.toString()}`)
      return response.data.data
    }
  })
} 