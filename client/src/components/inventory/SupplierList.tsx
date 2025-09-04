import React from "react";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";

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

const SupplierList: React.FC<SupplierListProps> = ({ suppliers, onEdit, onDelete }) => (
  <div className="rounded-md border">
    <table className="min-w-full divide-y divide-gray-200">
      <thead>
        <tr>
          <th>Name</th>
          <th>Contact Person</th>
          <th>Email</th>
          <th>Phone</th>
          <th>Address</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {suppliers.map((supplier) => (
          <tr key={supplier.id}>
            <td>{supplier.name}</td>
            <td>{supplier.contact_person || "-"}</td>
            <td>{supplier.email}</td>
            <td>{supplier.phone}</td>
            <td>{supplier.address}</td>
            <td>
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
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default SupplierList;
