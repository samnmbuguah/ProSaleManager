import { sequelize } from '../config/database.js';
import User from './User.js';
import Product from './Product.js';
import Category from './Category.js';
import Customer from './Customer.js';
import { setupAssociations } from './associations.js';

// Set up all model associations
setupAssociations();

// Export models
export {
  sequelize,
  User,
  Product,
  Category,
  Customer,
}; 