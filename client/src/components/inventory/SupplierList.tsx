import { useState } from "react";
import type { Supplier } from "@/types/schema";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const supplierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type FormData = z.infer<typeof supplierSchema>;

interface SupplierListProps {
  suppliers: Supplier[];
  onAdd: (supplier: FormData) => Promise<void>;
  onEdit: (id: number, supplier: FormData) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export default function SupplierList({
  suppliers,
  onAdd,
  onEdit,
  onDelete,
}: SupplierListProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      if (editingId !== null) {
        await onEdit(editingId, data);
        setEditingId(null);
      } else {
        await onAdd(data);
        setIsAdding(false);
      }
      form.reset();
    } catch (error) {
      console.error("Error saving supplier:", error);
    }
  };

  const startEdit = (supplier: Supplier) => {
    setEditingId(supplier.id);
    form.reset({
      name: supplier.name,
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    form.reset();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Suppliers</h2>
        <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
          Add Supplier
        </Button>
      </div>

      {isAdding && (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              {...form.register("name")}
              placeholder="Name"
              className="w-full"
            />
            <Input
              {...form.register("email")}
              placeholder="Email"
              type="email"
              className="w-full"
            />
            <Input
              {...form.register("phone")}
              placeholder="Phone"
              className="w-full"
            />
            <Input
              {...form.register("address")}
              placeholder="Address"
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit">Save</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAdding(false);
                form.reset();
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers.map((supplier) => (
            <TableRow key={supplier.id}>
              <TableCell>
                {editingId === supplier.id ? (
                  <Input {...form.register("name")} defaultValue={supplier.name} />
                ) : (
                  supplier.name
                )}
              </TableCell>
              <TableCell>
                {editingId === supplier.id ? (
                  <Input
                    {...form.register("email")}
                    defaultValue={supplier.email}
                  />
                ) : (
                  supplier.email
                )}
              </TableCell>
              <TableCell>
                {editingId === supplier.id ? (
                  <Input
                    {...form.register("phone")}
                    defaultValue={supplier.phone}
                  />
                ) : (
                  supplier.phone
                )}
              </TableCell>
              <TableCell>
                {editingId === supplier.id ? (
                  <Input
                    {...form.register("address")}
                    defaultValue={supplier.address}
                  />
                ) : (
                  supplier.address
                )}
              </TableCell>
              <TableCell>
                {editingId === supplier.id ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={form.handleSubmit(onSubmit)}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={cancelEdit}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(supplier)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDelete(supplier.id)}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
