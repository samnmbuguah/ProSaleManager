import { useState } from "react";
import CustomerList from "../components/customers/CustomerList";
import { useToast } from "@/components/ui/use-toast";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Customer } from "@/types/customer";
import CustomerFormDialog from "../components/customers/CustomerFormDialog";
import { useCustomers } from "@/hooks/useCustomers";

const CustomersPage = () => {
  const { toast } = useToast();
  // Replace Redux with useCustomers hook
  const { customers, isLoading, fetchCustomers } = useCustomers();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Customer>>({});
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const createCustomerMutation = useMutation({
    mutationFn: async (customer: Omit<Customer, "id" | "createdAt" | "updatedAt">) => {
      const response = await api.post("/customers", customer);
      return response.data;
    },
    onSuccess: () => {
      fetchCustomers(); // Use the hook's refetch to update context
      toast({
        title: "Success",
        description: "Customer added successfully.",
      });
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (error as Error).message ||
        "Failed to add customer";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Customer> }) => {
      const response = await api.put(`/customers/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      fetchCustomers();
      toast({
        title: "Success",
        description: "Customer updated successfully.",
      });
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (error as Error).message ||
        "Failed to update customer";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/customers/${id}`);
    },
    onSuccess: () => {
      fetchCustomers();
      toast({
        title: "Success",
        description: "Customer deleted successfully.",
      });
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (error as Error).message ||
        "Failed to delete customer";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  // Add customer: open dialog with empty form
  const handleAddCustomer = () => {
    setFormData({ name: "", email: "", phone: "" });
    setSelectedCustomer(null);
    setIsDialogOpen(true);
  };

  // Edit customer: open dialog with prefilled form
  const handleEditCustomer = (customer: Customer) => {
    setFormData({
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
    });
    setSelectedCustomer(customer);
    setIsDialogOpen(true);
  };

  // Dialog submit handler
  const handleDialogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCustomer) {
      // Edit
      await updateCustomerMutation.mutateAsync({
        id: selectedCustomer.id,
        data: formData,
      });
    } else {
      // Add
      await createCustomerMutation.mutateAsync(
        formData as Omit<Customer, "id" | "createdAt" | "updatedAt">
      );
    }
    setIsDialogOpen(false);
    setFormData({});
    setSelectedCustomer(null);
  };

  const handleDeleteCustomer = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this customer?")) {
      return;
    }
    await deleteCustomerMutation.mutateAsync(id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 mt-16">
      <CustomerList
        customers={customers || []}
        onAdd={handleAddCustomer}
        onEdit={handleEditCustomer}
        onDelete={handleDeleteCustomer}
        isSubmitting={createCustomerMutation.isPending || updateCustomerMutation.isPending}
      />
      <CustomerFormDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setFormData({});
            setSelectedCustomer(null);
          }
        }}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleDialogSubmit}
        selectedCustomer={selectedCustomer}
      />
    </div>
  );
};

export default CustomersPage;
