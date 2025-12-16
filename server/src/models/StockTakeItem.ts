import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database.js";

interface StockTakeItemAttributes {
  id?: number;
  session_id: number;
  product_id?: number | null;
  product_name: string;
  sku?: string | null;
  category_name?: string | null;
  system_quantity: number;
  counted_quantity: number;
  variance: number;
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type StockTakeItemCreationAttributes = Optional<
  StockTakeItemAttributes,
  "id" | "product_id" | "sku" | "category_name" | "variance" | "notes"
>;

export interface StockTakeItemInstance
  extends Model<StockTakeItemAttributes, StockTakeItemCreationAttributes>,
  StockTakeItemAttributes { }

const StockTakeItem = sequelize.define<StockTakeItemInstance>(
  "StockTakeItem",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    session_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    product_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sku: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    category_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    system_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    counted_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    variance: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "stock_take_items",
    underscored: true,
    timestamps: true,
  },
);

export default StockTakeItem;


