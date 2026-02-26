import { Sale, SaleItem, Product, User, Store } from "../models/index.js";
import { faker } from "@faker-js/faker";

// Helper function to generate random date within last 2 months
function getRandomDateInLastTwoMonths(): Date {
  const now = new Date();
  const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
  const randomTime = twoMonthsAgo.getTime() + Math.random() * (now.getTime() - twoMonthsAgo.getTime());
  return new Date(randomTime);
}

// Helper function to get random time during business hours (8 AM - 8 PM)
function getBusinessHoursTime(date: Date): Date {
  const businessStart = 8; // 8 AM
  const businessEnd = 20; // 8 PM
  const randomHour = businessStart + Math.random() * (businessEnd - businessStart);
  const randomMinute = Math.floor(Math.random() * 60);

  const newDate = new Date(date);
  newDate.setHours(Math.floor(randomHour), randomMinute, 0, 0);
  return newDate;
}

// Payment methods with realistic distribution
const PAYMENT_METHODS = [
  { method: "cash", weight: 0.6 },
  { method: "mpesa", weight: 0.3 },
  { method: "card", weight: 0.1 }
];

function getRandomPaymentMethod(): string {
  const random = Math.random();
  let cumulative = 0;

  for (const { method, weight } of PAYMENT_METHODS) {
    cumulative += weight;
    if (random <= cumulative) {
      return method;
    }
  }

  return "cash"; // fallback
}

// Sale statuses with realistic distribution
const SALE_STATUSES = [
  { status: "completed", weight: 0.95 },
  { status: "pending", weight: 0.03 },
  { status: "cancelled", weight: 0.02 }
];

function getRandomSaleStatus(): string {
  const random = Math.random();
  let cumulative = 0;

  for (const { status, weight } of SALE_STATUSES) {
    cumulative += weight;
    if (random <= cumulative) {
      return status;
    }
  }

  return "completed"; // fallback
}

export async function seedSales(): Promise<void> {
  try {
    console.log("🛒 Starting sales seeder...");

    // Clear existing sales data ONLY for Demo Store and BYC Collections to avoid affecting other stores
    const storesToSeed = await Store.findAll({
      where: {
        name: ["Demo Store", "BYC Collections"]
      }
    });

    if (!storesToSeed.length) {
      throw new Error("Target stores not found. Please seed stores first.");
    }

    const storeIds = storesToSeed.map(s => s.id);
    const demoStoreSales = await Sale.findAll({ where: { store_id: storeIds } });
    const demoSaleIds = demoStoreSales.map((sale) => sale.id).filter((id): id is number => typeof id === "number");

    if (demoSaleIds.length > 0) {
      await SaleItem.destroy({ where: { sale_id: demoSaleIds } });
      await Sale.destroy({ where: { id: demoSaleIds } });
      console.log(`🗑️ Cleared existing sales data for ${storesToSeed.map(s => s.name).join(', ')}`);
    } else {
      console.log("ℹ️ No existing sales for target stores to clear");
    }

    let totalSalesCreated = 0;

    for (const store of storesToSeed) {
      console.log(`🏪 Seeding sales for store: ${store.name}`);

      // Get products for this store
      const products = await Product.findAll({
        where: { store_id: store.id, is_active: true }
      });

      if (!products.length) {
        console.log(`⚠️ No products found for store ${store.name}, skipping...`);
        continue;
      }

      // Get users (cashiers/admins) for this store
      const users = await User.findAll({
        where: {
          store_id: store.id,
          role: ["admin", "sales", "manager"]
        }
      });

      if (!users.length) {
        console.log(`⚠️ No users found for store ${store.name}, skipping...`);
        continue;
      }

      // Get customers for this store
      const customers = await User.findAll({
        where: {
          store_id: store.id,
          role: "client"
        }
      });

      // Generate sales for the last 2 months
      // More sales on weekdays, fewer on weekends
      // Generate exactly 10 sales
      const salesCount = 10;
      const salesToCreate = [];

      for (let i = 0; i < salesCount; i++) {
        const saleDate = getBusinessHoursTime(getRandomDateInLastTwoMonths());
        const user = faker.helpers.arrayElement(users);
        const customer = customers.length > 0 ? faker.helpers.arrayElement(customers) : null;

        // Generate 1-5 items per sale
        const itemCount = Math.floor(Math.random() * 5) + 1;
        const selectedProducts = faker.helpers.arrayElements(products, itemCount);

        let totalAmount = 0;
        const saleItems = [];

        for (const product of selectedProducts) {
          const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 items
          const unitType = faker.helpers.arrayElement(["piece", "pack", "dozen"]);

          let unitPrice = 0;
          switch (unitType) {
            case "piece":
              unitPrice = parseFloat(product.piece_selling_price.toString());
              break;
            case "pack":
              unitPrice = parseFloat(product.pack_selling_price.toString());
              break;
            case "dozen":
              unitPrice = parseFloat(product.dozen_selling_price.toString());
              break;
          }

          const itemTotal = unitPrice * quantity;
          totalAmount += itemTotal;

          saleItems.push({
            product_id: product.id,
            quantity,
            unit_price: unitPrice,
            total: itemTotal,
            unit_type: unitType
          });
        }

        const paymentMethod = getRandomPaymentMethod();
        const status = getRandomSaleStatus();
        const deliveryFee = Math.random() < 0.1 ? Math.floor(Math.random() * 200) + 50 : 0; // 10% chance of delivery

        salesToCreate.push({
          customer_id: customer?.id || null,
          user_id: user.id,
          total_amount: totalAmount + deliveryFee,
          payment_method: paymentMethod,
          amount_paid: status === "completed" ? totalAmount + deliveryFee : Math.random() * (totalAmount + deliveryFee),
          status,
          payment_status: status === "completed" ? "paid" : "pending",
          delivery_fee: deliveryFee,
          receipt_status: {
            whatsapp: Math.random() < 0.3,
            sms: Math.random() < 0.2,
            last_sent_at: Math.random() < 0.4 ? saleDate : null
          },
          store_id: store.id,
          createdAt: saleDate,
          updatedAt: saleDate,
          items: saleItems
        });
      }

      // Create sales in batches to avoid memory issues
      const batchSize = 50;
      for (let i = 0; i < salesToCreate.length; i += batchSize) {
        const batch = salesToCreate.slice(i, i + batchSize);

        for (const saleData of batch) {
          const { items, ...saleAttributes } = saleData;

          // Create the sale
          const sale = await Sale.create(saleAttributes);

          // Create sale items
          for (const item of items) {
            await SaleItem.create({
              ...item,
              sale_id: sale.id
            });
          }
        }
      }

      totalSalesCreated += salesToCreate.length;
      console.log(`✅ Created ${salesToCreate.length} sales for store ${store.name}`);
    }

    console.log(`🎉 Sales seeder completed! Total sales created: ${totalSalesCreated}`);

    // Verify the data
    const totalSalesInDb = await Sale.count();
    const totalItemsInDb = await SaleItem.count();
    console.log(`📊 Verification: ${totalSalesInDb} sales and ${totalItemsInDb} sale items in database`);

  } catch (error) {
    console.error("❌ Error seeding sales:", error);
    throw error;
  }
}

// Run seeder if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedSales()
    .then(() => {
      console.log("Sales seeding completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Sales seeding failed:", error);
      process.exit(1);
    });
}
