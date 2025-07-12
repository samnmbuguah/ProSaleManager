import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ProductSearch } from '@/components/pos/ProductSearch'
import type { Product } from '@/types/product'
import type { PurchaseOrderItem } from '@/types/purchase-order'

interface PurchaseOrderItemsListProps {
  items: PurchaseOrderItem[]
  products: Product[]
  onProductSelect: (index: number, product: Product) => void
  onItemChange: (
    index: number,
    field: keyof PurchaseOrderItem,
    value: string | number
  ) => void
  onRemoveItem: (index: number) => void
  onAddItem: () => void
}

export function PurchaseOrderItemsList ({
  items,
  products,
  onProductSelect,
  onItemChange,
  onRemoveItem,
  onAddItem
}: PurchaseOrderItemsListProps) {
  return (
    <div>
      <Label>Items</Label>
      {items.map((item, index) => (
        <div key={index} className="grid grid-cols-3 gap-2 mt-2">
          <ProductSearch
            products={products}
            onSelect={(product) => onProductSelect(index, product)}
          />
          <Input
            type="number"
            min="1"
            value={item.quantity}
            onChange={(e) =>
              onItemChange(index, 'quantity', parseInt(e.target.value))
            }
            placeholder="Quantity"
          />
          <div className="flex gap-2">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={item.buying_price}
              onChange={(e) =>
                onItemChange(index, 'buying_price', parseFloat(e.target.value))
              }
              placeholder="Buying Price"
            />
            <Input
              type="number"
              min="0"
              step="0.01"
              value={item.selling_price}
              onChange={(e) =>
                onItemChange(index, 'selling_price', parseFloat(e.target.value))
              }
              placeholder="Selling Price"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => onRemoveItem(index)}
            >
              Remove
            </Button>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onAddItem}
        className="mt-2"
      >
        Add Item
      </Button>
    </div>
  )
}
