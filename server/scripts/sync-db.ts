import { sequelize } from "../src/config/database.js";
import "../src/models/index.js";
import "../src/models/ReceiptSettings.js";

const syncDatabase = async () => {
  try {
    console.log("🔄 Starting database synchronization...");
    console.log("⚠️  WARNING: This will reset the database and recreate all tables!");

    // Force sync (drops and recreates all tables)
    await sequelize.sync({ force: true });

    console.log("✅ Database synchronized successfully!");
    console.log("📊 All tables have been recreated with the latest schema");
    console.log("🔐 User roles now include: super_admin, admin, manager, sales, client");
    console.log("👤 Default user role is now: client");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error synchronizing database:", error);
    process.exit(1);
  }
};

syncDatabase();