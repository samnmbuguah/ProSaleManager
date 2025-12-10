import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database.js";

export type StockTakeStatus = "pending" | "applied" | "rejected";

interface StockTakeSessionAttributes {
  id?: number;
  store_id: number;
  submitted_by: number;
  reviewed_by?: number | null;
  status: StockTakeStatus;
  notes?: string | null;
  reviewed_at?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type StockTakeSessionCreationAttributes = Optional<
  StockTakeSessionAttributes,
  "id" | "status" | "notes" | "reviewed_by" | "reviewed_at"
>;

export interface StockTakeSessionInstance
  extends Model<StockTakeSessionAttributes, StockTakeSessionCreationAttributes>,
  StockTakeSessionAttributes { }

const StockTakeSession = sequelize.define<StockTakeSessionInstance>(
  "StockTakeSession",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    store_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    submitted_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    reviewed_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("pending", "applied", "rejected"),
      allowNull: false,
      defaultValue: "pending",
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reviewed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "stock_take_sessions",
    underscored: true,
    timestamps: true,
  },
);

export default StockTakeSession;

