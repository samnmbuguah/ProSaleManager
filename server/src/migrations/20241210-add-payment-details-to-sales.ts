import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
    // Add payment_details column to sales table for split payments
    await queryInterface.addColumn('sales', 'payment_details', {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
        // Structure: { cash?: number, mpesa?: number }
    });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.removeColumn('sales', 'payment_details');
}
