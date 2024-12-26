import { useState } from "react";
import { type Customer } from "@/types/schema";
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
import { format } from "date-fns";

interface CustomerListProps {
  customers: Customer[];
  onAdd: (customer: Omit<Customer, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  onEdit: (id: number, customer: Partial<Customer>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onSelect?: (customer: Customer) => void;
}

export default function CustomerList({
  customers,
  onAdd,
  onEdit,
  onDelete,
  onSelect,
}: CustomerListProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId !== null) {
        await onEdit(editingId, formData);
        setEditingId(null);
      } else {
        await onAdd(formData);
        setIsAdding(false);
      }
      setFormData({ name: "", email: "", phone: "", address: "" });
    } catch (error) {
      console.error("Error saving customer:", error);
    }
  };

  const startEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setFormData({
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ name: "", email: "", phone: "", address: "" });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Customers</h2>
        <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
          Add Customer
        </Button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
            <Input
              placeholder="Email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
            <Input
              placeholder="Phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />
            <Input
              placeholder="Address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit">Save</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAdding(false);
                setFormData({ name: "", email: "", phone: "", address: "" });
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
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow
              key={customer.id}
              className={onSelect ? "cursor-pointer hover:bg-muted/50" : ""}
              onClick={() => onSelect?.(customer)}
            >
              <TableCell>
                {editingId === customer.id ? (
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                ) : (
                  customer.name
                )}
              </TableCell>
              <TableCell>
                {editingId === customer.id ? (
                  <Input
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                ) : (
                  customer.email
                )}
              </TableCell>
              <TableCell>
                {editingId === customer.id ? (
                  <Input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                ) : (
                  customer.phone
                )}
              </TableCell>
              <TableCell>
                {editingId === customer.id ? (
                  <Input
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                  />
                ) : (
                  customer.address
                )}
              </TableCell>
              <TableCell>
                {format(new Date(customer.createdAt), "MMM d, yyyy")}
              </TableCell>
              <TableCell>
                {editingId === customer.id ? (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSubmit}>
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelEdit}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(customer);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(customer.id);
                      }}
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
