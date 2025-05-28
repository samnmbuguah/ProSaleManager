"use strict";

export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("sales", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      customer_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "customers",
          key: "id",
        },
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      total_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      payment_method: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "cash",
      },
      amount_paid: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "pending",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("sales");
  },
};
