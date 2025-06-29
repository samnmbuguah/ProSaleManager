import { useState, useCallback } from "react";
import { Customer } from "@/types/customer";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api-endpoints";

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(API_ENDPOINTS.customers.list);
      setCustomers(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || String(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { customers, isLoading, error, fetchCustomers, setCustomers };
}
