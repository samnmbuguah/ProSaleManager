import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { Sale, CreateSaleRequest } from "@/types/sale";
import { useStoreContext } from "@/contexts/StoreContext";

interface SalesPaginationState {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

export function useSalesQuery(page: number = 1, pageSize: number = 10) {
    const { currentStore, isLoading: isStoreLoading } = useStoreContext();

    const {
        data,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ["sales", currentStore?.id, page, pageSize],
        queryFn: async () => {
            const headers = currentStore?.id ? { "x-store-id": currentStore.id.toString() } : {};
            const response = await api.get(`${API_ENDPOINTS.sales.list}?page=${page}&pageSize=${pageSize}`, { headers });
            return {
                sales: response.data.sales as Sale[],
                pagination: {
                    page,
                    pageSize,
                    total: response.data.total,
                    totalPages: Math.ceil(response.data.total / pageSize),
                } as SalesPaginationState,
            };
        },
        enabled: !!currentStore && !isStoreLoading,
    });

    return {
        sales: data?.sales || [],
        pagination: data?.pagination || { page: 1, pageSize: 10, total: 0, totalPages: 0 },
        isLoading,
        error,
        refetch,
    };
}

export function useOrdersQuery(page: number = 1, pageSize: number = 10) {
    const { currentStore, isLoading: isStoreLoading } = useStoreContext();

    const {
        data,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ["orders", currentStore?.id, page, pageSize],
        queryFn: async () => {
            const headers = currentStore?.id ? { "x-store-id": currentStore.id.toString() } : {};
            const response = await api.get(`${API_ENDPOINTS.orders.list}?page=${page}&pageSize=${pageSize}`, { headers });
            return {
                orders: response.data.orders || [],
                pagination: {
                    page,
                    pageSize,
                    total: response.data.total || 0,
                    totalPages: Math.ceil((response.data.total || 0) / pageSize),
                } as SalesPaginationState,
            };
        },
        enabled: !!currentStore && !isStoreLoading,
    });

    return {
        orders: data?.orders || [],
        pagination: data?.pagination || { page: 1, pageSize: 10, total: 0, totalPages: 0 },
        isLoading,
        error,
        refetch,
    };
}

export function useCreateSale() {
    const queryClient = useQueryClient();
    const { currentStore } = useStoreContext();

    return useMutation({
        mutationFn: async (saleData: CreateSaleRequest) => {
            const headers = currentStore?.id ? { "x-store-id": currentStore.id.toString() } : {};
            const response = await api.post(API_ENDPOINTS.sales.create, saleData, { headers });
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sales", currentStore?.id] });
            // Also invalidate products as stock may have changed
            queryClient.invalidateQueries({ queryKey: ["products", currentStore?.id] });
        },
    });
}

export function useUpdateSale() {
    const queryClient = useQueryClient();
    const { currentStore } = useStoreContext();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<Sale> }) => {
            const headers = currentStore?.id ? { "x-store-id": currentStore.id.toString() } : {};
            const response = await api.put(API_ENDPOINTS.sales.update(id), data, { headers });
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sales", currentStore?.id] });
        },
    });
}

export function useDeleteSale() {
    const queryClient = useQueryClient();
    const { currentStore } = useStoreContext();

    return useMutation({
        mutationFn: async (id: number) => {
            const headers = currentStore?.id ? { "x-store-id": currentStore.id.toString() } : {};
            await api.delete(API_ENDPOINTS.sales.delete(id), { headers });
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sales", currentStore?.id] });
            // Also invalidate products as stock may have been restored
            queryClient.invalidateQueries({ queryKey: ["products", currentStore?.id] });
        },
    });
}

export function useUpdateOrder() {
    const queryClient = useQueryClient();
    const { currentStore } = useStoreContext();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: { status: string; payment_status?: string } }) => {
            const headers = currentStore?.id ? { "x-store-id": currentStore.id.toString() } : {};
            const response = await api.put(`/orders/${id}`, data, { headers });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["orders", currentStore?.id] });
        },
    });
}

// Local state hook for UI state
export function useSalesUIState() {
    const [tab, setTab] = useState<"sales" | "orders">("sales");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const [receiptSettingsOpen, setReceiptSettingsOpen] = useState(false);
    const [viewReceiptOpen, setViewReceiptOpen] = useState(false);
    const [saleForReceipt, setSaleForReceipt] = useState<number | null>(null);

    return {
        tab,
        setTab,
        currentPage,
        setCurrentPage,
        selectedSale,
        setSelectedSale,
        selectedOrder,
        setSelectedOrder,
        receiptSettingsOpen,
        setReceiptSettingsOpen,
        viewReceiptOpen,
        setViewReceiptOpen,
        saleForReceipt,
        setSaleForReceipt,
    };
}
