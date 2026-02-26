import React, { createContext, useContext } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Product } from "@/types/product";
import { Customer } from "@/types/customer";
import { api, API_ENDPOINTS } from "@/lib/api";
import { useStoreContext } from "@/contexts/StoreContext";
import { useAuth } from "@/hooks/use-auth";

interface StoreDataContextType {
    products: Product[];
    isLoadingProducts: boolean;
    productsError: unknown;
    refetchProducts: () => void;
    customers: Customer[];
    isLoadingCustomers: boolean;
    customersError: unknown;
    refetchCustomers: () => void;
    ensureWalkInCustomer: () => Promise<Customer | null>;
    setCustomers: (customers: Customer[]) => void;
}

const StoreDataContext = createContext<StoreDataContextType | undefined>(undefined);

export const StoreDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentStore, isLoading: isStoreLoading } = useStoreContext();
    const queryClient = useQueryClient();
    const { isAuthenticated } = useAuth();

    // Products Query
    const {
        data: products = [],
        isLoading: isLoadingProducts,
        error: productsError,
        refetch: refetchProducts,
    } = useQuery<Product[]>({
        queryKey: ["products", currentStore?.id],
        queryFn: async () => {
            console.log("[StoreData] Fetching products for store:", currentStore);
            // Explicitly pass x-store-id to avoid race conditions with global interceptor
            const headers = currentStore?.id ? { "x-store-id": currentStore.id.toString() } : {};
            console.log("[StoreData] Sending headers:", headers);
            const response = await api.get(`${API_ENDPOINTS.products.list}?limit=1000`, { headers });

            if (Array.isArray(response.data)) return response.data;
            if (Array.isArray(response.data.data)) return response.data.data;
            return [];
        },
        enabled: !!currentStore && isAuthenticated && !isStoreLoading,
    });

    // Customers Query
    const customersQueryKey = ["customers", currentStore?.id];
    const {
        data: customers = [],
        isLoading: isLoadingCustomers,
        error: customersError,
        refetch: refetchCustomers,
    } = useQuery<Customer[]>({
        queryKey: customersQueryKey,
        queryFn: async () => {
            let url = API_ENDPOINTS.customers.list;
            const userStr = localStorage.getItem("auth-storage");
            let isSuperAdmin = false;
            if (userStr) {
                try {
                    const parsed = JSON.parse(userStr);
                    if (parsed.state && parsed.state.user) {
                        isSuperAdmin = parsed.state.user.role === "super_admin";
                    }
                } catch {
                    // Ignore parsing errors
                }
            }

            // Explicitly pass header for customers too, cleaner than query param
            const headers = currentStore?.id ? { "x-store-id": currentStore.id.toString() } : {};

            // Keep query param logic if backend strictly requires it for superadmin filtering alongside header
            if (isSuperAdmin && currentStore?.id) {
                url += `?store_id=${currentStore.id}`;
            }

            const response = await api.get(url, { headers });
            return response.data.data || [];
        },
        enabled: !!currentStore && isAuthenticated && !isStoreLoading,
    });

    const ensureWalkInCustomer = async () => {
        const existingCustomers = queryClient.getQueryData<Customer[]>(customersQueryKey) || [];
        const walkInCustomer = existingCustomers.find((c) => c.name === "Walk-in Customer");

        if (walkInCustomer) {
            return walkInCustomer;
        }

        await queryClient.invalidateQueries({ queryKey: customersQueryKey });
        const freshCustomers = await queryClient.fetchQuery({ queryKey: customersQueryKey });
        return (freshCustomers as Customer[]).find((c) => c.name === "Walk-in Customer") || null;
    };

    const setCustomers = (newCustomers: Customer[]) => {
        queryClient.setQueryData(customersQueryKey, newCustomers);
    }

    return (
        <StoreDataContext.Provider
            value={{
                products,
                isLoadingProducts,
                productsError,
                refetchProducts,
                customers,
                isLoadingCustomers,
                customersError,
                refetchCustomers,
                ensureWalkInCustomer,
                setCustomers
            }}
        >
            {children}
        </StoreDataContext.Provider>
    );
};

export function useStoreData() {
    const ctx = useContext(StoreDataContext);
    if (!ctx) throw new Error("useStoreData must be used within StoreDataProvider");
    return ctx;
}
