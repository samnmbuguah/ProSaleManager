/**
 * Migration to update product price columns from DOUBLE to DECIMAL(10,2)
 * This ensures prices are stored with exactly 2 decimal places
 */

const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Update all price columns to DECIMAL(10,2)
    await queryInterface.changeColumn('products', 'piece_buying_price', {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    });

    await queryInterface.changeColumn('products', 'piece_selling_price', {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    });

    await queryInterface.changeColumn('products', 'pack_buying_price', {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    });

    await queryInterface.changeColumn('products', 'pack_selling_price', {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    });

    await queryInterface.changeColumn('products', 'dozen_buying_price', {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    });

    await queryInterface.changeColumn('products', 'dozen_selling_price', {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    });

    // Round existing prices to 2 decimal places
    await queryInterface.sequelize.query(`
      UPDATE products SET 
        piece_buying_price = ROUND(piece_buying_price, 2),
        piece_selling_price = ROUND(piece_selling_price, 2),
        pack_buying_price = ROUND(pack_buying_price, 2),
        pack_selling_price = ROUND(pack_selling_price, 2),
        dozen_buying_price = ROUND(dozen_buying_price, 2),
        dozen_selling_price = ROUND(dozen_selling_price, 2)
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Revert back to DOUBLE (not recommended but included for completeness)
    await queryInterface.changeColumn('products', 'piece_buying_price', {
      type: DataTypes.DOUBLE,
      allowNull: false,
    });

    await queryInterface.changeColumn('products', 'piece_selling_price', {
      type: DataTypes.DOUBLE,
      allowNull: false,
    });

    await queryInterface.changeColumn('products', 'pack_buying_price', {
      type: DataTypes.DOUBLE,
      allowNull: false,
    });

    await queryInterface.changeColumn('products', 'pack_selling_price', {
      type: DataTypes.DOUBLE,
      allowNull: false,
    });

    await queryInterface.changeColumn('products', 'dozen_buying_price', {
      type: DataTypes.DOUBLE,
      allowNull: false,
    });

    await queryInterface.changeColumn('products', 'dozen_selling_price', {
      type: DataTypes.DOUBLE,
      allowNull: false,
    });
  }
};
