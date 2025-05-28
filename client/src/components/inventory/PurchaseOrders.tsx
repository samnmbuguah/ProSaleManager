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

interface PurchaseOrder {
  id: number;
  order_number: string;
  supplier_id: number;
  order_date: string;
  expected_delivery_date: string | null;
  status: "pending" | "approved" | "ordered" | "received" | "cancelled";
  total_amount: number;
  notes: string | null;
  supplier: {
    name: string;
  };
}

interface PurchaseOrderFormData {
  supplier_id: number;
  expected_delivery_date: string;
  notes: string;
  items: {
    product_id: number;
    quantity: number;
    unit_price: number;
  }[];
}

interface Supplier {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  product_number: string;
  buying_price: number;
}

export function PurchaseOrders() {
  const dispatch = useDispatch<AppDispatch>();
  const purchaseOrders = useSelector(
    (state: RootState) => state.purchaseOrders.items,
  );
  const purchaseOrdersStatus = useSelector(
    (state: RootState) => state.purchaseOrders.status,
  );
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(
    null,
  );
  const [formData, setFormData] = useState<PurchaseOrderFormData>({
    supplier_id: 0,
    expected_delivery_date: "",
    notes: "",
    items: [{ product_id: 0, quantity: 1, unit_price: 0 }],
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
    field: string,
    value: string | number,
  ) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
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
      items: [...prev.items, { product_id: 0, quantity: 1, unit_price: 0 }],
    }));
  };

  const removeItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
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
        supplier_id: 0,
        expected_delivery_date: "",
        notes: "",
        items: [{ product_id: 0, quantity: 1, unit_price: 0 }],
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
      case "ordered":
        return "default";
      case "received":
        return "default";
      case "cancelled":
        return "destructive";
      default:
        return "default";
    }
  };

  const PurchaseOrderForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="supplier_id">Supplier</Label>
        <Select
          value={formData.supplier_id.toString()}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, supplier_id: parseInt(value) }))
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
        {formData.items.map((item, index) => (
          <div key={index} className="grid grid-cols-3 gap-2 mt-2">
            <Select
              value={item.product_id.toString()}
              onValueChange={(value) =>
                handleItemChange(index, "product_id", parseInt(value))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id.toString()}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                value={item.unit_price}
                onChange={(e) =>
                  handleItemChange(
                    index,
                    "unit_price",
                    parseFloat(e.target.value),
                  )
                }
                placeholder="Unit Price"
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
        ))}
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
            {purchaseOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>{order.order_number}</TableCell>
                <TableCell>
                  {order.supplier?.name || "Unknown Supplier"}
                </TableCell>
                <TableCell>
                  {format(new Date(order.order_date), "PPP")}
                </TableCell>
                <TableCell>
                  {order.expected_delivery_date
                    ? format(new Date(order.expected_delivery_date), "PPP")
                    : "Not set"}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(order.status)}>
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell>KSh {order.total_amount.toLocaleString()}</TableCell>
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
                      <SelectItem value="ordered">Ordered</SelectItem>
                      <SelectItem value="received">Received</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
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
