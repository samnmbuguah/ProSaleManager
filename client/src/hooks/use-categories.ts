import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, API_ENDPOINTS } from "@/lib/api";

export interface Category {
  id: number;
  name: string;
}

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.categories.list);
      return response.data.data;
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const response = await api.post(API_ENDPOINTS.categories.create, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}
