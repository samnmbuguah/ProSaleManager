import { User, Store } from "../models/index.js";

export async function seedCustomers() {
  const stores = await Store.findAll();
  if (!stores.length) throw new Error("No stores found");
  const customers: any[] = [];
  for (const store of stores) {
    customers.push(
      // Walk-in Customer (default)
      {
        name: "Walk-in Customer",
        email: `walkin.${store.subdomain || store.id}@example.com`,
        phone: "N/A",
        role: "client",
        password: Math.random().toString(36).slice(2),
        is_active: true,
        store_id: store.id,
      },
      {
        name: `Alice Johnson (${store.name})`,
        email: `alice.${store.subdomain || store.id}@example.com`,
        phone: "555-1234",
        role: "client",
        password: Math.random().toString(36).slice(2),
        is_active: true,
        store_id: store.id,
      },
      {
        name: `Bob Smith (${store.name})`,
        email: `bob.${store.subdomain || store.id}@example.com`,
        phone: "555-5678",
        role: "client",
        password: Math.random().toString(36).slice(2),
        is_active: true,
        store_id: store.id,
      },
    );
  }
  await User.bulkCreate(customers, { ignoreDuplicates: true });
  console.log("Customers seeded");
}
