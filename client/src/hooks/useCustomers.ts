import { useState, useCallback } from "react";
import { Customer } from "@/types/customer";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { useStoreContext } from "@/contexts/StoreContext";

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentStore } = useStoreContext();

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let url = API_ENDPOINTS.customers.list;
      // If super admin and currentStore is set, add store_id param
      const userStr = localStorage.getItem("user");
      let isSuperAdmin = false;
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          isSuperAdmin = user?.role === "super_admin";
        } catch {
          // Ignore parsing errors
        }
      }
      if (isSuperAdmin && currentStore?.id) {
        url += `?store_id=${currentStore.id}`;
      }
      const response = await api.get(url);
      const data = response.data.data;
      setCustomers(data);
      if (!data || data.length === 0) {
        setError("No customers found for this store. Please add a customer or contact support.");
      }
    } catch (error: unknown) {
      let errorMessage = error instanceof Error ? error.message : String(error);
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { status?: number } }).response?.status === "number" &&
        ((error as { response: { status: number } }).response.status === 401 ||
          (error as { response: { status: number } }).response.status === 403)
      ) {
        errorMessage = "You are not authorized to view customers. Please log in again.";
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [currentStore]);

  const ensureWalkInCustomer = useCallback(async () => {
    // Check if walk-in customer already exists
    const walkInCustomer = customers.find((customer) => customer.name === "Walk-in Customer");
    if (walkInCustomer) {
      return walkInCustomer;
    }

    // If no walk-in customer exists, fetch customers to ensure it's created
    await fetchCustomers();
    const updatedWalkInCustomer = customers.find(
      (customer) => customer.name === "Walk-in Customer"
    );
    return updatedWalkInCustomer || null;
  }, [customers, fetchCustomers]);

  return { customers, isLoading, error, fetchCustomers, setCustomers, ensureWalkInCustomer };
}
