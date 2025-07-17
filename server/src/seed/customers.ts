import { Customer } from '../models/index.js';

export async function seedCustomers() {
  const customers = [
    { name: 'Alice Johnson', email: 'alice@example.com', phone: '555-1234', address: '101 First St', notes: 'VIP customer', loyalty_points: 100, is_active: true },
    { name: 'Bob Smith', email: 'bob@example.com', phone: '555-5678', address: '202 Second St', notes: '', loyalty_points: 50, is_active: true },
  ];
  await Customer.bulkCreate(customers, { ignoreDuplicates: true });
  console.log('Customers seeded');
} 