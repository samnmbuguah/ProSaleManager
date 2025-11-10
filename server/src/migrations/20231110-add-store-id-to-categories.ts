import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.addColumn('categories', 'store_id', {
    type: DataTypes.INTEGER,
    allowNull: true, // Temporarily allow null for existing records
    references: {
      model: 'stores',
      key: 'id',
    },
  });

  // Optional: Update existing categories to have a default store_id if needed
  // await queryInterface.sequelize.query(
  //   "UPDATE categories SET store_id = 1 WHERE store_id IS NULL"
  // );

  // Optional: Make the column not nullable after updating existing records
  // await queryInterface.changeColumn('categories', 'store_id', {
  //   type: DataTypes.INTEGER,
  //   allowNull: false,
  //   references: {
  //     model: 'stores',
  //     key: 'id',
  //   },
  // });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.removeColumn('categories', 'store_id');
}
