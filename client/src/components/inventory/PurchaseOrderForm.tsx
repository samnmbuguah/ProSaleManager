import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PurchaseOrderItemsList } from "./PurchaseOrderItemsList";
import type { PurchaseOrderFormData } from "@/types/purchase-order";
import type { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { SupplierSelect } from "./SupplierSelect";
import { useState } from "react";
import { useFetchLowStockProducts } from "@/hooks/use-low-stock-products";
import { Loader2 } from "lucide-react";

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
  onAutoFillLowStock: (products: Product[]) => void;
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
  onAutoFillLowStock,
  products,
  suppliers,
  suppliersLoading,
  formErrors = {},
  isSubmitting = false,
  isFormValid = () => true,
}: PurchaseOrderFormProps) {
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(10);
  const [isLoadingLowStock, setIsLoadingLowStock] = useState(false);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const { fetchLowStockProducts } = useFetchLowStockProducts();

  const handleAutoFillLowStock = async () => {
    if (lowStockThreshold <= 0) return;

    setIsLoadingLowStock(true);
    try {
      const products = await fetchLowStockProducts(lowStockThreshold);
      setLowStockProducts(products);
      if (products.length > 0) {
        onAutoFillLowStock(products);
      }
    } catch (error) {
      console.error("Error fetching low stock products:", error);
    } finally {
      setIsLoadingLowStock(false);
    }
  };
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

      {/* Low Stock Auto-fill Section */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <h3 className="text-md font-semibold mb-3">Auto-fill Low Stock Products</h3>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <Label htmlFor="low_stock_threshold">Stock Threshold</Label>
            <Input
              type="number"
              id="low_stock_threshold"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(Number(e.target.value))}
              placeholder="Enter threshold (e.g., 10)"
              min="1"
            />
            <p className="text-xs text-gray-600 mt-1">
              Products with stock ≤ this amount will be added
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleAutoFillLowStock}
            disabled={isLoadingLowStock || lowStockThreshold <= 0}
            className="whitespace-nowrap"
          >
            {isLoadingLowStock ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              "Auto-fill Low Stock"
            )}
          </Button>
        </div>
        {lowStockProducts && lowStockProducts.length > 0 && (
          <p className="text-sm text-green-600 mt-2">
            Found {lowStockProducts.length} low stock products
          </p>
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
