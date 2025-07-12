import React from 'react'
import { Customer } from '@/types/customer'
import CustomerCard from './CustomerCard'

interface CustomerListProps {
  customers: Customer[];
  onAdd: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (id: number) => void;
  isSubmitting: boolean;
}

const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  onAdd,
  onEdit,
  onDelete,
  isSubmitting
}) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold">Customers</h1>
      <button
        onClick={() => onAdd({
          name: '',
          email: null,
          phone: '',
          address: null,
          notes: null
        })}
        disabled={isSubmitting}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
      >
        Add Customer
      </button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {customers.map((customer) => (
        <CustomerCard
          key={customer.id}
          customer={customer}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
      {customers.length === 0 && (
        <div className="col-span-full text-center py-8 text-gray-500">
          No customers found. Add your first customer to get started.
        </div>
      )}
    </div>
    {isSubmitting && <div>Loading...</div>}
  </div>
)

export default CustomerList
