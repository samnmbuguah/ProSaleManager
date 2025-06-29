import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const isTest = process.env.NODE_ENV === 'test';

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: isTest ? 'localhost' : process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'prosalemanager',
  password: process.env.DB_PASSWORD || 'prosalepassword',
  database: isTest ? 'pos_test_db' : process.env.DB_NAME || 'prosaledatabase',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
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

