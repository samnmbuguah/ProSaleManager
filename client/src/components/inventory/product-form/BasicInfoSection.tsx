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
import { type ProductFormData } from '@/types/product'
import { Label } from '@/components/ui/label'
import { useCategories } from '@/hooks/use-categories'

interface BasicInfoSectionProps {
  form: UseFormReturn<ProductFormData>;
}

export function BasicInfoSection ({ form }: BasicInfoSectionProps) {
  const { control } = form
  const { data: categories, isLoading } = useCategories()
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Product Name</FormLabel>
            <FormControl>
              <Input {...field} value={field.value || ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="sku"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Product Code</FormLabel>
            <FormControl>
              <Input {...field} value={field.value || ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        name="category_id"
        control={control}
        render={({ field }) => (
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select onValueChange={(value) => field.onChange(Number(value))} value={String(field.value)} disabled={isLoading || !categories}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={isLoading ? 'Loading...' : 'Select category'} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {categories && categories.map((category) => (
                  <SelectItem key={category.id} value={String(category.id)}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </div>
        )}
      />
    </div>
  )
}
