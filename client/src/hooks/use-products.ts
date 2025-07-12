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
      // Remove price_units logic since it doesn't exist in the Product type
      const productData = {
        name: data.name,
        description: data.description || '',
        sku: data.sku || '',
        barcode: data.barcode || '',
        category_id: data.category_id,
        piece_buying_price: data.piece_buying_price,
        piece_selling_price: data.piece_selling_price,
        pack_buying_price: data.pack_buying_price,
        pack_selling_price: data.pack_selling_price,
        dozen_buying_price: data.dozen_buying_price,
        dozen_selling_price: data.dozen_selling_price,
        quantity: data.quantity,
        min_quantity: data.min_quantity,
        image_url: data.image_url || '',
        is_active: data.is_active
      }
      const response = await api.post(API_ENDPOINTS.products.create, productData)
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
        description: data.description || '',
        sku: data.sku || '',
        barcode: data.barcode || '',
        category_id: data.category_id,
        piece_buying_price: data.piece_buying_price,
        piece_selling_price: data.piece_selling_price,
        pack_buying_price: data.pack_buying_price,
        pack_selling_price: data.pack_selling_price,
        dozen_buying_price: data.dozen_buying_price,
        dozen_selling_price: data.dozen_selling_price,
        quantity: data.quantity,
        min_quantity: data.min_quantity,
        image_url: data.image_url || '',
        is_active: data.is_active
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
