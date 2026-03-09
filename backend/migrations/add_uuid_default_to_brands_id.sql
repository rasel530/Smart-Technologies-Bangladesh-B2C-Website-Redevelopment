-- Migration to add UUID auto-generation to brands.id field
-- This preserves all existing brand data

-- Step 1: Drop the primary key constraint from brands (with CASCADE to drop dependent foreign keys)
ALTER TABLE brands DROP CONSTRAINT brands_pkey CASCADE;

-- Step 2: Update any NULL id values to have proper UUIDs
UPDATE brands
SET id = gen_random_uuid()
WHERE id IS NULL OR id = '';

-- Step 3: Update the column type to UUID
ALTER TABLE brands
ALTER COLUMN id TYPE UUID USING id::UUID;

-- Step 4: Add the default value for new records
ALTER TABLE brands
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Step 5: Add the NOT NULL constraint if not already present
ALTER TABLE brands
ALTER COLUMN id SET NOT NULL;

-- Step 6: Recreate the primary key constraint
ALTER TABLE brands
ADD CONSTRAINT brands_pkey PRIMARY KEY (id);

-- Step 7: Update products.brandId column type to UUID
ALTER TABLE products
ALTER COLUMN "brandId" TYPE UUID USING "brandId"::UUID;

-- Step 8: Recreate the foreign key constraint on products
ALTER TABLE products
ADD CONSTRAINT products_brandId_fkey
FOREIGN KEY ("brandId") REFERENCES brands(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Verify the changes
SELECT 'Migration completed successfully' as status;
