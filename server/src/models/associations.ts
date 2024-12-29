import User from './User.js';
import Customer from './Customer.js';
import Sale from './Sale.js';
import SaleItem from './SaleItem.js';
import Product from './Product.js';
import PriceUnit from './PriceUnit.js';
import Expense from './Expense.js';

export function setupAssociations() {
  // User - Sale association
  User.hasMany(Sale, { foreignKey: 'user_id' });
  Sale.belongsTo(User, { foreignKey: 'user_id' });

  // Customer - Sale association
  Customer.hasMany(Sale, { foreignKey: 'customer_id' });
  Sale.belongsTo(Customer, { foreignKey: 'customer_id', constraints: false });

  // Sale - SaleItem association
  Sale.hasMany(SaleItem, { foreignKey: 'sale_id' });
  SaleItem.belongsTo(Sale, { foreignKey: 'sale_id' });

  // Product - SaleItem association
  Product.hasMany(SaleItem, { foreignKey: 'product_id' });
  SaleItem.belongsTo(Product, { foreignKey: 'product_id' });

  // Product - PriceUnit association
  Product.hasMany(PriceUnit, { 
    foreignKey: 'product_id',
    as: 'price_units'
  });
  PriceUnit.belongsTo(Product, { 
    foreignKey: 'product_id'
  });

  // User - Expense association
  User.hasMany(Expense, { foreignKey: 'user_id', as: 'expenses' });
  Expense.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  console.log('Model associations have been set up');
} 