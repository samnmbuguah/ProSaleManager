import { User, Store } from "../models/index.js";
import type { UserAttributes } from "../models/User.js";
import { faker } from "@faker-js/faker";

export async function seedUsers() {
  try {
    // Clear all users except super_admin before seeding to avoid double hashing
    await User.destroy({ where: { role: ["admin", "sales", "manager"] } });

    // Get store references
    const elteeStore = await Store.findOne({ where: { name: "eltee" } });
    const demoStore = await Store.findOne({ where: { name: "Demo Store" } });
    const branchStore = await Store.findOne({
      where: { name: "Branch Store" },
    });

    if (!elteeStore) throw new Error("eltee store not found");
    if (!demoStore) throw new Error("Demo Store not found");
    if (!branchStore) throw new Error("Branch Store not found");

    const baseUsers: UserAttributes[] = [
      // Admins for each store
      {
        name: "Eltee Admin",
        email: "eltee.admin@prosale.com",
        password: "elteeadmin123",
        role: "admin",
        is_active: true,
        store_id: elteeStore.id,
      },
      {
        name: "Demo Admin",
        email: "demo.admin@prosale.com",
        password: "demoadmin123",
        role: "admin",
        is_active: true,
        store_id: demoStore.id,
      },
      {
        name: "Branch Admin",
        email: "branch.admin@prosale.com",
        password: "branchadmin123",
        role: "admin",
        is_active: true,
        store_id: branchStore.id,
      },
      // Cashiers (sales) for each store
      {
        name: "Eltee Cashier",
        email: "eltee.cashier@prosale.com",
        password: "eltee123",
        role: "sales",
        is_active: true,
        store_id: elteeStore.id,
      },
      {
        name: "Demo Cashier",
        email: "demo.cashier@prosale.com",
        password: "demo123",
        role: "sales",
        is_active: true,
        store_id: demoStore.id,
      },
      {
        name: "Branch Cashier",
        email: "branch.cashier@prosale.com",
        password: "branch123",
        role: "sales",
        is_active: true,
        store_id: branchStore.id,
      },
      // Managers for each store
      {
        name: "Eltee Manager",
        email: "eltee.manager@prosale.com",
        password: "elteemgr123",
        role: "manager",
        is_active: true,
        store_id: elteeStore.id,
      },
      {
        name: "Demo Manager",
        email: "demo.manager@prosale.com",
        password: "demomgr123",
        role: "manager",
        is_active: true,
        store_id: demoStore.id,
      },
      {
        name: "Branch Manager",
        email: "branch.manager@prosale.com",
        password: "branchmgr123",
        role: "manager",
        is_active: true,
        store_id: branchStore.id,
      },
    ];

    // Generate additional random users for each store
    const stores = [elteeStore, demoStore, branchStore];
    for (const store of stores) {
      for (let i = 0; i < 5; i++) {
        const roles = ["admin", "sales", "manager"] as const;
        const role = roles[Math.floor(Math.random() * roles.length)];
        baseUsers.push({
          name: faker.person.fullName(),
          email: faker.internet.email(),
          password: faker.internet.password(),
          role: role as "admin" | "sales" | "manager",
          is_active: true,
          store_id: store.id,
        });
      }
    }

    for (const user of baseUsers) {
      const existing = await User.findOne({ where: { email: user.email } });
      if (existing) {
        existing.password = user.password; // plain text, let model hook hash
        existing.name = user.name;
        existing.role = user.role ?? "sales";
        existing.is_active = user.is_active ?? true;
        existing.store_id = user.store_id;
        existing.changed("password", true);
        await existing.save();
      } else {
        await User.create(user); // plain text, let model hook hash
      }
    }

    console.log("Users seeded successfully");
  } catch (error) {
    console.error("Error seeding users:", error);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedUsers();
}
