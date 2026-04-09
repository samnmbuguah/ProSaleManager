'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // 1. Create stock_receipts table
      await queryInterface.createTable('stock_receipts', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          }
        },
        store_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'stores',
            key: 'id'
          }
        },
        total_cost: {
          type: Sequelize.DECIMAL(12, 5),
          allowNull: false,
          defaultValue: 0
        },
        items_count: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        date: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        created_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });

      // 2. Add receipt_id to stock_logs
      await queryInterface.addColumn('stock_logs', 'receipt_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'stock_receipts',
          key: 'id'
        },
        onDelete: 'SET NULL'
      }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn('stock_logs', 'receipt_id', { transaction });
      await queryInterface.dropTable('stock_receipts', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
