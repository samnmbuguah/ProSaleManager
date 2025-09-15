import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { api, API_ENDPOINTS } from "@/lib/api";
import type { Product } from "@/types/product";

// Get user's favorites
export function useFavorites(isAuthenticated: boolean = false) {
  return useQuery<Product[]>({
    queryKey: ["favorites"],
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.favorites.list);
      return response.data.data;
    },
    enabled: isAuthenticated,
    retry: (failureCount, error: unknown) => {
      // Don't retry on 401 (Unauthorized) errors
      if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "status" in error.response &&
        error.response.status === 401
      ) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

// Check if a product is in favorites
export function useFavoriteStatus(productId: number, isAuthenticated: boolean = false) {
  return useQuery<{ isFavorite: boolean }>({
    queryKey: ["favorite-status", productId],
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.favorites.check(productId));
      return response.data.data;
    },
    enabled: !!productId && isAuthenticated,
    retry: (failureCount, error: unknown) => {
      // Don't retry on 401 (Unauthorized) errors
      if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "status" in error.response &&
        error.response.status === 401
      ) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

// Toggle favorite status
export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (productId: number) => {
      const response = await api.patch(API_ENDPOINTS.favorites.toggle(productId));
      return response.data;
    },
    onMutate: async (productId: number) => {
      await queryClient.cancelQueries({ queryKey: ["favorite-status", productId] });
      const previousStatus = queryClient.getQueryData<{ isFavorite: boolean }>([
        "favorite-status",
        productId,
      ]);

      // Optimistically update to the new value
      const nextIsFavorite = !previousStatus?.isFavorite;
      queryClient.setQueryData(["favorite-status", productId], { isFavorite: nextIsFavorite });

      return { previousStatus, productId };
    },
    onSuccess: (data, productId) => {
      // Update the favorite status for this product
      queryClient.setQueryData(["favorite-status", productId], data.data);

      // Update the favorites list
      queryClient.invalidateQueries({ queryKey: ["favorites"] });

      toast({
        title: "Success",
        description: data.message,
      });
    },
    onError: (
      error: unknown,
      _productId: number,
      context: { previousStatus?: { isFavorite: boolean }; productId: number } | undefined
    ) => {
      // Rollback optimistic update
      if (context?.previousStatus) {
        queryClient.setQueryData(["favorite-status", context.productId], context.previousStatus);
      }
      toast({
        variant: "destructive",
        title: "Error",
        description:
          (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Failed to update favorites",
      });
    },
  });
}

// Add to favorites
export function useAddToFavorites() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (productId: number) => {
      const response = await api.post(API_ENDPOINTS.favorites.add(productId));
      return response.data;
    },
    onMutate: async (productId: number) => {
      await queryClient.cancelQueries({ queryKey: ["favorite-status", productId] });
      const previousStatus = queryClient.getQueryData<{ isFavorite: boolean }>([
        "favorite-status",
        productId,
      ]);
      queryClient.setQueryData(["favorite-status", productId], { isFavorite: true });
      return { previousStatus, productId };
    },
    onSuccess: (data, productId) => {
      // Update the favorite status for this product
      queryClient.setQueryData(["favorite-status", productId], { isFavorite: true });

      // Update the favorites list
      queryClient.invalidateQueries({ queryKey: ["favorites"] });

      toast({
        title: "Success",
        description: data.message,
      });
    },
    onError: (
      error: unknown,
      _productId: number,
      context: { previousStatus?: { isFavorite: boolean }; productId: number } | undefined
    ) => {
      if (context?.previousStatus) {
        queryClient.setQueryData(["favorite-status", context.productId], context.previousStatus);
      }
      toast({
        variant: "destructive",
        title: "Error",
        description:
          (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Failed to add to favorites",
      });
    },
  });
}

// Remove from favorites
export function useRemoveFromFavorites() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (productId: number) => {
      const response = await api.delete(API_ENDPOINTS.favorites.remove(productId));
      return response.data;
    },
    onMutate: async (productId: number) => {
      await queryClient.cancelQueries({ queryKey: ["favorite-status", productId] });
      const previousStatus = queryClient.getQueryData<{ isFavorite: boolean }>([
        "favorite-status",
        productId,
      ]);
      queryClient.setQueryData(["favorite-status", productId], { isFavorite: false });
      return { previousStatus, productId };
    },
    onSuccess: (data, productId) => {
      // Update the favorite status for this product
      queryClient.setQueryData(["favorite-status", productId], { isFavorite: false });

      // Update the favorites list
      queryClient.invalidateQueries({ queryKey: ["favorites"] });

      toast({
        title: "Success",
        description: data.message,
      });
    },
    onError: (
      error: unknown,
      _productId: number,
      context: { previousStatus?: { isFavorite: boolean }; productId: number } | undefined
    ) => {
      if (context?.previousStatus) {
        queryClient.setQueryData(["favorite-status", context.productId], context.previousStatus);
      }
      toast({
        variant: "destructive",
        title: "Error",
        description:
          (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Failed to remove from favorites",
      });
    },
  });
}
