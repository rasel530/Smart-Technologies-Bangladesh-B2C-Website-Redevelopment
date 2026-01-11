-- Add partial unique index to ensure only one default address per user
-- This is a PostgreSQL-specific feature that enforces the constraint at the database level
CREATE UNIQUE INDEX "unique_default_address_per_user" 
ON "addresses" ("userId") 
WHERE "isDefault" = true;
