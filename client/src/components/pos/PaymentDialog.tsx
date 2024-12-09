import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCustomers } from "@/hooks/use-customers";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Phone, Mail, Receipt, User } from "lucide-react";
import { LoyaltyPointsSection } from "./LoyaltyPointsSection";

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onComplete: (paymentMethod: string, customerId?: number, usePoints?: number, cashAmount?: string) => void;
  total: number;
  isProcessing: boolean;
}

export function PaymentDialog({
  open,
  onClose,
  onComplete,
  total,
  isProcessing
}: PaymentDialogProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>();
  const [pointsToUse, setPointsToUse] = useState(0);
  const [cashAmount, setCashAmount] = useState("");
  const [showCashDialog, setShowCashDialog] = useState(false);
  const { customers, searchCustomers } = useCustomers();
  const [query, setQuery] = useState("");
  const selectedCustomer = customers?.find(c => c.id === selectedCustomerId);

  const handlePayment = async (method: string) => {
    if (method === "cash") {
      setShowCashDialog(true);
      return;
    }
    
    try {
      await onComplete(method, selectedCustomerId, pointsToUse);
    } catch (error) {
      console.error('Payment error:', error);
    }
  };

  const handleCashPayment = async () => {
    const amountReceived = parseFloat(cashAmount);
    if (isNaN(amountReceived) || amountReceived < total - pointsToUse) {
      return; // Invalid amount
    }

    try {
      await onComplete("cash", selectedCustomerId, pointsToUse, cashAmount);
      setShowCashDialog(false);
      setCashAmount("");
    } catch (error) {
      console.error('Payment error:', error);
    }
  };

  const getChange = () => {
    const amountReceived = parseFloat(cashAmount);
    if (isNaN(amountReceived)) return 0;
    return Math.max(0, amountReceived - (total - pointsToUse));
  };

  const handlePointsUse = (points: number) => {
    setPointsToUse(points);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-2xl font-bold text-center">
            KSh {(total - pointsToUse).toFixed(2)}
            {pointsToUse > 0 && (
              <div className="text-sm text-muted-foreground">
                Original: KSh {total.toFixed(2)}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Command className="rounded-lg border shadow-md">
              <CommandInput
                placeholder="Search customer..."
                value={query}
                onValueChange={setQuery}
              />
              <CommandEmpty>No customer found.</CommandEmpty>
              <CommandGroup>
                {searchCustomers(query).map((customer) => (
                  <CommandItem
                    key={customer.id}
                    onSelect={() => setSelectedCustomerId(customer.id)}
                  >
                    <User className="mr-2 h-4 w-4" />
                    {customer.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>

            {selectedCustomer && (
              <div className="rounded-lg border p-4 bg-accent">
                <div className="space-y-2">
                  <div className="font-medium">{selectedCustomer.name}</div>
                  {selectedCustomer.email && (
                    <div className="text-sm flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {selectedCustomer.email}
                    </div>
                  )}
                  {selectedCustomer.phone && (
                    <div className="text-sm flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {selectedCustomer.phone}
                    </div>
                  )}
                </div>
              </div>
            )}

            <LoyaltyPointsSection 
              customerId={selectedCustomerId}
              total={total}
              onPointsUse={handlePointsUse}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              size="lg"
              className="h-24"
              onClick={() => handlePayment("mpesa")}
              disabled={isProcessing}
            >
              <div className="space-y-2">
                <Phone className="h-6 w-6 mx-auto" />
                <div>M-Pesa</div>
              </div>
            </Button>

            <Button
              size="lg"
              className="h-24"
              onClick={() => handlePayment("cash")}
              disabled={isProcessing}
            >
              <div className="space-y-2">
                <Receipt className="h-6 w-6 mx-auto" />
                <div>Cash</div>
              </div>
            </Button>
          </div>
        </div>

        {/* Cash Payment Dialog */}
        <Dialog open={showCashDialog} onOpenChange={setShowCashDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Cash Payment</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="text-2xl font-bold text-center">
                Total: KSh {(total - pointsToUse).toFixed(2)}
              </div>

              <div className="space-y-2">
                <label htmlFor="cashAmount" className="text-sm font-medium">
                  Amount Received
                </label>
                <input
                  id="cashAmount"
                  type="number"
                  min={total - pointsToUse}
                  step="0.01"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Enter amount received"
                />
              </div>

              {parseFloat(cashAmount) > 0 && (
                <div className="space-y-2 p-4 rounded-lg bg-accent">
                  <div className="flex justify-between text-lg">
                    <span>Amount Received:</span>
                    <span>KSh {parseFloat(cashAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Change:</span>
                    <span>KSh {getChange().toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCashDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCashPayment}
                  disabled={parseFloat(cashAmount) < (total - pointsToUse) || isProcessing}
                >
                  Complete Payment
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
