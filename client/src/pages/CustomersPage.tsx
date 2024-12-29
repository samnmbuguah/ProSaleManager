import { useEffect, useState } from "react";
import CustomerList from "../components/customers/CustomerList";
import type { Customer } from "@/types/schema";
import { useToast } from "@/components/ui/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function CustomersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await api.get("/customers");
      return response.data;
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (customer: Omit<Customer, "id" | "createdAt" | "updatedAt">) => {
      const response = await api.post("/customers", customer);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        title: "Success",
        description: "Customer added successfully.",
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || "Failed to add customer";
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
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        title: "Success",
        description: "Customer updated successfully.",
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || "Failed to update customer";
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
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        title: "Success",
        description: "Customer deleted successfully.",
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || "Failed to delete customer";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleAddCustomer = async (customer: Omit<Customer, "id" | "createdAt" | "updatedAt">) => {
    await createCustomerMutation.mutateAsync(customer);
  };

  const handleEditCustomer = async (id: number, customer: Partial<Customer>) => {
    await updateCustomerMutation.mutateAsync({ id, data: customer });
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
    <div className="container mx-auto py-6">
      <CustomerList
        customers={customers}
        onAdd={handleAddCustomer}
        onEdit={handleEditCustomer}
        onDelete={handleDeleteCustomer}
        isSubmitting={createCustomerMutation.isPending || updateCustomerMutation.isPending}
      />
    </div>
  );
}
