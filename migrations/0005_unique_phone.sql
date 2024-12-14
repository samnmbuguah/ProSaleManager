-- Add unique constraint to phone number
ALTER TABLE customers ADD CONSTRAINT customers_phone_unique UNIQUE (phone);

-- Add index for faster phone number lookups
CREATE INDEX IF NOT EXISTS customers_phone_idx ON customers (phone); 