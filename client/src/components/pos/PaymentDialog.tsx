import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCustomers } from "@/hooks/use-customers";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Mail, Phone, Receipt, User, Smartphone } from "lucide-react";
import { MpesaDialog } from "./MpesaDialog";
import { useToast } from "@/hooks/use-toast";

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
  const [isMpesaOpen, setIsMpesaOpen] = useState(false);
  const { customers, searchCustomers } = useCustomers();
  const [query, setQuery] = useState("");
  const { toast } = useToast();
  const selectedCustomer = customers?.find(c => c.id === selectedCustomerId);

  const handlePayment = async (method: string) => {
    await onComplete(method, selectedCustomerId);
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
          </div>

          <div className="grid grid-cols-2 gap-4">
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

            <Button
              size="lg"
              className="h-24 bg-green-600 hover:bg-green-700"
              onClick={() => setIsMpesaOpen(true)}
              disabled={isProcessing}
            >
              <div className="space-y-2">
                <Smartphone className="h-6 w-6 mx-auto" />
                <div>M-Pesa</div>
              </div>
            </Button>
          </div>
        </div>
      </DialogContent>

      <MpesaDialog
        open={isMpesaOpen}
        onClose={() => setIsMpesaOpen(false)}
        onSubmit={async (phone) => {
          try {
            const response = await fetch('/api/payments/mpesa', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ phone, amount: total }),
              credentials: 'include',
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.details || error.error || 'Payment failed');
            }

            const result = await response.json();
            toast({
              title: "Payment initiated",
              description: "Please check your phone for the M-Pesa prompt"
            });

            await handlePayment('mpesa');
            setIsMpesaOpen(false);
          } catch (error) {
            toast({
              variant: "destructive",
              title: "Payment failed",
              description: error instanceof Error ? error.message : 'Failed to process payment'
            });
          }
        }}
        amount={total}
        isProcessing={isProcessing}
      />
    </Dialog>
  );
}