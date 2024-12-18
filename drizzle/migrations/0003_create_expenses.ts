import { sql } from "drizzle-orm";

export async function up(db) {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      description VARCHAR NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      category VARCHAR(50) NOT NULL DEFAULT 'other',
      date TIMESTAMP NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX expenses_user_id_idx ON expenses(user_id);
    CREATE INDEX expenses_date_idx ON expenses(date);
  `);
}

export async function down(db) {
  await db.execute(sql`
    DROP TABLE IF EXISTS expenses CASCADE;
  `);
} 