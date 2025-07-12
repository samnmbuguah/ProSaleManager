import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import type { Supplier } from '@/types/supplier'
import { API_ENDPOINTS } from '@/lib/api-endpoints'
import { api } from '@/lib/api'

interface PurchaseOrderDetailsProps {
  orderId: number | null;
  isOpen: boolean;
  onClose: () => void;
  supplier?: Supplier | null;
}

export function PurchaseOrderDetails ({
  orderId,
  isOpen,
  onClose,
  supplier
}: PurchaseOrderDetailsProps) {
  const { data: items, isLoading } = useQuery({
    queryKey: ['purchase-order-items', orderId],
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.purchaseOrders.items(orderId || 0))
      return response.data
    },
    enabled: !!orderId
  })

  const formatCurrency = (amount: string) => {
    return `KSh ${Number(amount).toLocaleString('en-KE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Purchase Order Details</DialogTitle>
        </DialogHeader>

        {supplier && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Supplier Information</h3>
            <p>Name: {supplier.name}</p>
            {supplier.email && <p>Email: {supplier.email}</p>}
            {supplier.phone && <p>Phone: {supplier.phone}</p>}
          </div>
        )}

        {isLoading
          ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
            )
          : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Stock Unit</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Buying Price</TableHead>
                  <TableHead>Selling Price</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items?.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.product.name}</TableCell>
                    <TableCell>{item.product.stock_unit}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatCurrency(item.buying_price)}</TableCell>
                    <TableCell>{formatCurrency(item.selling_price)}</TableCell>
                    <TableCell>
                      {formatCurrency(
                        (Number(item.buying_price) * item.quantity).toString()
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
            )}
      </DialogContent>
    </Dialog>
  )
}
