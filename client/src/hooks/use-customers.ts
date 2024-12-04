import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Customer, InsertCustomer } from '@db/schema';
import { useToast } from '@/hooks/use-toast';

interface APIError {
  error: string;
  details?: string;
}

async function fetchWithRetry(url: string, options?: RequestInit, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok || response.status === 401) {
        return response;
      }
      console.warn(`Attempt ${i + 1} failed for ${url}`);
      await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, i), 5000)));
    } catch (error) {
      if (i === retries - 1) throw error;
      console.warn(`Attempt ${i + 1} failed for ${url}:`, error);
    }
  }
  throw new Error(`Failed after ${retries} retries`);
}

export function useCustomers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: customers, isLoading, error } = useQuery<Customer[], Error>({
    queryKey: ['customers'],
    queryFn: async () => {
      try {
        console.log('[Customers] Fetching customers data');
        const res = await fetchWithRetry('/api/customers');
        
        if (!res.ok) {
          if (res.status === 401) {
            throw new Error('Please login to view customers');
          }
          const errorData: APIError = await res.json();
          throw new Error(errorData.error || 'Failed to fetch customers');
        }
        
        const data = await res.json();
        console.log('[Customers] Successfully fetched customers:', data.length);
        return data;
      } catch (error) {
        console.error('[Customers] Error fetching customers:', error);
        throw error;
      }
    },
    initialData: [],
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 5000),
  });

  const createCustomerMutation = useMutation<Customer, Error, InsertCustomer>({
    mutationFn: (customer) =>
      fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer),
        credentials: 'include',
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
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
    return customers.filter(c => 
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.email?.toLowerCase().includes(query.toLowerCase()) ||
      c.phone?.includes(query)
    );
  };

  return {
    customers,
    isLoading,
    createCustomer: createCustomerMutation.mutateAsync,
    isCreating: createCustomerMutation.isPending,
    searchCustomers,
  };
}
