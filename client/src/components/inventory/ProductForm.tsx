import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ProductFormData, productSchema } from '@/types/product'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useCategories } from '@/hooks/use-categories'
import React from 'react'

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function ProductForm ({
  initialData,
  onSubmit,
  isSubmitting
}: ProductFormProps) {
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      sku: '',
      barcode: '',
      category_id: 1,
      quantity: 0,
      min_quantity: 0,
      is_active: true,
      ...initialData
    }
  })

  const { data: categories, isLoading } = useCategories()

  React.useEffect(() => {
    if (categories && categories.length > 0 && !form.watch('category_id')) {
      form.setValue('category_id', categories[0].id)
    }
  }, [categories, form])

  const handleSubmit = async (data: ProductFormData) => {
    await onSubmit(data)
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            {...form.register('name')}
            placeholder="Enter product name"
          />
          {form.formState.errors.name && (
            <p className="text-sm text-red-500">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...form.register('description')}
            placeholder="Enter product description"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sku">SKU</Label>
            <Input id="sku" {...form.register('sku')} placeholder="Enter SKU" />
          </div>

          <div>
            <Label htmlFor="barcode">Barcode</Label>
            <Input
              id="barcode"
              {...form.register('barcode')}
              placeholder="Enter barcode"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Remove Price and Cost Price fields */}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              {...form.register('quantity', { valueAsNumber: true })}
              placeholder="Enter quantity"
            />
            {form.formState.errors.quantity && (
              <p className="text-sm text-red-500">
                {form.formState.errors.quantity.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="min_quantity">Minimum Quantity</Label>
            <Input
              id="min_quantity"
              type="number"
              {...form.register('min_quantity', { valueAsNumber: true })}
              placeholder="Enter minimum quantity"
            />
            {form.formState.errors.min_quantity && (
              <p className="text-sm text-red-500">
                {form.formState.errors.min_quantity.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="category_id">Category</Label>
          <Select
            value={form.watch('category_id').toString()}
            onValueChange={(value) =>
              form.setValue('category_id', parseInt(value))
            }
            disabled={isLoading || !categories}
          >
            <SelectTrigger>
              <SelectValue placeholder={isLoading ? 'Loading...' : 'Select a category'} />
            </SelectTrigger>
            <SelectContent>
              {categories && categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id.toString()}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.category_id && (
            <p className="text-sm text-red-500">
              {form.formState.errors.category_id.message}
            </p>
          )}
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save Product'}
      </Button>
    </form>
  )
}
