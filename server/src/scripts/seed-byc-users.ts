#!/usr/bin/env node
import 'dotenv/config';
import { sequelize } from "../config/database.js";
import { Store, User, sequelize as seq } from "../models/index.js";

async function seedBYCUsers() {
  try {
    console.log("🚀 Seeding BYC Collections additional users...");

    const transaction = await seq.transaction();
    try {
      const store = await Store.findOne({ where: { name: "BYC Collections" }, transaction });
      if (!store) {
        throw new Error("BYC Collections store not found. Run the main BYC seeder first.");
      }

      // Get passwords from environment variables with fallback to default values
      const managerPassword = process.env.BYC_MANAGER_PASSWORD || 'changeme!';
      const cashierPassword = process.env.BYC_CASHIER_PASSWORD || 'changeme!';
      const demoAdminPassword = process.env.DEMO_ADMIN_PASSWORD || 'demoadmin123';
      const demoCashierPassword = process.env.DEMO_CASHIER_PASSWORD || 'ChangeMe123!';

      const usersToCreate = [
        {
          name: "BYC Manager",
          email: "manager@byccollections.com",
          password: managerPassword,
          role: "manager" as const,
        },
        {
          name: "BYC Cashier",
          email: "cashier@byccollections.com",
          password: cashierPassword,
          role: "sales" as const,
        },
        {
          name: "Demo Admin",
          email: "demo.admin@prosale.com",
          password: demoAdminPassword,
          role: "admin" as const,
        },
        {
          name: "Demo Cashier",
          email: "demo.cashier@example.com",
          password: demoCashierPassword,
          role: "sales" as const,
        },
      ];

      for (const u of usersToCreate) {
        const [user, created] = await User.findOrCreate({
          where: { email: u.email },
          defaults: {
            name: u.name,
            email: u.email,
            password: u.password, // rely on model hook to hash
            role: u.role,
            is_active: true,
            store_id: store.id,
          },
          transaction,
        });
        if (!created) {
          // Ensure password matches the intended value; if not, update to plaintext (hook will hash)
          const matches = await (user as any).comparePassword(u.password);
          if (!matches) {
            user.password = u.password;
            await user.save({ transaction });
            console.log(`🔁 Updated password for ${u.email}`);
          } else {
            console.log(`ℹ️  ${u.email} already exists`);
          }
        } else {
          console.log(`✅ Created ${u.role} ${u.email}`);
        }
      }

      await transaction.commit();
      console.log("🎉 BYC additional users seeding complete");
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    console.error("❌ Error seeding BYC users:", error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

seedBYCUsers();
