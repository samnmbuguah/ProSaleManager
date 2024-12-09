import { ReactNode, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ReceiptPreview } from "./ReceiptPreview";
import type { ReceiptData } from "@/hooks/use-pos";

interface SaleTerminalProps {
  children: ReactNode;
  onSendReceipt?: (saleId: number, method: 'whatsapp' | 'sms') => Promise<void>;
}

export function SaleTerminal({ children, onSendReceipt }: SaleTerminalProps) {
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleSendReceipt = async (method: 'whatsapp' | 'sms') => {
    if (receipt && onSendReceipt) {
      if (!receipt.customer?.phone && !phoneNumber) {
        setShowPhoneInput(true);
        return;
      }
      await onSendReceipt(receipt.id, method);
    }
  };

  const handlePhoneSubmit = async (method: 'whatsapp' | 'sms') => {
    if (receipt && onSendReceipt) {
      // Update receipt with phone number
      const updatedReceipt = {
        ...receipt,
        customer: {
          ...receipt.customer,
          phone: phoneNumber,
        },
      };
      setReceipt(updatedReceipt);
      setShowPhoneInput(false);
      await onSendReceipt(receipt.id, method);
    }
  };

  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div 
          className="h-full bg-cover bg-center rounded-lg p-4"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1532795986-dbef1643a596)',
            backgroundBlendMode: 'overlay',
            backgroundColor: 'rgba(255,255,255,0.9)',
          }}
        >
          {receipt ? (
            <ReceiptPreview
              receipt={receipt}
              onSend={handleSendReceipt}
              onClose={() => setReceipt(null)}
            />
          ) : (
            children
          )}
        </div>
      </CardContent>

      <Dialog open={showPhoneInput} onOpenChange={setShowPhoneInput}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Phone Number</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+254..."
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPhoneInput(false)}>
                Cancel
              </Button>
              <Button onClick={() => handlePhoneSubmit('whatsapp')}>
                Send via WhatsApp
              </Button>
              <Button onClick={() => handlePhoneSubmit('sms')}>
                Send via SMS
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
