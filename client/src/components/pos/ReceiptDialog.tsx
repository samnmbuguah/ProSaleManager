import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ReceiptDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentSaleId: number | null;
    phoneNumber: string;
    setPhoneNumber: (phone: string) => void;
    isSendingReceipt: boolean;
    handleSendReceipt: (method: "whatsapp" | "sms") => void;
}

export const ReceiptDialog: React.FC<ReceiptDialogProps> = ({
    open,
    onOpenChange,
    currentSaleId,
    phoneNumber,
    setPhoneNumber,
    isSendingReceipt,
    handleSendReceipt,
}) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Sale Receipt</DialogTitle>
                <DialogDescription>
                    Sale #{currentSaleId} completed successfully
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input
                        type="tel"
                        placeholder="+254..."
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                </div>
                <div className="text-center text-sm text-muted-foreground">
                    <p>Send a receipt to the customer via WhatsApp or SMS</p>
                </div>
            </div>
            <DialogFooter className="flex gap-2 sm:justify-end">
                <Button
                    variant="outline"
                    onClick={() => handleSendReceipt("sms")}
                    disabled={!phoneNumber || isSendingReceipt}
                >
                    Send via SMS
                </Button>
                <Button
                    onClick={() => handleSendReceipt("whatsapp")}
                    disabled={!phoneNumber || isSendingReceipt}
                >
                    Send via WhatsApp
                </Button>
                <Button
                    variant="ghost"
                    onClick={() => onOpenChange(false)}
                >
                    Close
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
); 