import sequelize from '../config/database.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Supplier from '../models/Supplier.js';
import ProductSupplier from '../models/ProductSupplier.js';
import PriceUnit from '../models/PriceUnit.js';
import Customer from '../models/Customer.js';
import Sale from '../models/Sale.js';
import SaleItem from '../models/SaleItem.js';
import Expense from '../models/Expense.js';
import { setupAssociations } from '../models/associations.js';

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

export async function syncDatabase() {
  try {
    // Test the database connection
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Set up associations
    setupAssociations();
    console.log('Model associations have been set up');
    
    // Sync all models with alter: true to update tables without dropping
    await User.sync({ alter: true });
    await Customer.sync({ alter: true });
    await Supplier.sync({ alter: true });
    await Product.sync({ alter: true });
    await PriceUnit.sync({ alter: true });
    await ProductSupplier.sync({ alter: true });
    await Sale.sync({ alter: true });
    await SaleItem.sync({ alter: true });
    await Expense.sync({ alter: true });

    console.log('All models synchronized successfully.');
    return true;
  } catch (error) {
    console.error('Unable to sync database:', error);
    return false;
  }
} 