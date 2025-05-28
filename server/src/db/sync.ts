import sequelize from "../config/database.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Supplier from "../models/Supplier.js";
import ProductSupplier from "../models/ProductSupplier.js";
import Customer from "../models/Customer.js";
import Sale from "../models/Sale.js";
import SaleItem from "../models/SaleItem.js";
import Expense from "../models/Expense.js";
import PurchaseOrder from "../models/PurchaseOrder.js";
import PurchaseOrderItem from "../models/PurchaseOrderItem.js";
import { setupAssociations } from "../models/associations.js";

// Define the order of table creation
const modelSequence = [
  User, // No dependencies
  Customer, // No dependencies
  Supplier, // No dependencies
  Product, // Create products first
  ProductSupplier, // Depends on Product and Supplier
  Sale, // Depends on Customer and User
  SaleItem, // Depends on Sale and Product
  Expense, // Depends on User
  PurchaseOrder, // Depends on Supplier
  PurchaseOrderItem, // Depends on PurchaseOrder and Product
];

export async function syncDatabase() {
  try {
    // Test the database connection
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");

    // Set up associations
    setupAssociations();
    console.log("Model associations have been set up");

    // Sync all models with alter: true to update tables without dropping
    for (const model of modelSequence) {
      await model.sync({ alter: true });
    }

    console.log("All models synchronized successfully.");
    return true;
  } catch (error) {
    console.error("Unable to sync database:", error);
    return false;
  }
}
