import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { MessageSquare } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import type { ReceiptData } from "@/hooks/use-pos";
import { useReceiptSettings } from "@/lib/receipt-settings";

interface ReceiptPreviewProps {
  receipt: ReceiptData;
  onSend: (method: 'whatsapp' | 'sms') => Promise<void>;
  onClose: () => void;
}

export function ReceiptPreview({ receipt, onSend, onClose }: ReceiptPreviewProps) {
  const { settings } = useReceiptSettings();
  const fontSize = settings.fontSize === 'small' ? 'text-sm' : 
                  settings.fontSize === 'large' ? 'text-lg' : 'text-base';
  
  if (!receipt) {
    return null;
  }

  // Format date safely
  const formattedDate = receipt.timestamp ? 
    new Date(receipt.timestamp).toLocaleString('en-KE', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }) : 'Invalid Date';

  return (
    <Card className={`w-full ${settings.paperSize === 'thermal' ? 'max-w-[302px]' : 'max-w-md'} mx-auto ${fontSize}`}>
      <CardHeader>
        <CardTitle className="text-center">{settings.businessName}</CardTitle>
        {settings.address && (
          <div className="text-center text-muted-foreground">
            <p>{settings.address}</p>
          </div>
        )}
        {(settings.phone || settings.email) && (
          <div className="text-center text-muted-foreground">
            {settings.phone && <p>Tel: {settings.phone}</p>}
            {settings.email && <p>Email: {settings.email}</p>}
          </div>
        )}
        {settings.website && (
          <div className="text-center text-muted-foreground">
            <p>{settings.website}</p>
          </div>
        )}
        <div className="text-center text-muted-foreground mt-2">
          <p>Transaction ID: {receipt.transaction_id || 'N/A'}</p>
          <p>{formattedDate}</p>
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
          {receipt.items.map((item: { name: string; quantity: number; unit_price: number; total: number; unit_type?: string }, index: number) => (
            <div key={index} className="flex justify-between text-sm">
              <div>
                <span>{item.quantity}x </span>
                <span>{item.name} {item.unit_type ? `(${item.unit_type})` : ''}</span>
              </div>
              <div className="text-right">
                <div>{formatCurrency(item.unit_price)}</div>
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
            Paid via {receipt.payment_method || "Unknown"}
            {receipt.payment_method === "cash" && (
              <div className="mt-2">
                {typeof receipt.cash_amount === 'number' && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>Cash Tendered:</span>
                      <span>{formatCurrency(receipt.cash_amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Change:</span>
                      <span>{formatCurrency(receipt.cash_amount - receipt.total)}</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-4 text-muted-foreground">
          {settings.thankYouMessage}
        </div>
      </CardContent>
      
      <CardFooter className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={() => onSend('whatsapp')}>
          <FaWhatsapp className="w-4 h-4 mr-2" />
          WhatsApp
          {receipt.receipt_status?.whatsapp && (
            <span className="ml-2 text-green-500">✓</span>
          )}
        </Button>
        <Button variant="outline" size="sm" onClick={() => onSend('sms')}>
          <MessageSquare className="w-4 h-4 mr-2" />
          SMS
          {receipt.receipt_status?.sms && (
            <span className="ml-2 text-green-500">✓</span>
          )}
        </Button>
        <Button variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
      </CardFooter>
    </Card>
  );
}
