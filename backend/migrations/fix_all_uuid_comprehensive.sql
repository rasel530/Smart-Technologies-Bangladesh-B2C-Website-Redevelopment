-- Comprehensive script to convert all TEXT IDs to UUID
-- This handles all tables in the correct dependency order

BEGIN;

-- ============================================================================
-- STEP 1: Convert users table (no dependencies)
-- ============================================================================
ALTER TABLE users ADD COLUMN id_new UUID;
UPDATE users SET id_new = id::uuid;

-- Drop all foreign keys that reference users.id
DO $$
DECLARE
    fk_record RECORD;
BEGIN
    FOR fk_record IN 
        SELECT conname, conrelid::regclass::text as table_name
        FROM pg_constraint
        WHERE confrelid = 'users'::regclass AND contype = 'f'
    LOOP
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I CASCADE', fk_record.table_name, fk_record.conname);
    END LOOP;
END $$;

-- Drop primary key and old column
ALTER TABLE users DROP CONSTRAINT users_pkey CASCADE;
ALTER TABLE users DROP COLUMN id CASCADE;

-- Rename new column and recreate primary key
ALTER TABLE users RENAME COLUMN id_new TO id;
ALTER TABLE users ADD PRIMARY KEY (id);

-- ============================================================================
-- STEP 2: Convert products table (no dependencies)
-- ============================================================================
ALTER TABLE products ADD COLUMN id_new UUID;
UPDATE products SET id_new = id::uuid;

-- Drop all foreign keys that reference products.id
DO $$
DECLARE
    fk_record RECORD;
BEGIN
    FOR fk_record IN 
        SELECT conname, conrelid::regclass::text as table_name
        FROM pg_constraint
        WHERE confrelid = 'products'::regclass AND contype = 'f'
    LOOP
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I CASCADE', fk_record.table_name, fk_record.conname);
    END LOOP;
END $$;

-- Drop primary key and old column
ALTER TABLE products DROP CONSTRAINT products_pkey CASCADE;
ALTER TABLE products DROP COLUMN id CASCADE;

-- Rename new column and recreate primary key
ALTER TABLE products RENAME COLUMN id_new TO id;
ALTER TABLE products ADD PRIMARY KEY (id);

-- ============================================================================
-- STEP 3: Convert wishlists table (depends on users)
-- ============================================================================
ALTER TABLE wishlists ADD COLUMN id_new UUID;
ALTER TABLE wishlists ADD COLUMN "userId_new" UUID;
UPDATE wishlists SET id_new = id::uuid, "userId_new" = "userId"::uuid;

-- Drop all foreign keys that reference wishlists.id
DO $$
DECLARE
    fk_record RECORD;
BEGIN
    FOR fk_record IN 
        SELECT conname, conrelid::regclass::text as table_name
        FROM pg_constraint
        WHERE confrelid = 'wishlists'::regclass AND contype = 'f'
    LOOP
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I CASCADE', fk_record.table_name, fk_record.conname);
    END LOOP;
END $$;

-- Drop primary key and old columns
ALTER TABLE wishlists DROP CONSTRAINT wishlists_pkey CASCADE;
ALTER TABLE wishlists DROP COLUMN id CASCADE;
ALTER TABLE wishlists DROP COLUMN "userId" CASCADE;

-- Rename new columns and recreate primary key
ALTER TABLE wishlists RENAME COLUMN id_new TO id;
ALTER TABLE wishlists RENAME COLUMN "userId_new" TO "userId";
ALTER TABLE wishlists ADD PRIMARY KEY (id);

-- ============================================================================
-- STEP 4: Convert wishlist_items table (depends on wishlists and products)
-- ============================================================================
ALTER TABLE wishlist_items ADD COLUMN "wishlistId_new" UUID;
ALTER TABLE wishlist_items ADD COLUMN "productId_new" UUID;
UPDATE wishlist_items SET "wishlistId_new" = "wishlistId"::uuid, "productId_new" = "productId"::uuid;

-- Drop primary key and old columns
ALTER TABLE wishlist_items DROP CONSTRAINT wishlist_items_pkey CASCADE;
ALTER TABLE wishlist_items DROP COLUMN "wishlistId" CASCADE;
ALTER TABLE wishlist_items DROP COLUMN "productId" CASCADE;

-- Rename new columns and recreate primary key
ALTER TABLE wishlist_items RENAME COLUMN "wishlistId_new" TO "wishlistId";
ALTER TABLE wishlist_items RENAME COLUMN "productId_new" TO "productId";
ALTER TABLE wishlist_items ADD PRIMARY KEY (id);

-- ============================================================================
-- STEP 5: Recreate all foreign key constraints
-- ============================================================================

-- Users foreign keys
ALTER TABLE wishlists 
  ADD CONSTRAINT wishlists_userId_fkey 
  FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE;

-- Products foreign keys
ALTER TABLE wishlist_items 
  ADD CONSTRAINT wishlist_items_productId_fkey 
  FOREIGN KEY ("productId") REFERENCES products(id) ON DELETE CASCADE;

-- Wishlists foreign keys
ALTER TABLE wishlist_items 
  ADD CONSTRAINT wishlist_items_wishlistId_fkey 
  FOREIGN KEY ("wishlistId") REFERENCES wishlists(id) ON DELETE CASCADE;

ALTER TABLE wishlist_analytics 
  ADD CONSTRAINT wishlist_analytics_wishlistId_fkey 
  FOREIGN KEY ("wishlistId") REFERENCES wishlists(id) ON DELETE CASCADE;

COMMIT;
