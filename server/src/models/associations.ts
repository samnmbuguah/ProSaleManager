import Product from './Product';
import Supplier from './Supplier';
import ProductSupplier from './ProductSupplier';
import Customer from './Customer';
import Sale from './Sale';

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

  // Customer-Sale associations
  Customer.hasMany(Sale, {
    foreignKey: 'customer_id',
  });

  Sale.belongsTo(Customer, {
    foreignKey: 'customer_id',
  });
}

export { Product, Supplier, ProductSupplier, Customer, Sale }; 