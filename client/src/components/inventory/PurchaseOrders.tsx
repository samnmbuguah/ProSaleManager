import { useState } from "react";
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
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import type {
  PurchaseOrder,
} from "@/types/purchase-order";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthContext } from "@/contexts/AuthContext";
import { Loader2, Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import { usePurchaseOrders } from "@/hooks/use-purchase-orders";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { PurchaseOrderDetails } from "./PurchaseOrderDetails";
import type { Supplier } from "@/types/supplier";
import { AppRole } from "@/types/user";
import { CreatePurchaseOrder } from "./CreatePurchaseOrder";


export function PurchaseOrders({
  purchaseOrders: propPurchaseOrders,
  loading,
}: {
  purchaseOrders: PurchaseOrder[];
  loading: boolean;
}) {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const [markingReceivedId, setMarkingReceivedId] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

  // Use React Query for purchase orders
  const {
    purchaseOrders,
    isLoading: purchaseOrdersLoading,
    updatePurchaseOrderStatus,
  } = usePurchaseOrders();

  const handleStatusChange = async (orderId: number, newStatus: PurchaseOrder["status"]) => {
    try {
      await updatePurchaseOrderStatus({ id: orderId, status: newStatus });
      toast({
        title: "Success",
        description: "Status updated successfully",
      });
      // No reload needed, React Query will refetch
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error:", error);
        toast({
          title: "Error",
          description: "Failed to update status",
          variant: "destructive",
        });
      }
    }
  };

  const handleMarkReceived = async (orderId: number) => {
    if (
      !window.confirm(
        "Are you sure you want to mark this order as received? This will update inventory quantities."
      )
    )
      return;
    setMarkingReceivedId(orderId);
    try {
      await updatePurchaseOrderStatus({ id: orderId, status: "received" });
      toast({
        title: "Order marked as received",
        description: "Inventory has been updated.",
      });
      // No reload needed, React Query will refetch
    } catch (err: unknown) {
      const message = (err as Error)?.message || "Failed to mark as received";
      if (
        (err as { response?: { status?: number } })?.response?.status === 400 &&
        message.includes("Product with id")
      ) {
        Swal.fire({
          title: "Error",
          text: message,
          icon: "error",
        });
      } else {
        toast({ title: "Error", description: message, variant: "destructive" });
      }
    } finally {
      setMarkingReceivedId(null);
    }
  };

  // Delete order handler
  const handleDeleteOrder = async (orderId: number) => {
    if (!window.confirm("Are you sure you want to delete this purchase order? This action cannot be undone.")) return;

    try {
      await api.delete(API_ENDPOINTS.purchaseOrders.delete(orderId));
      toast({ title: "Success", description: "Purchase order deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    } catch (error) {
      console.error("Error deleting order:", error);
      toast({ title: "Error", description: "Failed to delete order", variant: "destructive" });
    }
  };

  const getStatusBadgeVariant = (status: PurchaseOrder["status"]) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "approved":
        return "default"; // "Awaiting Delivery"
      case "rejected":
        return "destructive";
      case "completed":
        return "outline";
      case "received":
        return "success";
      default:
        return "default";
    }
  };

  const getFriendlyStatus = (status: PurchaseOrder["status"]) => {
    switch (status) {
      case 'pending': return 'Pending Approval';
      case 'approved': return 'Awaiting Delivery';
      case 'received': return 'Received & Completed';
      case 'rejected': return 'Rejected';
      case 'completed': return 'Completed';
      default: return (status as string).charAt(0).toUpperCase() + (status as string).slice(1);
    }
  };

  // Centralized status transition logic
  function getAvailableStatuses(
    currentStatus: PurchaseOrder["status"],
    userRole: AppRole | undefined
  ) {
    if (
      currentStatus === "pending" &&
      ["admin", "manager", "super_admin"].includes(userRole as AppRole)
    ) {
      return ["approved", "rejected"];
    }
    // Only admins/managers can receive orders now, not sales
    if (currentStatus === "approved" && ["admin", "manager", "super_admin"].includes(userRole as AppRole)) {
      return ["received"];
    }
    return [];
  }

  // Check if status can be changed
  const canChangeStatus = (currentStatus: PurchaseOrder["status"]) => {
    return getAvailableStatuses(currentStatus, user?.role).length > 0;
  };

  // Use purchaseOrders from React Query, fallback to prop for SSR
  const orders = purchaseOrders || propPurchaseOrders || [];
  const isLoading = purchaseOrdersLoading || loading;

  if (isCreating) {
    return (
      <CreatePurchaseOrder
        onCancel={() => setIsCreating(false)}
        onSuccess={() => {
          setIsCreating(false);
          queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Purchase Orders</h2>
        {/* Allow both admin and sales to create purchase orders */}
        {user && ((user.role as AppRole) === "admin" || (user.role as AppRole) === "sales" || (user.role as AppRole) === "manager") && (
          <Button onClick={() => setIsCreating(true)}>Create Purchase Order</Button>
        )}
      </div>
      {!Array.isArray(orders) || orders.length === 0 ? (
        <div className="p-4 text-center text-muted-foreground">
          {isLoading ? "Loading purchase orders..." : "No purchase orders found."}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
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
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No purchase orders found.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order: PurchaseOrder & { supplier?: { name: string } }) => (
                  <TableRow
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell>{order.order_number || order.id}</TableCell>
                    <TableCell>
                      {/* Show supplier name from either Supplier or supplier field */}
                      {order.supplier?.name || "Unknown Supplier"}
                    </TableCell>
                    <TableCell>
                      {/* Use order_date, createdAt, or created_at for order date */}
                      {order.created_at
                        ? format(new Date(order.created_at), "MMM d, y")
                        : order.created_at
                          ? format(new Date(order.created_at), "MMM d, y")
                          : ""}
                    </TableCell>
                    <TableCell>
                      {order.expected_delivery_date
                        ? format(new Date(order.expected_delivery_date), "MMM d, y")
                        : "Not set"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(order.status) as "default" | "secondary" | "destructive" | "outline"}>
                        {getFriendlyStatus(order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      KSh{" "}
                      {order.total_amount != null && !isNaN(Number(order.total_amount))
                        ? Number(order.total_amount).toLocaleString()
                        : "0"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{order.notes}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        {canChangeStatus(order.status) && order.status === "pending" ? (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleStatusChange(order.id, "approved")}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleStatusChange(order.id, "rejected")}
                            >
                              Reject
                            </Button>
                          </>
                        ) : null}
                        {/* Mark as Received button for approved orders - Only for Admins/Managers */}
                        {order.status === "approved" && ["admin", "manager", "super_admin"].includes(user?.role as string) && (
                          <Button
                            variant="default"
                            size="sm"
                            disabled={markingReceivedId === order.id}
                            onClick={() => handleMarkReceived(order.id)}
                          >
                            {markingReceivedId === order.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Receive"
                            )}
                          </Button>
                        )}
                        {/* Delete Button - Only for Admins */}
                        {["admin", "super_admin"].includes(user?.role as string) && (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="ml-2"
                            title="Delete Order"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteOrder(order.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <PurchaseOrderDetails
        orderId={selectedOrder?.id ?? null}
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        supplier={selectedOrder?.supplier as Supplier}
        items={selectedOrder?.items}
      />
    </div>
  );
}
