import { syncDatabase } from './sync.js';

async function seed() {
  try {
    // Sync the database
    const synced = await syncDatabase();
    if (!synced) {
      throw new Error('Failed to sync database');
    }

    console.log('Database synced successfully');
  } catch (error) {
    console.error('Error syncing database:', error);
    process.exit(1);
  }
}

seed(); 