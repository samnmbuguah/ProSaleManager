import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateSale } from "@/hooks/use-sales-query";
import { useCustomers } from "@/hooks/useCustomers";
import { useToast } from "@/components/ui/use-toast";
import { Sale } from "@/types/sale";

interface EditSaleDialogProps {
    sale: Sale | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditSaleDialog({ sale, open, onOpenChange }: EditSaleDialogProps) {
    const { toast } = useToast();
    const updateSaleMutation = useUpdateSale();
    const { customers } = useCustomers();

    const [status, setStatus] = useState<string>("");
    const [paymentStatus, setPaymentStatus] = useState<string>("");
    const [paymentMethod, setPaymentMethod] = useState<string>("");
    const [customerId, setCustomerId] = useState<string>("");
    const [totalAmount, setTotalAmount] = useState<string>("");

    useEffect(() => {
        if (sale && open) {
            setStatus(sale.status || "completed");
            setPaymentStatus(sale.payment_status || "paid"); // Default fallback if missing
            setPaymentMethod(sale.payment_method || "cash");
            setCustomerId(sale.customer_id ? sale.customer_id.toString() : "walk_in");
            setTotalAmount(sale.total_amount?.toString() || "0");
        }
    }, [sale, open]);

    const handleSave = async () => {
        if (!sale) return;

        try {
            const updateData: any = {
                status,
                payment_status: paymentStatus,
                payment_method: paymentMethod,
                total: parseFloat(totalAmount),
            };

            // Handle customer selection
            if (customerId && customerId !== "walk_in") {
                updateData.customer_id = parseInt(customerId);
            } else {
                updateData.customer_id = null; // Set to null for walk-in
            }

            await updateSaleMutation.mutateAsync({
                id: sale.id,
                data: updateData
            });

            toast({
                title: "Sale Updated",
                description: "The sale details have been successfully updated.",
            });
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to update sale:", error);
            toast({
                title: "Update Failed",
                description: "Failed to update sale details. Please try again.",
                variant: "destructive",
            });
        }
    };

    if (!sale) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Sale #{sale.id}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Payment Status</Label>
                        <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="paid">Paid</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="failed">Failed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Payment Method</Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="mpesa">M-Pesa</SelectItem>
                                <SelectItem value="card">Card</SelectItem>
                                <SelectItem value="credit">Credit</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Customer</Label>
                        <Select value={customerId} onValueChange={setCustomerId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Customer" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="walk_in">Walk-in Customer</SelectItem>
                                {customers?.filter(c => c.name !== "Walk-in Customer").map((c) => (
                                    <SelectItem key={c.id} value={c.id.toString()}>
                                        {c.name} {c.phone ? `(${c.phone})` : ""}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Total Amount</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={totalAmount}
                            onChange={(e) => setTotalAmount(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground text-red-500">
                            Warning: Changing total does not update individual item prices.
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={updateSaleMutation.isPending}>
                        {updateSaleMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
