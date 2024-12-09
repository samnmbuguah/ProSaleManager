import { useState, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Mail, Phone, Receipt, User } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { useCustomers } from "@/hooks/use-customers";
import { LoyaltyPointsSection } from "./LoyaltyPointsSection";

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onComplete: (paymentMethod: string, customerId?: number, pointsUsed?: number, cashAmount?: string) => Promise<void>;
  total: number;
  isProcessing: boolean;
}

export function PaymentDialog({
  open,
  onClose,
  onComplete,
  total,
  isProcessing,
}: PaymentDialogProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>();
  const [pointsToUse, setPointsToUse] = useState(0);
  const [showCashDialog, setShowCashDialog] = useState(false);
  const [cashAmount, setCashAmount] = useState("");
  const { customers, searchCustomers } = useCustomers();
  const [query, setQuery] = useState("");
  const selectedCustomer = customers?.find(c => c.id === selectedCustomerId);

  const handlePayment = async (method: string) => {
    try {
      await onComplete(method, selectedCustomerId, pointsToUse);
      onClose();
    } catch (error) {
      console.error('Payment error:', error);
    }
  };

  const handleCashPayment = async () => {
    const amountReceived = Number(cashAmount);
    if (amountReceived < (total - pointsToUse)) {
      return; // Amount is insufficient
    }

    try {
      await onComplete("cash", selectedCustomerId, pointsToUse, cashAmount);
      setShowCashDialog(false);
      setCashAmount("");
      onClose();
    } catch (error) {
      console.error('Payment error:', error);
    }
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

            <Dialog open={showCashDialog} onOpenChange={setShowCashDialog}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="h-24"
                  disabled={isProcessing}
                >
                  <div className="space-y-2">
                    <Receipt className="h-6 w-6 mx-auto" />
                    <div>Cash</div>
                  </div>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Enter Cash Amount</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="text-2xl font-bold text-center">
                    Total: KSh {(total - pointsToUse).toFixed(2)}
                  </div>
                  <div>
                    <Label htmlFor="cashAmount">Amount Received</Label>
                    <Input
                      id="cashAmount"
                      type="number"
                      min={total - pointsToUse}
                      step="0.01"
                      value={cashAmount}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setCashAmount(e.target.value)}
                    />
                  </div>
                  {Number(cashAmount) >= (total - pointsToUse) && (
                    <div className="text-lg text-center">
                      Change: KSh {(Number(cashAmount) - (total - pointsToUse)).toFixed(2)}
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowCashDialog(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCashPayment}
                      disabled={Number(cashAmount) < (total - pointsToUse)}
                    >
                      Complete Payment
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
