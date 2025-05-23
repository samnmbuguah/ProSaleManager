"use strict";

export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('sales', 'receipt_status', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: {
        whatsapp: false,
        sms: false
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('sales', 'receipt_status');
  }
}; 