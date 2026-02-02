import User from "./User.js";
import UserPreference from "./UserPreference.js";
import Sale from "./Sale.js";
import SaleItem from "./SaleItem.js";
import Product from "./Product.js";
import Expense from "./Expense.js";
import Supplier from "./Supplier.js";
import ProductSupplier from "./ProductSupplier.js";
import PurchaseOrder from "./PurchaseOrder.js";
import PurchaseOrderItem from "./PurchaseOrderItem.js";
import Category from "./Category.js";
import Store from "./Store.js";
import ReceiptSettings from "./ReceiptSettings.js";
import Favorite from "./Favorite.js";
import StockTakeSession from "./StockTakeSession.js";
import StockTakeItem from "./StockTakeItem.js";
import Notification from "./Notification.js";
import StockLog from "./StockLog.js";

let associationsSetup = false;

export function setupAssociations() {
  // Prevent setting up associations multiple times
  if (associationsSetup) {
    return;
  }

  // User - UserPreference association
  User.hasOne(UserPreference, { foreignKey: "user_id" });
  UserPreference.belongsTo(User, { foreignKey: "user_id" });

  // User - Sale association (sales made by the user/staff)
  User.hasMany(Sale, { foreignKey: "user_id", as: "Sales" });
  Sale.belongsTo(User, { foreignKey: "user_id", as: "User" });

  // Client User (customer) - Sale association
  User.hasMany(Sale, { foreignKey: "customer_id", as: "ClientSales" });
  Sale.belongsTo(User, { foreignKey: "customer_id", as: "Customer", constraints: false });

  // Sale - SaleItem association
  Sale.hasMany(SaleItem, { foreignKey: "sale_id", as: "items" });
  SaleItem.belongsTo(Sale, { foreignKey: "sale_id", as: "sale" });

  // Product - SaleItem association
  Product.hasMany(SaleItem, { foreignKey: "product_id" });
  SaleItem.belongsTo(Product, { foreignKey: "product_id" });

  // User - Expense association
  User.hasMany(Expense, { foreignKey: "user_id", as: "expenses" });
  Expense.belongsTo(User, { foreignKey: "user_id", as: "user" });

  // Product and Supplier associations through ProductSupplier
  Product.belongsToMany(Supplier, {
    through: ProductSupplier,
    foreignKey: "product_id",
    otherKey: "supplier_id",
  });
  Supplier.belongsToMany(Product, {
    through: ProductSupplier,
    foreignKey: "supplier_id",
    otherKey: "product_id",
  });

  // Purchase Order associations
  PurchaseOrder.belongsTo(Supplier, {
    foreignKey: "supplier_id",
    as: "supplier",
  });
  Supplier.hasMany(PurchaseOrder, {
    foreignKey: "supplier_id",
    as: "purchaseOrders",
  });

  PurchaseOrder.hasMany(PurchaseOrderItem, {
    foreignKey: "purchase_order_id",
    as: "items",
  });
  PurchaseOrderItem.belongsTo(PurchaseOrder, {
    foreignKey: "purchase_order_id",
  });

  PurchaseOrderItem.belongsTo(Product, {
    foreignKey: "product_id",
  });
  Product.hasMany(PurchaseOrderItem, {
    foreignKey: "product_id",
  });

  // Store - Category association
  Store.hasMany(Category, { foreignKey: 'store_id', as: 'categories' });
  Category.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

  // Category - Product association
  Category.hasMany(Product, { foreignKey: 'category_id' });
  Product.belongsTo(Category, { foreignKey: 'category_id' });

  // Store - Product association
  Store.hasMany(Product, { foreignKey: 'store_id' });
  Product.belongsTo(Store, { foreignKey: 'store_id' });

  // Store associations
  Store.hasMany(User, { foreignKey: "store_id" });
  User.belongsTo(Store, { foreignKey: "store_id", as: "store" });

  Product.belongsTo(Store, { foreignKey: "store_id" });

  // Store - Users association already exists via User model; clients are users with role='client'

  Store.hasMany(Sale, { foreignKey: "store_id" });
  Sale.belongsTo(Store, { foreignKey: "store_id", as: "store" });

  Store.hasMany(Expense, { foreignKey: "store_id" });
  Expense.belongsTo(Store, { foreignKey: "store_id" });

  Store.hasMany(Supplier, { foreignKey: "store_id" });
  Supplier.belongsTo(Store, { foreignKey: "store_id" });

  Store.hasMany(ProductSupplier, { foreignKey: "store_id" });
  ProductSupplier.belongsTo(Store, { foreignKey: "store_id" });

  Store.hasMany(PurchaseOrder, { foreignKey: "store_id" });
  PurchaseOrder.belongsTo(Store, { foreignKey: "store_id" });

  Store.hasMany(PurchaseOrderItem, { foreignKey: "store_id" });
  PurchaseOrderItem.belongsTo(Store, { foreignKey: "store_id" });

  // ReceiptSettings association
  Store.hasOne(ReceiptSettings, {
    foreignKey: "store_id",
    as: "receiptSettings",
  });
  ReceiptSettings.belongsTo(Store, { foreignKey: "store_id", as: "store" });

  // Favorite associations
  User.hasMany(Favorite, { foreignKey: "user_id", as: "favorites" });
  Favorite.belongsTo(User, { foreignKey: "user_id", as: "user" });

  Product.hasMany(Favorite, { foreignKey: "product_id", as: "favorites" });
  Favorite.belongsTo(Product, { foreignKey: "product_id", as: "product" });

  // Stock take associations
  StockTakeSession.belongsTo(Store, { foreignKey: "store_id", as: "store" });
  Store.hasMany(StockTakeSession, { foreignKey: "store_id", as: "stockTakeSessions" });

  StockTakeSession.belongsTo(User, { foreignKey: "submitted_by", as: "submittedBy" });
  StockTakeSession.belongsTo(User, { foreignKey: "reviewed_by", as: "reviewedBy" });

  StockTakeSession.hasMany(StockTakeItem, { foreignKey: "session_id", as: "items" });
  StockTakeItem.belongsTo(StockTakeSession, { foreignKey: "session_id", as: "session" });

  StockTakeItem.belongsTo(Product, { foreignKey: "product_id", as: "product" });

  // Notification associations
  User.hasMany(Notification, { foreignKey: "user_id", as: "notifications" });
  Notification.belongsTo(User, { foreignKey: "user_id", as: "user" });

  // StockLog associations
  StockLog.belongsTo(User, { foreignKey: "user_id", as: "user" });
  StockLog.belongsTo(Store, { foreignKey: "store_id", as: "store" });
  StockLog.belongsTo(Product, { foreignKey: "product_id", as: "product" });

  User.hasMany(StockLog, { foreignKey: "user_id", as: "stockLogs" });
  Store.hasMany(StockLog, { foreignKey: "store_id", as: "stockLogs" });
  Product.hasMany(StockLog, { foreignKey: "product_id", as: "stockLogs" });

  // Mark associations as set up
  associationsSetup = true;
}
