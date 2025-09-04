import React from "react";
import type { Customer } from "@/types/customer";

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
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(customer)}
            className="text-blue-500 hover:text-blue-700 text-sm"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(customer.id)}
            className="text-red-500 hover:text-red-700 text-sm"
          >
            Delete
          </button>
        </div>
      </div>
      {customer.email && <p className="text-sm text-gray-600 mb-1">Email: {customer.email}</p>}
      {customer.phone && <p className="text-sm text-gray-600 mb-1">Phone: {customer.phone}</p>}
    </div>
  );
};

export default CustomerCard;
