import { Customer } from '../models/Customer.js'

const customerData = [
  {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    address: '123 Main St, City, State 12345',
    notes: 'Regular customer'
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '+1234567891',
    address: '456 Oak Ave, City, State 12345',
    notes: 'VIP customer'
  },
  {
    name: 'Bob Johnson',
    email: 'bob.johnson@example.com',
    phone: '+1234567892',
    address: '789 Pine Rd, City, State 12345',
    notes: 'Wholesale customer'
  },
  {
    name: 'Alice Brown',
    email: 'alice.brown@example.com',
    phone: '+1234567893',
    address: '321 Elm St, City, State 12345',
    notes: 'New customer'
  },
  {
    name: 'Charlie Wilson',
    email: 'charlie.wilson@example.com',
    phone: '+1234567894',
    address: '654 Maple Dr, City, State 12345',
    notes: 'Online customer'
  }
]

export const seedCustomers = async () => {
  try {
    await Customer.bulkCreate(customerData)
    console.log('Customers seeded successfully')
  } catch (error) {
    console.error('Error seeding customers:', error)
  }
} 