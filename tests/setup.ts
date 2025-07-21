import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Set up __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.test before any other imports
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

// Now import sequelize and models
import { sequelize } from '../server/src/config/database.js';
import '../server/src/models/index.js';

// Optionally, keep afterAll to close the connection
afterAll(async () => {
  try {
    await sequelize.close();
  } catch (error) {
    console.error('Error closing database connection:', error);
    throw error;
  }
}); 