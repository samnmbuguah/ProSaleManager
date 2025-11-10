#!/usr/bin/env node
import { sequelize } from "../config/database.js";
import { Store, User, sequelize as seq } from "../models/index.js";
import bcrypt from "bcrypt";

async function seedBYCUsers() {
  try {
    console.log("🚀 Seeding BYC Collections additional users...");

    const transaction = await seq.transaction();
    try {
      const store = await Store.findOne({ where: { name: "BYC Collections" }, transaction });
      if (!store) {
        throw new Error("BYC Collections store not found. Run the main BYC seeder first.");
      }

      const usersToCreate = [
        {
          name: "BYC Manager",
          email: "manager@byccollections.com",
          password: "bycmanager123",
          role: "manager" as const,
        },
        {
          name: "BYC Cashier",
          email: "cashier@byccollections.com",
          password: "byccashier123",
          role: "sales" as const,
        },
      ];

      for (const u of usersToCreate) {
        const hashed = await bcrypt.hash(u.password, 10);
        const [user, created] = await User.findOrCreate({
          where: { email: u.email },
          defaults: {
            name: u.name,
            email: u.email,
            password: hashed,
            role: u.role,
            is_active: true,
            store_id: store.id,
          },
          transaction,
        });
        console.log(created ? `✅ Created ${u.role} ${u.email}` : `ℹ️  ${u.email} already exists`);
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
