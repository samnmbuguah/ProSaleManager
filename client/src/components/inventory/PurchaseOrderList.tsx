import type { PurchaseOrder } from '@/types/purchase-order'
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
import { format } from 'date-fns'
import { usePurchaseOrders } from '@/hooks/use-purchase-orders'
import { useSuppliers } from '@/hooks/use-suppliers'
import { useState } from 'react'
import { PurchaseOrderDetails } from './PurchaseOrderDetails'

interface PurchaseOrderListProps {
  onCreateOrder: () => void;
}

export function PurchaseOrderList ({ onCreateOrder }: PurchaseOrderListProps) {
  const { purchaseOrders, updatePurchaseOrderStatus, isUpdating } =
    usePurchaseOrders()
  const { suppliers } = useSuppliers()
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(
    null
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary'
      case 'approved':
        return 'default'
      case 'received':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    await updatePurchaseOrderStatus({ id: orderId, status: newStatus })
  }

  const formatDate = (date: Date | null) => {
    if (!date) return '-'
    try {
      return format(date, 'MMM d, yyyy')
    } catch {
      return '-'
    }
  }

  const getSupplier = (supplierId: number) => {
    return suppliers?.find((s) => s.id === supplierId)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Purchase Orders</h2>
        <Button onClick={onCreateOrder}>Create Purchase Order</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order Date</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchaseOrders?.map((order) => (
              <TableRow
                key={order.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={(e) => {
                  // Don't open details if clicking on action buttons
                  if ((e.target as HTMLElement).closest('button')) return
                  setSelectedOrder(order)
                }}
              >
                <TableCell>{formatDate(order?.created_at)}</TableCell>
                <TableCell>
                  {getSupplier(order?.supplier_id)?.name || 'Unknown Supplier'}
                </TableCell>
                <TableCell>
                  KSh{' '}
                  {Number(order?.total_amount).toLocaleString('en-KE', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(order?.status)}>
                    {order?.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {order?.status === 'pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(order.id, 'approved')}
                      disabled={isUpdating}
                    >
                      Approve
                    </Button>
                  )}
                  {order?.status === 'approved' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(order.id, 'received')}
                      disabled={isUpdating}
                    >
                      Mark Received
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PurchaseOrderDetails
        orderId={selectedOrder?.id ?? null}
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        supplier={
          selectedOrder
            ? {
                name: getSupplier(selectedOrder.supplier_id)?.name || '',
                email: getSupplier(selectedOrder.supplier_id)?.email || null,
                phone: getSupplier(selectedOrder.supplier_id)?.phone || null
              }
            : undefined
        }
      />
    </div>
  )
}
