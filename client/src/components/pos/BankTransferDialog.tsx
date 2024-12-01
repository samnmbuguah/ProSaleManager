import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Copy, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface BankTransferDialogProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => Promise<void>;
  amount: number;
  isProcessing: boolean;
}

interface BankDetails {
  accountName: string;
  accountNumber: string;
  bankName: string;
  reference: string;
}

export function BankTransferDialog({
  open,
  onClose,
  onComplete,
  amount,
  isProcessing
}: BankTransferDialogProps) {
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
    
    toast({
      title: "Copied",
      description: "Details copied to clipboard"
    });
  };

  const fetchBankDetails = async () => {
    try {
      const response = await fetch('/api/payments/bank-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to get bank details');
      }

      const data = await response.json();
      setBankDetails(data.bankDetails);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to get bank details'
      });
    }
  };

  // Fetch bank details when dialog opens
  useState(() => {
    if (open && !bankDetails) {
      fetchBankDetails();
    }
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Bank Transfer Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center">
            <div className="text-2xl font-bold">
              KSh {amount.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground">
              Please transfer the exact amount using the details below
            </p>
          </div>

          {bankDetails ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-muted-foreground">Bank Name</div>
                    <div className="font-medium">{bankDetails.bankName}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(bankDetails.bankName, 'bank')}
                  >
                    {copied === 'bank' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-muted-foreground">Account Name</div>
                    <div className="font-medium">{bankDetails.accountName}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(bankDetails.accountName, 'name')}
                  >
                    {copied === 'name' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-muted-foreground">Account Number</div>
                    <div className="font-medium">{bankDetails.accountNumber}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(bankDetails.accountNumber, 'account')}
                  >
                    {copied === 'account' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-muted-foreground">Reference</div>
                    <div className="font-medium">{bankDetails.reference}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(bankDetails.reference, 'reference')}
                  >
                    {copied === 'reference' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button 
                className="w-full" 
                onClick={() => onComplete()}
                disabled={isProcessing}
              >
                {isProcessing && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Complete Payment
              </Button>
            </div>
          ) : (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
