import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class Sale extends Model {
  declare id: number;
  declare customer_id: number | null;
  declare total_amount: number;
  declare payment_method: string;
  declare payment_status: string;
  declare notes: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Sale.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    payment_method: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'cash',
    },
    payment_status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'paid',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Sale',
    tableName: 'sales',
  }
);

export default Sale; 