import { jest } from '@jest/globals';
import { sequelize } from '../config/database';
import dotenv from 'dotenv';

dotenv.config();

beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  // Sync database
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  // Close database connection
  await sequelize.close();
});

// Global test timeout
jest.setTimeout(30000); 