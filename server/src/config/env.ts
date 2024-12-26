import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/prosale',
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'cookie-secret',
  // Add other environment variables as needed
};

export default env; 