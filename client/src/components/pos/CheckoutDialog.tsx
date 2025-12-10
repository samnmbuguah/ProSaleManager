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
import { Switch } from "@/components/ui/switch";
import type { Customer } from "@/types/customer";

export interface PaymentDetails {
  cash?: number;
  mpesa?: number;
}

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cartTotal: number;
  deliveryFee: number;
  setDeliveryFee: (fee: number) => void;
  paymentMethod: "cash" | "mpesa" | "split";
  setPaymentMethod: (method: "cash" | "mpesa" | "split") => void;
  setPaymentDetails?: (details: PaymentDetails | null) => void;
  customers: Customer[];
  selectedCustomer: number | null;
  setSelectedCustomer: (id: number | null) => void;
  onCheckout: (amountTendered: number, change: number, historicalDate?: string) => void;
  isLoadingCheckout: boolean;
  isHistoricalMode: boolean;
}

export const CheckoutDialog: React.FC<CheckoutDialogProps> = ({
  open,
  onOpenChange,
  cartTotal,
  deliveryFee,
  setDeliveryFee,
  paymentMethod,
  setPaymentMethod,
  setPaymentDetails,
  customers,
  selectedCustomer,
  setSelectedCustomer,
  onCheckout,
  isLoadingCheckout,
  isHistoricalMode,
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
  const [isHistoricalSale, setIsHistoricalSale] = useState(false);
  const [historicalDate, setHistoricalDate] = useState("");
  const [historicalTime, setHistoricalTime] = useState("");

  // Split payment state
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [cashAmount, setCashAmount] = useState("");
  const [mpesaAmount, setMpesaAmount] = useState("");

  const total = Number(cartTotal) + Number(deliveryFee);
  const tendered = parseFloat(amountTendered) || 0;

  // For split payments
  const splitCash = parseFloat(cashAmount) || 0;
  const splitMpesa = parseFloat(mpesaAmount) || 0;
  const splitTotal = splitCash + splitMpesa;
  const splitRemaining = total - splitTotal;

  // Calculate balance/change
  const balance = paymentMethod === "cash" && !isSplitPayment && !isNaN(tendered) ? tendered - total : 0;

  // Validation
  const canCheckoutSingle = paymentMethod === "cash" ? tendered >= total : true;
  const canCheckoutSplit = isSplitPayment && splitTotal >= total;
  const canCheckout = isSplitPayment ? canCheckoutSplit : canCheckoutSingle;

  // Reset when dialog opens/closes
  useEffect(() => {
    if (open) {
      setIsSplitPayment(false);
      setCashAmount("");
      setMpesaAmount("");
      setAmountTendered("");
    }
  }, [open]);

  useEffect(() => {
    if (paymentMethod !== "cash") setAmountTendered("");
  }, [paymentMethod]);

  // Handle split payment toggle
  useEffect(() => {
    if (isSplitPayment) {
      setPaymentMethod("split");
      if (setPaymentDetails) {
        setPaymentDetails({ cash: splitCash, mpesa: splitMpesa });
      }
    } else {
      if (paymentMethod === "split") {
        setPaymentMethod("cash");
      }
      if (setPaymentDetails) {
        setPaymentDetails(null);
      }
    }
  }, [isSplitPayment, splitCash, splitMpesa, setPaymentMethod, setPaymentDetails, paymentMethod]);

  // Update payment details when amounts change
  useEffect(() => {
    if (isSplitPayment && setPaymentDetails) {
      const details: PaymentDetails = {};
      if (splitCash > 0) details.cash = splitCash;
      if (splitMpesa > 0) details.mpesa = splitMpesa;
      setPaymentDetails(Object.keys(details).length > 0 ? details : null);
    }
  }, [splitCash, splitMpesa, isSplitPayment, setPaymentDetails]);

  // Auto-select Walk-in Customer if none is selected when dialog opens
  useEffect(() => {
    if (open && (!selectedCustomer || !customers.some((c) => c.id === selectedCustomer))) {
      const walkIn = customers.find((c) => c.name === "Walk-in Customer");
      if (walkIn) setSelectedCustomer(walkIn.id);
    }
  }, [open, customers, selectedCustomer, setSelectedCustomer]);

  // Reset historical sale state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setIsHistoricalSale(false);
      setHistoricalDate("");
      setHistoricalTime("");
    }
  }, [open]);

  // Set default date/time when historical sale is enabled
  useEffect(() => {
    if (isHistoricalSale && !historicalDate) {
      const now = new Date();
      setHistoricalDate(now.toISOString().split("T")[0]);
      setHistoricalTime(now.toTimeString().slice(0, 5));
    }
  }, [isHistoricalSale, historicalDate]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Sale</DialogTitle>
          <DialogDescription>Select payment method and customer details</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Historical Sale Toggle - Only show if historical mode is enabled */}
          {isHistoricalMode && (
            <div className="space-y-2 p-3 rounded bg-yellow-50 border border-yellow-200">
              <div className="flex items-center gap-2">
                <Switch
                  id="historical-sale"
                  checked={isHistoricalSale}
                  onCheckedChange={setIsHistoricalSale}
                />
                <Label htmlFor="historical-sale" className="text-sm font-medium">
                  Historical Sale
                </Label>
              </div>
              {isHistoricalSale && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="space-y-1">
                    <Label htmlFor="historical-date" className="text-xs">
                      Date
                    </Label>
                    <Input
                      id="historical-date"
                      type="date"
                      value={historicalDate}
                      onChange={(e) => setHistoricalDate(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="historical-time" className="text-xs">
                      Time
                    </Label>
                    <Input
                      id="historical-time"
                      type="time"
                      value={historicalTime}
                      onChange={(e) => setHistoricalTime(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Split Payment Toggle */}
          <div className="flex items-center justify-between p-3 rounded bg-blue-50 border border-blue-200">
            <div>
              <Label htmlFor="split-payment" className="text-sm font-medium">
                Split Payment
              </Label>
              <p className="text-xs text-gray-500">Pay with Cash + M-Pesa</p>
            </div>
            <Switch
              id="split-payment"
              checked={isSplitPayment}
              onCheckedChange={setIsSplitPayment}
            />
          </div>

          {!isSplitPayment ? (
            /* Single Payment Mode */
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod === "split" ? "cash" : paymentMethod} onValueChange={(v) => setPaymentMethod(v as "cash" | "mpesa")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="mpesa">M-Pesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            /* Split Payment Mode */
            <div className="space-y-3 p-3 rounded bg-green-50 border border-green-200">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="cash-amount" className="text-sm">Cash Amount</Label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">KSh</span>
                    <Input
                      id="cash-amount"
                      type="number"
                      min={0}
                      step={0.01}
                      value={cashAmount}
                      onChange={(e) => setCashAmount(e.target.value)}
                      placeholder="0.00"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="mpesa-amount" className="text-sm">M-Pesa Amount</Label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">KSh</span>
                    <Input
                      id="mpesa-amount"
                      type="number"
                      min={0}
                      step={0.01}
                      value={mpesaAmount}
                      onChange={(e) => setMpesaAmount(e.target.value)}
                      placeholder="0.00"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span>Split Total:</span>
                <span className={splitTotal >= total ? "text-green-600 font-bold" : "text-gray-600"}>
                  KSh {splitTotal.toFixed(2)}
                </span>
              </div>
              {splitRemaining > 0 && (
                <div className="flex justify-between text-sm text-orange-600">
                  <span>Remaining:</span>
                  <span className="font-bold">KSh {splitRemaining.toFixed(2)}</span>
                </div>
              )}
              {splitTotal > total && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Change:</span>
                  <span className="font-bold">KSh {(splitTotal - total).toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

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
              placeholder="0"
            />
          </div>
          <div className="pt-4 space-y-2">
            <div className="flex justify-between text-lg font-bold">
              <span>Total Amount:</span>
              <span>KSh {total.toFixed(2)}</span>
            </div>
            {paymentMethod === "cash" && !isSplitPayment && (
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
            onClick={() => {
              const historicalDateTime =
                isHistoricalSale && historicalDate && historicalTime
                  ? `${historicalDate}T${historicalTime}:00`
                  : undefined;
              const finalTendered = isSplitPayment ? splitTotal : tendered;
              const finalChange = isSplitPayment ? Math.max(0, splitTotal - total) : balance;
              onCheckout(finalTendered, finalChange, historicalDateTime);
            }}
            disabled={
              isLoadingCheckout ||
              !canCheckout ||
              (isHistoricalSale && (!historicalDate || !historicalTime))
            }
          >
            {isLoadingCheckout ? "Processing..." : "Complete Sale"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
