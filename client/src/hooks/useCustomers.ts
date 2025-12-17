import { useStoreData } from "@/contexts/StoreDataContext";


export function useCustomers() {
  const {
    customers,
    isLoadingCustomers: isLoading,
    customersError: error,
    refetchCustomers: fetchCustomers,
    ensureWalkInCustomer,
    setCustomers
  } = useStoreData();

  return {
    customers,
    isLoading,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    fetchCustomers,
    setCustomers,
    ensureWalkInCustomer
  };
}
