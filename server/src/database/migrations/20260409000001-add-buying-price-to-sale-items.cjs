'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // 1. Add buying_price column to sale_items
      await queryInterface.addColumn('sale_items', 'buying_price', {
        type: Sequelize.DECIMAL(12, 5),
        allowNull: true, // Allow null initially to facilitate add
      }, { transaction });

      // 2. Populate initial buying_price for existing items based on current product prices
      await queryInterface.sequelize.query(`
        UPDATE sale_items si
        JOIN products p ON si.product_id = p.id
        SET si.buying_price = CASE 
            WHEN si.unit_type = 'pack' THEN p.pack_buying_price
            WHEN si.unit_type = 'dozen' THEN p.dozen_buying_price
            ELSE p.piece_buying_price
        END
      `, { transaction });

      // 3. Set to NOT NULL after population (optional, but keep nullable if some products might be deleted)
      // For safety in this system where products can be deleted, we might keep it nullable 
      // but let's make it mandatory for new records going forward.
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('sale_items', 'buying_price');
  }
};
