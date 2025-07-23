import { useState, useCallback } from 'react'
import { ReceiptSettings } from '@/components/pos/ReceiptSettings'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Receipt, Loader2 } from 'lucide-react'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink
} from '@/components/ui/pagination'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sale } from '@/types/sale'
import { api } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/api-endpoints'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

interface OrderItem {
  id: number;
  Product?: {
    name?: string;
  };
  quantity: number;
  unit_price: number;
}
interface Order {
  id: number;
  createdAt: string;
  status: string;
  total_amount: number;
  items: OrderItem[];
}
// OrderDetailsDialog: Separate component for order details in Orders tab
function OrderDetailsDialog ({ order, open, onClose, onMarkShipped, onMarkFulfilled }: {
  order: Order;
  open: boolean;
  onClose: () => void;
  onMarkShipped: () => void;
  onMarkFulfilled: () => void;
}) {
  if (!order) return null
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="flex flex-col md:grid md:grid-cols-2 gap-6 border-b pb-6">
            <div>
              <h3 className="font-semibold mb-2">Order Info</h3>
              <p>Date: {format(new Date(order.createdAt), 'PPp')}</p>
              <p>Status: {order.status}</p>
              <p>Order ID: {order.id}</p>
              <p>Total: KSh {order.total_amount}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Items</h3>
              <ul className="list-disc pl-4">
                {order.items?.map((item: OrderItem) => (
                  <li key={item.id}>
                    {item.Product?.name || 'Unknown Product'} x {item.quantity} @ KSh {item.unit_price}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex gap-4 justify-end">
            <Button variant="outline" onClick={onMarkShipped} disabled={order.status === 'shipped' || order.status === 'fulfilled'}>
              Mark as Shipped
            </Button>
            <Button variant="default" onClick={onMarkFulfilled} disabled={order.status === 'fulfilled'}>
              Mark as Fulfilled
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function SalesPage () {
  const [tab, setTab] = useState('sales')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [ordersError, setOrdersError] = useState<string | null>(null)
  const pageSize = 10
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const { data: salesData } = useQuery<{
    sales: Sale[];
    total: number;
  }>({
    queryKey: ['sales', currentPage],
    queryFn: async () => {
      const response = await api.get(`/sales?page=${currentPage}&pageSize=${pageSize}`)
      return response.data
    }
  })

  // Only run orders query if user is authenticated (TODO: add real auth check if needed)
  const { data: ordersData, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['orders', currentPage],
    queryFn: async () => {
      try {
        const response = await api.get(API_ENDPOINTS.orders.list + `?page=${currentPage}&pageSize=${pageSize}`)
        setOrdersError(null)
        return response.data
      } catch (error: unknown) {
        if (
          typeof error === 'object' &&
          error !== null &&
          'response' in error &&
          (error as { response?: { status?: number; headers?: { [key: string]: string } } }).response &&
          (error as { response: { status: number } }).response.status === 429
        ) {
          setOrdersError('You are not authorized to view orders. Please log in.')
        } else if (
          typeof error === 'object' &&
          error !== null &&
          'response' in error &&
          (error as { response?: { data?: { message?: string } } }).response
        ) {
          setOrdersError((error as { response?: { data?: { message?: string } } }).response?.data?.message || (error as { message?: string }).message || 'Failed to load orders.')
        } else if (error instanceof Error) {
          setOrdersError(error.message)
        } else {
          setOrdersError('Failed to load orders.')
        }
        throw error
      }
    },
    enabled: tab === 'orders'
  })

  const totalPages = salesData ? Math.ceil(salesData.total / pageSize) : 1

  const formatCurrency = (amount: string | number) => {
    return `KSh ${Number(amount).toLocaleString('en-KE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`
  }

  const getPaymentStatusColor = (status: string | undefined) => {
    if (!status) return 'bg-gray-500'

    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-500'
      case 'pending':
        return 'bg-yellow-500'
      case 'failed':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  // Handlers for order actions
  const handleMarkShipped = useCallback(() => {
    if (!selectedOrder) return
    // TODO: Implement API call to mark as shipped
    alert('Order marked as shipped (implement API call)')
    setSelectedOrder({ ...selectedOrder, status: 'shipped' })
  }, [selectedOrder])

  const handleMarkFulfilled = useCallback(() => {
    if (!selectedOrder) return
    // TODO: Implement API call to mark as fulfilled
    alert('Order marked as fulfilled (implement API call)')
    setSelectedOrder({ ...selectedOrder, status: 'fulfilled' })
  }, [selectedOrder])

  return (
    <div className="container mx-auto p-4 mt-16">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Sales & Orders</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Receipt className="w-4 h-4 mr-2" />
              Receipt Settings
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Customize Receipt</DialogTitle>
            </DialogHeader>
            <ReceiptSettings />
          </DialogContent>
        </Dialog>
      </div>
      <Tabs value={tab} onValueChange={setTab} className="w-full mb-4">
        <TabsList>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>
        <TabsContent value="sales">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Cashier</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Receipt Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesData?.sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      {format(new Date(sale.createdAt), 'PPp')}
                    </TableCell>
                    <TableCell>
                      {sale.Customer?.name || 'Walk-in Customer'}
                    </TableCell>
                    <TableCell>
                      {sale.User?.name || sale.User?.email || 'Unknown User'}
                    </TableCell>
                    <TableCell className="capitalize">
                      {sale.payment_method}
                    </TableCell>
                    <TableCell>
                      <Badge className={getPaymentStatusColor(sale.status)}>
                        {sale.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {sale.receipt_status
                        ? (
                          <div className="flex gap-2">
                            <Badge
                              variant={
                                sale.receipt_status?.sms ? 'default' : 'outline'
                              }
                            >
                              SMS
                            </Badge>
                            <Badge
                              variant={
                                sale.receipt_status?.whatsapp
                                  ? 'default'
                                  : 'outline'
                              }
                            >
                              WhatsApp
                            </Badge>
                          </div>
                          )
                        : (
                          <span className="text-muted-foreground text-sm">
                            Not sent
                          </span>
                          )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(sale.total_amount)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        onClick={() => setSelectedSale(sale)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </TabsContent>
        <TabsContent value="orders">
          <div className="rounded-md border">
            {ordersError
              ? (
                <div className="text-center text-destructive py-8 font-semibold">{ordersError}</div>
                )
              : isLoadingOrders
                ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                  )
                : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ordersData?.orders?.map((order: Order) => (
                        <TableRow key={order.id}>
                          <TableCell>{format(new Date(order.createdAt), 'PPp')}</TableCell>
                          <TableCell>{order.status}</TableCell>
                          <TableCell>{Array.isArray(order.items) ? order.items.length : 0}</TableCell>
                          <TableCell className="text-right">KSh {order.total_amount}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              onClick={() => setSelectedOrder(order)}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  )}
          </div>
          <OrderDetailsDialog
            order={selectedOrder!}
            open={!!selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onMarkShipped={handleMarkShipped}
            onMarkFulfilled={handleMarkFulfilled}
          />
        </TabsContent>
      </Tabs>

      <Dialog
        open={!!selectedSale}
        onOpenChange={(open) => !open && setSelectedSale(null)}
      >
        <DialogContent className="max-w-4xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Sale Details</DialogTitle>
          </DialogHeader>

          {selectedSale && (
            <div className="space-y-8">
              {/* Summary Section */}
              <div className="flex flex-col md:grid md:grid-cols-3 gap-6 md:gap-4 border-b pb-6">
                <div>
                  <h3 className="font-semibold mb-2">Customer Information</h3>
                  <p>{selectedSale.Customer?.name || 'Walk-in Customer'}</p>
                  {selectedSale.Customer?.email && (
                    <p className="text-sm text-muted-foreground">
                      {selectedSale.Customer.email}
                    </p>
                  )}
                  {selectedSale.Customer?.phone && (
                    <p className="text-sm text-muted-foreground">
                      {selectedSale.Customer.phone}
                    </p>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Payment Information</h3>
                  <p className="capitalize">
                    Method: {selectedSale.payment_method}
                  </p>
                  <div className="flex items-center gap-2">
                    <span>Status:</span>
                    <Badge
                      className={getPaymentStatusColor(selectedSale.status)}
                    >
                      {selectedSale.status}
                    </Badge>
                  </div>
                  <p>Total: {formatCurrency(selectedSale.total_amount)}</p>
                  {selectedSale.receipt_status && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Receipt Status</h4>
                      <div className="flex gap-2">
                        <Badge
                          variant={
                            selectedSale.receipt_status.sms ? 'default' : 'outline'
                          }
                        >
                          SMS: {selectedSale.receipt_status.sms ? 'Sent' : 'Not Sent'}
                        </Badge>
                        <Badge
                          variant={
                            selectedSale.receipt_status.whatsapp ? 'default' : 'outline'
                          }
                        >
                          WhatsApp: {selectedSale.receipt_status.whatsapp ? 'Sent' : 'Not Sent'}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Sale Information</h3>
                  <p>Date: {format(new Date(selectedSale.createdAt), 'PPp')}</p>
                  <p>
                    Cashier:{' '}
                    {selectedSale.User?.name ||
                      selectedSale.User?.email ||
                      'Unknown User'}
                  </p>
                  {selectedSale.status && <p>Status: {selectedSale.status}</p>}
                  {selectedSale.id && <p>Sale ID: {selectedSale.id}</p>}
                </div>
              </div>

              {/* Items Section */}
              <div>
                <h3 className="font-semibold mb-2">Items</h3>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedSale.items?.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            {item.Product?.name || 'Unknown Product'}
                            {item.Product?.sku
                              ? (
                                <span className="block text-xs text-muted-foreground">SKU: {item.Product.sku}</span>
                                )
                              : null}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.unit_price)}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
