import { useQuery } from '@tanstack/react-query';
import { api, API_ENDPOINTS } from '@/lib/api';

export interface Category {
  id: number;
  name: string;
}

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.categories.list);
      return response.data;
    },
  });
} 