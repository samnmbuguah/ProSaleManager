import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

class PurchaseOrder extends Model {
  declare id: number;
  declare supplier_id: number;
  declare order_number: string;
  declare order_date: Date;
  declare expected_delivery_date: Date | null;
  declare status: "pending" | "approved" | "ordered" | "received" | "cancelled";
  declare total_amount: number;
  declare notes: string | null;
  declare store_id: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

PurchaseOrder.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    supplier_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "suppliers",
        key: "id",
      },
    },
    order_number: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    order_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    expected_delivery_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("pending", "approved", "ordered", "received", "cancelled"),
      allowNull: false,
      defaultValue: "pending",
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    notes: {
      type: DataTypes.TEXT,
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
    modelName: "PurchaseOrder",
    tableName: "purchase_orders",
  },
);

export default PurchaseOrder;
