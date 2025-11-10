import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { sequelize } from '../src/config/database.js';
import path from 'path';
import { readFile } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  try {
    console.log('Starting database migration...');
    
    // Read the migration SQL file
    const migrationPath = path.join(
      __dirname, 
      '../src/database/migrations/20231110000000-add-store-id-to-categories.js'
    );
    
    // Import the migration module
    const migrationModule = await import(migrationPath);
    const migration = migrationModule.default || migrationModule;
    
    // Run the migration
    await migration.up(sequelize.getQueryInterface(), sequelize.constructor);
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

runMigration();
