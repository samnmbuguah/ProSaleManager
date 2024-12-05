import { ReactNode, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ReceiptPreview } from "./ReceiptPreview";
import type { ReceiptData } from "@/hooks/use-pos";

interface SaleTerminalProps {
  children: ReactNode;
  onSendReceipt?: (saleId: number, method: 'whatsapp' | 'sms') => Promise<void>;
}

export function SaleTerminal({ children, onSendReceipt }: SaleTerminalProps) {
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  const handleSendReceipt = async (method: 'whatsapp' | 'sms') => {
    if (receipt && onSendReceipt) {
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
    </Card>
  );
}
