import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";

interface PriceUnit {
  stock_unit: string;
  selling_price: string;
  buying_price: string;
  conversion_rate: string;
}

interface CartItem {
  id: number;
  name: string;
  quantity: number;
  selectedUnit: string;
  unitPrice: number;
  total: number;
  priceUnits: PriceUnit[];
}

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onProcessPayment: (paymentDetails: {
    amountPaid: number;
    change: number;
    items: CartItem[];
  }) => Promise<void>;
}

export function PaymentDialog({
  isOpen,
  onClose,
  cartItems,
  onProcessPayment,
}: PaymentDialogProps) {
  const [amountPaid, setAmountPaid] = useState<string>("");

  const total = cartItems.reduce((sum, item) => sum + item.total, 0);
  const change = parseFloat(amountPaid) - total;
  const isValidPayment = parseFloat(amountPaid) >= total;

  const handlePayment = async () => {
    if (isValidPayment) {
      await onProcessPayment({
        amountPaid: parseFloat(amountPaid),
        change,
        items: cartItems,
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Process Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Cart Items</Label>
            <div className="space-y-2">
              {cartItems.map((item) => (
                <div
                  key={`${item.id}-${item.selectedUnit}`}
                  className="flex justify-between text-sm"
                >
                  <span>
                    {item.name} ({item.quantity} {item.selectedUnit} @{" "}
                    {formatCurrency(item.unitPrice)})
                  </span>
                  <span>{formatCurrency(item.total)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between font-medium">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount-paid">Amount Paid</Label>
            <Input
              id="amount-paid"
              type="number"
              step="0.01"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              className="text-right"
            />
          </div>

          {parseFloat(amountPaid) > 0 && (
            <div className="flex justify-between font-medium">
              <span>Change</span>
              <span>{formatCurrency(change)}</span>
            </div>
          )}

          <Button
            className="w-full"
            onClick={handlePayment}
            disabled={!isValidPayment}
          >
            Complete Payment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
