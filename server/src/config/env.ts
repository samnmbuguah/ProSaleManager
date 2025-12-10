import dotenv from "dotenv";

dotenv.config();

interface EnvConfig {
  NODE_ENV: "development" | "production" | "test";
  JWT_SECRET: string;
  COOKIE_SECRET: string;
  CLIENT_URL: string;
  DATABASE_URL: string;
  PORT: number;
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  SMTP_FROM?: string;
  // Database configuration (optional, handled by database.ts)
  SQLITE_PATH?: string;
  DB_HOST?: string;
  DB_PORT?: string;
  DB_USER?: string;
  DB_PASSWORD?: string;
  DB_NAME?: string;
}

const isProduction = process.env.NODE_ENV === "production";

// Validate required environment variables based on environment
const requiredEnvVars = ["JWT_SECRET"] as const;

// SQLite is required only in development/test
if (!isProduction) {
  if (!process.env.SQLITE_PATH) {
    throw new Error("SQLITE_PATH must be defined in environment variables for development/test");
  }
}

// MySQL is required only in production
if (isProduction) {
  const mysqlVars = [
    process.env.DB_USER || process.env.MYSQL_USER,
    process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD,
    process.env.DB_NAME || process.env.MYSQL_DATABASE,
  ];
  if (!mysqlVars[0] || !mysqlVars[1] || !mysqlVars[2]) {
    throw new Error(
      "MySQL configuration incomplete in production. Required: DB_USER (or MYSQL_USER), DB_PASSWORD (or MYSQL_PASSWORD), DB_NAME (or MYSQL_DATABASE)"
    );
  }
}

// Validate all required environment variables
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`${envVar} must be defined in environment variables`);
  }
}

const env: EnvConfig = {
  NODE_ENV: (process.env.NODE_ENV as EnvConfig["NODE_ENV"]) || "development",
  JWT_SECRET: process.env.JWT_SECRET!,
  COOKIE_SECRET: process.env.COOKIE_SECRET || "your-cookie-secret",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  DATABASE_URL: isProduction
    ? `mysql://${process.env.DB_USER || process.env.MYSQL_USER}@${process.env.DB_HOST || "localhost"}/${process.env.DB_NAME || process.env.MYSQL_DATABASE}`
    : process.env.SQLITE_PATH || "database.sqlite",
  PORT: parseInt(process.env.PORT || "3000", 10),
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM: process.env.SMTP_FROM,
  SQLITE_PATH: process.env.SQLITE_PATH,
  DB_HOST: process.env.DB_HOST || process.env.MYSQL_HOST,
  DB_PORT: process.env.DB_PORT || process.env.MYSQL_PORT,
  DB_USER: process.env.DB_USER || process.env.MYSQL_USER,
  DB_PASSWORD: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD,
  DB_NAME: process.env.DB_NAME || process.env.MYSQL_DATABASE,
};

export default env;
