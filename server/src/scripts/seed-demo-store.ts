#!/usr/bin/env node

import { faker } from "@faker-js/faker";
import { Store, User } from "../models/index.js";
import { seedCategories } from "../seed/categories.js";
import { seedDemoProducts } from "../seed/seed-products.js";
import { seedSuppliers } from "../seed/suppliers.js";
import { seedSales } from "../seed/sales.js";
import { seedExpenses } from "../seed/expenses.js";

async function seedDemoStore() {
  try {
    console.log("🚀 Starting Demo Store seeding...");
    console.log("=".repeat(60));

    // 1. Ensure Demo Store exists (do NOT touch other stores)
    console.log("\n🏪 Ensuring Demo Store exists...");
    const [demoStore] = await Store.findOrCreate({
      where: { name: "Demo Store" },
      defaults: {
        subdomain: "demo",
      },
    });
    console.log(`✅ Demo Store ready (id=${demoStore.id})`);

    // 2. Seed Demo Store users ONLY (no global deletes)
    console.log("\n👤 Seeding Demo Store users (admin/manager/cashier/clients)...");

    const demoAdminEmail = process.env.DEMO_ADMIN_EMAIL || "demo.admin@example.com";
    const demoAdminPassword = process.env.DEMO_ADMIN_PASSWORD || "ChangeMe123!";
    const demoManagerEmail = process.env.DEMO_MANAGER_EMAIL || "demo.manager@example.com";
    const demoManagerPassword = process.env.DEMO_MANAGER_PASSWORD || "ChangeMe123!";
    const demoCashierEmail = process.env.DEMO_CASHIER_EMAIL || "demo.cashier@example.com";
    const demoCashierPassword = process.env.DEMO_CASHIER_PASSWORD || "ChangeMe123!";

    const baseUsers = [
      {
        name: "Demo Admin",
        email: demoAdminEmail,
        password: demoAdminPassword,
        role: "admin" as const,
        is_active: true,
        store_id: demoStore.id,
      },
      {
        name: "Demo Manager",
        email: demoManagerEmail,
        password: demoManagerPassword,
        role: "manager" as const,
        is_active: true,
        store_id: demoStore.id,
      },
      {
        name: "Demo Cashier",
        email: demoCashierEmail,
        password: demoCashierPassword,
        role: "sales" as const,
        is_active: true,
        store_id: demoStore.id,
      },
      // Default walk-in customer
      {
        name: "Walk-in Customer",
        email: `walkin.${demoStore.subdomain || demoStore.id}@example.com`,
        password: faker.internet.password(),
        role: "client" as const,
        is_active: true,
        store_id: demoStore.id,
      },
      {
        name: `Alice Johnson (${demoStore.name})`,
        email: `alice.${demoStore.subdomain || demoStore.id}@example.com`,
        password: faker.internet.password(),
        role: "client" as const,
        is_active: true,
        store_id: demoStore.id,
      },
      {
        name: `Bob Smith (${demoStore.name})`,
        email: `bob.${demoStore.subdomain || demoStore.id}@example.com`,
        password: faker.internet.password(),
        role: "client" as const,
        is_active: true,
        store_id: demoStore.id,
      },
    ];

    // Add a few extra random staff users for Demo Store
    for (let i = 0; i < 5; i++) {
      const roles = ["admin", "sales", "manager"] as const;
      const role = roles[Math.floor(Math.random() * roles.length)];
      baseUsers.push({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: faker.internet.password(),
        role,
        is_active: true,
        store_id: demoStore.id,
      });
    }

    for (const user of baseUsers) {
      const existing = await User.findOne({ where: { email: user.email } });
      if (existing) {
        if (existing.password !== user.password) {
          existing.password = user.password; // plain text, let model hook hash
        }
        existing.name = user.name;
        existing.role = user.role as any;
        existing.is_active = user.is_active ?? true;
        existing.store_id = user.store_id;
        await existing.save();
      } else {
        await User.create(user as any); // plain text, let model hook hash
      }
    }

    console.log("✅ Demo Store users seeded/updated");

    // 3. Seed categories (safe global upsert)
    console.log("\n🏷️  Seeding categories (global, ignoreDuplicates)...");
    await seedCategories();

    // 4. Seed Demo Store products only (with Pexels images)
    console.log("\n📦 Seeding Demo Store products (with images)...");
    await seedDemoProducts();

    // 5. Seed Demo Store suppliers only
    console.log("\n🚚 Seeding Demo Store suppliers...");
    await seedSuppliers();

    // 6. Seed Demo Store sales (last 2 months)
    console.log("\n💳 Seeding Demo Store sales...");
    await seedSales();

    // 7. Seed Demo Store expenses (last 2 months)
    console.log("\n💰 Seeding Demo Store expenses...");
    await seedExpenses();

    console.log("\n" + "=".repeat(60));
    console.log("🎉 Demo Store seeding completed successfully!");
    console.log("=".repeat(60));
    console.log("\n🔑 Demo login credentials (defaults, can be overridden by env):");
    console.log(`   Admin:   ${demoAdminEmail} / ${demoAdminPassword}`);
    console.log(`   Manager: ${demoManagerEmail} / ${demoManagerPassword}`);
    console.log(`   Cashier: ${demoCashierEmail} / ${demoCashierPassword}`);
  } catch (error) {
    console.error("❌ Error seeding Demo Store:", error);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedDemoStore()
    .then(() => {
      console.log("Demo Store seeding script finished successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Demo Store seeding script failed:", error);
      process.exit(1);
    });
}
