import sequelize from '../config/database';
import User from '../models/User';
import Product from '../models/Product';
import Supplier from '../models/Supplier';
import ProductSupplier from '../models/ProductSupplier';
import { setupAssociations } from '../models/associations';

// Import all models here
const models = [
  User,
  Product,
  Supplier,
  ProductSupplier
];

async function syncDatabase() {
  try {
    // Test the database connection
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Setup model associations
    setupAssociations();

    // Force sync all models (this will drop all tables and recreate them)
    await sequelize.sync({ alter: true });
    console.log('All models were synchronized successfully.');

    return true;
  } catch (error) {
    console.error('Unable to sync database:', error);
    return false;
  }
}

export { syncDatabase, models }; 