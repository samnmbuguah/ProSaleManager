import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class Product extends Model {
  declare id: number;
  declare name: string;
  declare product_code: string | null;
  declare category: string;
  declare stock_unit: "piece" | "pack" | "dozen";
  declare quantity: number;
  declare available_units: number;
  declare min_stock: number;
  declare buying_price: string;
  declare selling_price: string;
  declare image_url: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Product.init(
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
    product_code: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    stock_unit: {
      type: DataTypes.ENUM("piece", "pack", "dozen"),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    available_units: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    min_stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    buying_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    selling_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    image_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Product",
    tableName: "products",
    hooks: {
      beforeSave: (product: Product) => {
        // Calculate available units based on stock unit and quantity
        switch (product.stock_unit) {
          case "dozen":
            product.available_units = product.quantity * 12;
            break;
          case "pack":
            // Assuming a pack is 6 pieces
            product.available_units = product.quantity * 6;
            break;
          default:
            product.available_units = product.quantity;
        }
      },
    },
  },
);

export default Product;
