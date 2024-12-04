import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Customer, InsertCustomer } from '@db/schema';
import { useToast } from '@/hooks/use-toast';

export function useCustomers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: customers, isLoading, error } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await fetch('/api/customers');
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Please login to view customers');
        }
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch customers');
      }
      return res.json();
    },
    initialData: [],
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
