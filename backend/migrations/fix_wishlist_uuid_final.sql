-- Final script to convert TEXT to UUID for wishlist tables
-- This approach uses CASCADE to drop dependent constraints

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

-- Step 5: Drop old columns with CASCADE to remove dependent constraints
ALTER TABLE wishlists DROP COLUMN id CASCADE;
ALTER TABLE wishlists DROP COLUMN "userId" CASCADE;
ALTER TABLE wishlist_items DROP COLUMN "wishlistId" CASCADE;
ALTER TABLE wishlist_items DROP COLUMN "productId" CASCADE;

-- Step 6: Rename new columns to replace old ones
ALTER TABLE wishlists RENAME COLUMN id_new TO id;
ALTER TABLE wishlists RENAME COLUMN "userId_new" TO "userId";
ALTER TABLE wishlist_items RENAME COLUMN "wishlistId_new" TO "wishlistId";
ALTER TABLE wishlist_items RENAME COLUMN "productId_new" TO "productId";

-- Step 7: Set primary key for wishlists
ALTER TABLE wishlists ADD PRIMARY KEY (id);

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

COMMIT;
