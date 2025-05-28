import User from "./User.js";
import Customer from "./Customer.js";
import Sale from "./Sale.js";
import SaleItem from "./SaleItem.js";
import Product from "./Product.js";
import Expense from "./Expense.js";
import Supplier from "./Supplier.js";
import PurchaseOrder from "./PurchaseOrder.js";
import PurchaseOrderItem from "./PurchaseOrderItem.js";

export function setupAssociations() {
  // User - Sale association
  User.hasMany(Sale, { foreignKey: "user_id" });
  Sale.belongsTo(User, { foreignKey: "user_id" });

  // Customer - Sale association
  Customer.hasMany(Sale, { foreignKey: "customer_id" });
  Sale.belongsTo(Customer, { foreignKey: "customer_id", constraints: false });

  // Sale - SaleItem association
  Sale.hasMany(SaleItem, { foreignKey: "sale_id" });
  SaleItem.belongsTo(Sale, { foreignKey: "sale_id" });

  // Product - SaleItem association
  Product.hasMany(SaleItem, { foreignKey: "product_id" });
  SaleItem.belongsTo(Product, { foreignKey: "product_id" });

  // User - Expense association
  User.hasMany(Expense, { foreignKey: "user_id", as: "expenses" });
  Expense.belongsTo(User, { foreignKey: "user_id", as: "user" });

  // Product and Supplier associations
  Product.belongsToMany(Supplier, {
    through: "product_suppliers",
    foreignKey: "product_id",
    otherKey: "supplier_id",
  });
  Supplier.belongsToMany(Product, {
    through: "product_suppliers",
    foreignKey: "supplier_id",
    otherKey: "product_id",
  });

  // Purchase Order associations
  PurchaseOrder.belongsTo(Supplier, {
    foreignKey: "supplier_id",
  });
  Supplier.hasMany(PurchaseOrder, {
    foreignKey: "supplier_id",
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

  console.log("Model associations have been set up");
}
