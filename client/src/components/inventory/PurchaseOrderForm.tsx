import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SupplierSelect } from "./SupplierSelect";
import { PurchaseOrderItemsList } from "./PurchaseOrderItemsList";
import type { Supplier } from "@/types/supplier";
import type { Product } from "@/types/product";
import type { PurchaseOrderItem, PurchaseOrderFormData } from "@/types/purchase-order";
import { Button } from "@/components/ui/button";

interface PurchaseOrderFormProps {
  suppliers: Supplier[];
  suppliersLoading: boolean;
  products: Product[];
  formData: PurchaseOrderFormData;
  onSupplierChange: (value: string) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onProductSelect: (index: number, product: Product) => void;
  onItemChange: (index: number, field: keyof PurchaseOrderItem, value: string | number) => void;
  onRemoveItem: (index: number) => void;
  onAddItem: () => void;
  onSubmit: (e: React.FormEvent) => void;
  submitDisabled: boolean;
}

export function PurchaseOrderForm({
  suppliers,
  suppliersLoading,
  products,
  formData,
  onSupplierChange,
  onInputChange,
  onProductSelect,
  onItemChange,
  onRemoveItem,
  onAddItem,
  onSubmit,
  submitDisabled,
}: PurchaseOrderFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <SupplierSelect
        suppliers={suppliers}
        value={formData.supplier_id}
        onChange={onSupplierChange}
        loading={suppliersLoading}
      />
      <div>
        <Label htmlFor="expected_delivery_date">Expected Delivery Date</Label>
        <Input
          id="expected_delivery_date"
          name="expected_delivery_date"
          type="date"
          value={formData.expected_delivery_date}
          onChange={onInputChange}
          required
        />
      </div>
      <PurchaseOrderItemsList
        items={formData.items}
        products={products}
        onProductSelect={onProductSelect}
        onItemChange={onItemChange}
        onRemoveItem={onRemoveItem}
        onAddItem={onAddItem}
      />
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Input
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={onInputChange}
        />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={submitDisabled}>
          Create Purchase Order
        </Button>
      </DialogFooter>
    </form>
  );
}
