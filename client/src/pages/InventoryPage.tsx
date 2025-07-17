import React, { useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Product } from '@/types/product'
import Suppliers from '@/components/inventory/Suppliers'
import { PurchaseOrders } from '@/components/inventory/PurchaseOrders'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState, AppDispatch } from '@/store'
import {
  fetchProducts,
  setIsAddDialogOpen,
  setIsEditDialogOpen,
  setSelectedProduct,
  setSearchQuery,
  setActiveTab,
  setFormData,
  searchProducts
} from '@/store/productsSlice'
import ProductList from '@/components/inventory/ProductList'
import ProductFormDialog from '@/components/inventory/ProductFormDialog'
import ProductSearchBar from '@/components/inventory/ProductSearchBar'
import TabsNav from '@/components/inventory/TabsNav'
import { ProductFormData } from '@/types/product'
import { api } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/api-endpoints'
import Swal from 'sweetalert2';
import { usePurchaseOrders } from '@/hooks/use-purchase-orders'

const InventoryPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const products = useSelector(
    (state: RootState) => state.products.items as Product[]
  )
  const productsStatus = useSelector(
    (state: RootState) => state.products.status
  )
  const isAddDialogOpen = useSelector(
    (state: RootState) => state.products.isAddDialogOpen
  )
  const isEditDialogOpen = useSelector(
    (state: RootState) => state.products.isEditDialogOpen
  )
  const selectedProduct = useSelector(
    (state: RootState) => state.products.selectedProduct
  )
  const searchQuery = useSelector(
    (state: RootState) => state.products.searchQuery
  )
  const activeTab = useSelector((state: RootState) => state.products.activeTab)
  const formData = useSelector((state: RootState) => state.products.formData)
  const { toast } = useToast()

  const [uploading, setUploading] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState<number | null>(
    null
  )
  // Remove local state and manual fetching for purchase orders
  // const [purchaseOrders, setPurchaseOrders] = React.useState([])
  // const [purchaseOrdersLoading, setPurchaseOrdersLoading] = React.useState(false)

  // Use React Query hook for purchase orders
  const { purchaseOrders, isLoading: purchaseOrdersLoading } = usePurchaseOrders();

  const initialFormData = {
    name: '',
    description: '',
    sku: '',
    barcode: '',
    category_id: 1, // Default category ID
    quantity: 0,
    min_quantity: 0,
    is_active: true
  }

  useEffect(() => {
    if (productsStatus === 'idle') {
      dispatch(fetchProducts())
    }
  }, [dispatch, productsStatus])

  const handleSubmit = async (_unused: unknown, localImageFile?: File) => {
    try {
      setUploading(true)
      setUploadProgress(null)
      let response
      if (localImageFile) {
        // Use FormData if uploading an image
        const formDataToSend = new FormData()
        Object.entries(formData).forEach(([key, value]) => {
          if (typeof value === 'number' || typeof value === 'boolean') {
            formDataToSend.append(key, value.toString())
          } else {
            formDataToSend.append(key, Array.isArray(value) ? value.join(',') : value ?? '')
          }
        })
        formDataToSend.append('images', localImageFile)
        if (selectedProduct) {
          response = await api.put(
            API_ENDPOINTS.products.update(selectedProduct.id),
            formDataToSend,
            { headers: { 'Content-Type': 'multipart/form-data' } }
          )
        } else {
          response = await api.post(
            API_ENDPOINTS.products.create,
            formDataToSend,
            { headers: { 'Content-Type': 'multipart/form-data' } }
          )
        }
      } else {
        // Only include the correct fields for the backend
        const allowedFields = [
          'name',
          'description',
          'sku',
          'barcode',
          'category_id',
          'piece_buying_price',
          'piece_selling_price',
          'pack_buying_price',
          'pack_selling_price',
          'dozen_buying_price',
          'dozen_selling_price',
          'quantity',
          'min_quantity',
          'image_url',
          'is_active'
        ]
        const payload: Partial<ProductFormData> = {}
        allowedFields.forEach((field) => {
          if (formData[field as keyof ProductFormData] !== undefined) {
            payload[field as keyof ProductFormData] = formData[field as keyof ProductFormData] as any
          }
        })
        if (selectedProduct) {
          response = await api.put(
            API_ENDPOINTS.products.update(selectedProduct.id),
            payload
          )
        } else {
          response = await api.post(
            API_ENDPOINTS.products.create,
            payload
          )
        }
      }
      if (!response || response.status < 200 || response.status >= 300) throw new Error('Failed to save product')
      toast({
        title: 'Success',
        description: `Product ${selectedProduct ? 'updated' : 'created'} successfully`
      })
      dispatch(setFormData(initialFormData))
      dispatch(setIsAddDialogOpen(false))
      dispatch(setIsEditDialogOpen(false))
      dispatch(fetchProducts())
    } catch (error: unknown) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: `Failed to ${selectedProduct ? 'update' : 'create'} product`,
        variant: 'destructive'
      })
    } finally {
      setUploading(false)
      setUploadProgress(null)
    }
  }

  const handleEdit = (product: Product) => {
    dispatch(setSelectedProduct(product))
    dispatch(
      setFormData({
        name: product.name,
        description: product.description || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        category_id: product.category_id,
        piece_buying_price: product.piece_buying_price || 0,
        piece_selling_price: product.piece_selling_price || 0,
        pack_buying_price: product.pack_buying_price || 0,
        pack_selling_price: product.pack_selling_price || 0,
        dozen_buying_price: product.dozen_buying_price || 0,
        dozen_selling_price: product.dozen_selling_price || 0,
        quantity: product.quantity,
        min_quantity: product.min_quantity,
        image_url: product.image_url || '',
        is_active: product.is_active
      })
    )
    dispatch(setIsEditDialogOpen(true))
  }

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you really want to delete this product?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(API_ENDPOINTS.products.delete(id));
      toast({
        title: 'Success',
        description: 'Product deleted successfully',
      });
      dispatch(fetchProducts());
    } catch (error: any) {
      // Show SweetAlert2 error dialog for backend error
      const message = error?.response?.data?.message || error.message || 'Failed to delete product';
      Swal.fire({
        title: 'Error',
        text: message,
        icon: 'error',
      });
    }
  };

  const handleSearch = async (query: string) => {
    try {
      await dispatch(searchProducts(query))
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: 'Failed to search products',
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="container mx-auto p-4 mt-16">
      <TabsNav
        activeTab={activeTab}
        setActiveTab={(tab) => dispatch(setActiveTab(tab))}
      />
      <div className="flex justify-between items-center mb-4">
        {activeTab === 'products' && (
          <>
            <ProductSearchBar
              searchQuery={searchQuery}
              setSearchQuery={(q) => dispatch(setSearchQuery(q))}
              onSearch={handleSearch}
            />
            <Button
              onClick={() => {
                dispatch(setFormData(initialFormData))
                dispatch(setSelectedProduct(null))
                dispatch(setIsAddDialogOpen(true))
              }}
            >
              Add Product
            </Button>
          </>
        )}
      </div>
      {activeTab === 'products' && (
        <ProductList
          products={products}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
      <ProductFormDialog
        open={isAddDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            dispatch(setFormData(initialFormData))
            dispatch(setSelectedProduct(null))
          }
          dispatch(setIsAddDialogOpen(open))
          dispatch(setIsEditDialogOpen(open))
        }}
        formData={formData}
        setFormData={(data) => dispatch(setFormData(data))}
        onSubmit={handleSubmit}
        selectedProduct={selectedProduct}
      />
      {uploading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white p-6 rounded shadow flex flex-col items-center">
            <div className="mb-2">Uploading product...</div>
            <div className="w-48 h-2 bg-gray-200 rounded">
              <div
                className="h-2 bg-blue-500 rounded"
                style={{
                  width:
                    uploadProgress !== null ? `${uploadProgress}%` : '100%'
                }}
              />
            </div>
          </div>
        </div>
      )}
      {activeTab === 'suppliers' && <Suppliers />}
      {activeTab === 'purchase-orders' && (
        <PurchaseOrders
          purchaseOrders={purchaseOrders || []}
          loading={purchaseOrdersLoading}
        />
      )}
    </div>
  )
}

export default InventoryPage
