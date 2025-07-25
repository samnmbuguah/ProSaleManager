import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

class Store extends Model {
  declare id: number;
  declare name: string;
  declare subdomain: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Store.init(
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
    subdomain: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
  },
  {
    sequelize,
    modelName: "Store",
    tableName: "stores",
    timestamps: true,
    underscored: true,
  },
);

export default Store;
