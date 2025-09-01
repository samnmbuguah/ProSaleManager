import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: process.env.SQLITE_PATH || path.resolve(process.cwd(), "database.sqlite"),
  logging: false,
});

export { sequelize };

// Test database connection
export const testConnection = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log("Database connection established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    throw error;
  }
};
