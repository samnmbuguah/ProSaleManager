import { Product, STOCK_UNITS } from "@/types/product";
import type { PurchaseOrderItem } from "@/types/purchase-order";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PurchaseOrderItemsListProps {
  items: PurchaseOrderItem[];
  products: Product[];
  onItemChange: (
    index: number,
    field: keyof PurchaseOrderItem,
    value: string | number,
    extra?: Record<string, unknown>
  ) => void;
  onRemoveItem: (index: number) => void;
  formErrors?: { [key: string]: string };
}

export function PurchaseOrderItemsList({
  items,
  products, // not used anymore
  onItemChange,
  onRemoveItem,
  formErrors = {},
}: PurchaseOrderItemsListProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Order Items</h3>
      </div>
      {/* Header row for labels */}
      <div className="flex gap-2 p-2 border-b font-semibold bg-gray-50 rounded-t items-center">
        <div className="w-60">Product</div>
        <div className="w-24">Unit</div>
        <div className="w-20">Quantity</div>
        <div className="w-24">Buying Price (per unit)</div>
        <div className="w-24">Selling Price (per unit)</div>
        <div className="w-20">Actions</div>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => {
          // Find the product for this item (by product_id)
          const product =
            item.product_id && products ? products.find((p) => p.id === item.product_id) : null;
          return (
            <div
              key={index}
              className="flex gap-2 p-2 border rounded items-center flex-col md:flex-row"
            >
              <div className="w-60">
                {item.product_name ? (
                  <span>{item.product_name}</span>
                ) : (
                  <span className="text-gray-400 italic">No product selected</span>
                )}
                {formErrors[`item_${index}_product`] && (
                  <div className="text-red-600 text-xs mt-1">
                    {formErrors[`item_${index}_product`]}
                  </div>
                )}
              </div>
              <div className="w-24">
                <Select
                  value={item.unit_type || "piece"}
                  onValueChange={(value) => {
                    if (!product) return;
                    let buyingPrice = product.piece_buying_price;
                    let sellingPrice = product.piece_selling_price;
                    if (value === "pack") {
                      buyingPrice = product.pack_buying_price;
                      sellingPrice = product.pack_selling_price;
                    } else if (value === "dozen") {
                      buyingPrice = product.dozen_buying_price;
                      sellingPrice = product.dozen_selling_price;
                    }
                    // Always update both unit_type and prices
                    onItemChange(index, "unit_type", value, {
                      buying_price: buyingPrice,
                      selling_price: sellingPrice,
                    });
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {STOCK_UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u.charAt(0).toUpperCase() + u.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors[`item_${index}_unit`] && (
                  <div className="text-red-600 text-xs mt-1">
                    {formErrors[`item_${index}_unit`]}
                  </div>
                )}
              </div>
              <div className="w-20">
                <input
                  type="number"
                  placeholder="Quantity"
                  value={item.quantity || ""}
                  onChange={(e) => onItemChange(index, "quantity", parseInt(e.target.value))}
                  className="w-20 px-2 py-1 border rounded"
                />
                {formErrors[`item_${index}_quantity`] && (
                  <div className="text-red-600 text-xs mt-1">
                    {formErrors[`item_${index}_quantity`]}
                  </div>
                )}
              </div>
              <div className="w-24">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Buying Price"
                  value={item.buying_price || ""}
                  onChange={(e) => onItemChange(index, "buying_price", parseFloat(e.target.value))}
                  className="w-24 px-2 py-1 border rounded"
                />
                {formErrors[`item_${index}_buying_price`] && (
                  <div className="text-red-600 text-xs mt-1">
                    {formErrors[`item_${index}_buying_price`]}
                  </div>
                )}
              </div>
              <div className="w-24">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Selling Price"
                  value={item.selling_price || ""}
                  onChange={(e) => onItemChange(index, "selling_price", parseFloat(e.target.value))}
                  className="w-24 px-2 py-1 border rounded"
                />
              </div>
              <button
                type="button"
                onClick={() => onRemoveItem(index)}
                className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 w-20"
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>
      {/* Remove Add Item button, as items are now added via search */}
    </div>
  );
}
