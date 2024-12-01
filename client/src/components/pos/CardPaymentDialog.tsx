import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { useToast } from "@/hooks/use-toast";

interface CardPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => Promise<void>;
  amount: number;
  isProcessing: boolean;
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export function CardPaymentDialog({
  open,
  onClose,
  onComplete,
  amount,
  isProcessing
}: CardPaymentDialogProps) {
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    try {
      setIsPaymentProcessing(true);
      const stripe = await stripePromise;
      
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      const response = await fetch('/api/payments/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret } = await response.json();
      const { error } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: {
            // Use Stripe Elements here
            token: 'dummy_token', // This is just for demo
          },
        },
      });

      if (error) {
        throw error;
      }

      await onComplete();
      onClose();
      toast({
        title: "Payment successful",
        description: "Your card payment has been processed"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Payment failed",
        description: error instanceof Error ? error.message : 'Failed to process payment'
      });
    } finally {
      setIsPaymentProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Card Payment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-2xl font-bold">
              KSh {amount.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground">
              Enter your card details to complete the payment
            </p>
          </div>

          {/* Stripe Elements will be mounted here */}
          <div className="min-h-[200px] border rounded-md p-4">
            <p className="text-center text-muted-foreground">
              Stripe payment form will be displayed here
            </p>
          </div>

          <Button 
            className="w-full" 
            onClick={handlePayment}
            disabled={isProcessing || isPaymentProcessing}
          >
            {(isProcessing || isPaymentProcessing) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Pay with Card
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
