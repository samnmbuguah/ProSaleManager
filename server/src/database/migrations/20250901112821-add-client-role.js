'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up (queryInterface, Sequelize) {
    // Add 'client' to the user_role enum
    await queryInterface.sequelize.query(`
      ALTER TYPE user_role ADD VALUE 'client';
    `);
    
    // Update default value for role column to 'client'
    await queryInterface.changeColumn('users', 'role', {
      type: Sequelize.ENUM('super_admin', 'admin', 'sales', 'manager', 'client'),
      defaultValue: 'client',
      allowNull: false
    });
  },

  async down (queryInterface, Sequelize) {
    // Note: PostgreSQL doesn't support removing enum values directly
    // This would require recreating the enum type, which is complex
    // For now, we'll just change the default back to 'sales'
    await queryInterface.changeColumn('users', 'role', {
      type: Sequelize.ENUM('super_admin', 'admin', 'sales', 'manager', 'client'),
      defaultValue: 'sales',
      allowNull: false
    });
  }
};
