import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { customerSchema, type CustomerInsert } from '@/types/customer'

interface CustomerFormProps {
  onSubmit: (data: CustomerInsert) => Promise<void>
  defaultValues?: Partial<CustomerInsert>
  isSubmitting?: boolean
}

export function CustomerForm({ onSubmit, defaultValues, isSubmitting = false }: CustomerFormProps) {
  const form = useForm<CustomerInsert>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      email: defaultValues?.email || undefined,
      phone: defaultValues?.phone || undefined,
      address: defaultValues?.address || undefined,
      notes: defaultValues?.notes || ''
    }
  })

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...field}
              placeholder="Enter customer name"
              className={fieldState.error ? 'border-red-500' : ''}
            />
            {fieldState.error && (
              <p className="text-sm text-red-500">{fieldState.error.message}</p>
            )}
          </div>
        )}
      />

      <Controller
        name="email"
        control={form.control}
        render={({ field, fieldState }) => (
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...field}
              value={field.value || ''}
              placeholder="Enter email address"
              className={fieldState.error ? 'border-red-500' : ''}
            />
            {fieldState.error && (
              <p className="text-sm text-red-500">{fieldState.error.message}</p>
            )}
          </div>
        )}
      />

      <Controller
        name="phone"
        control={form.control}
        render={({ field, fieldState }) => (
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              {...field}
              value={field.value || ''}
              placeholder="Enter phone number"
              className={fieldState.error ? 'border-red-500' : ''}
            />
            {fieldState.error && (
              <p className="text-sm text-red-500">{fieldState.error.message}</p>
            )}
          </div>
        )}
      />

      <Controller
        name="address"
        control={form.control}
        render={({ field, fieldState }) => (
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              {...field}
              value={field.value || ''}
              placeholder="Enter address"
              className={fieldState.error ? 'border-red-500' : ''}
            />
            {fieldState.error && (
              <p className="text-sm text-red-500">{fieldState.error.message}</p>
            )}
          </div>
        )}
      />

      <Controller
        name="notes"
        control={form.control}
        render={({ field, fieldState }) => (
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...field}
              value={field.value || ''}
              placeholder="Enter additional notes"
              className={fieldState.error ? 'border-red-500' : ''}
            />
            {fieldState.error && (
              <p className="text-sm text-red-500">{fieldState.error.message}</p>
            )}
          </div>
        )}
      />

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Saving...' : 'Save Customer'}
      </Button>
    </form>
  )
}
