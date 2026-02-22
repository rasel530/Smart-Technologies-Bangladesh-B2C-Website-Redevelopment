-- Fix missing last_recovery_at column
ALTER TABLE "carts" 
ADD COLUMN IF NOT EXISTS "last_recovery_at" TIMESTAMP(3);

-- Create index for the new column
CREATE INDEX IF NOT EXISTS "idx_carts_last_recovery_at" ON "carts"("last_recovery_at");