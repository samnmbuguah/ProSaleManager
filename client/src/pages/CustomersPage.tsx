import { useEffect, useState } from 'react'
import CustomerList from '../components/customers/CustomerList'
import { useToast } from '@/components/ui/use-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState, AppDispatch } from '@/store'
import { fetchCustomers } from '@/store/customersSlice'
import type { Customer } from '@/types/customer'
import CustomerFormDialog from '../components/customers/CustomerFormDialog'

const CustomersPage = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const dispatch = useDispatch<AppDispatch>()
  const customers = useSelector((state: RootState) => state.customers.items)
  const customersStatus = useSelector(
    (state: RootState) => state.customers.status
  )
  const isLoading = customersStatus === 'loading'
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<Customer>>({})
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  useEffect(() => {
    if (customersStatus === 'idle') {
      dispatch(fetchCustomers())
    }
  }, [dispatch, customersStatus])

  const createCustomerMutation = useMutation({
    mutationFn: async (
      customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>
    ) => {
      // FIX: Remove double /api prefix
      const response = await api.post('/customers', customer)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast({
        title: 'Success',
        description: 'Customer added successfully.'
      })
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ||
        (error as Error).message ||
        'Failed to add customer'
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      })
    }
  })

  const updateCustomerMutation = useMutation({
    mutationFn: async ({
      id,
      data
    }: {
      id: number;
      data: Partial<Customer>;
    }) => {
      // FIX: Remove double /api prefix
      const response = await api.put(`/customers/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast({
        title: 'Success',
        description: 'Customer updated successfully.'
      })
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ||
        (error as Error).message ||
        'Failed to update customer'
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      })
    }
  })

  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: number) => {
      // FIX: Remove double /api prefix
      await api.delete(`/customers/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast({
        title: 'Success',
        description: 'Customer deleted successfully.'
      })
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ||
        (error as Error).message ||
        'Failed to delete customer'
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      })
    }
  })

  // Add customer: open dialog with empty form
  const handleAddCustomer = () => {
    setFormData({ name: '', email: '', phone: '', address: '', notes: '' })
    setSelectedCustomer(null)
    setIsDialogOpen(true)
  }

  // Edit customer: open dialog with prefilled form
  const handleEditCustomer = (customer: Customer) => {
    setFormData({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      notes: customer.notes || ''
    })
    setSelectedCustomer(customer)
    setIsDialogOpen(true)
  }

  // Dialog submit handler
  const handleDialogSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedCustomer) {
      // Edit
      await updateCustomerMutation.mutateAsync({ id: selectedCustomer.id, data: formData })
    } else {
      // Add
      await createCustomerMutation.mutateAsync(formData as Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>)
    }
    setIsDialogOpen(false)
    setFormData({})
    setSelectedCustomer(null)
  }

  const handleDeleteCustomer = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) {
      return
    }
    await deleteCustomerMutation.mutateAsync(id)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 mt-16">
      <CustomerList
        customers={customers}
        onAdd={handleAddCustomer}
        onEdit={handleEditCustomer}
        onDelete={handleDeleteCustomer}
        isSubmitting={
          createCustomerMutation.isPending || updateCustomerMutation.isPending
        }
      />
      <CustomerFormDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) {
            setFormData({})
            setSelectedCustomer(null)
          }
        }}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleDialogSubmit}
        selectedCustomer={selectedCustomer}
      />
    </div>
  )
}

export default CustomersPage
