import dotenv from 'dotenv';
import { sequelize } from '../config/database.js';

// Load environment variables from .env file
dotenv.config();

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/prosale_test';

// Global setup
beforeAll(async () => {
  // Ensure database is synced
  await sequelize.sync({ force: true });
});

// Global teardown
afterAll(async () => {
  // Close database connection
  await sequelize.close();
}); 