import dotenv from "dotenv";
import { sequelize } from "../server/src/config/database.js";
import "../server/src/models/index.js";
import { cleanupCsrf } from "../server/src/utils/csrf.js";
import { seedTestDatabase, cleanupTestDatabase } from "./utils/test-seeder.js";

// Load test environment variables
dotenv.config({ path: ".env.test" });

// Global test setup
beforeAll(async () => {
  try {
    console.log("🧪 Setting up test environment...");
    console.log("⏱️  Test timeout set to 60 seconds");

    // Clean up CSRF utility
    cleanupCsrf();
    console.log("✅ CSRF utility cleaned up");

    // Seed test database with initial data (only once)
    console.log("🌱 Starting database seeding...");
    await seedTestDatabase();
    console.log("✅ Test environment setup complete");
  } catch (error) {
    console.error("❌ Error setting up test environment:", error);
    throw error;
  }
});

afterAll(async () => {
  try {
    console.log("🧹 Cleaning up test environment...");

    // Clean up CSRF utility
    cleanupCsrf();
    console.log("✅ CSRF utility cleaned up");

    // Clean up test database
    await cleanupTestDatabase();
    console.log("✅ Test environment cleaned up");
  } catch (error) {
    console.error("❌ Error cleaning up test environment:", error);
  }
});

// Suppress console.log during tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeEach(() => {
  // Keep console.log for debugging during tests
  console.log = originalConsoleLog;

  // Keep console.error for debugging
  console.error = originalConsoleError;
});

afterEach(() => {
  // Clear all mocks
  jest.clearAllMocks();
});

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
