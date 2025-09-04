import React from "react";
import type { Customer } from "@/types/customer";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";

interface CustomerCardProps {
  customer: Customer;
  onEdit: (customer: Customer) => void;
  onDelete: (id: number) => void;
}

const CustomerCard: React.FC<CustomerCardProps> = ({ customer, onEdit, onDelete }) => {
  return (
    <div className="border rounded-lg p-4 shadow-sm bg-white hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h2 className="text-lg font-semibold">{customer.name}</h2>
      </div>
      {customer.email && <p className="text-sm text-gray-600 mb-1">Email: {customer.email}</p>}
      {customer.phone && <p className="text-sm text-gray-600 mb-1">Phone: {customer.phone}</p>}
      <div className="flex gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={() => onEdit(customer)} className="flex-1">
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(customer.id)}
          className="flex-1"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </div>
    </div>
  );
};

export default CustomerCard;
