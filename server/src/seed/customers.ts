import { User, Store } from "../models/index.js";

export async function seedCustomers() {
  const stores = await Store.findAll({
    where: { name: ["Demo Store", "BYC Collections"] }
  });
  if (!stores.length) throw new Error("Target stores not found");
  const customers: Array<{
    name: string;
    email: string;
    phone: string;
    role: "client";
    password: string;
    is_active: boolean;
    store_id: number;
  }> = [];
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
