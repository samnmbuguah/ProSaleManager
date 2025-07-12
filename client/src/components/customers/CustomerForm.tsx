import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { customerSchema, type CustomerInsert } from '@/types/customer'

const customerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').nullable(),
  phone: z
    .string()
    .regex(/^\+?[0-9]{10,}$/, 'Phone number must be at least 10 digits')
    .nullable(),
  address: z.string().optional()
})

interface CustomerFormProps {
  onSubmit: (data: CustomerInsert) => Promise<void>;
  isSubmitting?: boolean;
  defaultValues?: Partial<CustomerInsert>;
}

export function CustomerForm ({
  onSubmit,
  isSubmitting = false,
  defaultValues
}: CustomerFormProps) {
  const form = useForm<CustomerInsert>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      email: defaultValues?.email || null,
      phone: defaultValues?.phone || null,
      address: defaultValues?.address || ''
    }
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer Name</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field: { value, onChange, ...field } }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  value={value || ''}
                  onChange={(e) => onChange(e.target.value || null)}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field: { value, onChange, ...field } }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input
                  value={value || ''}
                  onChange={(e) => onChange(e.target.value || null)}
                  placeholder="+254700000000"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Adding...' : 'Add Customer'}
        </Button>
      </form>
    </Form>
  )
}
