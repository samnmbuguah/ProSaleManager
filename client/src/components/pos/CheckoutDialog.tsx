import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Customer } from "@/types/customer";

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cartTotal: number;
  deliveryFee: number;
  setDeliveryFee: (fee: number) => void;
  paymentMethod: "cash" | "mpesa";
  setPaymentMethod: (method: "cash" | "mpesa") => void;
  customers: Customer[];
  selectedCustomer: number | null;
  setSelectedCustomer: (id: number | null) => void;
  onCheckout: (amountTendered: number, change: number) => void;
  isLoadingCheckout: boolean;
}

export const CheckoutDialog: React.FC<CheckoutDialogProps> = ({
  open,
  onOpenChange,
  cartTotal,
  deliveryFee,
  setDeliveryFee,
  paymentMethod,
  setPaymentMethod,
  customers,
  selectedCustomer,
  setSelectedCustomer,
  onCheckout,
  isLoadingCheckout,
}) => {
  // Set Walk-in Customer as default when dialog opens
  useEffect(() => {
    if (open && customers.length > 0 && !selectedCustomer) {
      const walkInCustomer = customers.find((c) => c.name === "Walk-in Customer");
      if (walkInCustomer) {
        setSelectedCustomer(walkInCustomer.id);
      }
    }
  }, [open, customers, selectedCustomer, setSelectedCustomer]);
  const [amountTendered, setAmountTendered] = useState("");
  const total = cartTotal + deliveryFee;
  const tendered = parseFloat(amountTendered);
  const balance = paymentMethod === "cash" && !isNaN(tendered) ? tendered - total : 0;
  const canCheckout = paymentMethod === "cash" ? tendered >= total : true;

  useEffect(() => {
    if (paymentMethod !== "cash") setAmountTendered("");
  }, [paymentMethod]);

  // Auto-select Walk-in Customer if none is selected when dialog opens
  useEffect(() => {
    if (open && (!selectedCustomer || !customers.some((c) => c.id === selectedCustomer))) {
      const walkIn = customers.find((c) => c.name === "Walk-in Customer");
      if (walkIn) setSelectedCustomer(walkIn.id);
    }
  }, [open, customers, selectedCustomer, setSelectedCustomer]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete Sale</DialogTitle>
          <DialogDescription>Select payment method and customer details</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="mpesa">M-Pesa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Customer (Optional)</Label>
            <Select
              value={selectedCustomer ? selectedCustomer.toString() : ""}
              onValueChange={(value) => {
                if (value === "" || value === "walk_in") {
                  const walkIn = customers.find((c) => c.name === "Walk-in Customer");
                  if (walkIn) setSelectedCustomer(walkIn.id);
                  else setSelectedCustomer(null);
                } else {
                  setSelectedCustomer(parseInt(value));
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.find((c) => c.name === "Walk-in Customer") && (
                  <SelectItem
                    value={customers.find((c) => c.name === "Walk-in Customer")!.id.toString()}
                  >
                    Walk-in Customer
                  </SelectItem>
                )}
                {(customers || [])
                  .filter((c) => c.name !== "Walk-in Customer")
                  .map((customer) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Delivery Fee</Label>
            <Input
              type="number"
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(Number(e.target.value))}
              min={0}
              step={0.01}
              placeholder="200"
            />
          </div>
          <div className="pt-4 space-y-2">
            <div className="flex justify-between text-lg font-bold">
              <span>Total Amount:</span>
              <span>KSh {total.toFixed(2)}</span>
            </div>
            {paymentMethod === "cash" && (
              <div className="space-y-2 mt-2 p-3 rounded bg-blue-50 border">
                <Label htmlFor="amount-tendered">Amount Tendered</Label>
                <Input
                  id="amount-tendered"
                  type="number"
                  min={total}
                  step={0.01}
                  value={amountTendered}
                  onChange={(e) => setAmountTendered(e.target.value)}
                  placeholder="Enter amount tendered"
                />
                <div className="flex justify-between text-base mt-2">
                  <span>Balance:</span>
                  <span
                    className={balance < 0 ? "text-red-600 font-bold" : "text-green-700 font-bold"}
                  >
                    KSh {balance >= 0 ? balance.toFixed(2) : "0.00"}
                  </span>
                </div>
                {balance < 0 && (
                  <div className="text-xs text-red-500 mt-1">
                    Amount tendered must be at least total
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => onCheckout(tendered, balance)}
            disabled={isLoadingCheckout || !canCheckout}
          >
            {isLoadingCheckout ? "Processing..." : "Complete Sale"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
