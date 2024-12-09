CREATE TYPE sku_type AS ENUM ('per_piece', 'three_piece', 'dozen');

CREATE TABLE IF NOT EXISTS sku_pricing (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) NOT NULL,
  sku_type sku_type NOT NULL,
  buying_price DECIMAL(10,2) NOT NULL,
  selling_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, sku_type)
);

-- Add initial per piece pricing from existing products
INSERT INTO sku_pricing (product_id, sku_type, buying_price, selling_price)
SELECT id, 'per_piece', buying_price::DECIMAL, selling_price::DECIMAL
FROM products;

-- Add stock_unit column to products table to track the base unit
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_unit sku_type NOT NULL DEFAULT 'per_piece';
