'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('user_preferences', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      dark_mode: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      notifications: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      language: {
        type: Sequelize.STRING,
        defaultValue: 'english',
      },
      theme: {
        type: Sequelize.STRING,
        defaultValue: 'default',
      },
      timezone: {
        type: Sequelize.STRING,
        defaultValue: 'UTC',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add indexes
    await queryInterface.addIndex('user_preferences', ['user_id'], {
      unique: true,
      name: 'user_preferences_user_id_unique'
    });
  },

  async down (queryInterface) {
    await queryInterface.dropTable('user_preferences');
  }
};
