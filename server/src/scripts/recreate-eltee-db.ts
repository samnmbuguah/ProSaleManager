#!/usr/bin/env tsx

import { sequelize } from "../config/database.js";
import seedElteeStore from "../seed/eltee-store.js";

async function recreateElteeDatabase() {
    try {
        console.log("🗑️ Recreating database...");

        // Sync database (create all tables, force will drop existing ones)
        await sequelize.sync({ force: true });
        console.log("✅ Database tables created");

        // Run the Eltee store seeder
        await seedElteeStore();

        console.log("🎉 Eltee Store database recreated successfully!");
        console.log("🔑 Login credentials:");
        console.log("   Admin: eltee.admin@prosale.com / elteeadmin123");
        console.log("   Manager: eltee.manager@prosale.com / elteemgr123");
        console.log("   Cashier: eltee.cashier@prosale.com / eltee123");

    } catch (error) {
        console.error("❌ Error recreating database:", error);
        process.exit(1);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

recreateElteeDatabase();
