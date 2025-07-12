import { UseFormReturn } from 'react-hook-form'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { PRICE_UNITS } from '@/constants/priceUnits'
import { type ProductFormData } from '@/types/product'

interface StockSectionProps {
  form: UseFormReturn<ProductFormData>;
}

export function StockSection ({ form }: StockSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormField
        control={form.control}
        name="quantity"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Current Quantity</FormLabel>
            <FormControl>
              <Input type="number" {...field} value={field.value} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="stock_unit"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Stock Unit</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select stock unit" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {PRICE_UNITS.map((unit) => (
                  <SelectItem key={unit.value} value={unit.value}>
                    {unit.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="min_stock"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Minimum Stock</FormLabel>
            <FormControl>
              <Input type="number" {...field} value={field.value} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="max_stock"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Maximum Stock</FormLabel>
            <FormControl>
              <Input type="number" {...field} value={field.value} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="reorder_point"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Reorder Point</FormLabel>
            <FormControl>
              <Input type="number" {...field} value={field.value} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
