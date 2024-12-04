CREATE TABLE IF NOT EXISTS "users" (
    "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    "email" text NOT NULL UNIQUE,
    "password" text NOT NULL,
    "role" text NOT NULL DEFAULT 'cashier',
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "customers" (
    "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    "name" text NOT NULL,
    "email" text UNIQUE,
    "phone" text,
    "loyalty_points" integer NOT NULL DEFAULT 0,
    "loyalty_tier" text NOT NULL DEFAULT 'bronze',
    "created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "products" (
    "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    "name" text NOT NULL,
    "sku" text NOT NULL UNIQUE,
    "buying_price" decimal(10,2) NOT NULL,
    "selling_price" decimal(10,2) NOT NULL,
    "stock" integer NOT NULL DEFAULT 0,
    "category" text NOT NULL,
    "min_stock" integer NOT NULL DEFAULT 10,
    "max_stock" integer NOT NULL DEFAULT 100,
    "reorder_point" integer NOT NULL DEFAULT 20,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "suppliers" (
    "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    "name" text NOT NULL,
    "email" text UNIQUE,
    "phone" text,
    "address" text,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "product_suppliers" (
    "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    "product_id" integer NOT NULL REFERENCES "products"("id"),
    "supplier_id" integer NOT NULL REFERENCES "suppliers"("id"),
    "cost_price" decimal(10,2) NOT NULL,
    "is_preferred" boolean NOT NULL DEFAULT false,
    "last_supply_date" timestamp,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "sales" (
    "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    "customer_id" integer REFERENCES "customers"("id"),
    "user_id" integer NOT NULL REFERENCES "users"("id"),
    "total" decimal(10,2) NOT NULL,
    "payment_method" text NOT NULL,
    "created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "sale_items" (
    "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    "sale_id" integer NOT NULL REFERENCES "sales"("id"),
    "product_id" integer NOT NULL REFERENCES "products"("id"),
    "quantity" integer NOT NULL,
    "price" decimal(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS "purchase_orders" (
    "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    "supplier_id" integer NOT NULL REFERENCES "suppliers"("id"),
    "user_id" integer NOT NULL REFERENCES "users"("id"),
    "status" text NOT NULL DEFAULT 'pending',
    "order_date" timestamp DEFAULT now(),
    "received_date" timestamp,
    "total" decimal(10,2) NOT NULL,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "purchase_order_items" (
    "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    "purchase_order_id" integer NOT NULL REFERENCES "purchase_orders"("id"),
    "product_id" integer NOT NULL REFERENCES "products"("id"),
    "quantity" integer NOT NULL,
    "buying_price" decimal(10,2) NOT NULL,
    "selling_price" decimal(10,2) NOT NULL
);
