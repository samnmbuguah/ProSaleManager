import { useState } from 'react'
import type { Product } from '@/types/product'
import type { SupplierFormData } from '@/types/supplier'
import type { ProductSupplierFormData } from '@/types/product-supplier'
import { useSuppliers } from '../../hooks/use-suppliers'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { supplierSchema } from '@/types/supplier'
import { productSupplierSchema } from '@/types/product-supplier'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Plus } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

interface SupplierPricingProps {
  product: Product;
}

export function SupplierPricing ({ product }: SupplierPricingProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isLinkFormOpen, setIsLinkFormOpen] = useState(false)
  const {
    suppliers,
    productSuppliers,
    createSupplier,
    linkProductToSupplier,
    isCreating,
    isLinking
  } = useSuppliers()

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: ''
    }
  })

  const linkForm = useForm<ProductSupplierFormData>({
    resolver: zodResolver(productSupplierSchema),
    defaultValues: {
      product_id: String(product.id),
      supplier_id: '',
      cost_price: '',
      is_preferred: 'false'
    }
  })

  const onSubmit = async (data: SupplierFormData) => {
    await createSupplier(data)
    setIsFormOpen(false)
    form.reset()
  }

  const onLinkSubmit = async (data: ProductSupplierFormData) => {
    await linkProductToSupplier(data)
    setIsLinkFormOpen(false)
    linkForm.reset()
  }

  const productSuppliersList =
    productSuppliers?.filter(
      (ps) => Number(ps.product_id) === Number(product.id)
    ) || []

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Supplier Management</h2>
        <div className="space-x-2">
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Supplier
          </Button>
          <Button onClick={() => setIsLinkFormOpen(true)} variant="outline">
            Link Supplier
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Supplier</TableHead>
            <TableHead>Cost Price</TableHead>
            <TableHead>Preferred</TableHead>
            <TableHead>Last Supply</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {productSuppliersList.map((ps) => (
            <TableRow key={ps.id}>
              <TableCell>
                {suppliers?.find((s) => s.id === Number(ps.supplier_id))
                  ?.name || 'Unknown Supplier'}
              </TableCell>
              <TableCell>KSh {Number(ps.cost_price).toFixed(2)}</TableCell>
              <TableCell>{ps.is_preferred ? 'Yes' : 'No'}</TableCell>
              <TableCell>
                {ps.last_supply_date
                  ? new Date(ps.last_supply_date).toLocaleDateString()
                  : 'Never'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
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
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} />
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
              <Button type="submit" disabled={isCreating}>
                Add Supplier
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isLinkFormOpen} onOpenChange={setIsLinkFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Supplier to Product</DialogTitle>
          </DialogHeader>
          <Form {...linkForm}>
            <form
              onSubmit={linkForm.handleSubmit(onLinkSubmit)}
              className="space-y-4"
            >
              <FormField
                control={linkForm.control}
                name="supplier_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="w-full p-2 border rounded"
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : undefined
                          )
                        }
                      >
                        <option value="">Select a supplier</option>
                        {suppliers?.map((supplier) => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={linkForm.control}
                name="cost_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={linkForm.control}
                name="is_preferred"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value === 'true'}
                        onCheckedChange={(checked) =>
                          field.onChange(String(checked))
                        }
                      />
                    </FormControl>
                    <FormLabel>Preferred Supplier</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLinking}>
                Link Supplier
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
