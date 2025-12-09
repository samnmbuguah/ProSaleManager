import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { MessageSquare, X } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import type { ReceiptData } from "@/hooks/use-pos";
import { useReceiptSettingsApi } from "@/lib/receipt-settings";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";

interface ReceiptPreviewProps {
  receipt: ReceiptData;
  onSend: (method: "whatsapp" | "sms") => Promise<void>;
  onClose: () => void;
}

export function ReceiptPreview({ receipt, onSend, onClose }: ReceiptPreviewProps) {
  const { settings, isLoading, isError, error } = useReceiptSettingsApi();
  const formatAmount = (value: number) =>
    new Intl.NumberFormat("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "", // avoid header title in some browsers
    pageStyle: `@page { size: 80mm auto; margin: 0; } body { margin: 0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; } .no-print{ display:none !important; }`,
  });

  if (!receipt) {
    return null;
  }
  if (isLoading) {
    return <div>Loading receipt settings...</div>;
  }
  if (isError) {
    return <div>Error loading receipt settings: {error?.message || "Unknown error"}</div>;
  }

  // Format date safely
  const formattedDate = receipt.timestamp
    ? new Date(receipt.timestamp).toLocaleString("en-KE", {
      dateStyle: "medium",
      timeStyle: "short",
    })
    : "Invalid Date";

  return (
    <>
      <div className="flex justify-end mb-2 print:hidden">
        <Button variant="default" size="sm" onClick={handlePrint}>
          Print / Save PDF
        </Button>
      </div>
      <Card
        ref={printRef}
        className="receipt-print w-full max-w-md mx-auto text-xs leading-tight tracking-tight print:w-[80mm] print:max-w-[80mm] print:mx-0 print:shadow-none print:border-0 print:text-[10px] print:leading-tight"
      >
        <CardHeader className="pb-2 print:pb-2">
          <div className="flex justify-center mb-2 print:mb-2">
            <img
              src="/logo.png"
              alt="Business Logo"
              className="h-12 w-auto object-contain print:h-10"
              onError={(e) => {
                // Fallback to JPEG if PNG fails
                const target = e.target as HTMLImageElement;
                if (target.src.endsWith(".png")) {
                  target.src = "/logo.jpeg";
                }
              }}
            />
          </div>
          <CardTitle className="text-center text-sm print:text-[12px]">
            {settings.businessName}
          </CardTitle>
          {settings.address && (
            <div className="text-center text-muted-foreground text-[11px] print:text-[10px] print:text-black print:font-semibold">
              <p>{settings.address}</p>
            </div>
          )}
          {(settings.phone || settings.email) && (
            <div className="text-center text-muted-foreground text-[11px] print:text-[10px] print:text-black print:font-semibold">
              {settings.phone && <p>Tel: {settings.phone}</p>}
              {settings.email && <p>Email: {settings.email}</p>}
            </div>
          )}
          {settings.website && (
            <div className="text-center text-muted-foreground text-[11px] print:text-[10px] print:text-black print:font-semibold">
              <p>{settings.website}</p>
            </div>
          )}
          <div className="text-center text-muted-foreground mt-1 print:mt-1 text-[11px] print:text-[10px] print:text-black print:font-semibold">
            <p>Transaction ID: {receipt.transaction_id || "N/A"}</p>
            <p>{formattedDate}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 print:space-y-2">
          {receipt.customer && (
            <div className="border-b pb-1 print:pb-1">
              <p className="font-medium text-[12px] print:text-[11px]">{receipt.customer.name}</p>
              {receipt.customer.phone && (
                <p className="text-[11px] print:text-[10px]">{receipt.customer.phone}</p>
              )}
              {receipt.customer.email && (
                <p className="text-[11px] print:text-[10px]">{receipt.customer.email}</p>
              )}
            </div>
          )}

          <div className="space-y-1 print:space-y-1">
            {/* Header row */}
            <div className="flex items-center justify-between border-b pb-1 text-[11px] print:text-[10px] text-muted-foreground print:text-black print:font-semibold">
              <span className="flex-1 pr-2">Item</span>
              <span className="w-10 text-right">Qty</span>
              <span className="w-16 text-right">Price</span>
              <span className="w-16 text-right">Total</span>
            </div>

            {receipt.items.map(
              (
                item: {
                  name: string;
                  quantity: number;
                  unit_price: number;
                  total: number;
                  unit_type?: string;
                },
                index: number
              ) => (
                <div
                  key={index}
                  className="flex items-baseline justify-between text-[11px] print:text-[10px] leading-tight"
                >
                  <div className="flex-1 pr-1 whitespace-normal break-words">
                    <span>
                      {item.name} {item.unit_type ? `(${item.unit_type})` : ""}
                    </span>
                  </div>
                  <div className="w-10 text-right font-mono tabular-nums print:font-semibold">{item.quantity}</div>
                  <div className="w-16 text-right font-mono tabular-nums print:font-semibold">
                    {formatAmount(item.unit_price)}
                  </div>
                  <div className="w-16 text-right font-mono tabular-nums print:font-semibold">
                    {formatAmount(item.total)}
                  </div>
                </div>
              )
            )}
          </div>

          <div className="border-t pt-1 print:pt-1">
            <div className="flex justify-between font-medium text-[12px] print:text-[11px]">
              <span>Total</span>
              <span>{formatCurrency(receipt.total)}</span>
            </div>
            <div className="text-muted-foreground text-[11px] print:text-[10px] print:text-black">
              {receipt.payment_method === "split" && receipt.payment_details ? (
                /* Split Payment Display */
                <div className="mt-1 print:mt-1">
                  <div className="font-medium mb-1">Paid via Split Payment:</div>
                  {receipt.payment_details.cash && receipt.payment_details.cash > 0 && (
                    <div className="flex justify-between text-[11px] print:text-[10px]">
                      <span>Cash:</span>
                      <span>{formatCurrency(receipt.payment_details.cash)}</span>
                    </div>
                  )}
                  {receipt.payment_details.mpesa && receipt.payment_details.mpesa > 0 && (
                    <div className="flex justify-between text-[11px] print:text-[10px]">
                      <span>M-Pesa:</span>
                      <span>{formatCurrency(receipt.payment_details.mpesa)}</span>
                    </div>
                  )}
                  {(receipt.payment_details.cash || 0) + (receipt.payment_details.mpesa || 0) > receipt.total && (
                    <div className="flex justify-between text-[11px] print:text-[10px] mt-1 border-t pt-1">
                      <span>Change:</span>
                      <span>{formatCurrency((receipt.payment_details.cash || 0) + (receipt.payment_details.mpesa || 0) - receipt.total)}</span>
                    </div>
                  )}
                </div>
              ) : (
                /* Single Payment Display */
                <>
                  Paid via {receipt.payment_method || "Unknown"}
                  {receipt.payment_method === "cash" && (
                    <div className="mt-1 print:mt-1">
                      {typeof receipt.cash_amount === "number" && (
                        <>
                          <div className="flex justify-between text-[11px] print:text-[10px]">
                            <span>Cash Tendered:</span>
                            <span>{formatCurrency(receipt.cash_amount)}</span>
                          </div>
                          <div className="flex justify-between text-[11px] print:text-[10px]">
                            <span>Change:</span>
                            <span>{formatCurrency(receipt.cash_amount - receipt.total)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="text-center mt-2 text-muted-foreground text-[11px] print:mt-2 print:text-[10px] print:text-black">
            {settings.thankYouMessage}
          </div>
        </CardContent>

        <CardFooter className="flex gap-2 justify-end print:hidden">
          <Button variant="outline" size="sm" onClick={() => onSend("whatsapp")}>
            <FaWhatsapp className="w-4 h-4 mr-2" />
            WhatsApp
            {receipt.receipt_status?.whatsapp && <span className="ml-2 text-green-500">✓</span>}
          </Button>
          <Button variant="outline" size="sm" onClick={() => onSend("sms")}>
            <MessageSquare className="w-4 h-4 mr-2" />
            SMS
            {receipt.receipt_status?.sms && <span className="ml-2 text-green-500">✓</span>}
          </Button>
          <Button variant="outline" size="icon" aria-label="Close" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}
