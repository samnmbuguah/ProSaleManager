import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/store";
import {
  fetchSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "@/store/suppliersSlice";
import type { Supplier } from "@/types/supplier";
import Swal from "sweetalert2";

const Suppliers = () => {
  const dispatch = useDispatch<AppDispatch>();
  const suppliers = useSelector((state: RootState) => state.suppliers.items);
  const suppliersStatus = useSelector((state: RootState) => state.suppliers.status);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    address: string;
    phone: string;
    contact_person: string;
    status: "active" | "inactive";
  }>({
    name: "",
    email: "",
    address: "",
    phone: "",
    contact_person: "",
    status: "active",
  });
  const { toast } = useToast();

  useEffect(() => {
    if (suppliersStatus === "idle") {
      dispatch(fetchSuppliers());
    }
  }, [dispatch, suppliersStatus]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedSupplier) {
        await dispatch(updateSupplier({ id: selectedSupplier.id, data: formData })).unwrap();
        setIsEditDialogOpen(false); // Close dialog first
        setSelectedSupplier(null);
        setFormData({
          name: "",
          email: "",
          phone: "",
          address: "",
          contact_person: "",
          status: "active" as const,
        });
        dispatch(fetchSuppliers()); // Refresh supplier list
        await Swal.fire({
          icon: "success",
          title: "Success",
          text: "Supplier updated successfully",
        });
      } else {
        await dispatch(createSupplier(formData)).unwrap();
        setIsAddDialogOpen(false); // Close dialog first
        setFormData({
          name: "",
          email: "",
          phone: "",
          address: "",
          contact_person: "",
          status: "active" as const,
        });
        dispatch(fetchSuppliers()); // Refresh supplier list
        await Swal.fire({
          icon: "success",
          title: "Success",
          text: "Supplier created successfully",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: `Failed to ${selectedSupplier ? "update" : "create"} supplier`,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      name: supplier.name,
      email: supplier.email,
      phone: supplier.phone || "",
      address: supplier.address || "",
      contact_person: supplier.contact_person || "",
      status: supplier.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this supplier?")) {
      return;
    }

    try {
      await dispatch(deleteSupplier(id)).unwrap();
      await Swal.fire({
        icon: "success",
        title: "Success",
        text: "Supplier deleted successfully",
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to delete supplier",
        variant: "destructive",
      });
    }
  };

  // Reset form when dialog closes (but not when opening, to avoid interfering with typing)
  const handleAddDialogClose = useCallback((open: boolean) => {
    setIsAddDialogOpen(open);
    if (!open) {
      // Only reset when closing
      setSelectedSupplier(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        contact_person: "",
        status: "active" as const,
      });
    }
  }, []);

  const handleEditDialogClose = useCallback((open: boolean) => {
    if (!open) {
      // Only reset when closing
      setSelectedSupplier(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        contact_person: "",
        status: "active" as const,
      });
    }
    setIsEditDialogOpen(open);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Suppliers</h2>
        <Button 
          onClick={() => {
            // Reset form before opening dialog
            setSelectedSupplier(null);
            setFormData({
              name: "",
              email: "",
              phone: "",
              address: "",
              contact_person: "",
              status: "active" as const,
            });
            setIsAddDialogOpen(true);
          }}
        >
          Add Supplier
        </Button>
      </div>

      <div className="rounded-md border">
        {suppliersStatus === "loading" ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading suppliers...</p>
          </div>
        ) : suppliersStatus === "failed" ? (
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
        ) : suppliers.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">No suppliers found</p>
            <p className="text-sm text-gray-500 mt-1">Add your first supplier to get started</p>
          </div>
        ) : (
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
                  <TableCell>{supplier.contact_person || "-"}</TableCell>
                  <TableCell>{supplier.email}</TableCell>
                  <TableCell>{supplier.phone}</TableCell>
                  <TableCell>{supplier.address}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(supplier)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(supplier.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
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

      <Dialog open={isAddDialogOpen} onOpenChange={handleAddDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
            <DialogDescription>
              Fill in the supplier information below to add a new supplier to your system.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="add-name">Name</Label>
              <Input 
                id="add-name" 
                name="name" 
                value={formData.name} 
                onChange={handleInputChange} 
                required 
              />
            </div>

            <div>
              <Label htmlFor="add-email">Email</Label>
              <Input
                id="add-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="add-phone">Phone</Label>
              <Input
                id="add-phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="add-address">Address</Label>
              <Input
                id="add-address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="add-contact_person">Contact Person</Label>
              <Input
                id="add-contact_person"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleInputChange}
              />
            </div>

            <DialogFooter>
              <Button type="submit">Add Supplier</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={handleEditDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
            <DialogDescription>
              Update the supplier information below. All fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input 
                id="edit-name" 
                name="name" 
                value={formData.name} 
                onChange={handleInputChange} 
                required 
              />
            </div>

            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-contact_person">Contact Person</Label>
              <Input
                id="edit-contact_person"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleInputChange}
              />
            </div>

            <DialogFooter>
              <Button type="submit">Update Supplier</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Suppliers;
