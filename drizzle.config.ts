import type { Config } from "drizzle-kit";

export default {
  schema: "./db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    user: process.env.DB_USER || "prosalemanager",
    password: process.env.DB_PASSWORD || "prosalepassword",
    database: process.env.DB_NAME || "prosaledatabase",
    ssl: false,
  },
} satisfies Config;
