import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

class Expense extends Model {
  declare id: number;
  declare description: string;
  declare amount: number;
  declare date: Date;
  declare category: string;
  declare payment_method: string;
  declare user_id: number;
  declare store_id: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Expense.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    payment_method: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "cash",
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
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
    modelName: "Expense",
    tableName: "expenses",
  },
);

export default Expense;
