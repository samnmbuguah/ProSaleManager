import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import type { Supplier } from "@/types/supplier";
import { useStoreContext } from "@/contexts/StoreContext";

export function useSuppliersQuery() {
    const { currentStore, isLoading: isStoreLoading } = useStoreContext();

    return useQuery({
        queryKey: ["suppliers", currentStore?.id],
        queryFn: async () => {
            const headers = currentStore?.id ? { "x-store-id": currentStore.id.toString() } : {};
            const response = await api.get(API_ENDPOINTS.suppliers.list, { headers });
            return response.data.data as Supplier[];
        },
        enabled: !!currentStore && !isStoreLoading,
    });
}

export function useCreateSupplier() {
    const queryClient = useQueryClient();
    const { currentStore } = useStoreContext();

    return useMutation({
        mutationFn: async (data: Omit<Supplier, "id" | "createdAt" | "updatedAt">) => {
            const headers = currentStore?.id ? { "x-store-id": currentStore.id.toString() } : {};
            const response = await api.post(API_ENDPOINTS.suppliers.create, data, { headers });
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["suppliers", currentStore?.id] });
        },
    });
}

export function useUpdateSupplier() {
    const queryClient = useQueryClient();
    const { currentStore } = useStoreContext();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<Supplier> }) => {
            const headers = currentStore?.id ? { "x-store-id": currentStore.id.toString() } : {};
            const response = await api.put(API_ENDPOINTS.suppliers.update(id), data, { headers });
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["suppliers", currentStore?.id] });
        },
    });
}

export function useDeleteSupplier() {
    const queryClient = useQueryClient();
    const { currentStore } = useStoreContext();

    return useMutation({
        mutationFn: async (id: number) => {
            const headers = currentStore?.id ? { "x-store-id": currentStore.id.toString() } : {};
            await api.delete(API_ENDPOINTS.suppliers.delete(id), { headers });
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["suppliers", currentStore?.id] });
        },
    });
}
