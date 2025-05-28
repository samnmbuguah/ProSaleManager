import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface PurchaseOrderDetailsProps {
  orderId: number | null;
  isOpen: boolean;
  onClose: () => void;
  supplier?: {
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
}

interface OrderItem {
  id: number;
  quantity: number;
  buying_price: string;
  selling_price: string;
  product: {
    id: number;
    name: string;
    stock_unit: string;
  };
}

export function PurchaseOrderDetails({
  orderId,
  isOpen,
  onClose,
  supplier,
}: PurchaseOrderDetailsProps) {
  const { data: items, isLoading } = useQuery<OrderItem[]>({
    queryKey: ["purchase-order-items", orderId],
    queryFn: async () => {
      if (!orderId) return [];
      const response = await fetch(`/api/purchase-orders/${orderId}/items`);
      if (!response.ok) {
        throw new Error("Failed to fetch order items");
      }
      return response.json();
    },
    enabled: !!orderId,
  });

  const formatCurrency = (amount: string) => {
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

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
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
                {items?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.product.name}</TableCell>
                    <TableCell>{item.product.stock_unit}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatCurrency(item.buying_price)}</TableCell>
                    <TableCell>{formatCurrency(item.selling_price)}</TableCell>
                    <TableCell>
                      {formatCurrency(
                        (Number(item.buying_price) * item.quantity).toString(),
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
