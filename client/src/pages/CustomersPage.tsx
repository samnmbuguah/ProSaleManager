import { useState } from "react";
import { CustomerList } from "../components/customers/CustomerList";
import { CustomerForm } from "../components/customers/CustomerForm";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useCustomers } from "../hooks/use-customers";

export default function CustomersPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { customers, isLoading, createCustomer, isCreating } = useCustomers();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Customer Management</h1>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <CustomerList customers={customers || []} isLoading={isLoading} />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <CustomerForm
            onSubmit={async (data) => {
              await createCustomer(data);
              setIsFormOpen(false);
            }}
            isSubmitting={isCreating}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
