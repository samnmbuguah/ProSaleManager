import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Product, InsertProduct } from '@db/schema';
import { useToast } from '@/hooks/use-toast';

export function useInventory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();
      console.log('Fetched products data:', data); // Debug log
      return data;
    },
  });

  const createProductMutation = useMutation<Product, Error, InsertProduct>({
    mutationFn: (product) =>
      fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
        credentials: 'include',
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Product created",
        description: "New product has been added to inventory",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to create product",
        description: error.message,
      });
    },
  });

  const updateProductMutation = useMutation<Product, Error, Partial<Product> & { id: number }>({
    mutationFn: (product) =>
      fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
        credentials: 'include',
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Product updated",
        description: "Product information has been updated",
      });
    },
  });

  return {
    products,
    isLoading,
    createProduct: createProductMutation.mutateAsync,
    updateProduct: updateProductMutation.mutateAsync,
    isCreating: createProductMutation.isPending,
    isUpdating: updateProductMutation.isPending,
  };
}
