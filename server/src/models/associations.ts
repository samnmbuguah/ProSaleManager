import Product from './Product.js';
import Supplier from './Supplier.js';
import ProductSupplier from './ProductSupplier.js';
import Customer from './Customer.js';
import Sale from './Sale.js';
import PriceUnit from './PriceUnit.js';
import SaleItem from './SaleItem.js';

export function setupAssociations(): void {
  // Product-Supplier associations
  Product.belongsToMany(Supplier, {
    through: ProductSupplier,
    foreignKey: 'product_id',
  });

  Supplier.belongsToMany(Product, {
    through: ProductSupplier,
    foreignKey: 'supplier_id',
  });

  // Product-PriceUnit associations
  Product.hasMany(PriceUnit, {
    foreignKey: 'product_id',
    as: 'price_units',
  });

  PriceUnit.belongsTo(Product, {
    foreignKey: 'product_id',
  });

  // Customer-Sale associations
  Customer.hasMany(Sale, {
    foreignKey: 'customer_id',
  });

  Sale.belongsTo(Customer, {
    foreignKey: 'customer_id',
  });

  // Sale-SaleItem associations
  Sale.hasMany(SaleItem, {
    foreignKey: 'sale_id',
    as: 'items',
  });

  SaleItem.belongsTo(Sale, {
    foreignKey: 'sale_id',
    as: 'sale',
  });

  // Product-SaleItem associations
  Product.hasMany(SaleItem, {
    foreignKey: 'product_id',
    as: 'sale_items',
  });

  SaleItem.belongsTo(Product, {
    foreignKey: 'product_id',
    as: 'product',
  });
}

export { Product, Supplier, ProductSupplier, Customer, Sale, PriceUnit, SaleItem }; 