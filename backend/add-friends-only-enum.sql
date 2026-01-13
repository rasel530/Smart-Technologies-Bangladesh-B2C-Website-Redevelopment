-- Add FRIENDS_ONLY to ProfileVisibility enum
-- This migration adds FRIENDS_ONLY option to ProfileVisibility enum
-- Date: 2026-01-13

-- Drop dependent objects first
ALTER TABLE "user_privacy_settings" DROP CONSTRAINT IF EXISTS "user_privacy_settings_profileVisibility_check";

-- First, create a temporary type with the new enum value
CREATE TYPE "ProfileVisibility_temp" AS ENUM ('PUBLIC', 'PRIVATE', 'FRIENDS_ONLY');

-- Alter column to use new type
ALTER TABLE "user_privacy_settings" 
  ALTER COLUMN "profileVisibility" TYPE "ProfileVisibility_temp" 
  USING "profileVisibility"::text::"ProfileVisibility_temp";

-- Drop old type with CASCADE
DROP TYPE "ProfileVisibility" CASCADE;

-- Rename temporary type to original name
ALTER TYPE "ProfileVisibility_temp" RENAME TO "ProfileVisibility";

-- Add back check constraint
ALTER TABLE "user_privacy_settings" 
  ADD CONSTRAINT "user_privacy_settings_profileVisibility_check" 
  CHECK ("profileVisibility" IN ('PUBLIC', 'PRIVATE', 'FRIENDS_ONLY'));
