import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

class Category extends Model {
  declare id?: number;
  declare name: string;
  declare description: string;
  declare is_active?: boolean;
  declare store_id?: number;
}

Category.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      // unique: true, // Removed global uniqueness
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    store_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // Temporarily allow null for existing records
      references: {
        model: 'stores', // Name of the target table
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: "Category",
    tableName: "categories",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["name", "store_id"],
      },
    ],
  },
);

export default Category;
