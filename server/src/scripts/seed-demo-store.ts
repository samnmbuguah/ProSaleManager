#!/usr/bin/env node

import { faker } from "@faker-js/faker";
import {
  Store, User, Product, Supplier, ProductSupplier, PurchaseOrder, PurchaseOrderItem,
  ReceiptSettings, Favorite, StockTakeSession, StockTakeItem, Notification,
  StockReceipt, StockLog, UserPreference, Sale, SaleItem,
} from "../models/index.js";
import Customer from "../models/Customer.js";
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

    const demoPassword = process.env.DEMO_PASSWORD || "Demo123!";
    const demoAdminEmail = "demo.admin@prosale.com";
    const demoManagerEmail = "demo.manager@prosale.com";
    const demoCashierEmail = "demo.cashier@prosale.com";

    const baseUsers = [
      {
        name: "Demo Super Admin",
        email: "demo.superadmin@prosale.com",
        password: demoPassword,
        role: "super_admin" as const,
        is_active: true,
        // Super admin might not strictly need store_id, but it doesn't hurt to associate with demo store for now
        // to avoid null issues in some legacy checks if any. 
        // Although auth middleware handles it.
        store_id: null,
      },
      {
        name: "Demo Admin",
        email: demoAdminEmail,
        password: demoPassword,
        role: "admin" as const,
        is_active: true,
        store_id: demoStore.id,
      },
      {
        name: "Demo Manager",
        email: demoManagerEmail,
        password: demoPassword,
        role: "manager" as const,
        is_active: true,
        store_id: demoStore.id,
      },
      {
        name: "Demo Cashier",
        email: demoCashierEmail,
        password: demoPassword,
        role: "sales" as const,
        is_active: true,
        store_id: demoStore.id,
      },
      {
        name: "Demo Customer",
        email: "demo.customer@prosale.com",
        password: demoPassword,
        role: "client" as const,
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

    // Clear records that reference demo products so this seed remains safely repeatable.
    const existingProducts = await Product.findAll({ where: { store_id: demoStore.id }, attributes: ["id"] });
    const existingProductIds = existingProducts.map((product) => Number(product.id));
    const existingSales = await Sale.findAll({ where: { store_id: demoStore.id }, attributes: ["id"] });
    const existingOrderRows = await PurchaseOrder.findAll({ where: { store_id: demoStore.id }, attributes: ["id"] });
    const existingCounts = await StockTakeSession.findAll({ where: { store_id: demoStore.id }, attributes: ["id"] });
    if (existingSales.length) await SaleItem.destroy({ where: { sale_id: existingSales.map((sale) => sale.id) } });
    await Sale.destroy({ where: { store_id: demoStore.id } });
    if (existingOrderRows.length) await PurchaseOrderItem.destroy({ where: { purchase_order_id: existingOrderRows.map((order) => order.id) } });
    await PurchaseOrder.destroy({ where: { store_id: demoStore.id } });
    if (existingCounts.length) await StockTakeItem.destroy({ where: { session_id: existingCounts.map((count) => Number(count.id)) } });
    await StockTakeSession.destroy({ where: { store_id: demoStore.id } });
    await StockLog.destroy({ where: { store_id: demoStore.id } });
    await StockReceipt.destroy({ where: { store_id: demoStore.id } });
    await ProductSupplier.destroy({ where: { store_id: demoStore.id } });
    if (existingProductIds.length) await Favorite.destroy({ where: { product_id: existingProductIds } });

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

    // 8. Fill the workflows not covered by the legacy seeders.
    console.log("\n🧩 Seeding customers, purchasing, stock control, favorites, notifications and settings...");
    const [admin, manager, cashier, customer] = await Promise.all([
      User.findOne({ where: { email: demoAdminEmail } }),
      User.findOne({ where: { email: demoManagerEmail } }),
      User.findOne({ where: { email: demoCashierEmail } }),
      User.findOne({ where: { email: "demo.customer@prosale.com" } }),
    ]);
    const products = await Product.findAll({ where: { store_id: demoStore.id }, order: [["id", "ASC"]] });
    const suppliers = await Supplier.findAll({ where: { store_id: demoStore.id }, order: [["id", "ASC"]] });
    if (!admin || !manager || !cashier || !customer || products.length < 4 || suppliers.length < 2) {
      throw new Error("Core demo records are missing; cannot create complete workflow data");
    }

    await Customer.destroy({ where: { store_id: demoStore.id } });
    await Customer.bulkCreate([
      { name: "Amara Okafor", email: "amara.okafor@demo.test", phone: "+254 700 111 222", address: "Westlands, Nairobi", notes: "VIP customer; prefers WhatsApp receipts", loyalty_points: 840, is_active: true, store_id: demoStore.id },
      { name: "Daniel Mwangi", email: "daniel.mwangi@demo.test", phone: "+254 711 333 444", address: "Kilimani, Nairobi", notes: "Wholesale customer", loyalty_points: 320, is_active: true, store_id: demoStore.id },
      { name: "Inactive Demo Customer", email: "inactive.customer@demo.test", phone: "+254 722 555 666", address: "Nairobi", notes: "Archived account example", loyalty_points: 0, is_active: false, store_id: demoStore.id },
    ] as any);

    await ReceiptSettings.upsert({ store_id: demoStore.id, business_name: "ProSale Demo Store", address: "42 Market Street, Nairobi", phone: "+254 700 000 000", email: "hello@prosale.demo", website: "prosale.169-58-102-217.sslip.io", thank_you_message: "Thank you for shopping with ProSale!", show_logo: true, font_size: "medium", paper_size: "thermal" } as any);

    await ProductSupplier.destroy({ where: { store_id: demoStore.id } });
    for (let i = 0; i < products.length; i++) {
      await ProductSupplier.create({ product_id: products[i].id, supplier_id: suppliers[i % suppliers.length].id, cost_price: products[i].piece_buying_price, is_preferred: i % 2 === 0, last_supply_date: new Date(Date.now() - i * 86400000), store_id: demoStore.id } as any);
    }

    const oldOrders = await PurchaseOrder.findAll({ where: { store_id: demoStore.id } });
    await PurchaseOrderItem.destroy({ where: { purchase_order_id: oldOrders.map((order) => order.id) } });
    await PurchaseOrder.destroy({ where: { store_id: demoStore.id } });
    const orderStatuses = ["pending", "approved", "ordered", "received", "cancelled"] as const;
    for (let i = 0; i < orderStatuses.length; i++) {
      const quantity = 12 + i * 6;
      const unitPrice = Number(products[i].piece_buying_price);
      const order = await PurchaseOrder.create({ supplier_id: suppliers[i % suppliers.length].id, order_number: `DEMO-PO-${String(i + 1).padStart(3, "0")}`, order_date: new Date(Date.now() - (14 - i) * 86400000), expected_delivery_date: new Date(Date.now() + (i + 1) * 86400000), status: orderStatuses[i], total_amount: quantity * unitPrice, notes: `${orderStatuses[i]} purchase order example`, store_id: demoStore.id } as any);
      await PurchaseOrderItem.create({ purchase_order_id: order.id, product_id: products[i].id, quantity, unit_price: unitPrice, selling_price: Number(products[i].piece_selling_price), total_price: quantity * unitPrice, unit_type: "piece", store_id: demoStore.id } as any);
    }

    await Favorite.destroy({ where: { user_id: [admin.id, manager.id, cashier.id, customer.id] } });
    await Favorite.bulkCreate([admin, manager, cashier, customer].flatMap((user, index) => products.slice(index, index + 2).map((product) => ({ user_id: user.id, product_id: product.id }))) as any);

    const oldCountSessions = await StockTakeSession.findAll({ where: { store_id: demoStore.id }, attributes: ["id"] });
    if (oldCountSessions.length) await StockTakeItem.destroy({ where: { session_id: oldCountSessions.map((session) => Number(session.id)) } });
    await StockTakeSession.destroy({ where: { store_id: demoStore.id } });
    for (const [index, status] of (["pending", "applied", "rejected"] as const).entries()) {
      const session = await StockTakeSession.create({ store_id: demoStore.id, submitted_by: cashier.id, reviewed_by: status === "pending" ? null : manager.id, status, notes: `${status} cycle count example`, reviewed_at: status === "pending" ? null : new Date() } as any);
      const product = products[index];
      const counted = product.quantity + (index - 1) * 2;
      const variance = counted - product.quantity;
      await StockTakeItem.create({ session_id: session.id, product_id: product.id, product_name: product.name, sku: product.sku, category_name: "Demo category", system_quantity: product.quantity, counted_quantity: counted, variance, unit_cost: Number(product.piece_buying_price), variance_value: variance * Number(product.piece_buying_price), notes: variance === 0 ? "Count matched" : "Variance under review" } as any);
    }

    const oldReceipts = await StockReceipt.findAll({ where: { store_id: demoStore.id } });
    await StockLog.destroy({ where: { store_id: demoStore.id } });
    await StockReceipt.destroy({ where: { id: oldReceipts.map((receipt) => receipt.id) } });
    const receipt = await StockReceipt.create({ user_id: manager.id, store_id: demoStore.id, total_cost: 7800, items_count: 2, notes: "Weekly replenishment delivery", date: new Date(Date.now() - 3 * 86400000) } as any);
    for (const product of products.slice(0, 2)) {
      await StockLog.create({ product_id: product.id, quantity_added: 24, unit_cost: Number(product.piece_buying_price), total_cost: 24 * Number(product.piece_buying_price), user_id: manager.id, store_id: demoStore.id, type: "purchase_order", notes: "Demo replenishment", receipt_id: receipt.id, date: receipt.date } as any);
    }

    await Notification.destroy({ where: { user_id: [admin.id, manager.id, cashier.id] } });
    await Notification.bulkCreate([
      { user_id: admin.id, title: "Demo store ready", message: "All demo workflows have sample data.", type: "system", is_read: false },
      { user_id: manager.id, title: "Stock take awaiting review", message: "A pending cycle count needs review.", type: "stock_take", data: { status: "pending" }, is_read: false },
      { user_id: cashier.id, title: "Low stock reminder", message: "Review the low-stock items before the next shift.", type: "info", is_read: true, read_at: new Date() },
    ] as any);
    for (const [index, user] of [admin, manager, cashier, customer].entries()) {
      await UserPreference.upsert({ user_id: user.id, dark_mode: index === 1, notifications: true, language: "english", theme: "default", timezone: "Africa/Nairobi" } as any);
    }
    console.log("✅ Complete demo workflow data seeded");

    console.log("\n" + "=".repeat(60));
    console.log("🎉 Demo Store seeding completed successfully!");
    console.log("=".repeat(60));
    console.log("\n🔑 Demo login credentials (defaults, can be overridden by env):");
    console.log(`   All demo accounts use: ${demoPassword}`);
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
