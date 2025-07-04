import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database.js";

interface ProductAttributes {
  id?: number;
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  category_id: number;
  piece_buying_price: number;
  piece_selling_price: number;
  pack_buying_price: number;
  pack_selling_price: number;
  dozen_buying_price: number;
  dozen_selling_price: number;
  quantity: number;
  min_quantity: number;
  image_url?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface ProductInstance extends Model<ProductAttributes>, ProductAttributes {
  updatePrices(unit: 'piece' | 'pack' | 'dozen', buyingPrice: number, sellingPrice: number): Promise<void>;
}

const Product = sequelize.define<ProductInstance>('Product', {
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
    allowNull: true,
    unique: true,
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
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  piece_selling_price: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  pack_buying_price: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  pack_selling_price: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  dozen_buying_price: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  dozen_selling_price: {
    type: DataTypes.DOUBLE,
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
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "products",
  timestamps: true,
  underscored: true,
});

// Add instance method to update prices
(Product as any).prototype.updatePrices = async function(unit: 'piece' | 'pack' | 'dozen', buyingPrice: number, sellingPrice: number) {
  const PACK_DISCOUNT = 0.95; // 5% discount for pack
  const DOZEN_DISCOUNT = 0.90; // 10% discount for dozen

  console.log('Updating prices for unit:', unit);
  console.log('Buying price:', buyingPrice);
  console.log('Selling price:', sellingPrice);

  // Ensure all price fields are numbers
  this.set("piece_buying_price", Number(this.get("piece_buying_price")));
  this.set("piece_selling_price", Number(this.get("piece_selling_price")));
  this.set("pack_buying_price", Number(this.get("pack_buying_price")));
  this.set("pack_selling_price", Number(this.get("pack_selling_price")));
  this.set("dozen_buying_price", Number(this.get("dozen_buying_price")));
  this.set("dozen_selling_price", Number(this.get("dozen_selling_price")));

  if (unit === 'piece') {
    // Set both buying and selling prices for piece
    this.set("piece_buying_price", Number(buyingPrice));
    this.set("piece_selling_price", Number(sellingPrice));
    
    // Calculate pack prices (3 pieces with 5% discount)
    this.set("pack_buying_price", Number((buyingPrice * 3 * PACK_DISCOUNT).toFixed(2)));
    this.set("pack_selling_price", Number((sellingPrice * 3 * PACK_DISCOUNT).toFixed(2)));
    
    // Calculate dozen prices (12 pieces with 10% discount)
    this.set("dozen_buying_price", Number((buyingPrice * 12 * DOZEN_DISCOUNT).toFixed(2)));
    this.set("dozen_selling_price", Number((sellingPrice * 12 * DOZEN_DISCOUNT).toFixed(2)));
  } else if (unit === 'pack') {
    // Set both buying and selling prices for pack
    this.set("pack_buying_price", Number(buyingPrice));
    this.set("pack_selling_price", Number(sellingPrice));
    
    // Calculate piece prices (pack price divided by 3 pieces, adjusted for discount)
    this.set("piece_buying_price", Number((buyingPrice / (3 * PACK_DISCOUNT)).toFixed(2)));
    this.set("piece_selling_price", Number((sellingPrice / (3 * PACK_DISCOUNT)).toFixed(2)));
    
    // Calculate dozen prices (12 pieces with 10% discount)
    this.set("dozen_buying_price", Number((this.get("piece_buying_price") * 12 * DOZEN_DISCOUNT).toFixed(2)));
    this.set("dozen_selling_price", Number((this.get("piece_selling_price") * 12 * DOZEN_DISCOUNT).toFixed(2)));
  } else if (unit === 'dozen') {
    // Set both buying and selling prices for dozen
    this.set("dozen_buying_price", Number(buyingPrice));
    this.set("dozen_selling_price", Number(sellingPrice));
    
    // Calculate piece prices (dozen price divided by 12 pieces, adjusted for discount)
    this.set("piece_buying_price", Number((buyingPrice / (12 * DOZEN_DISCOUNT)).toFixed(2)));
    this.set("piece_selling_price", Number((sellingPrice / (12 * DOZEN_DISCOUNT)).toFixed(2)));
    
    // Calculate pack prices (3 pieces with 5% discount)
    this.set("pack_buying_price", Number((this.get("piece_buying_price") * 3 * PACK_DISCOUNT).toFixed(2)));
    this.set("pack_selling_price", Number((this.get("piece_selling_price") * 3 * PACK_DISCOUNT).toFixed(2)));
  }

  console.log('Updated prices:', {
    piece_buying_price: this.get("piece_buying_price"),
    piece_selling_price: this.get("piece_selling_price"),
    pack_buying_price: this.get("pack_buying_price"),
    pack_selling_price: this.get("pack_selling_price"),
    dozen_buying_price: this.get("dozen_buying_price"),
    dozen_selling_price: this.get("dozen_selling_price"),
  });

  await this.save();
};

export default Product;
