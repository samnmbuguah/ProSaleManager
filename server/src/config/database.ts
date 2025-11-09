import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

// Configure database based on environment
let sequelize: Sequelize;

if (isProduction) {
  // MySQL configuration for production
  const dbConfig = {
    host: process.env.DB_HOST || process.env.MYSQL_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || process.env.MYSQL_PORT || "3306", 10),
    username: process.env.DB_USER || process.env.MYSQL_USER || "",
    password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || "",
    database: process.env.DB_NAME || process.env.MYSQL_DATABASE || "",
    dialect: "mysql" as const,
    logging: process.env.DB_LOGGING === "true" ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  };

  // Validate required MySQL environment variables
  if (!dbConfig.username || !dbConfig.password || !dbConfig.database) {
    throw new Error(
      "MySQL configuration incomplete. Required: DB_USER (or MYSQL_USER), DB_PASSWORD (or MYSQL_PASSWORD), DB_NAME (or MYSQL_DATABASE)"
    );
  }

  sequelize = new Sequelize(dbConfig);
} else {
  // SQLite configuration for development
  const sqlitePath =
    process.env.SQLITE_PATH || path.resolve(process.cwd(), "database.sqlite");

  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: sqlitePath,
    logging: false,
  });
}

export { sequelize };

// Test database connection
export const testConnection = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    const dbType = isProduction ? "MySQL" : "SQLite";
    console.log(`${dbType} database connection established successfully.`);
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    throw error;
  }
};
