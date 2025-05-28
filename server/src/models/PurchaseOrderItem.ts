import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class PurchaseOrderItem extends Model {
  declare id: number;
  declare purchase_order_id: number;
  declare product_id: number;
  declare quantity: number;
  declare unit_price: number;
  declare total_price: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

PurchaseOrderItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    purchase_order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "purchase_orders",
        key: "id",
      },
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "products",
        key: "id",
      },
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    unit_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    total_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: "PurchaseOrderItem",
    tableName: "purchase_order_items",
  },
);

export default PurchaseOrderItem;
