import React from "react";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import {
  ResponsiveTable,
  createTextColumn,
  createActionsColumn,
  ResponsiveTableColumn,
} from "@/components/ui/responsive-table";

interface Supplier {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  contact_person?: string;
  status: "active" | "inactive";
}

interface SupplierListProps {
  suppliers: Supplier[];
  onEdit: (supplier: Supplier) => void;
  onDelete: (id: number) => void;
}

const SupplierList: React.FC<SupplierListProps> = ({ suppliers, onEdit, onDelete }) => {
  const columns: ResponsiveTableColumn<Supplier>[] = [
    createTextColumn("name", "Name", (supplier) => supplier.name, { priority: 1 }),
    createTextColumn(
      "contact_person",
      "Contact Person",
      (supplier) => supplier.contact_person || "-",
      { hideOnMobile: true, priority: 2 }
    ),
    createTextColumn("email", "Email", (supplier) => supplier.email, { priority: 3 }),
    createTextColumn("phone", "Phone", (supplier) => supplier.phone, {
      hideOnMobile: true,
      priority: 4,
    }),
    createTextColumn("address", "Address", (supplier) => supplier.address, {
      hideOnMobile: true,
      priority: 5,
    }),
    createActionsColumn(
      "actions",
      "Actions",
      (supplier) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(supplier)}>
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={() => onDelete(supplier.id)}>
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      ),
      { priority: 6 }
    ),
  ];

  return (
    <ResponsiveTable
      data={suppliers}
      columns={columns}
      keyExtractor={(supplier) => supplier.id}
      title="Suppliers"
      description="Manage your suppliers"
      emptyMessage="No suppliers found"
    />
  );
};

export default SupplierList;
