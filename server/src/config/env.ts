import dotenv from "dotenv";

dotenv.config();

interface EnvConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  JWT_SECRET: string;
  COOKIE_SECRET: string;
  CLIENT_URL: string;
  DATABASE_URL: string;
  PORT: number;
}

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'] as const;
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`${envVar} must be defined in environment variables`);
  }
}

const env: EnvConfig = {
  NODE_ENV: (process.env.NODE_ENV as EnvConfig['NODE_ENV']) || 'development',
  JWT_SECRET: process.env.JWT_SECRET!,
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'your-cookie-secret',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  DATABASE_URL: process.env.DATABASE_URL!,
  PORT: parseInt(process.env.PORT || '3000', 10),
};

export default env;
