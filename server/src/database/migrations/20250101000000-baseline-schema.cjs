
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    
    // Helper to check if table exists
    const tableExists = (tableName) => tables.includes(tableName);

    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    if (!tableExists('sales')) {
      await queryInterface.createTable('sales', {
        id: {
          type: 'INT(11)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: true,
          autoIncrement: true,
        },
        customer_id: {
          type: 'INT(11)',
          allowNull: true,
          defaultValue: null,
          primaryKey: false,
          autoIncrement: false,
        },
        user_id: {
          type: 'INT(11)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        total_amount: {
          type: 'DECIMAL(10,2)',
          allowNull: false,
          defaultValue: '0.00',
          primaryKey: false,
          autoIncrement: false,
        },
        payment_method: {
          type: 'VARCHAR(255)',
          allowNull: false,
          defaultValue: 'cash',
          primaryKey: false,
          autoIncrement: false,
        },
        amount_paid: {
          type: 'DECIMAL(10,2)',
          allowNull: false,
          defaultValue: '0.00',
          primaryKey: false,
          autoIncrement: false,
        },
        status: {
          type: 'VARCHAR(255)',
          allowNull: false,
          defaultValue: 'pending',
          primaryKey: false,
          autoIncrement: false,
        },
        payment_status: {
          type: 'VARCHAR(255)',
          allowNull: false,
          defaultValue: 'pending',
          primaryKey: false,
          autoIncrement: false,
        },
        delivery_fee: {
          type: 'DECIMAL(10,2)',
          allowNull: false,
          defaultValue: '0.00',
          primaryKey: false,
          autoIncrement: false,
        },
        receipt_status: {
          type: 'LONGTEXT',
          allowNull: true,
          defaultValue: null,
          primaryKey: false,
          autoIncrement: false,
        },
        store_id: {
          type: 'INT(11)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        createdAt: {
          type: 'DATETIME',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        updatedAt: {
          type: 'DATETIME',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        payment_details: {
          type: 'LONGTEXT',
          allowNull: true,
          defaultValue: null,
          primaryKey: false,
          autoIncrement: false,
        },
      });
    }

    if (!tableExists('receipt_settings')) {
      await queryInterface.createTable('receipt_settings', {
        id: {
          type: 'INT(11)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: true,
          autoIncrement: true,
        },
        store_id: {
          type: 'INT(11)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        business_name: {
          type: 'VARCHAR(255)',
          allowNull: false,
          defaultValue: '',
          primaryKey: false,
          autoIncrement: false,
        },
        address: {
          type: 'VARCHAR(255)',
          allowNull: false,
          defaultValue: '',
          primaryKey: false,
          autoIncrement: false,
        },
        phone: {
          type: 'VARCHAR(255)',
          allowNull: false,
          defaultValue: '',
          primaryKey: false,
          autoIncrement: false,
        },
        email: {
          type: 'VARCHAR(255)',
          allowNull: false,
          defaultValue: '',
          primaryKey: false,
          autoIncrement: false,
        },
        website: {
          type: 'VARCHAR(255)',
          allowNull: false,
          defaultValue: '',
          primaryKey: false,
          autoIncrement: false,
        },
        thank_you_message: {
          type: 'VARCHAR(255)',
          allowNull: false,
          defaultValue: 'Thank you for your business!',
          primaryKey: false,
          autoIncrement: false,
        },
        show_logo: {
          type: 'TINYINT(1)',
          allowNull: false,
          defaultValue: '1',
          primaryKey: false,
          autoIncrement: false,
        },
        font_size: {
          type: 'ENUM(\'small\',\'medium\',\'large\')',
          allowNull: false,
          defaultValue: 'medium',
          primaryKey: false,
          autoIncrement: false,
        },
        paper_size: {
          type: 'ENUM(\'standard\',\'thermal\')',
          allowNull: false,
          defaultValue: 'thermal',
          primaryKey: false,
          autoIncrement: false,
        },
        logo_url: {
          type: 'VARCHAR(255)',
          allowNull: true,
          defaultValue: null,
          primaryKey: false,
          autoIncrement: false,
        },
        created_at: {
          type: 'DATETIME',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        updated_at: {
          type: 'DATETIME',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
      });
    }

    if (!tableExists('sale_items')) {
      await queryInterface.createTable('sale_items', {
        id: {
          type: 'INT(11)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: true,
          autoIncrement: true,
        },
        sale_id: {
          type: 'INT(11)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        product_id: {
          type: 'INT(11)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        quantity: {
          type: 'INT(11)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        unit_price: {
          type: 'DECIMAL(10,2)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        total: {
          type: 'DECIMAL(10,2)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        unit_type: {
          type: 'VARCHAR(255)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        created_at: {
          type: 'DATETIME',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        updated_at: {
          type: 'DATETIME',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
      });
    }

    if (!tableExists('stores')) {
      await queryInterface.createTable('stores', {
        id: {
          type: 'INT(11)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: true,
          autoIncrement: true,
        },
        name: {
          type: 'VARCHAR(255)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        subdomain: {
          type: 'VARCHAR(255)',
          allowNull: true,
          defaultValue: null,
          primaryKey: false,
          autoIncrement: false,
        },
        created_at: {
          type: 'DATETIME',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        updated_at: {
          type: 'DATETIME',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
      });
    }

    if (!tableExists('purchase_order_items')) {
      await queryInterface.createTable('purchase_order_items', {
        id: {
          type: 'INT(11)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: true,
          autoIncrement: true,
        },
        purchase_order_id: {
          type: 'INT(11)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        product_id: {
          type: 'INT(11)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        quantity: {
          type: 'INT(11)',
          allowNull: false,
          defaultValue: '1',
          primaryKey: false,
          autoIncrement: false,
        },
        unit_price: {
          type: 'DECIMAL(10,2)',
          allowNull: false,
          defaultValue: '0.00',
          primaryKey: false,
          autoIncrement: false,
        },
        selling_price: {
          type: 'DECIMAL(10,2)',
          allowNull: true,
          defaultValue: null,
          primaryKey: false,
          autoIncrement: false,
        },
        total_price: {
          type: 'DECIMAL(10,2)',
          allowNull: false,
          defaultValue: '0.00',
          primaryKey: false,
          autoIncrement: false,
        },
        unit_type: {
          type: 'VARCHAR(255)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        store_id: {
          type: 'INT(11)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        createdAt: {
          type: 'DATETIME',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        updatedAt: {
          type: 'DATETIME',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
      });
    }

    if (!tableExists('users')) {
      await queryInterface.createTable('users', {
        id: {
          type: 'INT(11)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: true,
          autoIncrement: true,
        },
        email: {
          type: 'VARCHAR(255)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        password: {
          type: 'VARCHAR(255)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        name: {
          type: 'VARCHAR(255)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        phone: {
          type: 'VARCHAR(255)',
          allowNull: true,
          defaultValue: null,
          primaryKey: false,
          autoIncrement: false,
        },
        store_id: {
          type: 'INT(11)',
          allowNull: true,
          defaultValue: null,
          primaryKey: false,
          autoIncrement: false,
        },
        role: {
          type: 'ENUM(\'super_admin\',\'admin\',\'sales\',\'manager\',\'client\')',
          allowNull: true,
          defaultValue: 'client',
          primaryKey: false,
          autoIncrement: false,
        },
        is_active: {
          type: 'TINYINT(1)',
          allowNull: true,
          defaultValue: '1',
          primaryKey: false,
          autoIncrement: false,
        },
        last_login: {
          type: 'DATETIME',
          allowNull: true,
          defaultValue: null,
          primaryKey: false,
          autoIncrement: false,
        },
        created_at: {
          type: 'DATETIME',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        updated_at: {
          type: 'DATETIME',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
      });
    }

    if (!tableExists('expenses')) {
      await queryInterface.createTable('expenses', {
        id: {
          type: 'INT(11)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: true,
          autoIncrement: true,
        },
        description: {
          type: 'VARCHAR(255)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        amount: {
          type: 'DECIMAL(10,2)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        date: {
          type: 'DATETIME',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        category: {
          type: 'VARCHAR(255)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        payment_method: {
          type: 'VARCHAR(255)',
          allowNull: false,
          defaultValue: 'cash',
          primaryKey: false,
          autoIncrement: false,
        },
        user_id: {
          type: 'INT(11)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        store_id: {
          type: 'INT(11)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        createdAt: {
          type: 'DATETIME',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        updatedAt: {
          type: 'DATETIME',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
      });
    }

    if (!tableExists('user_preferences')) {
      await queryInterface.createTable('user_preferences', {
        id: {
          type: 'INT(11)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: true,
          autoIncrement: true,
        },
        user_id: {
          type: 'INT(11)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        dark_mode: {
          type: 'TINYINT(1)',
          allowNull: true,
          defaultValue: '0',
          primaryKey: false,
          autoIncrement: false,
        },
        notifications: {
          type: 'TINYINT(1)',
          allowNull: true,
          defaultValue: '1',
          primaryKey: false,
          autoIncrement: false,
        },
        language: {
          type: 'VARCHAR(255)',
          allowNull: true,
          defaultValue: 'english',
          primaryKey: false,
          autoIncrement: false,
        },
        theme: {
          type: 'VARCHAR(255)',
          allowNull: true,
          defaultValue: 'default',
          primaryKey: false,
          autoIncrement: false,
        },
        timezone: {
          type: 'VARCHAR(255)',
          allowNull: true,
          defaultValue: 'UTC',
          primaryKey: false,
          autoIncrement: false,
        },
        created_at: {
          type: 'DATETIME',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        updated_at: {
          type: 'DATETIME',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
      });
    }

    if (!tableExists('suppliers')) {
      await queryInterface.createTable('suppliers', {
        id: {
          type: 'INT(11)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: true,
          autoIncrement: true,
        },
        name: {
          type: 'VARCHAR(255)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        email: {
          type: 'VARCHAR(255)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        phone: {
          type: 'VARCHAR(255)',
          allowNull: true,
          defaultValue: null,
          primaryKey: false,
          autoIncrement: false,
        },
        address: {
          type: 'VARCHAR(255)',
          allowNull: true,
          defaultValue: null,
          primaryKey: false,
          autoIncrement: false,
        },
        contact_person: {
          type: 'VARCHAR(255)',
          allowNull: true,
          defaultValue: null,
          primaryKey: false,
          autoIncrement: false,
        },
        store_id: {
          type: 'INT(11)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        createdAt: {
          type: 'DATETIME',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        updatedAt: {
          type: 'DATETIME',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
      });
    }

    if (!tableExists('purchase_orders')) {
      await queryInterface.createTable('purchase_orders', {
        id: {
          type: 'INT(11)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: true,
          autoIncrement: true,
        },
        supplier_id: {
          type: 'INT(11)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        order_number: {
          type: 'VARCHAR(255)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        order_date: {
          type: 'DATETIME',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        expected_delivery_date: {
          type: 'DATETIME',
          allowNull: true,
          defaultValue: null,
          primaryKey: false,
          autoIncrement: false,
        },
        status: {
          type: 'ENUM(\'pending\',\'approved\',\'ordered\',\'received\',\'cancelled\')',
          allowNull: false,
          defaultValue: 'pending',
          primaryKey: false,
          autoIncrement: false,
        },
        total_amount: {
          type: 'DECIMAL(10,2)',
          allowNull: false,
          defaultValue: '0.00',
          primaryKey: false,
          autoIncrement: false,
        },
        notes: {
          type: 'TEXT',
          allowNull: true,
          defaultValue: null,
          primaryKey: false,
          autoIncrement: false,
        },
        store_id: {
          type: 'INT(11)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        createdAt: {
          type: 'DATETIME',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        updatedAt: {
          type: 'DATETIME',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
      });
    }

    if (!tableExists('product_suppliers')) {
      await queryInterface.createTable('product_suppliers', {
        id: {
          type: 'INT(11)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: true,
          autoIncrement: true,
        },
        product_id: {
          type: 'INT(11)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        supplier_id: {
          type: 'INT(11)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        cost_price: {
          type: 'DECIMAL(10,2)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        is_preferred: {
          type: 'TINYINT(1)',
          allowNull: false,
          defaultValue: '0',
          primaryKey: false,
          autoIncrement: false,
        },
        last_supply_date: {
          type: 'DATETIME',
          allowNull: true,
          defaultValue: null,
          primaryKey: false,
          autoIncrement: false,
        },
        store_id: {
          type: 'INT(11)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        created_at: {
          type: 'DATETIME',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        updated_at: {
          type: 'DATETIME',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
      });
    }

    if (!tableExists('categories')) {
      await queryInterface.createTable('categories', {
        id: {
          type: 'INT(11)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: true,
          autoIncrement: true,
        },
        name: {
          type: 'VARCHAR(255)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        description: {
          type: 'TEXT',
          allowNull: true,
          defaultValue: null,
          primaryKey: false,
          autoIncrement: false,
        },
        is_active: {
          type: 'TINYINT(1)',
          allowNull: false,
          defaultValue: '1',
          primaryKey: false,
          autoIncrement: false,
        },
        store_id: {
          type: 'INT(11)',
          allowNull: true,
          defaultValue: null,
          primaryKey: false,
          autoIncrement: false,
        },
        created_at: {
          type: 'DATETIME',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        updated_at: {
          type: 'DATETIME',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
      });
    }

    if (!tableExists('customers')) {
      await queryInterface.createTable('customers', {
        id: {
          type: 'INT(11)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: true,
          autoIncrement: true,
        },
        name: {
          type: 'VARCHAR(255)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        email: {
          type: 'VARCHAR(255)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        phone: {
          type: 'VARCHAR(255)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        address: {
          type: 'VARCHAR(255)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        notes: {
          type: 'TEXT',
          allowNull: true,
          defaultValue: null,
          primaryKey: false,
          autoIncrement: false,
        },
        loyalty_points: {
          type: 'INT(11)',
          allowNull: true,
          defaultValue: '0',
          primaryKey: false,
          autoIncrement: false,
        },
        is_active: {
          type: 'TINYINT(1)',
          allowNull: false,
          defaultValue: '1',
          primaryKey: false,
          autoIncrement: false,
        },
        store_id: {
          type: 'INT(11)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        created_at: {
          type: 'DATETIME',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        updated_at: {
          type: 'DATETIME',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
      });
    }

    if (!tableExists('products')) {
      await queryInterface.createTable('products', {
        id: {
          type: 'INT(11)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: true,
          autoIncrement: true,
        },
        name: {
          type: 'VARCHAR(255)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        description: {
          type: 'TEXT',
          allowNull: true,
          defaultValue: null,
          primaryKey: false,
          autoIncrement: false,
        },
        sku: {
          type: 'VARCHAR(255)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        barcode: {
          type: 'VARCHAR(255)',
          allowNull: true,
          defaultValue: null,
          primaryKey: false,
          autoIncrement: false,
        },
        category_id: {
          type: 'INT(11)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        piece_buying_price: {
          type: 'DECIMAL(10,2)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        piece_selling_price: {
          type: 'DECIMAL(10,2)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        pack_buying_price: {
          type: 'DECIMAL(10,2)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        pack_selling_price: {
          type: 'DECIMAL(10,2)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        dozen_buying_price: {
          type: 'DECIMAL(10,2)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        dozen_selling_price: {
          type: 'DECIMAL(10,2)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        quantity: {
          type: 'INT(11)',
          allowNull: false,
          defaultValue: '0',
          primaryKey: false,
          autoIncrement: false,
        },
        min_quantity: {
          type: 'INT(11)',
          allowNull: false,
          defaultValue: '0',
          primaryKey: false,
          autoIncrement: false,
        },
        image_url: {
          type: 'VARCHAR(255)',
          allowNull: true,
          defaultValue: null,
          primaryKey: false,
          autoIncrement: false,
        },
        images: {
          type: 'LONGTEXT',
          allowNull: true,
          defaultValue: null,
          primaryKey: false,
          autoIncrement: false,
        },
        is_active: {
          type: 'TINYINT(1)',
          allowNull: false,
          defaultValue: '1',
          primaryKey: false,
          autoIncrement: false,
        },
        stock_unit: {
          type: 'VARCHAR(255)',
          allowNull: false,
          defaultValue: 'piece',
          primaryKey: false,
          autoIncrement: false,
        },
        store_id: {
          type: 'INT(11)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        created_at: {
          type: 'DATETIME',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        updated_at: {
          type: 'DATETIME',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
      });
    }

    if (!tableExists('favorites')) {
      await queryInterface.createTable('favorites', {
        id: {
          type: 'INT(11)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: true,
          autoIncrement: true,
        },
        user_id: {
          type: 'INT(11)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        product_id: {
          type: 'INT(11)',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        created_at: {
          type: 'DATETIME',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
        updated_at: {
          type: 'DATETIME',
          allowNull: false,
          // defaultValue: skipped
          primaryKey: false,
          autoIncrement: false,
        },
      });
    }

    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

  },

  async down(queryInterface, Sequelize) {
    // Drop all tables in reverse order or just drop existing ones
    // For baseline, down usually drops everything.
    // We can list tables from schema keys.
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await queryInterface.dropTable('favorites');
    await queryInterface.dropTable('products');
    await queryInterface.dropTable('customers');
    await queryInterface.dropTable('categories');
    await queryInterface.dropTable('product_suppliers');
    await queryInterface.dropTable('purchase_orders');
    await queryInterface.dropTable('suppliers');
    await queryInterface.dropTable('user_preferences');
    await queryInterface.dropTable('expenses');
    await queryInterface.dropTable('users');
    await queryInterface.dropTable('purchase_order_items');
    await queryInterface.dropTable('stores');
    await queryInterface.dropTable('sale_items');
    await queryInterface.dropTable('receipt_settings');
    await queryInterface.dropTable('sales');
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  }
};
