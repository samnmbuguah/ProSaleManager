"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.addColumn("purchase_order_items", "unit_type", {
      type: "STRING",
      allowNull: false,
      defaultValue: "piece", // Temporary default for migration; remove after migration if needed
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("purchase_order_items", "unit_type");
  },
};
