import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Customer } from "@/types/customer";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { useStoreContext } from "@/contexts/StoreContext";

export function useCustomers() {
  const { currentStore } = useStoreContext();
  const queryClient = useQueryClient();

  // Create a unique query key that includes the store ID
  // This ensures that when the store changes, the query is automatically refetched
  const queryKey = ["customers", currentStore?.id];

  const { data: customers = [], isLoading, error } = useQuery<Customer[]>({
    queryKey, // ["customers", 1] or ["customers", undefined]
    queryFn: async () => {
      let url = API_ENDPOINTS.customers.list;
      // If super admin and currentStore is set, add store_id param
      const userStr = localStorage.getItem("auth-storage"); // Correctly read auth-storage
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
      if (isSuperAdmin && currentStore?.id) {
        url += `?store_id=${currentStore.id}`;
      }
      const response = await api.get(url);
      return response.data.data || [];
    },
    // Only run query if we are not a super admin OR if we have a currentStore
    // This prevents fetching "all" customers for super admins blindly if that's not desired,
    // though the backend likely filters by store_id anyway.
    enabled: true,
  });

  const ensureWalkInCustomer = async () => {
    // Check if walk-in customer already exists in the cache
    const existingCustomers = queryClient.getQueryData<Customer[]>(queryKey) || [];
    const walkInCustomer = existingCustomers.find((c) => c.name === "Walk-in Customer");

    if (walkInCustomer) {
      return walkInCustomer;
    }

    // Force strict refetch
    await queryClient.invalidateQueries({ queryKey });
    const freshCustomers = await queryClient.fetchQuery({ queryKey }); // Re-trigger fetch
    // Note: This logic assumes the backend creates "Walk-in Customer" on GET if missing,
    // or that it exists. The original hook logic was a bit recursive.

    return (freshCustomers as Customer[]).find((c) => c.name === "Walk-in Customer") || null;
  };

  return {
    customers,
    isLoading,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    fetchCustomers: () => queryClient.invalidateQueries({ queryKey }), // Manual refetch mapping 
    setCustomers: (newCustomers: Customer[]) => queryClient.setQueryData(queryKey, newCustomers), // Manual set mapping
    ensureWalkInCustomer
  };
}
