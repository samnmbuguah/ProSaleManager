import { useEffect } from "react";
import CustomerList from "../components/customers/CustomerList";
import { useToast } from "@/components/ui/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/store";
import { fetchCustomers } from "@/store/customersSlice";
import { Customer as CustomerType } from "@/types/customer";

const CustomersPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();
  const customers = useSelector((state: RootState) => state.customers.items);
  const customersStatus = useSelector(
    (state: RootState) => state.customers.status,
  );
  const isLoading = customersStatus === "loading";

  useEffect(() => {
    if (customersStatus === "idle") {
      dispatch(fetchCustomers());
    }
  }, [dispatch, customersStatus]);

  const createCustomerMutation = useMutation({
    mutationFn: async (
      customer: Omit<CustomerType, "id" | "createdAt" | "updatedAt">,
    ) => {
      const response = await api.post("/api/customers", customer);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({
        title: "Success",
        description: "Customer added successfully.",
      });
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ||
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
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<CustomerType>;
    }) => {
      const response = await api.put(`/api/customers/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({
        title: "Success",
        description: "Customer updated successfully.",
      });
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ||
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
      await api.delete(`/api/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({
        title: "Success",
        description: "Customer deleted successfully.",
      });
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ||
        (error as Error).message ||
        "Failed to delete customer";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleAddCustomer = async (
    customer: Omit<CustomerType, "id" | "createdAt" | "updatedAt">,
  ) => {
    await createCustomerMutation.mutateAsync(customer);
  };

  const handleEditCustomer = (_customer: CustomerType) => {
    // setIsEditDialogOpen(true);
    // setSelectedCustomer(customer);
    // setFormData(customer);
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
        customers={customers}
        onAdd={handleAddCustomer}
        onEdit={handleEditCustomer}
        onDelete={handleDeleteCustomer}
        isSubmitting={
          createCustomerMutation.isPending || updateCustomerMutation.isPending
        }
      />
    </div>
  );
};

export default CustomersPage;
