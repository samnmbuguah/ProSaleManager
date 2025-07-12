import React from 'react'
import { Customer } from '@/types/customer'
import CustomerCard from './CustomerCard'

interface CustomerListProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (id: number) => void;
  isSubmitting: boolean;
}

const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  onEdit,
  onDelete,
  isSubmitting
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {customers.map((customer) => (
      <CustomerCard
        key={customer.id}
        customer={customer}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    ))}
    {isSubmitting && <div>Loading...</div>}
  </div>
)

export default CustomerList
