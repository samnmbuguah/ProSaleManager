'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn("sales", "payment_status", {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "pending"
    });

    // Update existing records to set payment_status to 'paid' for completed sales
    await queryInterface.sequelize.query(`
      UPDATE sales 
      SET payment_status = 'paid' 
      WHERE status = 'completed' OR status = 'paid'
    `);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn("sales", "payment_status");
  }
};
