import { useState, useCallback } from "react";
import { ReceiptSettings } from "@/components/pos/ReceiptSettings";
import { format } from "date-fns";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Receipt, Loader2, Edit, Trash2 } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sale } from "@/types/sale";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useStoreContext } from "@/contexts/StoreContext";
import { useSalesQuery, useOrdersQuery, useDeleteSale } from "@/hooks/use-sales-query";
import { ReceiptDialog } from "@/components/pos/ReceiptDialog";

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
function OrderDetailsDialog({
  order,
  open,
  onClose,
  onMarkFulfilled,
  isAdmin,
  isProcessing,
}: {
  order: Order & { Customer?: { name: string; email?: string; phone?: string } };
  open: boolean;
  onClose: () => void;
  onMarkFulfilled: () => void;
  isAdmin: boolean;
  isProcessing: boolean;
}) {
  if (!order) return null;
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
              <p>Date: {format(new Date(order.createdAt), "PPp")}</p>
              <p>Status: {order.status}</p>
              <p>Order ID: {order.id}</p>
              <p>Total: KSh {order.total_amount}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Customer Info</h3>
              {order.Customer ? (
                <>
                  <p className="font-medium">{order.Customer.name}</p>
                  {order.Customer.phone && <p>Phone: {order.Customer.phone}</p>}
                  {order.Customer.email && <p>Email: {order.Customer.email}</p>}
                </>
              ) : (
                <p className="text-muted-foreground">Walk-in / Unknown</p>
              )}
            </div>
            <div>
              <h3 className="font-semibold mb-2">Items</h3>
              <ul className="list-disc pl-4">
                {order.items?.map((item: OrderItem) => (
                  <li key={item.id}>
                    {item.Product?.name || "Unknown Product"} x {item.quantity} @ KSh{" "}
                    {item.unit_price}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex gap-4 justify-end">
            {isAdmin && order.status !== "completed" && order.status !== "fulfilled" && (
              <Button
                variant="default"
                onClick={onMarkFulfilled}
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : "Mark as Fulfilled"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SalesPage() {
  const [tab, setTab] = useState<"sales" | "orders">("sales");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [ordersError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const pageSize = 10;
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [receiptSettingsOpen, setReceiptSettingsOpen] = useState(false);
  const [viewReceiptOpen, setViewReceiptOpen] = useState(false);
  const [saleForReceipt, setSaleForReceipt] = useState<number | null>(null);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const { currentStore } = useStoreContext();
  const queryClient = useQueryClient();

  // React Query hooks for data fetching
  const { sales, pagination: salesPagination, isLoading: salesLoading } = useSalesQuery(currentPage, pageSize);
  const { orders, isLoading: ordersLoading } = useOrdersQuery(currentPage, pageSize);
  const deleteSaleMutation = useDeleteSale();

  const totalPages = salesPagination.totalPages;
  const isLoadingOrders = ordersLoading && tab === "orders";

  const formatCurrency = (amount: string | number) => {
    return `KSh ${Number(amount).toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getPaymentStatusColor = (status: string | undefined) => {
    if (!status) return "bg-gray-500";

    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "failed":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  // Check if user has admin privileges (excludes sales role)
  const isAdmin = user ? ["admin", "manager", "super_admin"].includes(user.role) : false;

  // Delete sale function
  const handleDeleteSale = async (saleId: number) => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to delete sales",
        variant: "destructive",
      });
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this sale? This action cannot be undone and will restore inventory."
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteSaleMutation.mutateAsync(saleId);
      toast({
        title: "Sale Deleted",
        description: "The sale has been successfully deleted and inventory restored.",
        variant: "default",
      });

      // Close the dialog
      setSelectedSale(null);
    } catch (error: unknown) {
      console.error("Error deleting sale:", error);
      const errorMessage =
        error &&
          typeof error === "object" &&
          "response" in error &&
          error.response &&
          typeof error.response === "object" &&
          "data" in error.response &&
          error.response.data &&
          typeof error.response.data === "object" &&
          "message" in error.response.data
          ? (error.response.data as { message: string }).message
          : "Failed to delete sale";

      toast({
        title: "Delete Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Handlers for order actions
  const handleMarkFulfilled = useCallback(async () => {
    if (!selectedOrder) return;

    setIsProcessingOrder(true);
    try {
      // Call the API to update order status to "completed"
      await api.put(`/orders/${selectedOrder.id}`, {
        status: "completed",
        payment_status: "paid",
      });

      // Show success message
      toast({
        title: "Order Fulfilled",
        description: "Order has been marked as fulfilled and inventory has been updated.",
        variant: "default",
      });

      // Close the dialog
      setSelectedOrder(null);

      // Invalidate orders query to refetch
      queryClient.invalidateQueries({ queryKey: ["orders", currentStore?.id] });
    } catch (error: unknown) {
      console.error("Error marking order as fulfilled:", error);
      const errorMessage =
        error &&
          typeof error === "object" &&
          "response" in error &&
          error.response &&
          typeof error.response === "object" &&
          "data" in error.response &&
          error.response.data &&
          typeof error.response.data === "object" &&
          "message" in error.response.data
          ? (error.response.data as { message: string }).message
          : "Failed to mark order as fulfilled. Please try again.";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessingOrder(false);
    }
  }, [selectedOrder, queryClient, currentStore?.id, toast]);

  return (
    <div className="container mx-auto p-4 mt-16">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Sales & Orders</h1>
        <Dialog open={receiptSettingsOpen} onOpenChange={setReceiptSettingsOpen}>
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
            <ReceiptSettings onClose={() => setReceiptSettingsOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      <Tabs value={tab} onValueChange={(v) => setTab(v as "sales" | "orders")} className="w-full mb-4">
        <TabsList>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>
        <TabsContent value="sales">
          {salesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
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
                  {sales?.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>{format(new Date(sale.createdAt), "PPp")}</TableCell>
                      <TableCell>{sale.Customer?.name || "Walk-in Customer"}</TableCell>
                      <TableCell>{sale.User?.name || sale.User?.email || "Unknown User"}</TableCell>
                      <TableCell className="capitalize">{sale.payment_method}</TableCell>
                      <TableCell>
                        <Badge className={getPaymentStatusColor(sale.status)}>{sale.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {sale.receipt_status ? (
                          <div className="flex gap-2">
                            <Badge variant={sale.receipt_status?.sms ? "default" : "outline"}>
                              SMS
                            </Badge>
                            <Badge variant={sale.receipt_status?.whatsapp ? "default" : "outline"}>
                              WhatsApp
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not sent</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(sale.total_amount)}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" onClick={() => setSelectedSale(sale)}>
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => setCurrentPage(page)}
                    isActive={currentPage === page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
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
            {ordersError ? (
              <div className="text-center text-destructive py-8 font-semibold">{ordersError}</div>
            ) : isLoadingOrders ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
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
                  {orders?.map((order: Order) => (
                    <TableRow key={order.id}>
                      <TableCell>{format(new Date(order.createdAt), "PPp")}</TableCell>
                      <TableCell>{order.status}</TableCell>
                      <TableCell>{Array.isArray(order.items) ? order.items.length : 0}</TableCell>
                      <TableCell className="text-right">KSh {order.total_amount}</TableCell>
                      <TableCell>
                        <Button variant="ghost" onClick={() => setSelectedOrder(order)}>
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
            onMarkFulfilled={handleMarkFulfilled}
            isAdmin={isAdmin}
            isProcessing={isProcessingOrder}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedSale} onOpenChange={(open) => !open && setSelectedSale(null)}>
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
                  <p>{selectedSale.Customer?.name || "Walk-in Customer"}</p>
                  {selectedSale.Customer?.email && (
                    <p className="text-sm text-muted-foreground">{selectedSale.Customer.email}</p>
                  )}
                  {selectedSale.Customer?.phone && (
                    <p className="text-sm text-muted-foreground">{selectedSale.Customer.phone}</p>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Payment Information</h3>
                  <p className="capitalize">Method: {selectedSale.payment_method}</p>
                  <div className="flex items-center gap-2">
                    <span>Status:</span>
                    <Badge className={getPaymentStatusColor(selectedSale.status)}>
                      {selectedSale.status}
                    </Badge>
                  </div>
                  <p>Total: {formatCurrency(selectedSale.total_amount)}</p>
                  {selectedSale.receipt_status && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Receipt Status</h4>
                      <div className="flex gap-2">
                        <Badge variant={selectedSale.receipt_status.sms ? "default" : "outline"}>
                          SMS: {selectedSale.receipt_status.sms ? "Sent" : "Not Sent"}
                        </Badge>
                        <Badge
                          variant={selectedSale.receipt_status.whatsapp ? "default" : "outline"}
                        >
                          WhatsApp: {selectedSale.receipt_status.whatsapp ? "Sent" : "Not Sent"}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Sale Information</h3>
                  <p>Date: {format(new Date(selectedSale.createdAt), "PPp")}</p>
                  <p>
                    Cashier: {selectedSale.User?.name || selectedSale.User?.email || "Unknown User"}
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
                            {item.Product?.name || "Unknown Product"}
                            {item.Product?.sku ? (
                              <span className="block text-xs text-muted-foreground">
                                SKU: {item.Product.sku}
                              </span>
                            ) : null}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.unit_price)}
                          </TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button variant="outline" size="sm" onClick={() => {
                  setSaleForReceipt(selectedSale.id);
                  setViewReceiptOpen(true);
                }}>
                  <Receipt className="h-4 w-4 mr-2" />
                  View Receipt
                </Button>
                {isAdmin && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        toast({
                          title: "Edit Sale",
                          description: "Edit functionality will be implemented in the next update.",
                          variant: "default",
                        });
                      }}
                      className="flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit Sale
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteSale(selectedSale.id)}
                      disabled={isDeleting}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      {isDeleting ? "Deleting..." : "Delete Sale"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ReceiptDialog
        open={viewReceiptOpen}
        onOpenChange={setViewReceiptOpen}
        currentSaleId={saleForReceipt}
      />
    </div>
  );
}
