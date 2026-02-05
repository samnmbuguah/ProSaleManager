'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('stock_logs', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            product_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "products",
                    key: "id",
                },
            },
            quantity_added: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            unit_cost: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
            },
            total_cost: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "users",
                    key: "id",
                },
            },
            store_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "stores",
                    key: "id",
                },
            },
            type: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "manual_receive",
            },
            notes: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            date: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
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
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('stock_logs');
    }
};
