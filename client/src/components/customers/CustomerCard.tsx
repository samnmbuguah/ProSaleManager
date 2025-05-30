import React from "react";
import type { Customer } from "@/types/customer";

interface CustomerCardProps {
  customer: Customer;
}

const CustomerCard: React.FC<CustomerCardProps> = ({ customer }) => {
  return (
    <div className="border rounded-lg p-4 shadow-sm bg-white">
      <h2 className="text-lg font-semibold mb-1">{customer.name}</h2>
      {customer.email && (
        <p className="text-sm text-gray-600">Email: {customer.email}</p>
      )}
      {customer.phone && (
        <p className="text-sm text-gray-600">Phone: {customer.phone}</p>
      )}
      {customer.address && (
        <p className="text-sm text-gray-600">Address: {customer.address}</p>
      )}
    </div>
  );
};

export default CustomerCard;
