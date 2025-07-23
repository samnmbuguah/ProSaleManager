import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supplierSchema, type SupplierFormData } from '@/types/supplier'

interface SupplierFormProps {
  onSubmit: (data: SupplierFormData) => Promise<void>
  defaultValues?: Partial<SupplierFormData>
  isSubmitting?: boolean
}

export function SupplierForm ({ onSubmit, defaultValues, isSubmitting = false }: SupplierFormProps) {
  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      email: defaultValues?.email || '',
      phone: defaultValues?.phone || '',
      address: defaultValues?.address || '',
      contact_person: defaultValues?.contact_person || '',
      status: defaultValues?.status || 'active'
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
              placeholder="Enter supplier name"
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
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              {...field}
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
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              {...field}
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
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              {...field}
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
        name="contact_person"
        control={form.control}
        render={({ field, fieldState }) => (
          <div className="space-y-2">
            <Label htmlFor="contact_person">Contact Person *</Label>
            <Input
              id="contact_person"
              {...field}
              placeholder="Enter contact person name"
              className={fieldState.error ? 'border-red-500' : ''}
            />
            {fieldState.error && (
              <p className="text-sm text-red-500">{fieldState.error.message}</p>
            )}
          </div>
        )}
      />

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Saving...' : 'Save Supplier'}
      </Button>
    </form>
  )
}
