-- Drop the skuPricing foreign key constraint from sale_items first
ALTER TABLE "sale_items" DROP CONSTRAINT IF EXISTS "sale_items_sku_pricing_id_sku_pricing_id_fk";

-- Drop the sku_pricing table
DROP TABLE IF EXISTS "sku_pricing";

-- Create the new unit_pricing table
CREATE TABLE "unit_pricing" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "product_id" integer NOT NULL REFERENCES "products"("id"),
  "unit_type" text NOT NULL,  -- 'piece', 'dozen', 'box', etc.
  "quantity" integer NOT NULL, -- number of base units in this unit type
  "buying_price" decimal(10, 2) NOT NULL,
  "selling_price" decimal(10, 2) NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Remove SKU column from products and its unique constraint
ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_sku_unique";
ALTER TABLE "products" DROP COLUMN IF EXISTS "sku";

-- Rename sku_pricing_id to unit_pricing_id in sale_items
ALTER TABLE "sale_items" RENAME COLUMN "sku_pricing_id" TO "unit_pricing_id";

-- Add foreign key constraint for unit_pricing
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_unit_pricing_id_unit_pricing_id_fk" 
  FOREIGN KEY ("unit_pricing_id") REFERENCES "unit_pricing"("id");
