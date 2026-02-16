-- Manual script to convert TEXT to UUID for wishlist tables
-- This approach creates new UUID columns, copies data, and replaces old columns

BEGIN;

-- Step 1: Add new UUID columns to wishlists table
ALTER TABLE wishlists ADD COLUMN id_new UUID;
ALTER TABLE wishlists ADD COLUMN "userId_new" UUID;

-- Step 2: Copy data to new columns
UPDATE wishlists SET id_new = id::uuid, "userId_new" = "userId"::uuid;

-- Step 3: Add new UUID columns to wishlist_items table
ALTER TABLE wishlist_items ADD COLUMN "wishlistId_new" UUID;
ALTER TABLE wishlist_items ADD COLUMN "productId_new" UUID;

-- Step 4: Copy data to new columns
UPDATE wishlist_items SET "wishlistId_new" = "wishlistId"::uuid, "productId_new" = "productId"::uuid;

-- Step 5: Drop foreign key constraints
ALTER TABLE wishlist_items DROP CONSTRAINT IF EXISTS wishlist_items_wishlistId_fkey;
ALTER TABLE wishlist_items DROP CONSTRAINT IF EXISTS wishlist_items_productId_fkey;
ALTER TABLE wishlists DROP CONSTRAINT IF EXISTS wishlists_userId_fkey;

-- Step 6: Drop old columns
ALTER TABLE wishlists DROP COLUMN id;
ALTER TABLE wishlists DROP COLUMN "userId";
ALTER TABLE wishlist_items DROP COLUMN "wishlistId";
ALTER TABLE wishlist_items DROP COLUMN "productId";

-- Step 7: Rename new columns to replace old ones
ALTER TABLE wishlists RENAME COLUMN id_new TO id;
ALTER TABLE wishlists RENAME COLUMN "userId_new" TO "userId";
ALTER TABLE wishlist_items RENAME COLUMN "wishlistId_new" TO "wishlistId";
ALTER TABLE wishlist_items RENAME COLUMN "productId_new" TO "productId";

-- Step 8: Recreate foreign key constraints
ALTER TABLE wishlists 
  ADD CONSTRAINT wishlists_userId_fkey 
  FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE wishlist_items 
  ADD CONSTRAINT wishlist_items_wishlistId_fkey 
  FOREIGN KEY ("wishlistId") REFERENCES wishlists(id) ON DELETE CASCADE;

ALTER TABLE wishlist_items 
  ADD CONSTRAINT wishlist_items_productId_fkey 
  FOREIGN KEY ("productId") REFERENCES products(id) ON DELETE CASCADE;

-- Step 9: Set primary key for wishlists
ALTER TABLE wishlists ADD PRIMARY KEY (id);

COMMIT;
