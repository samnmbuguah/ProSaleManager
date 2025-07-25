import { sequelize } from "../config/database.js";

async function createTables() {
  try {
    await sequelize.query(`
      CREATE TYPE user_role AS ENUM ('admin', 'sales');

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role user_role NOT NULL DEFAULT 'sales',
        is_active BOOLEAN NOT NULL DEFAULT true,
        last_login TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    console.log("Tables created successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error creating tables:", error);
    process.exit(1);
  }
}

createTables();
