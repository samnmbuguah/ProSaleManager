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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { useInventory } from "@/hooks/use-inventory";
import type {
  PurchaseOrder,
  PurchaseOrderFormData,
  PurchaseOrderItem,
} from "@/types/purchase-order";
import { api } from "@/lib/api";
import { PurchaseOrderForm } from "./PurchaseOrderForm";
import ProductSearchBar from "./ProductSearchBar";
import { useSuppliers } from "@/hooks/use-suppliers";
import { useQueryClient } from "@tanstack/react-query";
import { purchaseOrderSchema } from "@/types/purchase-order";
import { useAuthContext } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import Swal from "sweetalert2";
import { usePurchaseOrders } from "@/hooks/use-purchase-orders";
import { PurchaseOrderDetails } from "./PurchaseOrderDetails";
import type { Supplier } from "@/types/supplier";
import { AppRole } from "@/types/user";

export function PurchaseOrders({
  purchaseOrders: propPurchaseOrders,
  loading,
}: {
  purchaseOrders: PurchaseOrder[];
  loading: boolean;
}) {
  const { products } = useInventory();
  const { suppliers, isLoading: suppliersLoading } = useSuppliers();
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState<PurchaseOrderFormData>({
    items: [],
    supplier_id: "",
    expected_delivery_date: "",
    notes: "",
  });
  const { toast } = useToast();
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Product search state for purchase order dialog
  const [searchQuery, setSearchQuery] = useState("");
  const [markingReceivedId, setMarkingReceivedId] = useState<number | null>(null);
  const [productsList, setProductsList] = useState(products);
  const [productDropdownOpen, setProductDropdownOpen] = useState<boolean[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

  // Use React Query for purchase orders
  const {
    purchaseOrders,
    isLoading: purchaseOrdersLoading,
    createPurchaseOrder,
    updatePurchaseOrderStatus,
  } = usePurchaseOrders();

  useEffect(() => {
    if (Array.isArray(products)) {
      // setFilteredProducts(products) // This line is removed
    }
  }, [products]);

  useEffect(() => {
    if (isAddDialogOpen) {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    }
  }, [isAddDialogOpen, queryClient]);

  const handleProductSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setProductsList(products);
      setProductDropdownOpen((prev) => {
        const arr = [...prev];
        if (formData.items.length > 0) arr[formData.items.length - 1] = true;
        return arr;
      });
      return;
    }
    // setProductsLoading(true) // This line is removed
    try {
      const response = await api.get(`/products/search?q=${encodeURIComponent(query)}`);
      setProductsList(response.data.data);
      // Open dropdown for the most recent item
      setProductDropdownOpen((prev) => {
        const arr = [...prev];
        if (formData.items.length > 0) arr[formData.items.length - 1] = true;
        return arr;
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast({
          title: "Error",
          description: "Failed to search products",
          variant: "destructive",
        });
      }
    } finally {
      // setProductsLoading(false) // This line is removed
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const removeItem = (index: number) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData((prev) => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    // Only allow adding if all current items are complete
    const incomplete = formData.items.some(
      (item) =>
        !item.product_id ||
        !item.unit_type ||
        !item.quantity ||
        item.quantity <= 0 ||
        !item.buying_price ||
        item.buying_price < 0
    );
    if (incomplete) {
      toast({
        title: "Error",
        description: "Please complete all current items before adding a new one.",
        variant: "destructive",
      });
      return;
    }
    const newItem = {
      quantity: 1,
      product_id: "",
      product_name: "",
      buying_price: 0,
      selling_price: 0,
      unit_type: "piece",
    };
    setFormData((prev) => ({ ...prev, items: [...prev.items, newItem] }));
    setProductDropdownOpen((prev) => [...prev, false]);
  };

  const handleAutoFillLowStock = (products: Product[]) => {
    const newItems: PurchaseOrderItem[] = products.map((product) => ({
      quantity: 1, // Default quantity, user can adjust
      product_id: product.id,
      product_name: product.name,
      buying_price: product.piece_buying_price,
      selling_price: product.piece_selling_price,
      unit_type: "piece", // Default to piece, user can change
    }));

    // Add new items to existing items
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, ...newItems]
    }));

    // Update dropdown state for new items
    setProductDropdownOpen((prev) => [...prev, ...new Array(products.length).fill(false)]);

    toast({
      title: "Success",
      description: `Added ${products.length} low stock products to the order.`,
    });
  };

  // Helper to check if form is valid
  const isFormValid = () => {
    if (!formData.supplier_id || !formData.expected_delivery_date) return false;
    if (!formData.items.length) return false;
    const errors: { [key: string]: string } = {};
    formData.items.forEach((item, idx) => {
      if (!item.product_id) errors[`item_${idx}_product`] = "Product is required.";
      if (!item.unit_type) errors[`item_${idx}_unit`] = "Unit is required.";
      if (!item.quantity || item.quantity <= 0)
        errors[`item_${idx}_quantity`] = "Quantity must be positive.";
      if (item.buying_price == null || item.buying_price < 0)
        errors[`item_${idx}_buying_price`] = "Buying price must be 0 or more.";
    });
    return Object.keys(errors).length === 0;
  };

  // Replace handleStatusChange to use updatePurchaseOrderStatus
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

  // Replace handleMarkReceived to use updatePurchaseOrderStatus
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

  const getStatusBadgeVariant = (status: PurchaseOrder["status"]) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      case "completed":
        return "outline";
      default:
        return "default";
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
    if (currentStatus === "approved" && userRole === "sales") {
      return ["received"];
    }
    return [];
  }

  // Check if status can be changed
  const canChangeStatus = (currentStatus: PurchaseOrder["status"]) => {
    return getAvailableStatuses(currentStatus, user?.role).length > 0;
  };

  // Replace handleFormSubmit to use createPurchaseOrder
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    // Extra validation for each item
    const errors: { [key: string]: string } = {};
    formData.items.forEach((item, idx) => {
      if (!item.product_id) errors[`item_${idx}_product`] = "Product is required.";
      if (!item.unit_type) errors[`item_${idx}_unit`] = "Unit is required.";
      if (!item.quantity || item.quantity <= 0)
        errors[`item_${idx}_quantity`] = "Quantity must be positive.";
      if (item.buying_price == null || item.buying_price < 0)
        errors[`item_${idx}_buying_price`] = "Buying price must be 0 or more.";
    });
    if (!formData.supplier_id) errors.supplier_id = "Supplier is required.";
    if (!formData.expected_delivery_date)
      errors.expected_delivery_date = "Expected delivery date is required.";
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast({
        title: "Error",
        description: "Please fix the errors in the form.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const validated = purchaseOrderSchema.parse(formData);
      const itemsWithUnitType = validated.items.map((item) => ({
        ...item,
        unit_type: item.unit_type || "piece",
        unit_price: item.buying_price ?? 0,
      }));
      await createPurchaseOrder({
        ...validated,
        supplier_id: Number(validated.supplier_id),
        items: itemsWithUnitType,
        total: itemsWithUnitType
          .reduce((sum, item) => sum + item.quantity * item.buying_price, 0)
          .toString(),
      });
      setIsAddDialogOpen(false);
      setFormData({
        items: [],
        supplier_id: "",
        expected_delivery_date: "",
        notes: "",
      });
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        "errors" in err &&
        Array.isArray((err as { errors?: Array<{ path: string[]; message: string }> }).errors)
      ) {
        const errors: { [key: string]: string } = {};
        (err as { errors: Array<{ path: string[]; message: string }> }).errors.forEach(
          (e: { path: string[]; message: string }) => {
            errors[e.path[0]] = e.message;
          }
        );
        setFormErrors(errors);
      } else {
        toast({
          title: "Error",
          description: "Failed to create purchase order",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Use purchaseOrders from React Query, fallback to prop for SSR
  const orders = purchaseOrders || propPurchaseOrders || [];
  const isLoading = purchaseOrdersLoading || loading;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Purchase Orders</h2>
        {/* Allow both admin and sales to create purchase orders */}
        {user && ((user.role as AppRole) === "admin" || (user.role as AppRole) === "sales") && (
          <Button onClick={() => setIsAddDialogOpen(true)}>Create Purchase Order</Button>
        )}
      </div>
      {!Array.isArray(orders) || orders.length === 0 ? (
        <div className="p-4 text-center text-muted-foreground">
          {isLoading ? "Loading purchase orders..." : "No purchase orders found or failed to load."}
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
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No purchase orders found or failed to load.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order: PurchaseOrder & { supplier?: { name: string } }) => (
                  <TableRow
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell>{order.id}</TableCell>
                    <TableCell>
                      {/* Show supplier name from either Supplier or supplier field */}
                      {order.supplier?.name || "Unknown Supplier"}
                    </TableCell>
                    <TableCell>
                      {/* Use order_date, createdAt, or created_at for order date */}
                      {order.created_at
                        ? format(new Date(order.created_at), "PPP")
                        : order.created_at
                          ? format(new Date(order.created_at), "PPP")
                          : ""}
                    </TableCell>
                    <TableCell>
                      {order.expected_delivery_date
                        ? format(new Date(order.expected_delivery_date), "PPP")
                        : "Not set"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(order.status)}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      KSh{" "}
                      {order.total_amount != null && !isNaN(Number(order.total_amount))
                        ? Number(order.total_amount).toLocaleString()
                        : "0"}
                    </TableCell>
                    <TableCell>{order.notes}</TableCell>
                    <TableCell>
                      {canChangeStatus(order.status) && order.status === "pending" ? (
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(order.id, "approved");
                            }}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(order.id, "rejected");
                            }}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : null}
                      {/* Mark as Received button for approved orders */}
                      {order.status === "approved" && (
                        <Button
                          variant="default"
                          size="sm"
                          className="ml-2"
                          disabled={markingReceivedId === order.id}
                          onClick={() => handleMarkReceived(order.id)}
                        >
                          {markingReceivedId === order.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Mark as Received"
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
            <DialogDescription>Fill in the purchase order details below.</DialogDescription>
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
                  const alreadyAdded = formData.items.some(
                    (item) => item.product_id === product.id
                  );
                  return (
                    <li
                      key={product.id}
                      className="flex items-center justify-between p-1 border-b last:border-b-0"
                    >
                      <span>
                        {product.name} {product.sku ? `(${product.sku})` : ""}
                      </span>
                      <button
                        type="button"
                        className={`ml-2 px-2 py-1 rounded text-white ${alreadyAdded ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
                        disabled={alreadyAdded}
                        onClick={() => {
                          if (!alreadyAdded) {
                            // Use product.stock_unit as the default unit_type, do not fallback to 'piece'
                            const defaultUnit = product.stock_unit;
                            if (!defaultUnit) {
                              toast({
                                title: "Error",
                                description:
                                  "This product does not have a default stock unit set. Please edit the product to set a stock unit before adding to a purchase order.",
                                variant: "destructive",
                              });
                              return;
                            }
                            // Set buying/selling price based on default unit
                            let buying_price = 0;
                            let selling_price = 0;
                            if (defaultUnit === "piece") {
                              buying_price = product.piece_buying_price || 0;
                              selling_price = product.piece_selling_price || 0;
                            } else if (defaultUnit === "pack") {
                              buying_price = product.pack_buying_price || 0;
                              selling_price = product.pack_selling_price || 0;
                            } else if (defaultUnit === "dozen") {
                              buying_price = product.dozen_buying_price || 0;
                              selling_price = product.dozen_selling_price || 0;
                            }
                            setFormData((prev) => ({
                              ...prev,
                              items: [
                                ...prev.items,
                                {
                                  product_id: product.id,
                                  product_name:
                                    product.name + (product.sku ? ` (${product.sku})` : ""),
                                  quantity: 1,
                                  buying_price,
                                  selling_price,
                                  unit_type: defaultUnit,
                                },
                              ],
                            }));
                          }
                        }}
                      >
                        {alreadyAdded ? "Added" : "Add"}
                      </button>
                    </li>
                  );
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
              onItemChange={(
                index: number,
                field: string,
                value: string | number,
                extra?: Record<string, unknown>
              ) => {
                const newItems: PurchaseOrderItem[] = [...formData.items];
                newItems[index] = {
                  ...newItems[index],
                  [field]: value,
                  ...extra,
                };
                setFormData((prev) => ({ ...prev, items: newItems }));
              }}
              onRemoveItem={removeItem}
              products={productsList}
              suppliers={suppliers || []}
              suppliersLoading={suppliersLoading}
              productDropdownOpen={productDropdownOpen}
              setProductDropdownOpen={(index, open) =>
                setProductDropdownOpen((prev) => {
                  const arr = [...prev];
                  arr[index] = open;
                  return arr;
                })
              }
              onAddItem={addItem}
              onAutoFillLowStock={handleAutoFillLowStock}
              formErrors={formErrors}
              isSubmitting={isSubmitting}
              isFormValid={isFormValid}
            />
          </form>
        </DialogContent>
      </Dialog>
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
