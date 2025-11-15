import { Expense, User, Store } from "../models/index.js";
import { faker } from "@faker-js/faker";

// Helper function to generate random date within last 2 months
function getRandomDateInLastTwoMonths(): Date {
  const now = new Date();
  const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
  const randomTime = twoMonthsAgo.getTime() + Math.random() * (now.getTime() - twoMonthsAgo.getTime());
  return new Date(randomTime);
}

// Expense categories with realistic descriptions and amounts
const EXPENSE_CATEGORIES = [
  {
    category: "Rent",
    descriptions: ["Monthly rent", "Office rent", "Store rent", "Warehouse rent"],
    minAmount: 15000,
    maxAmount: 50000,
    frequency: "monthly" // Once per month
  },
  {
    category: "Utilities",
    descriptions: ["Electricity bill", "Water bill", "Internet bill", "Phone bill", "Gas bill"],
    minAmount: 2000,
    maxAmount: 15000,
    frequency: "monthly" // Once per month
  },
  {
    category: "Inventory",
    descriptions: ["Stock purchase", "Product restocking", "Bulk order", "New inventory", "Supplier payment"],
    minAmount: 5000,
    maxAmount: 100000,
    frequency: "weekly" // 2-4 times per month
  },
  {
    category: "Marketing",
    descriptions: ["Facebook ads", "Google ads", "Print advertising", "Social media promotion", "Flyers printing"],
    minAmount: 1000,
    maxAmount: 20000,
    frequency: "weekly" // 1-2 times per month
  },
  {
    category: "Transport",
    descriptions: ["Fuel", "Delivery costs", "Taxi fare", "Bus fare", "Vehicle maintenance"],
    minAmount: 500,
    maxAmount: 5000,
    frequency: "daily" // Multiple times per week
  },
  {
    category: "Office Supplies",
    descriptions: ["Stationery", "Receipt paper", "Pens and pencils", "Notebooks", "Printing supplies"],
    minAmount: 200,
    maxAmount: 3000,
    frequency: "weekly" // 1-2 times per month
  },
  {
    category: "Maintenance",
    descriptions: ["Equipment repair", "Store maintenance", "Cleaning supplies", "Security system", "POS maintenance"],
    minAmount: 1000,
    maxAmount: 25000,
    frequency: "monthly" // 1-2 times per month
  },
  {
    category: "Staff",
    descriptions: ["Staff training", "Employee benefits", "Overtime pay", "Staff meals", "Team building"],
    minAmount: 1000,
    maxAmount: 15000,
    frequency: "weekly" // 1-2 times per month
  },
  {
    category: "Insurance",
    descriptions: ["Business insurance", "Equipment insurance", "Liability insurance", "Health insurance"],
    minAmount: 3000,
    maxAmount: 20000,
    frequency: "monthly" // Once per month
  },
  {
    category: "Miscellaneous",
    descriptions: ["Bank charges", "Legal fees", "Consultation fees", "Emergency expenses", "Unexpected costs"],
    minAmount: 500,
    maxAmount: 10000,
    frequency: "weekly" // 1-3 times per month
  }
];

// Payment methods with realistic distribution
const PAYMENT_METHODS = [
  { method: "mpesa", weight: 0.5 },
  { method: "cash", weight: 0.3 },
  { method: "bank_transfer", weight: 0.2 }
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

  return "mpesa"; // fallback
}

function getRandomExpenseCategory() {
  return faker.helpers.arrayElement(EXPENSE_CATEGORIES);
}

function getExpenseAmount(category: typeof EXPENSE_CATEGORIES[0]): number {
  const min = category.minAmount;
  const max = category.maxAmount;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shouldCreateExpenseOnDate(category: typeof EXPENSE_CATEGORIES[0], date: Date): boolean {
  const dayOfWeek = date.getDay();
  const dayOfMonth = date.getDate();

  switch (category.frequency) {
    case "daily":
      // 30-50% chance on weekdays, 10-20% on weekends
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        return Math.random() < 0.4; // 40% chance on weekdays
      } else {
        return Math.random() < 0.15; // 15% chance on weekends
      }

    case "weekly":
      // 1-2 times per month, prefer weekdays
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        return Math.random() < 0.1; // 10% chance on weekdays
      } else {
        return Math.random() < 0.05; // 5% chance on weekends
      }

    case "monthly":
      // Once per month, prefer beginning or end of month
      if (dayOfMonth <= 5 || dayOfMonth >= 25) {
        return Math.random() < 0.15; // 15% chance at month start/end
      } else {
        return Math.random() < 0.05; // 5% chance in middle of month
      }

    default:
      return Math.random() < 0.1;
  }
}

export async function seedExpenses(): Promise<void> {
  try {
    console.log("💰 Starting expenses seeder...");
    
    // Only seed expenses for Demo Store
    const demoStore = await Store.findOne({ where: { name: "Demo Store" } });
    if (!demoStore) {
      throw new Error("Demo Store not found. Please seed stores first.");
    }

    // Clear existing expenses data ONLY for Demo Store to avoid affecting other stores
    await Expense.destroy({ where: { store_id: demoStore.id } });
    console.log("🗑️ Cleared existing expenses data for Demo Store only");

    const stores = [demoStore];

    let totalExpensesCreated = 0;

    for (const store of stores) {
      console.log(`🏪 Seeding expenses for store: ${store.name}`);

      // Get users (admins/managers) for this store who can create expenses
      const users = await User.findAll({
        where: {
          store_id: store.id,
          role: ["admin", "manager"]
        }
      });

      if (!users.length) {
        console.log(`⚠️ No admin/manager users found for store ${store.name}, skipping...`);
        continue;
      }

      // Generate expenses for the last 2 months
      const expensesToCreate = [];
      const currentDate = new Date();
      const twoMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, currentDate.getDate());

      // Generate expenses for each day in the last 2 months
      for (let date = new Date(twoMonthsAgo); date <= currentDate; date.setDate(date.getDate() + 1)) {
        // Check each expense category for this day
        for (const category of EXPENSE_CATEGORIES) {
          if (shouldCreateExpenseOnDate(category, date)) {
            const user = faker.helpers.arrayElement(users);
            const description = faker.helpers.arrayElement(category.descriptions);
            const amount = getExpenseAmount(category);
            const paymentMethod = getRandomPaymentMethod();

            // Add some randomness to the time within the day
            const expenseDate = new Date(date);
            expenseDate.setHours(
              Math.floor(Math.random() * 12) + 8, // 8 AM to 8 PM
              Math.floor(Math.random() * 60),
              0,
              0
            );

            expensesToCreate.push({
              description,
              amount,
              date: expenseDate,
              category: category.category,
              payment_method: paymentMethod,
              user_id: user.id,
              store_id: store.id,
              createdAt: expenseDate,
              updatedAt: expenseDate
            });
          }
        }
      }

      // Create expenses in batches
      const batchSize = 100;
      for (let i = 0; i < expensesToCreate.length; i += batchSize) {
        const batch = expensesToCreate.slice(i, i + batchSize);
        await Expense.bulkCreate(batch);
      }

      totalExpensesCreated += expensesToCreate.length;
      console.log(`✅ Created ${expensesToCreate.length} expenses for store ${store.name}`);
    }

    console.log(`🎉 Expenses seeder completed! Total expenses created: ${totalExpensesCreated}`);

    // Verify the data and show summary
    const totalExpensesInDb = await Expense.count();
    console.log(`📊 Verification: ${totalExpensesInDb} expenses in database`);

    // Show expense summary by category
    const expensesByCategory = await Expense.findAll({
      attributes: [
        'category',
        [Expense.sequelize!.fn('COUNT', Expense.sequelize!.col('id')), 'count'],
        [Expense.sequelize!.fn('SUM', Expense.sequelize!.col('amount')), 'total']
      ],
      group: ['category'],
      raw: true
    });

    console.log("\n📈 Expense Summary by Category:");
    expensesByCategory.forEach((expense: any) => {
      console.log(`  ${expense.category}: ${expense.count} expenses, Total: KES ${parseFloat(expense.total).toLocaleString()}`);
    });

  } catch (error) {
    console.error("❌ Error seeding expenses:", error);
    throw error;
  }
}

// Run seeder if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedExpenses()
    .then(() => {
      console.log("Expenses seeding completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Expenses seeding failed:", error);
      process.exit(1);
    });
}
