'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // 1. PRODUCTS
      await queryInterface.changeColumn('products', 'quantity', {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: false,
        defaultValue: 0,
      }, { transaction });
      await queryInterface.changeColumn('products', 'min_quantity', {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: false,
        defaultValue: 0,
      }, { transaction });
      
      const productPriceColumns = [
        'piece_buying_price', 'piece_selling_price',
        'pack_buying_price', 'pack_selling_price',
        'dozen_buying_price', 'dozen_selling_price'
      ];
      for (const col of productPriceColumns) {
        await queryInterface.changeColumn('products', col, {
          type: Sequelize.DECIMAL(12, 5),
          allowNull: false,
        }, { transaction });
      }

      // 2. SALE_ITEMS
      await queryInterface.changeColumn('sale_items', 'quantity', {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: false,
      }, { transaction });
      await queryInterface.changeColumn('sale_items', 'unit_price', {
        type: Sequelize.DECIMAL(12, 5),
        allowNull: false,
      }, { transaction });
      await queryInterface.changeColumn('sale_items', 'total', {
        type: Sequelize.DECIMAL(12, 5),
        allowNull: false,
      }, { transaction });

      // 3. SALES
      for (const col of ['total_amount', 'amount_paid', 'delivery_fee']) {
        try {
          await queryInterface.changeColumn('sales', col, {
            type: Sequelize.DECIMAL(12, 5),
            allowNull: false,
            defaultValue: 0
          }, { transaction });
        } catch (e) {
          // ignore if column doesn't exist
        }
      }

      // 4. PURCHASE_ORDER_ITEMS
      await queryInterface.changeColumn('purchase_order_items', 'quantity', {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: false,
      }, { transaction });
      await queryInterface.changeColumn('purchase_order_items', 'unit_price', {
        type: Sequelize.DECIMAL(12, 5),
        allowNull: false,
      }, { transaction });
      await queryInterface.changeColumn('purchase_order_items', 'selling_price', {
        type: Sequelize.DECIMAL(12, 5),
        allowNull: true,
      }, { transaction });
      await queryInterface.changeColumn('purchase_order_items', 'total_price', {
        type: Sequelize.DECIMAL(12, 5),
        allowNull: false,
      }, { transaction });

      // 5. PURCHASE_ORDERS
      for (const col of ['total_amount']) {
        try {
          await queryInterface.changeColumn('purchase_orders', col, {
            type: Sequelize.DECIMAL(12, 5),
            allowNull: false,
            defaultValue: 0
          }, { transaction });
        } catch (e) {}
      }

      // 6. STOCK_LOGS
      await queryInterface.changeColumn('stock_logs', 'quantity_added', {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: false,
      }, { transaction });
      await queryInterface.changeColumn('stock_logs', 'unit_cost', {
        type: Sequelize.DECIMAL(12, 5),
        allowNull: false,
      }, { transaction });
      await queryInterface.changeColumn('stock_logs', 'total_cost', {
        type: Sequelize.DECIMAL(12, 5),
        allowNull: false,
      }, { transaction });

      // 7. STOCK_TAKE_ITEMS
      await queryInterface.changeColumn('stock_take_items', 'system_quantity', {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: false,
      }, { transaction });
      await queryInterface.changeColumn('stock_take_items', 'counted_quantity', {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: false,
      }, { transaction });
      await queryInterface.changeColumn('stock_take_items', 'variance', {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: false,
      }, { transaction });
      await queryInterface.changeColumn('stock_take_items', 'unit_cost', {
        type: Sequelize.DECIMAL(12, 5),
        allowNull: false,
        defaultValue: 0
      }, { transaction });
      await queryInterface.changeColumn('stock_take_items', 'variance_value', {
        type: Sequelize.DECIMAL(12, 5),
        allowNull: false,
        defaultValue: 0
      }, { transaction });

      // 8. EXPENSES
      await queryInterface.changeColumn('expenses', 'amount', {
        type: Sequelize.DECIMAL(12, 5),
        allowNull: false,
      }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // Cannot easily safely down-migrate decimal back to integer without data loss,
    // but schema wise we revert.
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.changeColumn('products', 'quantity', {
        type: Sequelize.INTEGER,
      }, { transaction });
      await queryInterface.changeColumn('products', 'min_quantity', {
        type: Sequelize.INTEGER,
      }, { transaction });
      
      const productPriceColumns = [
        'piece_buying_price', 'piece_selling_price',
        'pack_buying_price', 'pack_selling_price',
        'dozen_buying_price', 'dozen_selling_price'
      ];
      for (const col of productPriceColumns) {
        await queryInterface.changeColumn('products', col, {
          type: Sequelize.DECIMAL(10, 2),
        }, { transaction });
      }
      
      await queryInterface.changeColumn('sale_items', 'quantity', {
        type: Sequelize.INTEGER,
      }, { transaction });
      await queryInterface.changeColumn('sale_items', 'unit_price', {
        type: Sequelize.DECIMAL(10, 2),
      }, { transaction });
      
      await queryInterface.changeColumn('purchase_order_items', 'quantity', {
        type: Sequelize.INTEGER,
      }, { transaction });
      await queryInterface.changeColumn('purchase_order_items', 'unit_price', {
        type: Sequelize.DECIMAL(10, 2),
      }, { transaction });

      await queryInterface.changeColumn('stock_logs', 'quantity_added', {
        type: Sequelize.INTEGER,
      }, { transaction });

      await queryInterface.changeColumn('stock_take_items', 'system_quantity', {
        type: Sequelize.INTEGER,
      }, { transaction });
      await queryInterface.changeColumn('stock_take_items', 'counted_quantity', {
        type: Sequelize.INTEGER,
      }, { transaction });
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
