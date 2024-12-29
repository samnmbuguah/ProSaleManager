import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class Product extends Model {
  declare id: number;
  declare name: string;
  declare sku: string;
  declare category: string;
  declare stock: number;
  declare min_stock: number;
  declare max_stock: number;
  declare reorder_point: number;
  declare stock_unit: string;
  declare buying_price: string;
  declare selling_price: string;
  declare image_url: string | null;
  declare default_unit_pricing_id: number | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Product.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sku: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    min_stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    max_stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    reorder_point: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    stock_unit: {
      type: DataTypes.STRING,
      allowNull: false,
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
    image_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    default_unit_pricing_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Product',
    tableName: 'products',
  }
);

export default Product; 