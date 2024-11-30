import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MpesaDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (phone: string) => Promise<void>;
  amount: number;
  isProcessing: boolean;
}

export function MpesaDialog({
  open,
  onClose,
  onSubmit,
  amount,
  isProcessing
}: MpesaDialogProps) {
  const [phone, setPhone] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.match(/^254[0-9]{9}$/)) {
      toast({
        variant: "destructive",
        title: "Invalid phone number",
        description: "Please enter a valid Safaricom number starting with 254"
      });
      return;
    }
    await onSubmit(phone);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>M-Pesa Payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center">
            <div className="text-2xl font-bold">
              KSh {amount.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground">
              Enter your M-Pesa number to receive payment prompt
            </p>
          </div>

          <div className="space-y-2">
            <Input
              placeholder="254712345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isProcessing}
            />
            <p className="text-xs text-muted-foreground">
              Format: 254XXXXXXXXX (12 digits)
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isProcessing}
          >
            {isProcessing && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Pay with M-Pesa
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
