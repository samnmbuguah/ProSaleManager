'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up (queryInterface, Sequelize) {
    // For SQLite, we need to recreate the table to change the enum
    // First, create a backup table
    await queryInterface.sequelize.query(`
      CREATE TABLE users_backup AS SELECT * FROM users;
    `);
    
    // Drop the original table
    await queryInterface.dropTable('users');
    
    // Recreate the table with the new enum values
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      role: {
        type: Sequelize.ENUM('super_admin', 'admin', 'sales', 'manager', 'client'),
        defaultValue: 'client',
        allowNull: false,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      last_login: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      store_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'stores',
          key: 'id',
        },
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
    
    // Copy data back from backup
    await queryInterface.sequelize.query(`
      INSERT INTO users SELECT * FROM users_backup;
    `);
    
    // Drop the backup table
    await queryInterface.sequelize.query(`
      DROP TABLE users_backup;
    `);
  },

  async down (queryInterface, Sequelize) {
    // Revert to original enum without 'client'
    await queryInterface.sequelize.query(`
      CREATE TABLE users_backup AS SELECT * FROM users;
    `);
    
    await queryInterface.dropTable('users');
    
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      role: {
        type: Sequelize.ENUM('super_admin', 'admin', 'sales', 'manager'),
        defaultValue: 'sales',
        allowNull: false,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      last_login: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      store_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'stores',
          key: 'id',
        },
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
    
    await queryInterface.sequelize.query(`
      INSERT INTO users SELECT * FROM users_backup WHERE role != 'client';
    `);
    
    await queryInterface.sequelize.query(`
      DROP TABLE users_backup;
    `);
  }
};
