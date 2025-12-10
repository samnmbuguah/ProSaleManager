import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database.js";

export type NotificationType = "stock_take" | "system" | "info";

interface NotificationAttributes {
  id?: number;
  user_id: number;
  title: string;
  message: string;
  type: NotificationType;
  data?: Record<string, unknown> | null;
  is_read?: boolean;
  read_at?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type NotificationCreationAttributes = Optional<
  NotificationAttributes,
  "id" | "data" | "is_read" | "read_at" | "type"
>;

export interface NotificationInstance
  extends Model<NotificationAttributes, NotificationCreationAttributes>,
  NotificationAttributes { }

const Notification = sequelize.define<NotificationInstance>(
  "Notification",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "info",
    },
    data: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "notifications",
    underscored: true,
    timestamps: true,
  },
);

export default Notification;

