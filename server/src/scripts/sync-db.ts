import { sequelize } from "../config/database.js";
import "../models/index.js"; // Ensure all models are registered
import "../models/ReceiptSettings.js";

async function syncDatabase() {
  try {
    await sequelize.sync({ force: true });
    console.log("Database synced successfully.");
  } catch (error) {
    console.error("Error syncing database:", error);
  } finally {
    await sequelize.close();
  }
}

syncDatabase();
