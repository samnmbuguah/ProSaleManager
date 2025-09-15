import React, { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Receipt } from "lucide-react";
import { api } from "@/lib/api";
import { ReceiptPreview } from "./ReceiptPreview";

interface ReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSaleId: number | null;
}

interface ReceiptData {
  id: number;
  transaction_id: string;
  timestamp: string;
  total: number;
  total_amount: number;
  payment_method: string;
  amount_paid: number;
  delivery_fee: number;
  status: string;
  payment_status: string;
  createdAt: string;
  Customer?: {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
  };
  User?: {
    id: number;
    name: string;
    email: string;
  };
  items?: Array<{
    id: number;
    quantity: number;
    unit_price: number;
    total: number;
    unit_type: string;
    Product: {
      id: number;
      name: string;
      sku?: string;
    };
  }>;
}

// Map backend sale data to ReceiptPreview expected format
function mapSaleToReceiptPreview(sale: unknown): import("@/hooks/use-pos").ReceiptData {
  const s = sale as Record<string, unknown>;
  return {
    id: (s.id as number) ?? 0,
    items: ((s.items as unknown[]) || []).map((item: unknown) => {
      const i = item as Record<string, unknown>;
      const product = i.Product as Record<string, unknown> | undefined;
      return {
        name: (product?.name as string) || "Unknown Product",
        quantity: (i.quantity as number) ?? 0,
        unit_price: (i.unit_price as number) ?? 0,
        total: (i.total as number) ?? 0,
        unit_type: (i.unit_type as string) ?? "",
      };
    }),
    customer: s.Customer
      ? {
          name: ((s.Customer as Record<string, unknown>).name as string) ?? "",
          phone: ((s.Customer as Record<string, unknown>).phone as string) ?? "",
          email: ((s.Customer as Record<string, unknown>).email as string) ?? "",
        }
      : undefined,
    total: (s.total_amount as number) ?? 0,
    payment_method: (s.payment_method as string) ?? "",
    timestamp: (s.createdAt as string) ?? "",
    transaction_id: s.id ? String(s.id) : "N/A",
    cash_amount: (s.amount_paid as number) ?? undefined,
    receipt_status: s.receipt_status || {},
  };
}

export const ReceiptDialog: React.FC<ReceiptDialogProps> = ({
  open,
  onOpenChange,
  currentSaleId,
}) => {
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReceiptData = useCallback(async () => {
    if (!currentSaleId) return;
    setIsLoading(true);
    try {
      // Fetch sale details
      const saleResponse = await api.get(`/sales/${currentSaleId}`);
      setReceiptData(saleResponse.data);
    } catch (error) {
      console.error("Error fetching receipt data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentSaleId]);

  useEffect(() => {
    if (open && currentSaleId) {
      fetchReceiptData();
    }
  }, [open, currentSaleId, fetchReceiptData]);

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading receipt...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Sale Receipt #{receiptData?.id}
          </DialogTitle>
          <DialogDescription>
            View and print the receipt for sale #{receiptData?.id}
          </DialogDescription>
        </DialogHeader>
        {receiptData && (
          <ReceiptPreview
            receipt={mapSaleToReceiptPreview(receiptData)}
            onSend={async () => {}}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
