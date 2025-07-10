import { Sequelize } from 'sequelize';
import { seedCategories } from '../seed/categories.js';
import { seedProducts } from '../seed/products.js';
import { seedUsers } from '../seed/users.js';
import { seedCustomers } from '../seed/customers.js';
import { seedSuppliers } from '../seed/suppliers.js';
import dotenv from 'dotenv';
import { sequelize } from '../src/config/database.js';
import User from '../src/models/User.js';
import Product from '../src/models/Product.js';
import Category from '../src/models/Category.js';
import Customer from '../src/models/Customer.js';
import Supplier from '../src/models/Supplier.js';
import { setupAssociations } from '../src/models/associations.js';

dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set in environment variables');
  process.exit(1);
}

async function setupDatabase() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Create enum type for user roles
    await sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('admin', 'sales');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Manually drop the products table first
    await sequelize.query('DROP TABLE IF EXISTS products CASCADE;');
    console.log('✅ Products table dropped');

    // Sync all models with force: true to ensure clean slate
    await sequelize.sync({ force: true });
    console.log('✅ Database tables created successfully');

    // Set up model associations
    setupAssociations();

    // Seed users using the original seedUsers function
    await seedUsers();

    // Seed categories
    await seedCategories();
    console.log('✅ Categories seeded');

    // Seed products
    await seedProducts();
    console.log('✅ Products seeded');

    // Seed customers
    await seedCustomers();
    console.log('✅ Customers seeded');

    // Seed suppliers
    await seedSuppliers();
    console.log('✅ Suppliers seeded');

    // Verify seeded data
    const customers = await Customer.findAll({
      attributes: ['id', 'name', 'email', 'phone', 'address', 'is_active']
    });
    console.log('\n📊 Seeded Customers:', customers.length);
    customers.forEach(customer => {
      const customerData = customer.toJSON();
      console.log(`- ${customerData.name} (${customerData.email})`);
    });

    const suppliers = await Supplier.findAll({
      attributes: ['id', 'name', 'email', 'phone', 'address', 'contact_person']
    });
    console.log('\n📊 Seeded Suppliers:', suppliers.length);
    suppliers.forEach(supplier => {
      const supplierData = supplier.toJSON();
      console.log(`- ${supplierData.name} (${supplierData.email})`);
    });

    const products = await Product.findAll({
      attributes: [
        'id', 
        'name', 
        'piece_selling_price', 
        'pack_selling_price', 
        'dozen_selling_price',
        'category_id'
      ],
      include: [{
        model: Category,
        as: 'Category',
        attributes: ['name']
      }]
    });
    console.log('\n📊 Seeded Products:', products.length);
    products.forEach(product => {
      const productData = product.toJSON() as any;
      const category = productData.Category;
      console.log(`- ${productData.name} (${category?.name || 'No Category'})`);
      console.log(`  Piece: $${productData.piece_selling_price}`);
      console.log(`  Pack: $${productData.pack_selling_price}`);
      console.log(`  Dozen: $${productData.dozen_selling_price}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase(); 