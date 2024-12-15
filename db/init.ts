import { db } from './index';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

export async function initializeDatabase() {
  try {
    console.log('Starting database initialization...');

    // Ensure meta directory exists in the migrations folder
    const migrationsDir = path.join(process.cwd(), 'drizzle', 'migrations');
    const metaDir = path.join(migrationsDir, 'meta');
    const journalPath = path.join(metaDir, '_journal.json');
    
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
    }
    
    if (!fs.existsSync(metaDir)) {
      fs.mkdirSync(metaDir, { recursive: true });
    }
    
    if (!fs.existsSync(journalPath)) {
      fs.writeFileSync(journalPath, JSON.stringify({
        version: "5",
        dialect: "pg",
        entries: []
      }));
    }

    // Run drizzle migrations
    await migrate(db, { migrationsFolder: './drizzle/migrations' });
    console.log('Database migrations completed successfully');
    
    // Verify database connection
    await db.execute(sql`SELECT 1`);
    console.log('Database connection verified');

    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    return false;
  }
} 