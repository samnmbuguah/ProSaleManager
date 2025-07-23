import { Customer, Store } from '../models/index.js';

export async function seedCustomers() {
  const stores = await Store.findAll();
  if (!stores.length) throw new Error('No stores found');
  const customers = [];
  for (const store of stores) {
    customers.push(
      // Walk-in Customer (default)
      { name: 'Walk-in Customer', email: `walkin.${store.subdomain || store.id}@example.com`, phone: 'N/A', address: 'N/A', notes: 'Default walk-in customer', loyalty_points: 0, is_active: true, store_id: store.id },
      { name: `Alice Johnson (${store.name})`, email: `alice.${store.subdomain}@example.com`, phone: '555-1234', address: '101 First St', notes: 'VIP customer', loyalty_points: 100, is_active: true, store_id: store.id },
      { name: `Bob Smith (${store.name})`, email: `bob.${store.subdomain}@example.com`, phone: '555-5678', address: '202 Second St', notes: '', loyalty_points: 50, is_active: true, store_id: store.id }
    );
  }
  await Customer.bulkCreate(customers, { ignoreDuplicates: true });
  console.log('Customers seeded');
} 