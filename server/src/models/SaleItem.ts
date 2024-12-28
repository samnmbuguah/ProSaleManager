import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

export class SaleItem extends Model {
  declare id: number;
  declare sale_id: number;
  declare product_id: number;
  declare quantity: number;
  declare unit_price: number;
  declare total: number;
  declare unit_type: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

SaleItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    sale_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'sales',
        key: 'id',
      },
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id',
      },
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    unit_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    unit_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'SaleItem',
    tableName: 'sale_items',
    underscored: true,
  }
);

export default SaleItem; 