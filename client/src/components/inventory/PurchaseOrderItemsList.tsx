import { Product } from '@/types/product'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/lib/api'
import { STOCK_UNITS } from '@/types/product'

interface PurchaseOrderItemsListProps {
  items: any[]
  products: Product[]
  onItemChange: (index: number, field: string, value: any) => void
  onRemoveItem: (index: number) => void
  onAddItem: () => void
  dropdownOpen: boolean[]
  setDropdownOpen: (index: number, open: boolean) => void
}

export function PurchaseOrderItemsList({
  items,
  products, // not used anymore
  onItemChange,
  onRemoveItem,
  onAddItem,
  dropdownOpen,
  setDropdownOpen
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
          const product = item.product_id && products ? products.find((p) => p.id === item.product_id) : null
          // Default unit is 'piece' if not set
          const unit = item.unit_type || 'piece'
          return (
            <div key={index} className="flex gap-2 p-2 border rounded items-center">
              <div className="w-60">
                {item.product_name ? (
                  <span>{item.product_name}</span>
                ) : (
                  <span className="text-gray-400 italic">No product selected</span>
                )}
              </div>
              <div className="w-24">
                <Select
                  value={unit}
                  onValueChange={(value) => {
                    // Update unit_type and set prices from product if available
                    let buying_price = item.buying_price
                    let selling_price = item.selling_price
                    if (product) {
                      if (value === 'piece') {
                        buying_price = product.piece_buying_price
                        selling_price = product.piece_selling_price
                      } else if (value === 'pack') {
                        buying_price = product.pack_buying_price
                        selling_price = product.pack_selling_price
                      } else if (value === 'dozen') {
                        buying_price = product.dozen_buying_price
                        selling_price = product.dozen_selling_price
                      }
                    }
                    console.log('Unit change:', {
                      unit: value,
                      product: product?.name,
                      buying_price,
                      selling_price,
                      product_piece_buying: product?.piece_buying_price,
                      product_pack_buying: product?.pack_buying_price,
                      product_dozen_buying: product?.dozen_buying_price
                    })
                    onItemChange(index, 'unit_type', value)
                    onItemChange(index, 'buying_price', buying_price)
                    onItemChange(index, 'selling_price', selling_price)
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {STOCK_UNITS.map((u) => (
                      <SelectItem key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 w-20"
              >
                Remove
              </button>
            </div>
          )
        })}
      </div>
      {/* Remove Add Item button, as items are now added via search */}
    </div>
  )
}
