import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { Product } from "@/types/product";
import type { ProductFormData } from "@/types/product";
import { useStoreContext } from "@/contexts/StoreContext";

export interface ProductFilters {
    categoryId: number | null;
    stockStatus: "all" | "in-stock" | "low-stock" | "out-of-stock";
    priceRange: {
        min: number | null;
        max: number | null;
    };
    quantityRange: {
        min: number | null;
        max: number | null;
    };
    isActive: boolean | null;
    stockUnit: "all" | "piece" | "pack" | "dozen";
}

const initialFilters: ProductFilters = {
    categoryId: null,
    stockStatus: "all",
    priceRange: { min: null, max: null },
    quantityRange: { min: null, max: null },
    isActive: null,
    stockUnit: "all",
};

interface PaginationState {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export function useProductsQuery(page: number = 1, limit: number = 100) {
    const { currentStore, isLoading: isStoreLoading } = useStoreContext();

    const {
        data,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ["products", currentStore?.id, page, limit],
        queryFn: async () => {
            const headers = currentStore?.id ? { "x-store-id": currentStore.id.toString() } : {};
            const response = await api.get(`${API_ENDPOINTS.products.list}?page=${page}&limit=${limit}`, { headers });
            return {
                products: response.data.data as Product[],
                pagination: response.data.pagination as PaginationState,
            };
        },
        enabled: !!currentStore && !isStoreLoading,
    });

    return {
        products: data?.products || [],
        pagination: data?.pagination || { page: 1, limit: 100, total: 0, totalPages: 0 },
        isLoading,
        error,
        refetch,
    };
}

export function useSearchProducts() {
    const { currentStore: _currentStore } = useStoreContext();

    return useMutation({
        mutationFn: async (query: string) => {
            // Note: Search relies on global store context usually, but if we have access to currentStore 
            // from UseStoreContext in the component calling this, we could pass it.
            // Since this is a mutation, we can rely on the interceptor OR pass it if we lift state.
            // The search hook normally runs in valid store context.
            // However, to be safe, let's grab it here too if we can, but hooks rules apply.
            // _currentStore is available in closure.
            const headers = _currentStore?.id ? { "x-store-id": _currentStore.id.toString() } : {};
            const response = await api.get(API_ENDPOINTS.products.search(query), { headers });
            return response.data.data as Product[];
        },
    });
}

export function useUpdateProduct() {
    const queryClient = useQueryClient();
    const { currentStore } = useStoreContext();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<ProductFormData> }) => {
            const headers = currentStore?.id ? { "x-store-id": currentStore.id.toString() } : {};
            const response = await api.put(API_ENDPOINTS.products.update(id), data, { headers });
            return response.data.data;
        },
        onSuccess: () => {
            // Invalidate products query to refetch
            queryClient.invalidateQueries({ queryKey: ["products", currentStore?.id] });
        },
    });
}

export function useCreateProduct() {
    const queryClient = useQueryClient();
    const { currentStore } = useStoreContext();

    return useMutation({
        mutationFn: async (data: ProductFormData | FormData) => {
            const headers = {
                ...(currentStore?.id ? { "x-store-id": currentStore.id.toString() } : {}),
                ...(data instanceof FormData ? { "Content-Type": "multipart/form-data" } : {}),
            };
            const response = await api.post(API_ENDPOINTS.products.create, data, { headers });
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products", currentStore?.id] });
        },
    });
}

export function useDeleteProduct() {
    const queryClient = useQueryClient();
    const { currentStore } = useStoreContext();

    return useMutation({
        mutationFn: async (id: number) => {
            const headers = currentStore?.id ? { "x-store-id": currentStore.id.toString() } : {};
            await api.delete(API_ENDPOINTS.products.delete(id), { headers });
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products", currentStore?.id] });
        },
    });
}

// Local state hook for filters and UI state (not server state)
export function useProductsUIState() {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("products");
    const [filters, setFilters] = useState<ProductFilters>(initialFilters);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(100);

    const clearFilters = () => {
        setFilters(initialFilters);
        setPage(1);
    };

    const updateFilters = (newFilters: Partial<ProductFilters>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        setPage(1);
    };

    return {
        // Dialog state
        isAddDialogOpen,
        setIsAddDialogOpen,
        isEditDialogOpen,
        setIsEditDialogOpen,
        selectedProduct,
        setSelectedProduct,
        // Search
        searchQuery,
        setSearchQuery,
        // Tabs
        activeTab,
        setActiveTab,
        // Filters
        filters,
        setFilters: updateFilters,
        clearFilters,
        // Pagination
        page,
        setPage,
        limit,
        setLimit: (newLimit: number) => {
            setLimit(newLimit);
            setPage(1);
        },
    };
}
