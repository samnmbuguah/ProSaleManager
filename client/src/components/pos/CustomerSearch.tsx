import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CustomerForm } from "./CustomerForm";

interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
}

interface CustomerSearchProps {
  onSelect: (customer: Customer | null) => void;
  selectedCustomer?: Customer | null;
}

export function CustomerSearch({ onSelect, selectedCustomer }: CustomerSearchProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isNewCustomerDialogOpen, setIsNewCustomerDialogOpen] = useState(false);

  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ["customers", search],
    queryFn: async () => {
      const response = await fetch(`/api/customers/search?q=${encodeURIComponent(search)}`);
      if (!response.ok) {
        throw new Error("Failed to fetch customers");
      }
      return response.json();
    },
  });

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedCustomer ? selectedCustomer.name : "Select customer..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <CommandInput 
              placeholder="Search customers..." 
              value={search}
              onValueChange={setSearch}
            />
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              <>
                <CommandEmpty>
                  <div className="flex flex-col items-center justify-center py-6 gap-2">
                    <p>No customer found.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setOpen(false);
                        setIsNewCustomerDialogOpen(true);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Customer
                    </Button>
                  </div>
                </CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      onSelect(null);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        !selectedCustomer ? "opacity-100" : "opacity-0"
                      )}
                    />
                    Walk-in Customer
                  </CommandItem>
                  {customers?.map((customer) => (
                    <CommandItem
                      key={customer.id}
                      onSelect={() => {
                        onSelect(customer);
                        setOpen(false);
                      }}
                      className="flex flex-col items-start"
                    >
                      <div className="flex items-center w-full">
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedCustomer?.id === customer.id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        <div>
                          <div>{customer.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {customer.phone || customer.email}
                          </div>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </Command>
        </PopoverContent>
      </Popover>

      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsNewCustomerDialogOpen(true)}
      >
        <Plus className="h-4 w-4" />
      </Button>

      <Dialog open={isNewCustomerDialogOpen} onOpenChange={setIsNewCustomerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <CustomerForm
            onSubmit={async (data) => {
              const response = await fetch("/api/customers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
              });

              if (!response.ok) {
                throw new Error("Failed to create customer");
              }

              const newCustomer = await response.json();
              onSelect(newCustomer);
              setIsNewCustomerDialogOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
} 