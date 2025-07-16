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
  created_at?: Date;
  updated_at?: Date;
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
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
