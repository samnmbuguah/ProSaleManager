import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCustomers } from "@/hooks/use-customers";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { CreditCard, Receipt, User } from "lucide-react";

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onComplete: (paymentMethod: string, customerId?: number) => void;
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
  const { customers, searchCustomers } = useCustomers();
  const [query, setQuery] = useState("");

  const handlePayment = (method: string) => {
    onComplete(method, selectedCustomerId);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-2xl font-bold text-center">
            KSh {total.toFixed(2)}
          </div>

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
