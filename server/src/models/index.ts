import { sequelize } from "../config/database.js";
import User from "./User.js";
import UserPreference from "./UserPreference.js";
import Product from "./Product.js";
import Category from "./Category.js";
// import Customer from "./Customer.js";
import Supplier from "./Supplier.js";
import ProductSupplier from "./ProductSupplier.js";
import PurchaseOrder from "./PurchaseOrder.js";
import PurchaseOrderItem from "./PurchaseOrderItem.js";
import Sale from "./Sale.js";
import SaleItem from "./SaleItem.js";
import Expense from "./Expense.js";
import Store from "./Store.js";
import ReceiptSettings from "./ReceiptSettings.js";
import Favorite from "./Favorite.js";
import { setupAssociations } from "./associations.js";

// Set up all model associations
setupAssociations();

// Export models
export {
  sequelize,
  User,
  UserPreference,
  Product,
  Category,
  Supplier,
  ProductSupplier,
  PurchaseOrder,
  PurchaseOrderItem,
  Sale,
  SaleItem,
  Expense,
  Store,
  ReceiptSettings,
  Favorite,
};
