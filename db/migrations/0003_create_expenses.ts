import { sql } from "drizzle-orm";

export async function up(db: any) {
  // Drop the table if it exists to ensure a clean state
  await db.execute(sql`DROP TABLE IF EXISTS expenses;`);
  
  await db.execute(sql`
    CREATE TABLE expenses (
      id SERIAL PRIMARY KEY,
      description TEXT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      date TIMESTAMP NOT NULL,
      category TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Add some initial seed data
    INSERT INTO expenses (description, amount, date, category)
    VALUES 
      ('Office Supplies', 150.00, NOW(), 'Other'),
      ('Team Lunch', 75.50, NOW(), 'Food'),
      ('Taxi Fare', 25.00, NOW(), 'Transportation');
  `);
}

export async function down(db: any) {
  await db.execute(sql`DROP TABLE IF EXISTS expenses;`);
} 