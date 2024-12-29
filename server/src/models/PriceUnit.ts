import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class PriceUnit extends Model {
  declare id: number;
  declare product_id: number;
  declare unit_type: string;
  declare quantity: number;
  declare buying_price: string;
  declare selling_price: string;
  declare is_default: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

PriceUnit.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    unit_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    buying_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    selling_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    is_default: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'PriceUnit',
    tableName: 'price_units',
  }
);

export default PriceUnit; 