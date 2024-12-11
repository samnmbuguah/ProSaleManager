-- Create an enum type for unit types if it doesn't exist
DO $$ BEGIN
    CREATE TYPE unit_type_enum AS ENUM ('per_piece', 'three_piece', 'dozen');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Modify the unit_pricing table to use the enum and add constraints
ALTER TABLE unit_pricing
    ALTER COLUMN unit_type TYPE unit_type_enum USING unit_type::unit_type_enum,
    ADD CONSTRAINT unit_pricing_quantity_check 
    CHECK (
        (unit_type = 'per_piece' AND quantity = 1) OR
        (unit_type = 'three_piece' AND quantity = 3) OR
        (unit_type = 'dozen' AND quantity = 12)
    ),
    ADD CONSTRAINT unique_product_unit_type UNIQUE (product_id, unit_type);

-- Ensure each product has a default unit pricing
ALTER TABLE products
    ADD CONSTRAINT fk_default_unit_pricing
    FOREIGN KEY (default_unit_pricing_id) 
    REFERENCES unit_pricing(id);

-- Add indexes for better query performance
CREATE INDEX idx_unit_pricing_product_id ON unit_pricing(product_id);
CREATE INDEX idx_unit_pricing_unit_type ON unit_pricing(unit_type);
