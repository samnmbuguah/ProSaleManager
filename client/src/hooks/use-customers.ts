import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Customer, CustomerInsert } from "@/types/customer";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api-endpoints";

export function useCustomers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: customers,
    isLoading,
    error,
  } = useQuery<Customer[], Error>({
    queryKey: ["customers"],
    queryFn: async () => {
      try {
        const response = await api.get(API_ENDPOINTS.customers.list);
        return response.data.data;
      } catch (error) {
        console.error("[Customers] Error fetching customers:", error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 5000),
  });

  const createCustomerMutation = useMutation<Customer, Error, CustomerInsert>({
    mutationFn: async (customer) => {
      const response = await api.post(API_ENDPOINTS.customers.create, customer);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({
        title: "Customer added",
        description: "New customer has been registered",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to add customer",
        description: error.message,
      });
    },
  });

  const searchCustomers = (query: string) => {
    if (!customers) return [];
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.email?.toLowerCase().includes(query.toLowerCase()) ||
        c.phone?.includes(query)
    );
  };

  return {
    customers,
    isLoading,
    error,
    createCustomer: createCustomerMutation.mutate,
    isCreating: createCustomerMutation.isPending,
    searchCustomers,
  };
}
