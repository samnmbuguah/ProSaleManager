import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export interface ProductAttributes {
  id?: number;
  name: string;
  sku: string;
  category_id: number;
  piece_buying_price: number;
  piece_selling_price: number;
  pack_buying_price: number;
  pack_selling_price: number;
  dozen_buying_price: number;
  dozen_selling_price: number;
  quantity: number;
  min_quantity: number;
  barcode?: string;
  description?: string;
  image_url?: string | null;
  is_active?: boolean;
  images?: string[]; // New field for multiple images
  store_id?: number;
  stock_unit: string;
}

interface ProductInstance extends Model<ProductAttributes>, ProductAttributes {
  updatePrices(
    unit: "piece" | "pack" | "dozen",
    buyingPrice: number,
    sellingPrice: number,
  ): Promise<void>;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

const Product = sequelize.define<ProductInstance>(
  "Product",
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
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sku: {
      type: DataTypes.STRING,
      allowNull: false,
      // unique removed; now handled by composite index below
    },
    barcode: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    piece_buying_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    piece_selling_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    pack_buying_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    pack_selling_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    dozen_buying_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    dozen_selling_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    min_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    image_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    images: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    stock_unit: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "piece",
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
    tableName: "products",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["sku", "store_id"],
        name: "products_sku_store_id_unique",
      },
    ],
  },
);

// Add instance method to update prices
(
  Product as typeof Product & {
    prototype: {
      updatePrices: (
        unit: "piece" | "pack" | "dozen",
        buyingPrice: number,
        sellingPrice: number,
      ) => Promise<void>;
    };
  }
).prototype.updatePrices = async function (
  unit: "piece" | "pack" | "dozen",
  buyingPrice: number,
  sellingPrice: number,
) {
    // No discounts: pack = 4 pieces, dozen = 12 pieces

    // Ensure all price fields are numbers
    this.set("piece_buying_price", Number(this.get("piece_buying_price")));
    this.set("piece_selling_price", Number(this.get("piece_selling_price")));
    this.set("pack_buying_price", Number(this.get("pack_buying_price")));
    this.set("pack_selling_price", Number(this.get("pack_selling_price")));
    this.set("dozen_buying_price", Number(this.get("dozen_buying_price")));
    this.set("dozen_selling_price", Number(this.get("dozen_selling_price")));

    if (unit === "piece") {
      // Set both buying and selling prices for piece
      this.set("piece_buying_price", Number(buyingPrice));
      this.set("piece_selling_price", Number(sellingPrice));

      // Calculate pack prices (3 pieces, no discount)
      this.set("pack_buying_price", Number((buyingPrice * 3).toFixed(2)));
      this.set("pack_selling_price", Number((sellingPrice * 3).toFixed(2)));

      // Calculate dozen prices (12 pieces, no discount)
      this.set("dozen_buying_price", Number((buyingPrice * 12).toFixed(2)));
      this.set("dozen_selling_price", Number((sellingPrice * 12).toFixed(2)));
    } else if (unit === "pack") {
      // Set both buying and selling prices for pack
      this.set("pack_buying_price", Number(buyingPrice));
      this.set("pack_selling_price", Number(sellingPrice));

      // Calculate piece prices (pack price divided by 3 pieces)
      this.set("piece_buying_price", Number((buyingPrice / 3).toFixed(2)));
      this.set("piece_selling_price", Number((sellingPrice / 3).toFixed(2)));

      // Calculate dozen prices (12 pieces)
      this.set(
        "dozen_buying_price",
        Number((Number(this.get("piece_buying_price")) * 12).toFixed(2)),
      );
      this.set(
        "dozen_selling_price",
        Number((Number(this.get("piece_selling_price")) * 12).toFixed(2)),
      );
    } else if (unit === "dozen") {
      // Set both buying and selling prices for dozen
      this.set("dozen_buying_price", Number(buyingPrice));
      this.set("dozen_selling_price", Number(sellingPrice));

      // Calculate piece prices (dozen price divided by 12 pieces)
      this.set("piece_buying_price", Number((buyingPrice / 12).toFixed(2)));
      this.set("piece_selling_price", Number((sellingPrice / 12).toFixed(2)));

      // Calculate pack prices (3 pieces)
      this.set("pack_buying_price", Number((Number(this.get("piece_buying_price")) * 3).toFixed(2)));
      this.set(
        "pack_selling_price",
        Number((Number(this.get("piece_selling_price")) * 3).toFixed(2)),
      );
    }

    await this.save();
  };

export default Product;
