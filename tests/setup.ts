import { beforeAll, afterAll } from '@jest/globals';
import dotenv from 'dotenv';
import { sequelize } from '../server/src/config/database.js';

// Load environment variables
dotenv.config();

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/prosale';

// Global setup
beforeAll(async () => {
  try {
    // Ensure database is synced
    await sequelize.sync({ force: true });
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
});

// Global teardown
afterAll(async () => {
  try {
    // Close database connection
    await sequelize.close();
  } catch (error) {
    console.error('Error closing database connection:', error);
    throw error;
  }
}); 