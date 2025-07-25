import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";

interface CustomerAttributes {
  id?: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes?: string;
  loyalty_points?: number;
  is_active?: boolean;
  store_id?: number;
}

class Customer extends Model<CustomerAttributes> implements CustomerAttributes {
  declare id: number;
  declare name: string;
  declare email: string;
  declare phone: string;
  declare address: string;
  declare is_active: boolean;
}

Customer.init(
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
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    loyalty_points: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    store_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "stores",
        key: "id",
      },
    },
  },
  {
    sequelize,
    modelName: "Customer",
    tableName: "customers",
    timestamps: true,
    underscored: true,
  },
);

export default Customer;
