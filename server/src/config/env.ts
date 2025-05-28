import dotenv from "dotenv";

dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be defined in environment variables");
}

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  JWT_SECRET: process.env.JWT_SECRET,
  COOKIE_SECRET: process.env.COOKIE_SECRET || "your-cookie-secret",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  DATABASE_URL:
    process.env.DATABASE_URL ||
    "postgresql://prosalemanager:prosalepassword@localhost:5432/prosale",
};

export default env;
