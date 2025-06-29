import { sequelize } from '../src/config/database';
import Product from '../src/models/Product';
import Category from '../src/models/Category';
import User from '../src/models/User';
import Customer from '../src/models/Customer';
import { seedProducts } from '../seed/products.js';
import { seedUsers } from '../seed/users.js';
import { seedCustomers } from '../seed/customers.js';
import { setupAssociations } from '../src/models/associations';

async function syncAndSeedDatabase() {
  try {
    await sequelize.sync({ force: true });
    console.log('Database synced successfully.');

    // Set up associations
    setupAssociations();

    // Run seeds in sequence
    console.log('Seeding products...');
    await seedProducts();
    console.log('Seeding users...');
    await seedUsers();
    console.log('Seeding customers...');
    await seedCustomers();
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error syncing or seeding database:', error);
  } finally {
    await sequelize.close();
  }
}

syncAndSeedDatabase(); 