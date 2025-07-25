import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

class ProductSupplier extends Model {
  declare id: number;
  declare product_id: number;
  declare supplier_id: number;
  declare cost_price: string;
  declare is_preferred: boolean;
  declare last_supply_date: Date | null;
  declare store_id: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ProductSupplier.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "products",
        key: "id",
      },
    },
    supplier_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "suppliers",
        key: "id",
      },
    },
    cost_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    is_preferred: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    last_supply_date: {
      type: DataTypes.DATE,
      allowNull: true,
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
    modelName: "ProductSupplier",
    tableName: "product_suppliers",
    underscored: true, // This tells Sequelize to use snake_case for column names
    indexes: [
      {
        unique: true,
        fields: ["product_id", "supplier_id"],
      },
    ],
  },
);

export default ProductSupplier;
