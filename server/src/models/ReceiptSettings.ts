import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

class ReceiptSettings extends Model {
  declare id: number;
  declare store_id: number;
  declare business_name: string;
  declare address: string;
  declare phone: string;
  declare email: string;
  declare website: string;
  declare thank_you_message: string;
  declare show_logo: boolean;
  declare font_size: "small" | "medium" | "large";
  declare paper_size: "standard" | "thermal";
  declare logo_url: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ReceiptSettings.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    store_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: "stores",
        key: "id",
      },
    },
    business_name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    website: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    thank_you_message: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "Thank you for your business!",
    },
    show_logo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    font_size: {
      type: DataTypes.ENUM("small", "medium", "large"),
      allowNull: false,
      defaultValue: "medium",
    },
    paper_size: {
      type: DataTypes.ENUM("standard", "thermal"),
      allowNull: false,
      defaultValue: "thermal",
    },
    logo_url: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    modelName: "ReceiptSettings",
    tableName: "receipt_settings",
    timestamps: true,
    underscored: true,
  },
);

export default ReceiptSettings;
