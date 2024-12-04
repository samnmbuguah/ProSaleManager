import type { PurchaseOrder } from "@db/schema";

interface PurchaseOrderWithSupplier extends PurchaseOrder {
  supplier?: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
}

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { usePurchaseOrders } from "@/hooks/use-purchase-orders";

interface PurchaseOrderListProps {
  onCreateOrder: () => void;
}

export function PurchaseOrderList({ onCreateOrder }: PurchaseOrderListProps) {
  const { purchaseOrders, updatePurchaseOrderStatus, isUpdating } = usePurchaseOrders<PurchaseOrderWithSupplier>();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "approved":
        return "default";
      case "received":
        return "outline";
      default:
        return "secondary";
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    await updatePurchaseOrderStatus({ id: orderId, status: newStatus });
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    try {
      return format(date, "MMM d, yyyy");
    } catch {
      return "-";
    }
  };

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
              <TableRow key={order.id}>
                <TableCell>
                  {formatDate(order.orderDate)}
                </TableCell>
                <TableCell>{order.supplier?.name || "Unknown Supplier"}</TableCell>
                <TableCell>
                  KSh {Number(order.total).toLocaleString("en-KE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {order.status === "pending" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(order.id, "approved")}
                      disabled={isUpdating}
                    >
                      Approve
                    </Button>
                  )}
                  {order.status === "approved" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(order.id, "received")}
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
    </div>
  );
}
