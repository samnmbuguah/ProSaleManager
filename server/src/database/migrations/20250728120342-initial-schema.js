'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up (queryInterface, Sequelize) {
    // Stores
    await queryInterface.createTable('stores', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      subdomain: { type: Sequelize.STRING, allowNull: true, unique: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    // Users
    await queryInterface.createTable('users', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      password: { type: Sequelize.STRING, allowNull: false },
      name: { type: Sequelize.STRING, allowNull: false },
      store_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'stores', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      role: { type: Sequelize.ENUM('super_admin', 'admin', 'sales', 'manager'), defaultValue: 'sales' },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      last_login: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    // Categories
    await queryInterface.createTable('categories', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false, unique: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    // Customers
    await queryInterface.createTable('customers', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      phone: { type: Sequelize.STRING, allowNull: false },
      address: { type: Sequelize.STRING, allowNull: false },
      notes: { type: Sequelize.TEXT, allowNull: true },
      loyalty_points: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      store_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'stores', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    // Suppliers
    await queryInterface.createTable('suppliers', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      phone: { type: Sequelize.STRING, allowNull: true },
      address: { type: Sequelize.STRING, allowNull: true },
      contact_person: { type: Sequelize.STRING, allowNull: true },
      store_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'stores', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    // Products
    await queryInterface.createTable('products', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      sku: { type: Sequelize.STRING, allowNull: false },
      barcode: { type: Sequelize.STRING, allowNull: true, unique: true },
      category_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'categories', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      piece_buying_price: { type: Sequelize.DOUBLE, allowNull: false },
      piece_selling_price: { type: Sequelize.DOUBLE, allowNull: false },
      pack_buying_price: { type: Sequelize.DOUBLE, allowNull: false },
      pack_selling_price: { type: Sequelize.DOUBLE, allowNull: false },
      dozen_buying_price: { type: Sequelize.DOUBLE, allowNull: false },
      dozen_selling_price: { type: Sequelize.DOUBLE, allowNull: false },
      quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      min_quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      image_url: { type: Sequelize.STRING, allowNull: true },
      images: { type: Sequelize.JSON, allowNull: true, defaultValue: [] },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      stock_unit: { type: Sequelize.STRING, allowNull: false, defaultValue: 'piece' },
      store_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'stores', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('products', ['sku', 'store_id'], { unique: true, name: 'products_sku_store_id_unique' });

    // ProductSuppliers
    await queryInterface.createTable('product_suppliers', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      product_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'products', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      supplier_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'suppliers', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      cost_price: { type: Sequelize.DECIMAL(10,2), allowNull: false },
      is_preferred: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      last_supply_date: { type: Sequelize.DATE, allowNull: true },
      store_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'stores', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('product_suppliers', ['product_id', 'supplier_id'], { unique: true });

    // PurchaseOrders
    await queryInterface.createTable('purchase_orders', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      supplier_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'suppliers', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      order_number: { type: Sequelize.STRING, allowNull: false, unique: true },
      order_date: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      expected_delivery_date: { type: Sequelize.DATE, allowNull: true },
      status: { type: Sequelize.ENUM('pending', 'approved', 'ordered', 'received', 'cancelled'), allowNull: false, defaultValue: 'pending' },
      total_amount: { type: Sequelize.DECIMAL(10,2), allowNull: false, defaultValue: 0 },
      notes: { type: Sequelize.TEXT, allowNull: true },
      store_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'stores', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    // PurchaseOrderItems
    await queryInterface.createTable('purchase_order_items', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      purchase_order_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'purchase_orders', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      product_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'products', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      unit_price: { type: Sequelize.DECIMAL(10,2), allowNull: false, defaultValue: 0 },
      selling_price: { type: Sequelize.DECIMAL(10,2), allowNull: true, defaultValue: null },
      total_price: { type: Sequelize.DECIMAL(10,2), allowNull: false, defaultValue: 0 },
      unit_type: { type: Sequelize.STRING, allowNull: false },
      store_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'stores', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    // Expenses
    await queryInterface.createTable('expenses', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      description: { type: Sequelize.STRING, allowNull: false },
      amount: { type: Sequelize.DECIMAL(10,2), allowNull: false },
      date: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      category: { type: Sequelize.STRING, allowNull: false },
      payment_method: { type: Sequelize.STRING, allowNull: false, defaultValue: 'cash' },
      user_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      store_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'stores', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    // Sales
    await queryInterface.createTable('sales', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      customer_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'customers', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      user_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      total_amount: { type: Sequelize.DECIMAL(10,2), allowNull: false, defaultValue: 0 },
      payment_method: { type: Sequelize.STRING, allowNull: false, defaultValue: 'cash' },
      amount_paid: { type: Sequelize.DECIMAL(10,2), allowNull: false, defaultValue: 0 },
      status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'pending' },
      payment_status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'pending' },
      delivery_fee: { type: Sequelize.DECIMAL(10,2), allowNull: false, defaultValue: 0 },
      receipt_status: { type: Sequelize.JSON, allowNull: true, defaultValue: JSON.stringify({ whatsapp: false, sms: false }) },
      store_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'stores', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    // SaleItems
    await queryInterface.createTable('sale_items', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      sale_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'sales', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      product_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'products', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      quantity: { type: Sequelize.INTEGER, allowNull: false },
      unit_price: { type: Sequelize.DECIMAL(10,2), allowNull: false },
      total: { type: Sequelize.DECIMAL(10,2), allowNull: false },
      unit_type: { type: Sequelize.STRING, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    // ReceiptSettings
    await queryInterface.createTable('receipt_settings', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      store_id: { type: Sequelize.INTEGER, allowNull: false, unique: true, references: { model: 'stores', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      business_name: { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
      address: { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
      phone: { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
      email: { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
      website: { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
      thank_you_message: { type: Sequelize.STRING, allowNull: false, defaultValue: 'Thank you for your business!' },
      show_logo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      font_size: { type: Sequelize.ENUM('small', 'medium', 'large'), allowNull: false, defaultValue: 'medium' },
      paper_size: { type: Sequelize.ENUM('standard', 'thermal'), allowNull: false, defaultValue: 'thermal' },
      logo_url: { type: Sequelize.STRING, allowNull: true, defaultValue: null },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
  },

  async down (queryInterface) {
    // Drop tables in reverse order (respecting foreign key constraints)
    await queryInterface.dropTable('receipt_settings');
    await queryInterface.dropTable('sale_items');
    await queryInterface.dropTable('sales');
    await queryInterface.dropTable('expenses');
    await queryInterface.dropTable('purchase_order_items');
    await queryInterface.dropTable('purchase_orders');
    await queryInterface.dropTable('product_suppliers');
    await queryInterface.dropTable('products');
    await queryInterface.dropTable('suppliers');
    await queryInterface.dropTable('customers');
    await queryInterface.dropTable('categories');
    await queryInterface.dropTable('users');
    await queryInterface.dropTable('stores');
  }
};
