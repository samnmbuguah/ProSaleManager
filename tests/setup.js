const dotenv = require("dotenv");
const { sequelize } = require("../server/src/config/database.js");

// Load environment variables
dotenv.config();

// Set test environment
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-key";
process.env.JWT_EXPIRES_IN = "1h";
process.env.DATABASE_URL = process.env.DATABASE_URL || "sqlite::memory:";
process.env.SQLITE_PATH = ":memory:";

beforeAll(async () => {
  try {
    // Ensure database is synced
    await sequelize.sync({ force: true });
  } catch (error) {
    console.error("Error setting up test database:", error);
    throw error;
  }
});

afterAll(async () => {
  try {
    // Close database connection
    await sequelize.close();
  } catch (error) {
    console.error("Error closing database connection:", error);
    throw error;
  }
});
