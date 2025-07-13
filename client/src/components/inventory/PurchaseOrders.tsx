import { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { format } from 'date-fns'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState, AppDispatch } from '@/store'
import { fetchPurchaseOrders } from '@/store/purchaseOrdersSlice'
import { useInventory } from '@/hooks/use-inventory'
import type {
  PurchaseOrder,
  PurchaseOrderFormData
} from '@/types/purchase-order'
import { API_ENDPOINTS } from '@/lib/api-endpoints'
import { api } from '@/lib/api'
import { PurchaseOrderForm } from './PurchaseOrderForm'
import ProductSearchBar from './ProductSearchBar'
import { useSuppliers } from '@/hooks/use-suppliers'
import { purchaseOrderSchema } from '@/types/purchase-order'
import { useAuthContext } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'

export function PurchaseOrders({ purchaseOrders, loading }: { purchaseOrders: any[]; loading: boolean }) {
  const { products } = useInventory()
  const { suppliers, isLoading: suppliersLoading } = useSuppliers()
  const { user } = useAuthContext();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [formData, setFormData] = useState<PurchaseOrderFormData>({
    items: [],
    supplier_id: '',
    expected_delivery_date: '',
    notes: ''
  })
  const { toast } = useToast()
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Product search state for purchase order dialog
  const [searchQuery, setSearchQuery] = useState('')
  const { refetch: refetchInventory } = useInventory();
  const [markingReceivedId, setMarkingReceivedId] = useState<number | null>(null);
  const [productsList, setProductsList] = useState(products)
  const [productsLoading, setProductsLoading] = useState(false)
  const [productDropdownOpen, setProductDropdownOpen] = useState<boolean[]>([])

  useEffect(() => {
    if (Array.isArray(products)) {
      // setFilteredProducts(products) // This line is removed
    }
  }, [products])

  const handleProductSearch = async (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setProductsList(products)
      setProductDropdownOpen((prev) => {
        const arr = [...prev]
        if (formData.items.length > 0) arr[formData.items.length - 1] = true
        return arr
      })
      return
    }
    setProductsLoading(true)
    try {
      const response = await api.get(`/products/search?q=${encodeURIComponent(query)}`)
      setProductsList(response.data.data)
      // Open dropdown for the most recent item
      setProductDropdownOpen((prev) => {
        const arr = [...prev]
        if (formData.items.length > 0) arr[formData.items.length - 1] = true
        return arr
      })
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to search products', variant: 'destructive' })
    } finally {
      setProductsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const removeItem = (index: number) => {
    const newItems = [...formData.items]
    newItems.splice(index, 1)
    setFormData((prev) => ({ ...prev, items: newItems }))
  }

  const addItem = () => {
    const newItem = {
      quantity: 1,
      product_id: 0,
      buying_price: 0,
      selling_price: 0
    }
    setFormData((prev) => ({ ...prev, items: [...prev.items, newItem] }))
    setProductDropdownOpen((prev) => [...prev, false])
  }

  const handleStatusChange = async (
    orderId: number,
    newStatus: PurchaseOrder['status']
  ) => {
    try {
      await api.put(`${API_ENDPOINTS.purchaseOrders.update(orderId)}/status`, {
        status: newStatus
      })
      toast({
        title: 'Success',
        description: 'Status updated successfully'
      })
      // Refresh the purchase orders list to show updated status
      if (typeof window !== 'undefined') {
        window.location.reload()
      }
      // dispatch(fetchPurchaseOrders()) // This line is removed
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive'
      })
    }
  }

  const handleMarkReceived = async (orderId: number) => {
    if (!window.confirm('Are you sure you want to mark this order as received? This will update inventory quantities.')) return;
    setMarkingReceivedId(orderId);
    try {
      await api.put(`/purchase-orders/${orderId}/status`, { status: 'received' });
      toast({ title: 'Order marked as received', description: 'Inventory has been updated.' });
      // Refresh the purchase orders list to show updated status
      if (typeof window !== 'undefined') {
        window.location.reload()
      }
      // dispatch(fetchPurchaseOrders()); // This line is removed
      refetchInventory && refetchInventory();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to mark as received', variant: 'destructive' });
    } finally {
      setMarkingReceivedId(null);
    }
  };

  const getStatusBadgeVariant = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'pending':
        return 'secondary'
      case 'approved':
        return 'default'
      case 'rejected':
        return 'destructive'
      case 'received':
        return 'outline'
      case 'cancelled':
        return 'destructive'
      default:
        return 'default'
    }
  }

  // Get available status options based on current status
  const getAvailableStatuses = (currentStatus: PurchaseOrder['status']) => {
    switch (currentStatus) {
      case 'pending':
        return ['approved', 'rejected', 'cancelled']
      case 'approved':
        return ['received', 'cancelled']
      case 'rejected':
        return ['cancelled'] // Can only cancel rejected orders
      case 'received':
        return [] // No further status changes allowed
      case 'cancelled':
        return [] // No further status changes allowed
      default:
        return ['pending', 'approved', 'rejected', 'cancelled']
    }
  }

  // Check if status can be changed
  const canChangeStatus = (currentStatus: PurchaseOrder['status']) => {
    return getAvailableStatuses(currentStatus).length > 0
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    try {
      // Validate form data
      const validated = purchaseOrderSchema.parse(formData);
      // Ensure each item has unit_price set to buying_price
      const itemsWithUnitPrice = validated.items.map(item => ({
        ...item,
        unit_price: item.buying_price ?? 0,
      }));
      // Submit to backend
      await api.post('/purchase-orders', { ...validated, items: itemsWithUnitPrice });
      toast({ title: 'Success', description: 'Purchase order created successfully.' });
      setIsAddDialogOpen(false);
      setFormData({ items: [], supplier_id: '', expected_delivery_date: '', notes: '' });
      // dispatch(fetchPurchaseOrders()); // This line is removed
    } catch (err: any) {
      if (err.errors) {
        // Zod validation errors
        const errors: { [key: string]: string } = {};
        err.errors.forEach((e: any) => { errors[e.path[0]] = e.message; });
        setFormErrors(errors);
      } else {
        toast({ title: 'Error', description: 'Failed to create purchase order', variant: 'destructive' });
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Purchase Orders</h2>
        {/* Allow both admin and cashier to create purchase orders */}
        {(user?.role === 'admin' || user?.role === 'cashier') && (
          <Button onClick={() => setIsAddDialogOpen(true)}>
            Create Purchase Order
          </Button>
        )}
      </div>
      {!Array.isArray(purchaseOrders) || purchaseOrders.length === 0
        ? (
          <div className="p-4 text-center text-muted-foreground">
            {loading
              ? 'Loading purchase orders...'
              : 'No purchase orders found or failed to load.'}
          </div>
        )
        : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Expected Delivery</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrders.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No purchase orders found or failed to load.
                      </TableCell>
                    </TableRow>
                  )
                  : (
                    purchaseOrders.map(
                      (
                        order: PurchaseOrder & { supplier?: { name: string } }
                      ) => (
                        <TableRow key={order.id}>
                          <TableCell>{order.id}</TableCell>
                          <TableCell>
                            {/* Show supplier name regardless of field casing */}
                            {order.supplier?.name || order.Supplier?.name || 'Unknown Supplier'}
                          </TableCell>
                          <TableCell>
                            {(order.created_at || order.createdAt)
                              ? format(new Date(order.created_at || order.createdAt), 'PPP')
                              : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {(order.expected_delivery_date || order.expectedDeliveryDate)
                              ? format(new Date(order.expected_delivery_date || order.expectedDeliveryDate), 'PPP')
                              : 'Not set'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(order.status)}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            KSh {order.total_amount != null && !isNaN(Number(order.total_amount))
                              ? Number(order.total_amount).toLocaleString()
                              : '0'}
                          </TableCell>
                          <TableCell>{order.notes || 'No notes'}</TableCell>
                          <TableCell>
                            {/* Only admins can approve/reject orders */}
                            {user?.role === 'admin' ? (
                              <>
                                {canChangeStatus(order.status) ? (
                                  <Select
                                    value={order.status}
                                    onValueChange={(value) =>
                                      handleStatusChange(
                                        order.id,
                                        value as PurchaseOrder['status']
                                      )
                                    }
                                  >
                                    <SelectTrigger className="w-[130px]">
                                      <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {getAvailableStatuses(order.status).map((status) => (
                                        <SelectItem key={status} value={status}>
                                          {status.charAt(0).toUpperCase() + status.slice(1)}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Badge variant={getStatusBadgeVariant(order.status)}>
                                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                  </Badge>
                                )}
                                {/* Mark as Received button for approved orders */}
                                {order.status === 'approved' && (
                                  <Button
                                    variant="success"
                                    size="sm"
                                    className="ml-2"
                                    disabled={markingReceivedId === order.id}
                                    onClick={() => handleMarkReceived(order.id)}
                                  >
                                    {markingReceivedId === order.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      'Mark as Received'
                                    )}
                                  </Button>
                                )}
                              </>
                            ) : (
                              <Badge variant={getStatusBadgeVariant(order.status)}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </Badge>
                            )}
                            {/* TODO: After admin approval and order confirmation, update inventory */}
                          </TableCell>
                        </TableRow>
                      )
                    )
                  )}
              </TableBody>
            </Table>
          </div>
        )}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
            <DialogDescription>
              Fill in the purchase order details below.
            </DialogDescription>
          </DialogHeader>
          <ProductSearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSearch={handleProductSearch}
          />
          {searchQuery && productsList.length > 0 && (
            <div className="mb-4 border rounded p-2 bg-gray-50">
              <div className="font-semibold mb-2">Search Results</div>
              <ul className="space-y-1">
                {productsList.map((product) => {
                  const alreadyAdded = formData.items.some(item => item.product_id === product.id)
                  return (
                    <li key={product.id} className="flex items-center justify-between p-1 border-b last:border-b-0">
                      <span>{product.name} {product.sku ? `(${product.sku})` : ''}</span>
                      <button
                        type="button"
                        className={`ml-2 px-2 py-1 rounded text-white ${alreadyAdded ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                        disabled={alreadyAdded}
                        onClick={() => {
                          if (!alreadyAdded) {
                            setFormData(prev => ({
                              ...prev,
                              items: [
                                ...prev.items,
                                {
                                  product_id: product.id,
                                  product_name: product.name + (product.sku ? ` (${product.sku})` : ''),
                                  quantity: 1,
                                  buying_price: product.piece_buying_price || 0,
                                  selling_price: product.piece_selling_price || 0
                                }
                              ]
                            }))
                          }
                        }}
                      >
                        {alreadyAdded ? 'Added' : 'Add'}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
          {/* Show form errors if any */}
          {Object.values(formErrors).length > 0 && (
            <div className="mb-2 text-red-600 text-sm">
              {Object.values(formErrors).map((msg, i) => (
                <div key={i}>{msg}</div>
              ))}
            </div>
          )}
          <form onSubmit={handleFormSubmit}>
            <PurchaseOrderForm
              formData={formData}
              onInputChange={handleInputChange}
              onItemChange={(index: number, field: string, value: any) => {
                const newItems = [...formData.items]
                newItems[index] = { ...newItems[index], [field]: value }
                setFormData((prev) => ({ ...prev, items: newItems }))
              }}
              onRemoveItem={removeItem}
              products={productsList}
              suppliers={suppliers || []}
              suppliersLoading={suppliersLoading}
              productDropdownOpen={productDropdownOpen}
              setProductDropdownOpen={(index, open) => setProductDropdownOpen((prev) => {
                const arr = [...prev]
                arr[index] = open
                return arr
              })}
            />
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Purchase Order</DialogTitle>
            <DialogDescription>
              Purchase order details and status.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  )
}
