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

export function PurchaseOrders() {
  const dispatch = useDispatch<AppDispatch>();
  const purchaseOrders = useSelector(
    (state: RootState) => state.purchaseOrders.items,
  );
  const purchaseOrdersStatus = useSelector(
    (state: RootState) => state.purchaseOrders.status,
  );
  const { suppliers = [] } = useSuppliers();
  const { products = [] } = useInventory();
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
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/purchase-orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
          credentials: "include",
        },
      );

      if (!response.ok) throw new Error("Failed to create purchase order");

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
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/purchase-orders/${orderId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
          credentials: "include",
        },
      );

      if (!response.ok) throw new Error("Failed to update status");

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

  const PurchaseOrderForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="supplier_id">Supplier</Label>
        <Select
          value={formData.supplier_id}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, supplier_id: value }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a supplier" />
          </SelectTrigger>
          <SelectContent>
            {suppliers.map((supplier) => (
              <SelectItem key={supplier.id} value={supplier.id.toString()}>
                {supplier.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="expected_delivery_date">Expected Delivery Date</Label>
        <Input
          id="expected_delivery_date"
          name="expected_delivery_date"
          type="date"
          value={formData.expected_delivery_date}
          onChange={handleInputChange}
          required
        />
      </div>

      <div>
        <Label>Items</Label>
        {formData.items.map(
          (
            item: PurchaseOrderItem,
            index: number, // Explicitly type map parameters
          ) => (
            <div key={index} className="grid grid-cols-3 gap-2 mt-2">
              <ProductSearch
                products={products}
                onSelect={(product) => handleProductSelect(index, product)}
                searchProducts={async () => {
                  /* Implement search logic */
                }}
              />
              <Input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) =>
                  handleItemChange(index, "quantity", parseInt(e.target.value))
                }
                placeholder="Quantity"
              />
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.buying_price}
                  onChange={(e) =>
                    handleItemChange(
                      index,
                      "buying_price",
                      parseFloat(e.target.value),
                    )
                  }
                  placeholder="Buying Price"
                />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.selling_price}
                  onChange={(e) =>
                    handleItemChange(
                      index,
                      "selling_price",
                      parseFloat(e.target.value),
                    )
                  }
                  placeholder="Selling Price"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeItem(index)}
                >
                  Remove
                </Button>
              </div>
            </div>
          ),
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addItem}
          className="mt-2"
        >
          Add Item
        </Button>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Input
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleInputChange}
        />
      </div>

      <DialogFooter>
        <Button type="submit">Create Purchase Order</Button>
      </DialogFooter>
    </form>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Purchase Orders</h2>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          Create Purchase Order
        </Button>
      </div>

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
            {purchaseOrders.map(
              (
                order: PurchaseOrder & { supplier?: { name: string } }, // Explicitly type order and include optional supplier with name
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
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
            <DialogDescription>
              Fill in the purchase order details below.
            </DialogDescription>
          </DialogHeader>
          <PurchaseOrderForm />
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
