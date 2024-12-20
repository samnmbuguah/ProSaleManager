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

import type { CartItem, PaymentDetails } from "../../types/pos";

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onProcessPayment: (paymentDetails: PaymentDetails) => Promise<void>;
}

export function PaymentDialog({
  isOpen,
  onClose,
  cartItems,
  onProcessPayment,
}: PaymentDialogProps) {
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mpesa">("cash");

  const total = cartItems.reduce((sum, item) => sum + item.total, 0);
  const change = parseFloat(amountPaid) - total;
  const isValidPayment = paymentMethod === "mpesa" || parseFloat(amountPaid) >= total;

  const handlePayment = async () => {
    if (isValidPayment) {
      await onProcessPayment({
        amountPaid: paymentMethod === "mpesa" ? total : parseFloat(amountPaid),
        change: paymentMethod === "mpesa" ? 0 : change,
        items: cartItems,
        paymentMethod,
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

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={paymentMethod === "cash" ? "default" : "outline"}
              onClick={() => setPaymentMethod("cash")}
            >
              Cash Payment
            </Button>
            <Button
              variant={paymentMethod === "mpesa" ? "default" : "outline"}
              onClick={() => {
                setPaymentMethod("mpesa");
                setAmountPaid("");
              }}
            >
              M-Pesa
            </Button>
          </div>

          {paymentMethod === "cash" && (
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
          )}

          {paymentMethod === "cash" && parseFloat(amountPaid) > 0 && (
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
            {paymentMethod === "mpesa" ? "Complete M-Pesa Payment" : "Complete Cash Payment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
