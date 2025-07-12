import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Product, ProductFormData } from '@/types/product'
import { useToast } from '@/hooks/use-toast'
import { api, API_ENDPOINTS } from '@/lib/api'

export function useProducts () {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.products.list)
      return response.data
    }
  })

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      if (data.price_units?.find((p) => p.is_default)) {
        const defaultUnit = data.price_units.find((p) => p.is_default)
        return {
          ...data,
          buying_price: defaultUnit?.buying_price || '0',
          selling_price: defaultUnit?.selling_price || '0'
        }
      }
      const response = await api.post(API_ENDPOINTS.products.create, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast({
        title: 'Success',
        description: 'Product created successfully'
      })
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      })
    }
  })

  const updateProductMutation = useMutation({
    mutationFn: async (data: Partial<Product> & { id: number }) => {
      // Prepare the product data
      const productData = {
        name: data.name,
        category: data.category,
        quantity: data.quantity,
        min_stock: data.min_stock,
        max_stock: data.max_stock,
        reorder_point: data.reorder_point,
        stock_unit: data.stock_unit
      }

      // If there are price units, update them first
      if (data.price_units?.length) {
        const defaultUnit = data.price_units.find((p) => p.is_default)
        if (defaultUnit) {
          Object.assign(productData, {
            buying_price: defaultUnit.buying_price,
            selling_price: defaultUnit.selling_price
          })
        }
      }

      const response = await api.put(API_ENDPOINTS.products.update(data.id), productData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast({
        title: 'Success',
        description: 'Product updated successfully'
      })
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      })
    }
  })

  return {
    products,
    isLoading,
    createProduct: createProductMutation.mutateAsync,
    updateProduct: updateProductMutation.mutateAsync,
    isCreating: createProductMutation.isPending,
    isUpdating: updateProductMutation.isPending
  }
}
