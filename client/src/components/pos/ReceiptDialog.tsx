import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, MessageSquare } from "lucide-react";
import type { Product, Customer } from "@db/schema";

interface ReceiptItem extends Product {
  quantity: number;
}

interface ReceiptDialogProps {
  open: boolean;
  onClose: () => void;
  saleId: number;
  items: ReceiptItem[];
  total: number;
  paymentMethod: string;
  customer: Customer | null;
  date: Date;
}

export function ReceiptDialog({
  open,
  onClose,
  saleId,
  items,
  total,
  paymentMethod,
  customer,
  date
}: ReceiptDialogProps) {
  const handleShare = async (method: 'whatsapp' | 'sms') => {
    const receiptText = `Receipt #${saleId}\n` +
      `Date: ${date.toLocaleString()}\n\n` +
      `Items:\n${items.map(item => 
        `${item.name} x${item.quantity} @ KSh${Number(item.price).toFixed(2)} = KSh${(Number(item.price) * item.quantity).toFixed(2)}`
      ).join('\n')}\n\n` +
      `Total: KSh${total.toFixed(2)}\n` +
      `Payment Method: ${paymentMethod}\n\n` +
      `Thank you for your purchase!`;

    if (method === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(receiptText)}`);
    } else {
      window.open(`sms:?body=${encodeURIComponent(receiptText)}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="font-semibold text-lg">Sale Receipt</h2>
            <p className="text-sm text-muted-foreground">#{saleId}</p>
            <p className="text-sm">{date.toLocaleString()}</p>
          </div>

          {customer && (
            <div className="border-t pt-2">
              <p className="font-medium">{customer.name}</p>
              {customer.email && <p className="text-sm">{customer.email}</p>}
              {customer.phone && <p className="text-sm">{customer.phone}</p>}
            </div>
          )}

          <div className="border-t pt-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="text-left">Item</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td className="text-right">{item.quantity}</td>
                    <td className="text-right">
                      KSh {Number(item.price).toFixed(2)}
                    </td>
                    <td className="text-right">
                      KSh {(Number(item.price) * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-medium">
                  <td colSpan={3} className="text-right pt-2">Total:</td>
                  <td className="text-right pt-2">
                    KSh {total.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="border-t pt-2">
            <p className="text-sm">
              Payment Method: <span className="capitalize">{paymentMethod}</span>
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              className="flex-1"
              variant="outline"
              onClick={() => handleShare('whatsapp')}
            >
              <Share2 className="mr-2 h-4 w-4" />
              WhatsApp
            </Button>
            <Button
              className="flex-1"
              variant="outline"
              onClick={() => handleShare('sms')}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              SMS
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
