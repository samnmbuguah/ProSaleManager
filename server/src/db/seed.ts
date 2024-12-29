import { syncDatabase } from './sync.js';
import { seedProducts } from '../../seed/products.js';
import { seedUsers } from '../../seed/users.js';
import { setupProductImages } from '../utils/setupImages.js';

async function seed() {
  try {
    // First sync the database
    const syncResult = await syncDatabase();
    if (!syncResult) {
      throw new Error('Database sync failed');
    }

    // Setup product images directory and sample images
    await setupProductImages();

    // Seed users first
    await seedUsers();

    // Seed products and their price units
    await seedProducts();

    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seed(); 