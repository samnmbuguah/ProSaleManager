import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Customer, InsertCustomer } from '@db/schema';
import { useToast } from '@/hooks/use-toast';

interface APIError {
  error: string;
  details?: string;
}

async function fetchWithRetry(url: string, options?: RequestInit, retries = 3): Promise<Response> {
  const reportError = async (error: Error, attempt: number) => {
    try {
      await fetch('/api/client-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: error.message,
          stack: error.stack,
          component: 'useCustomers',
          context: { url, attempt }
        })
      });
    } catch (e) {
      console.error('Failed to report error:', e);
    }
  };

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok || response.status === 401) {
        return response;
      }
      
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      const error = new Error(errorData.error || `HTTP ${response.status}`);
      await reportError(error, i + 1);
      
      if (i < retries - 1) {
        const delay = Math.min(1000 * Math.pow(2, i), 5000);
        console.warn(`Attempt ${i + 1} failed for ${url}. Retrying in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      await reportError(error as Error, i + 1);
      if (i === retries - 1) throw error;
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
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 5000),
  });

  const createCustomerMutation = useMutation<Customer, Error, InsertCustomer>({
    mutationFn: async (customer) => {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer),
        credentials: 'include',
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create customer');
      }
      
      return res.json();
    },
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
    error,
    createCustomer: createCustomerMutation.mutateAsync,
    isCreating: createCustomerMutation.isPending,
    searchCustomers,
  };
}
