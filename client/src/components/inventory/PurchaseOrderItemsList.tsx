import { Product } from '@/types/product'

interface PurchaseOrderItemsListProps {
  items: any[]
  products: Product[]
  onItemChange: (index: number, field: string, value: any) => void
  onRemoveItem: (index: number) => void
  onAddItem: () => void
}

export function PurchaseOrderItemsList({
  items,
  products,
  onItemChange,
  onRemoveItem,
  onAddItem
}: PurchaseOrderItemsListProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Order Items</h3>
        <div className="text-sm text-gray-500">
          {products.length} products available
        </div>
      </div>

      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex gap-2 p-2 border rounded">
            <input
              type="number"
              placeholder="Quantity"
              value={item.quantity || ''}
              onChange={(e) => onItemChange(index, 'quantity', parseInt(e.target.value))}
              className="w-20 px-2 py-1 border rounded"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Buying Price"
              value={item.buying_price || ''}
              onChange={(e) =>
                onItemChange(index, 'buying_price', parseFloat(e.target.value))
              }
              className="w-24 px-2 py-1 border rounded"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Selling Price"
              value={item.selling_price || ''}
              onChange={(e) =>
                onItemChange(index, 'selling_price', parseFloat(e.target.value))
              }
              className="w-24 px-2 py-1 border rounded"
            />
            <button
              type="button"
              onClick={() => onRemoveItem(index)}
              className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onAddItem}
        className="w-full py-2 border-2 border-dashed border-gray-300 rounded hover:border-gray-400"
      >
        Add Item
      </button>
    </div>
  )
}
