import bcrypt from "bcryptjs";
import { sequelize } from "../../server/src/config/database.js";
import Store from "../../server/src/models/Store.js";
import User from "../../server/src/models/User.js";
import UserPreference from "../../server/src/models/UserPreference.js";
import Category from "../../server/src/models/Category.js";
import Product from "../../server/src/models/Product.js";
import Customer from "../../server/src/models/Customer.js";
import { SEEDED_USERS } from "../fixtures/users.js";
import { TEST_CATEGORIES } from "../fixtures/products.js";

export interface SeededTestData {
  store: any;
  users: {
    superAdmin: any;
    admin: any;
    sales: any;
  };
  categories: any[];
  products: any[];
  customers: any[];
}

export const seedTestDatabase = async (): Promise<SeededTestData> => {
  try {
    console.log("🌱 Seeding test database...");

    // Clear existing data
    await sequelize.sync({ force: true });

    // Create a test store first
    const store = await Store.create({
      name: "Test Store",
      subdomain: "test"
    });

    // Create test users - let the User model handle password hashing
    const hashedUsers = await Promise.all(
      Object.entries(SEEDED_USERS).map(async ([key, userData]) => {
        // Check if user already exists
        let user = await User.findOne({ where: { email: userData.email } });

        if (!user) {
          // Don't hash password here - let the User model do it
          user = await User.create({
            ...userData,
            store_id: store.id // Use the created store ID
          });

          // Create user preferences
          await UserPreference.create({
            user_id: user.id,
            dark_mode: false,
            notifications: true,
            language: "english",
            theme: "default",
            timezone: "UTC"
          });
        } else {
          // Check if user preferences exist
          const existingPrefs = await UserPreference.findOne({ where: { user_id: user.id } });
          if (!existingPrefs) {
            await UserPreference.create({
              user_id: user.id,
              dark_mode: false,
              notifications: true,
              language: "english",
              theme: "default",
              timezone: "UTC"
            });
          }
        }

        return { key, user };
      })
    );

    // Organize users by role
    const users = {
      superAdmin: hashedUsers.find(u => u.key === 'superAdmin')!.user,
      admin: hashedUsers.find(u => u.key === 'admin')!.user,
      sales: hashedUsers.find(u => u.key === 'sales')!.user
    };

    // Create test categories - cast to any to bypass type checking
    const categories = await Category.bulkCreate(TEST_CATEGORIES as any[]);

    // Create test products
    const testProducts = [
      {
        name: "Test Product 1",
        sku: "TEST001",
        category_id: categories[0].id,
        piece_buying_price: 100,
        piece_selling_price: 150,
        pack_buying_price: 400,
        pack_selling_price: 600,
        dozen_buying_price: 1200,
        dozen_selling_price: 1800,
        quantity: 50,
        min_quantity: 10,
        is_active: true,
        store_id: store.id,
        stock_unit: "piece",
        description: "Test product 1"
      },
      {
        name: "Test Product 2",
        sku: "TEST002",
        category_id: categories[1].id,
        piece_buying_price: 200,
        piece_selling_price: 300,
        pack_buying_price: 800,
        pack_selling_price: 1200,
        dozen_buying_price: 2400,
        dozen_selling_price: 3600,
        quantity: 25,
        min_quantity: 5,
        is_active: true,
        store_id: store.id,
        stock_unit: "piece",
        description: "Test product 2"
      }
    ];

    // Cast to any to bypass type checking
    const products = await Product.bulkCreate(testProducts as any[]);

    // Create test customers
    const testCustomers = [
      {
        name: "John Doe",
        email: "john@example.com",
        phone: "+1234567890",
        address: "123 Main St",
        store_id: store.id
      },
      {
        name: "Jane Smith",
        email: "jane@example.com",
        phone: "+0987654321",
        address: "456 Oak Ave",
        store_id: store.id
      }
    ];

    const customers = await Customer.bulkCreate(testCustomers);

    console.log("✅ Test database seeded successfully");

    return {
      store,
      users,
      categories,
      products,
      customers
    };

  } catch (error) {
    console.error("❌ Error seeding test database:", error);
    throw error;
  }
};

export const cleanupTestDatabase = async (): Promise<void> => {
  try {
    await sequelize.close();
    console.log("✅ Test database cleaned up");
  } catch (error) {
    console.error("❌ Error cleaning up test database:", error);
  }
};
