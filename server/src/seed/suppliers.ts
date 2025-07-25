import { Supplier, Store } from "../models/index.js";

export async function seedSuppliers() {
  const store = await Store.findOne({ where: { name: "Demo Store" } });
  if (!store) throw new Error("Demo Store not found");
  const storeId = store.id;
  const suppliers = [
    {
      name: "Acme Corp",
      email: "acme@example.com",
      phone: "1234567890",
      address: "123 Main St",
      contact_person: "John Doe",
      store_id: storeId,
    },
    {
      name: "Global Distributors",
      email: "global@example.com",
      phone: "9876543210",
      address: "456 Market Ave",
      contact_person: "Jane Smith",
      store_id: storeId,
    },
  ];
  await Supplier.bulkCreate(suppliers, { ignoreDuplicates: true });
  console.log("Suppliers seeded");
}
