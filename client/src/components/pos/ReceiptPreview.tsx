import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { MessageSquare } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import type { ReceiptData } from "@/hooks/use-pos";

interface ReceiptPreviewProps {
  receipt: ReceiptData;
  onSend: (method: 'whatsapp' | 'sms') => Promise<void>;
  onClose: () => void;
}

export function ReceiptPreview({ receipt, onSend, onClose }: ReceiptPreviewProps) {
  const hasPhone = receipt.customer?.phone;
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Sales Receipt</CardTitle>
        <div className="text-sm text-center text-muted-foreground">
          <p>Transaction ID: {receipt.transactionId}</p>
          <p>{new Date(receipt.timestamp).toLocaleString()}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {receipt.customer && (
          <div className="border-b pb-2">
            <p className="font-medium">{receipt.customer.name}</p>
            {receipt.customer.phone && <p className="text-sm">{receipt.customer.phone}</p>}
            {receipt.customer.email && <p className="text-sm">{receipt.customer.email}</p>}
          </div>
        )}
        
        <div className="space-y-2">
          {receipt.items.map((item: { name: string; quantity: number; unitPrice: number; total: number }, index: number) => (
            <div key={index} className="flex justify-between text-sm">
              <div>
                <span>{item.quantity}x </span>
                <span>{item.name}</span>
              </div>
              <div className="text-right">
                <div>{formatCurrency(item.unitPrice)}</div>
                <div>{formatCurrency(item.total)}</div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="border-t pt-2">
          <div className="flex justify-between font-medium">
            <span>Total</span>
            <span>{formatCurrency(receipt.total)}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Paid via {receipt.paymentMethod}
          </div>
        </div>
      </CardContent>
      
      {hasPhone && (
        <CardFooter className="flex gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSend('whatsapp')}
          >
            <FaWhatsapp className="w-4 h-4 mr-2" />
            WhatsApp
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSend('sms')}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            SMS
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
