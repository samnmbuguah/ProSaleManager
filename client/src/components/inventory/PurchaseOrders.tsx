import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/store";
import { fetchPurchaseOrders } from "@/store/purchaseOrdersSlice";
import { useSuppliers } from "@/hooks/use-suppliers";
import { useInventory } from "@/hooks/use-inventory";
import { ProductSearch } from "@/components/pos/ProductSearch";
import type {
  PurchaseOrder,
  PurchaseOrderFormData,
  PurchaseOrderItem,
} from "@/types/purchase-order"; // Import PurchaseOrderItem
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { api } from "@/lib/api";
import type { Product } from "@/types/product";
import { PurchaseOrderForm } from "./PurchaseOrderForm";

export function PurchaseOrders() {
  const dispatch = useDispatch<AppDispatch>();
  const purchaseOrders = useSelector(
    (state: RootState) => state.purchaseOrders.items,
  );
  const purchaseOrdersStatus = useSelector(
    (state: RootState) => state.purchaseOrders.status,
  );
  const { suppliers, isLoading: suppliersLoading } = useSuppliers();
  const { products, isLoading: productsLoading } = useInventory();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [formData, setFormData] = useState<PurchaseOrderFormData>({
    supplier_id: "",
    expected_delivery_date: "",
    notes: "",
    items: [],
  });
  const { toast } = useToast();

  useEffect(() => {
    if (purchaseOrdersStatus === "idle") {
      dispatch(fetchPurchaseOrders());
    }
  }, [dispatch, purchaseOrdersStatus]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleItemChange = (
    index: number,
    field: keyof PurchaseOrderItem, // Use keyof PurchaseOrderItem
    value: string | number,
  ) => {
    setFormData((prev) => {
      const newItems: PurchaseOrderItem[] = [...prev.items]; // Explicitly type newItems
      newItems[index] = {
        ...newItems[index],
        [field]: value,
      };
      return {
        ...prev,
        items: newItems,
      };
    });
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product_id: 0,
          quantity: 1,
          buying_price: 0,
          selling_price: 0,
          name: "",
        } as PurchaseOrderItem,
      ], // Added buying_price and selling_price
    }));
  };

  const removeItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter(
        (_item: PurchaseOrderItem, i: number) => i !== index,
      ), // Explicitly type filter parameters
    }));
  };

  const handleProductSelect = (index: number, product: Product) => {
    setFormData((prev) => {
      const newItems: PurchaseOrderItem[] = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        product_id: product.id,
        buying_price: Number(product.buying_price), // Set buying_price
        selling_price: Number(product.selling_price), // Set selling_price
        // unit_price is not in PurchaseOrderItem
      };
      return { ...prev, items: newItems };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Prevent submission if any item has invalid product_id
    const invalidItem = formData.items.find(
      (item) => !item.product_id || item.product_id === 0
    );
    if (invalidItem) {
      toast({
        title: "Error",
        description: "Please select a valid product for each item before submitting.",
        variant: "destructive",
      });
      return;
    }
    try {
      await api.post(API_ENDPOINTS.purchaseOrders.create, formData);

      toast({
        title: "Success",
        description: "Purchase order created successfully",
      });

      setFormData({
        supplier_id: "",
        expected_delivery_date: "",
        notes: "",
        items: [],
      });
      setIsAddDialogOpen(false);
      dispatch(fetchPurchaseOrders());
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to create purchase order",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (
    orderId: number,
    newStatus: PurchaseOrder["status"],
  ) => {
    try {
      await api.put(`${API_ENDPOINTS.purchaseOrders.update(orderId)}/status`, {
        status: newStatus,
      });

      toast({
        title: "Success",
        description: "Status updated successfully",
      });

      dispatch(fetchPurchaseOrders());
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: PurchaseOrder["status"]) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      case "completed":
        return "default"; // Assuming completed is also a 'default' visual style
      default:
        return "default";
    }
  };

  const submitDisabled = formData.items.some(
    (item) => !item.product_id || item.product_id === 0,
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Purchase Orders</h2>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          Create Purchase Order
        </Button>
      </div>

      {/* Error handling for non-array purchaseOrders */}
      {(!Array.isArray(purchaseOrders) || purchaseOrders.length === 0) ? (
        <div className="p-4 text-center text-muted-foreground">
          {purchaseOrdersStatus === "loading"
            ? "Loading purchase orders..."
            : "No purchase orders found or failed to load."}
        </div>
      ) : (
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
              {purchaseOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No purchase orders found or failed to load.
                  </TableCell>
                </TableRow>
              ) : (
                purchaseOrders.map(
                  (
                    order: PurchaseOrder & { supplier?: { name: string } },
                  ) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.id}</TableCell>{" "}
                      {/* Assuming id is used for order number */}
                      <TableCell>
                        {order.supplier?.name || "Unknown Supplier"}
                      </TableCell>
                      <TableCell>
                        {order.created_at
                          ? format(new Date(order.created_at), "PPP")
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {order.expected_delivery_date
                          ? format(new Date(order.expected_delivery_date), "PPP")
                          : "Not set"}{" "}
                        {/* Check for null before formatting */}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(order.status)}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        KSh {order.total_amount.toLocaleString()}
                      </TableCell>
                      <TableCell>{order.notes || "No notes"}</TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(value) =>
                            handleStatusChange(
                              order.id,
                              value as PurchaseOrder["status"],
                            )
                          }
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ),
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
          <PurchaseOrderForm
            suppliers={Array.isArray(suppliers) ? suppliers : []}
            suppliersLoading={suppliersLoading}
            products={Array.isArray(products) ? products : []}
            formData={formData}
            onSupplierChange={(value) =>
              setFormData((prev) => ({ ...prev, supplier_id: value }))
            }
            onInputChange={handleInputChange}
            onProductSelect={handleProductSelect}
            onItemChange={handleItemChange}
            onRemoveItem={removeItem}
            onAddItem={addItem}
            onSubmit={handleSubmit}
            submitDisabled={submitDisabled}
          />
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
          {/* {selectedOrder && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Order Information</h3>
                <p>Order Number: {selectedOrder.order_number}</p>
                <p>Supplier: {selectedOrder.supplier.name}</p>
                <p>
                  Order Date:{" "}
                  {format(new Date(selectedOrder.order_date), "MMM d, yyyy")}
                </p>
                <p>
                  Expected Delivery:{" "}
                  {selectedOrder.expected_delivery_date
                    ? format(
                        new Date(selectedOrder.expected_delivery_date),
                        "MMM d, yyyy",
                      )
                    : "-"}
                </p>
                <p>Status: {selectedOrder.status}</p>
                <p>
                  Total Amount: KSh{" "}
                  {selectedOrder.total_amount.toLocaleString("en-KE")}
                </p>
              </div>
              {selectedOrder.notes && (
                <div>
                  <h3 className="font-medium">Notes</h3>
                  <p>{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          )} */}
        </DialogContent>
      </Dialog>
    </div>
  );
}
