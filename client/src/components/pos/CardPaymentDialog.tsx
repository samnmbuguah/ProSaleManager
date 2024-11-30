import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CardPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  amount: number;
  isProcessing: boolean;
}

export function CardPaymentDialog({
  open,
  onClose,
  onSubmit,
  amount,
  isProcessing
}: CardPaymentDialogProps) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic card validation
    if (!cardNumber.match(/^\d{16}$/)) {
      toast({
        variant: "destructive",
        title: "Invalid card number",
        description: "Please enter a valid 16-digit card number"
      });
      return;
    }

    if (!expiryDate.match(/^(0[1-9]|1[0-2])\/([0-9]{2})$/)) {
      toast({
        variant: "destructive",
        title: "Invalid expiry date",
        description: "Please enter a valid expiry date (MM/YY)"
      });
      return;
    }

    if (!cvv.match(/^\d{3,4}$/)) {
      toast({
        variant: "destructive",
        title: "Invalid CVV",
        description: "Please enter a valid CVV number"
      });
      return;
    }

    await onSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Card Payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center">
            <div className="text-2xl font-bold">
              KSh {amount.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground">
              Enter your card details to complete the payment
            </p>
          </div>

          <div className="space-y-2">
            <Input
              placeholder="Card Number"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
              disabled={isProcessing}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="MM/YY"
                value={expiryDate}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 2) {
                    setExpiryDate(value);
                  } else {
                    setExpiryDate(`${value.slice(0, 2)}/${value.slice(2, 4)}`);
                  }
                }}
                disabled={isProcessing}
              />
              <Input
                placeholder="CVV"
                type="password"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                disabled={isProcessing}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isProcessing}
          >
            {isProcessing && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Pay with Card
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
