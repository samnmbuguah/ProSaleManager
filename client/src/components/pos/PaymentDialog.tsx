import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import type { CartItem, PaymentDetails } from "@/types/pos";

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onProcessPayment: (details: PaymentDetails) => void;
}

export function PaymentDialog({ isOpen, onClose, cartItems, onProcessPayment }: PaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [amountPaid, setAmountPaid] = useState<string>("");

  const total = cartItems.reduce((sum, item) => sum + item.total, 0);
  const change = Math.max(0, Number(amountPaid) - total);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amountPaid || isNaN(Number(amountPaid))) {
      alert("Please enter a valid amount");
      return;
    }

    if (Number(amountPaid) < total && paymentMethod === "cash") {
      alert("Amount paid must be greater than or equal to total");
      return;
    }

    onProcessPayment({
      paymentMethod,
      amountPaid: Number(amountPaid),
      change
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Payment Details</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="payment-method">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger id="payment-method">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="mpesa">M-Pesa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="amount">Amount Paid</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min={paymentMethod === "cash" ? total : "0"}
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              required
            />
          </div>

          {paymentMethod === "cash" && (
            <div>
              <Label>Change</Label>
              <div className="text-lg font-semibold">
                {change.toLocaleString("en-KE", {
                  style: "currency",
                  currency: "KES",
                })}
              </div>
            </div>
          )}

          <div>
            <Label>Total</Label>
            <div className="text-lg font-semibold">
              {total.toLocaleString("en-KE", {
                style: "currency",
                currency: "KES",
              })}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Process Payment</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
