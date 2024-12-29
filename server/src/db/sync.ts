import sequelize from '../config/database';
import User from '../models/User';
import Product from '../models/Product';
import Supplier from '../models/Supplier';
import ProductSupplier from '../models/ProductSupplier';
import PriceUnit from '../models/PriceUnit';
import Customer from '../models/Customer';
import Sale from '../models/Sale';
import SaleItem from '../models/SaleItem';
import Expense from '../models/Expense';
import { setupAssociations } from '../models/associations';

// Define the order of table creation
const modelSequence = [
  User,         // No dependencies
  Customer,     // No dependencies
  Supplier,     // No dependencies
  Product,      // Create products first
  PriceUnit,    // Then price units
  ProductSupplier, // Depends on Product and Supplier
  Sale,         // Depends on Customer and User
  SaleItem,     // Depends on Sale and Product
  Expense       // Depends on User
];

async function syncDatabase() {
  try {
    // Test the database connection
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Set up associations
    setupAssociations();
    
    // Sync models without dropping tables
    for (const model of modelSequence) {
      await model.sync({ alter: true });
      console.log(`${model.name} model synchronized successfully.`);
    }

    console.log('All models were synchronized successfully.');
    return true;
  } catch (error) {
    console.error('Unable to sync database:', error);
    return false;
  }
}

export { syncDatabase }; 