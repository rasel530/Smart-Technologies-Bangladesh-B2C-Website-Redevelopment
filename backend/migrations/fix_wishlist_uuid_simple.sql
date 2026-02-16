-- Simple script to convert TEXT to UUID for wishlist tables
-- This script bypasses foreign key constraints by temporarily disabling them

-- Step 1: Disable triggers
SET session_replication_role = 'replica';

-- Step 2: Convert wishlists.id from TEXT to UUID
ALTER TABLE wishlists ALTER COLUMN id TYPE UUID USING id::uuid;

-- Step 3: Convert wishlists.userId from TEXT to UUID
ALTER TABLE wishlists ALTER COLUMN "userId" TYPE UUID USING "userId"::uuid;

-- Step 4: Convert wishlist_items.wishlistId from TEXT to UUID
ALTER TABLE wishlist_items ALTER COLUMN "wishlistId" TYPE UUID USING "wishlistId"::uuid;

-- Step 5: Convert wishlist_items.productId from TEXT to UUID
ALTER TABLE wishlist_items ALTER COLUMN "productId" TYPE UUID USING "productId"::uuid;

-- Step 6: Re-enable triggers
SET session_replication_role = 'origin';
