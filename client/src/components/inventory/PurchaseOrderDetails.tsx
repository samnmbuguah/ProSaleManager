import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Supplier } from "@/types/supplier";
import type { PurchaseOrderItem } from "@/types/purchase-order";

interface PurchaseOrderDetailsProps {
  orderId: number | null;
  isOpen: boolean;
  onClose: () => void;
  supplier?: Supplier | null;
  items?: PurchaseOrderItem[];
}

export function PurchaseOrderDetails({
  isOpen,
  onClose,
  supplier,
  items,
}: PurchaseOrderDetailsProps) {
  const formatCurrency = (amount: string | number) => {
    return `KSh ${Number(amount).toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

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

        {Array.isArray(items) && items.length > 0 ? (
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
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.Product?.name || item.product_name || "N/A"}</TableCell>
                    <TableCell>{item.unit_type || "N/A"}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>
                      {item.unit_price != null && !isNaN(Number(item.unit_price))
                        ? formatCurrency(item.unit_price)
                        : "KSh N/A"}
                    </TableCell>
                    <TableCell>
                      {item.Product?.piece_selling_price != null &&
                      !isNaN(Number(item.Product?.piece_selling_price))
                        ? formatCurrency(item.Product.piece_selling_price)
                        : "KSh N/A"}
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
      </DialogContent>
    </Dialog>
  );
}
