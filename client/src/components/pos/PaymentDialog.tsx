import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCustomers } from "@/hooks/use-customers";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { CreditCard, Mail, Phone, Receipt, User } from "lucide-react";
import { LoyaltyPointsSection } from "./LoyaltyPointsSection";

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onComplete: (paymentMethod: string, customerId?: number, usePoints?: number) => void;
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
  const { customers, searchCustomers } = useCustomers();
  const [query, setQuery] = useState("");
  const selectedCustomer = customers?.find(c => c.id === selectedCustomerId);

  const handlePayment = (method: string) => {
    onComplete(method, selectedCustomerId, pointsToUse);
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
              onClick={() => handlePayment("card")}
              disabled={isProcessing}
            >
              <div className="space-y-2">
                <CreditCard className="h-6 w-6 mx-auto" />
                <div>Card</div>
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
      </DialogContent>
    </Dialog>
  );
}
