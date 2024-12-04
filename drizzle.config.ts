import type { Config } from "drizzle-kit";

// DATABASE_URL is provided by Replit environment
export default {
  schema: "./db/schema.ts",
  out: "./migrations",
  driver: "pg",
  dialect: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
