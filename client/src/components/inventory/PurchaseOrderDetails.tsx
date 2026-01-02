import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { useAuthContext } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import type { Supplier } from "@/types/supplier";
import type { PurchaseOrderItem } from "@/types/purchase-order";
import { Loader2, Edit } from "lucide-react";

interface PurchaseOrderDetailsProps {
  orderId: number | null;
  isOpen: boolean;
  onClose: () => void;
  supplier?: Supplier | null;
  items?: PurchaseOrderItem[];
}

export function PurchaseOrderDetails({
  orderId,
  isOpen,
  onClose,
  supplier,
  items,
}: PurchaseOrderDetailsProps) {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editedItems, setEditedItems] = useState<PurchaseOrderItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Sync items when they open/change
  useEffect(() => {
    if (items) {
      setEditedItems(JSON.parse(JSON.stringify(items))); // Deep copy
    }
  }, [items, isOpen]);

  // Reset editing state when closing
  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setIsSaving(false);
    }
  }, [isOpen]);

  const formatCurrency = (amount: string | number) => {
    return `KSh ${Number(amount).toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handleItemChange = (index: number, field: keyof PurchaseOrderItem, value: string) => {
    const newItems = [...editedItems];
    const item = { ...newItems[index] };

    // Handle number fields
    if (field === 'quantity' || field === 'unit_price' || field === 'selling_price') {
      const numVal = parseFloat(value);
      // @ts-ignore
      item[field] = isNaN(numVal) ? 0 : numVal;
    } else {
      // @ts-ignore
      item[field] = value;
    }

    newItems[index] = item;
    setEditedItems(newItems);
  };

  const handleSave = async () => {
    if (!orderId) return;

    setIsSaving(true);
    try {
      // Construct payload
      // We only update items for now as per requirement, but endpoint supports notes/dates too
      await api.put(API_ENDPOINTS.purchaseOrders.update(orderId), {
        items: editedItems.map(item => ({
          product_id: item.product_id, // Ensure your backend expects product_id or id? Backend create expects product_id
          quantity: item.quantity,
          unit_price: item.unit_price,
          selling_price: item.selling_price,
          unit_type: item.unit_type
        }))
      });

      toast({ title: "Success", description: "Order details updated." });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      // Don't close dialog, just exit edit mode? or close? let's keep open to show updated

    } catch (error) {
      console.error("Failed to update order:", error);
      toast({ title: "Error", description: "Failed to update order.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const currentItems = isEditing ? editedItems : items;
  const isAdminOrManager = ["admin", "manager", "super_admin"].includes(user?.role as string);

  return (
    <Dialog open={isOpen} onOpenChange={() => {
      if (!isSaving) onClose();
    }}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Purchase Order Details #{orderId}</DialogTitle>
          {!isEditing && isAdminOrManager && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Order
            </Button>
          )}
        </DialogHeader>

        {supplier && (
          <div className="mb-4 bg-muted p-4 rounded-md">
            <h3 className="font-semibold mb-2">Supplier Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="font-medium">Name:</span> {supplier.name}</div>
              <div><span className="font-medium">Email:</span> {supplier.email || 'N/A'}</div>
              <div><span className="font-medium">Phone:</span> {supplier.phone || 'N/A'}</div>
            </div>
          </div>
        )}

        {Array.isArray(currentItems) && currentItems.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Stock Unit</TableHead>
                  <TableHead className="w-24">Quantity</TableHead>
                  <TableHead className="w-32">Buying Price</TableHead>
                  <TableHead className="w-32">Selling Price</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.Product?.name || item.product_name || "N/A"}</TableCell>
                    <TableCell>{item.unit_type || "N/A"}</TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          className="h-8 w-20"
                        />
                      ) : item.quantity}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                          className="h-8 w-28"
                        />
                      ) : (
                        item.unit_price != null && !isNaN(Number(item.unit_price))
                          ? formatCurrency(item.unit_price)
                          : "KSh N/A"
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={item.selling_price ?? ""}
                          onChange={(e) => handleItemChange(index, 'selling_price', e.target.value)}
                          className="h-8 w-28"
                        />
                      ) : (
                        item.selling_price != null && !isNaN(Number(item.selling_price))
                          ? formatCurrency(item.selling_price)
                          : "KSh N/A"
                      )}
                    </TableCell>
                    <TableCell>
                      {item.unit_price != null &&
                        !isNaN(Number(item.unit_price)) &&
                        item.quantity != null &&
                        !isNaN(Number(item.quantity))
                        ? formatCurrency(String(Number(item.unit_price) * Number(item.quantity)))
                        : "KSh N/A"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            No items found for this order.
          </div>
        )}

        {isEditing && (
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
