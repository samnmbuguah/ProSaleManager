'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add store_id column to categories table
    await queryInterface.addColumn('categories', 'store_id', {
      type: Sequelize.INTEGER,
      allowNull: true, // Temporarily allow null for existing records
      references: {
        model: 'stores',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    // If you have a default store, you can update existing categories to use it
    // const [results] = await queryInterface.sequelize.query("SELECT id FROM stores LIMIT 1");
    // if (results.length > 0) {
    //   const defaultStoreId = results[0].id;
    //   await queryInterface.sequelize.query(
    //     `UPDATE categories SET store_id = ${defaultStoreId} WHERE store_id IS NULL`
    //   );
    // }

    // After updating existing records, you can make the column not null if needed
    // await queryInterface.changeColumn('categories', 'store_id', {
    //   type: Sequelize.INTEGER,
    //   allowNull: false,
    //   references: {
    //     model: 'stores',
    //     key: 'id',
    //   },
    //   onUpdate: 'CASCADE',
    //   onDelete: 'SET NULL',
    // });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('categories', 'store_id');
  }
};
