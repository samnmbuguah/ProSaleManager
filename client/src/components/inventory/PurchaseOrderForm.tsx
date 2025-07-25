import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PurchaseOrderItemsList } from "./PurchaseOrderItemsList";
import type { PurchaseOrderFormData } from "@/types/purchase-order";
import type { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { SupplierSelect } from "./SupplierSelect";

interface PurchaseOrderFormProps {
  formData: PurchaseOrderFormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onItemChange: (
    index: number,
    field: string,
    value: string | number,
    extra?: Record<string, unknown>
  ) => void;
  onRemoveItem: (index: number) => void;
  onAddItem: () => void;
  products: Product[];
  suppliers: { id: number | string; name: string }[];
  suppliersLoading?: boolean;
  productDropdownOpen: boolean[];
  setProductDropdownOpen: (index: number, open: boolean) => void;
  formErrors?: { [key: string]: string };
  isSubmitting?: boolean;
  isFormValid?: () => boolean;
}

export function PurchaseOrderForm({
  formData,
  onInputChange,
  onItemChange,
  onRemoveItem,
  products,
  suppliers,
  suppliersLoading,
  formErrors = {},
  isSubmitting = false,
  isFormValid = () => true,
}: PurchaseOrderFormProps) {
  return (
    <div className="space-y-4">
      <SupplierSelect
        suppliers={suppliers}
        value={formData.supplier_id}
        onChange={(value) =>
          onInputChange({
            target: { name: "supplier_id", value },
          } as React.ChangeEvent<HTMLInputElement>)
        }
        loading={suppliersLoading}
      />
      {formErrors.supplier_id && (
        <div className="text-red-600 text-xs mt-1">{formErrors.supplier_id}</div>
      )}
      <div>
        <Label htmlFor="expected_delivery_date">Expected Delivery Date</Label>
        <Input
          type="date"
          id="expected_delivery_date"
          name="expected_delivery_date"
          value={formData.expected_delivery_date}
          onChange={onInputChange}
          required
        />
        {formErrors.expected_delivery_date && (
          <div className="text-red-600 text-xs mt-1">{formErrors.expected_delivery_date}</div>
        )}
      </div>
      {/* Items list */}
      <PurchaseOrderItemsList
        items={formData.items}
        products={products}
        onItemChange={onItemChange}
        onRemoveItem={onRemoveItem}
        formErrors={formErrors}
      />
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Input id="notes" name="notes" value={formData.notes} onChange={onInputChange} />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isSubmitting || !isFormValid()}>
          {isSubmitting ? "Submitting..." : "Submit"}
        </Button>
      </DialogFooter>
    </div>
  );
}
