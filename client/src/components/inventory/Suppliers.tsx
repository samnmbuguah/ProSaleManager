import { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState, AppDispatch } from '@/store'
import { fetchSuppliers, createSupplier, updateSupplier, deleteSupplier } from '@/store/suppliersSlice'
import type { Supplier } from '@/types/supplier'
import Swal from 'sweetalert2'

const Suppliers = () => {
  const dispatch = useDispatch<AppDispatch>()
  const suppliers = useSelector((state: RootState) => state.suppliers.items)
  const suppliersStatus = useSelector(
    (state: RootState) => state.suppliers.status
  )
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null
  )
  const [formData, setFormData] = useState<{
    name: string
    email: string
    address: string
    phone: string
    contact_person: string
    status: 'active' | 'inactive'
  }>({
    name: '',
    email: '',
    address: '',
    phone: '',
    contact_person: '',
    status: 'active'
  })
  const { toast } = useToast()

  useEffect(() => {
    if (suppliersStatus === 'idle') {
      dispatch(fetchSuppliers())
    }
  }, [dispatch, suppliersStatus])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (selectedSupplier) {
        await dispatch(updateSupplier({ id: selectedSupplier.id, data: formData })).unwrap()
        setIsEditDialogOpen(false) // Close dialog first
        setSelectedSupplier(null)
        setFormData({
          name: '',
          email: '',
          phone: '',
          address: '',
          contact_person: '',
          status: 'active' as const
        })
        await Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Supplier updated successfully'
        })
      } else {
        await dispatch(createSupplier(formData)).unwrap()
        setIsAddDialogOpen(false) // Close dialog first
        setFormData({
          name: '',
          email: '',
          phone: '',
          address: '',
          contact_person: '',
          status: 'active' as const
        })
        await Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Supplier created successfully'
        })
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: `Failed to ${selectedSupplier ? 'update' : 'create'} supplier`,
        variant: 'destructive'
      })
    }
  }

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setFormData({
      name: supplier.name,
      email: supplier.email,
      phone: supplier.phone || '',
      address: supplier.address || '',
      contact_person: supplier.contact_person || '',
      status: supplier.status
    })
    setIsEditDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) { return }

    try {
      await dispatch(deleteSupplier(id)).unwrap()
      await Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Supplier deleted successfully'
      })
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete supplier',
        variant: 'destructive'
      })
    }
  }

  const SupplierForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
        />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          required
        />
      </div>

      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleInputChange}
          required
        />
      </div>

      <div>
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          name="address"
          value={formData.address}
          onChange={handleInputChange}
          required
        />
      </div>

      <div>
        <Label htmlFor="contact_person">Contact Person</Label>
        <Input
          id="contact_person"
          name="contact_person"
          value={formData.contact_person}
          onChange={handleInputChange}
        />
      </div>

      <DialogFooter>
        <Button type="submit">
          {selectedSupplier ? 'Update Supplier' : 'Add Supplier'}
        </Button>
      </DialogFooter>
    </form>
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Suppliers</h2>
        <Button onClick={() => setIsAddDialogOpen(true)}>Add Supplier</Button>
      </div>

      <div className="rounded-md border">
        {suppliersStatus === 'loading'
          ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading suppliers...</p>
            </div>
          )
          : suppliersStatus === 'failed'
            ? (
              <div className="p-8 text-center">
                <p className="text-red-600">Failed to load suppliers</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => dispatch(fetchSuppliers())}
                  className="mt-2"
                >
                  Retry
                </Button>
              </div>
            )
            : suppliers.length === 0
              ? (
                <div className="p-8 text-center">
                  <p className="text-gray-600">No suppliers found</p>
                  <p className="text-sm text-gray-500 mt-1">Add your first supplier to get started</p>
                </div>
              )
              : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact Person</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-medium">{supplier.name}</TableCell>
                        <TableCell>{supplier.contact_person || '-'}</TableCell>
                        <TableCell>{supplier.email}</TableCell>
                        <TableCell>{supplier.phone}</TableCell>
                        <TableCell>{supplier.address}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(supplier)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(supplier.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
            <DialogDescription>
              Fill in the supplier information below to add a new supplier to your system.
            </DialogDescription>
          </DialogHeader>
          <SupplierForm />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
            <DialogDescription>
              Update the supplier information below. All fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          <SupplierForm />
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Suppliers
