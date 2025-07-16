import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

class Supplier extends Model {
  declare id: number;
  declare name: string;
  declare email: string;
  declare phone: string | null;
  declare address: string | null;
  declare contact_person: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Supplier.init(
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
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    contact_person: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Supplier",
    tableName: "suppliers",
  },
);

export default Supplier;
