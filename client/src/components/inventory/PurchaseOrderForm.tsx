import { DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PurchaseOrderItemsList } from './PurchaseOrderItemsList'
import type { PurchaseOrderFormData } from '@/types/purchase-order'
import type { Product } from '@/types/product'
import { Button } from '@/components/ui/button'

interface PurchaseOrderFormProps {
  formData: PurchaseOrderFormData
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onItemChange: (index: number, field: string, value: any) => void
  onRemoveItem: (index: number) => void
  onAddItem: () => void
  products: Product[]
}

export function PurchaseOrderForm({
  formData,
  onInputChange,
  onItemChange,
  onRemoveItem,
  onAddItem,
  products
}: PurchaseOrderFormProps) {
  return (
    <form className="space-y-4">
      {/* Add your form fields here, e.g. supplier, expected_delivery_date, notes, etc. */}
      {/* Example: */}
      <input
        type="text"
        name="expected_delivery_date"
        value={formData.expected_delivery_date}
        onChange={onInputChange}
        placeholder="Expected Delivery Date"
        className="w-full px-2 py-1 border rounded"
      />
      {/* Items list */}
      <PurchaseOrderItemsList
        items={formData.items}
        products={products}
        onItemChange={(index: number, field: string, value: any) => {
          const newItems = [...formData.items]
          newItems[index] = { ...newItems[index], [field]: value }
          onItemChange(index, field, value)
        }}
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
        <Button type="submit">Submit</Button>
      </DialogFooter>
    </form>
  )
}
