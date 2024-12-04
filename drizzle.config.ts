import type { Config } from "drizzle-kit";

// All configuration is handled by Replit environment variables
export default {
  schema: "./db/schema.ts",
  out: "./migrations",
  driver: "pg",
  dialect: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL ?? "",
  },
  // Strict mode ensures type safety
  strict: true,
} satisfies Config;
