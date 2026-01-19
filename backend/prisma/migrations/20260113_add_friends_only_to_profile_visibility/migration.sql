-- Add FRIENDS_ONLY to ProfileVisibility enum
-- This migration adds the FRIENDS_ONLY option to the ProfileVisibility enum
-- Date: 2026-01-13

-- First, drop the default constraint if it exists
ALTER TABLE "user_privacy_settings" ALTER COLUMN "profileVisibility" DROP DEFAULT;

-- Create a temporary type with the new enum value
CREATE TYPE "ProfileVisibility_temp" AS ENUM ('public', 'private', 'friends_only');

-- Alter the column to use the new type
ALTER TABLE "user_privacy_settings" 
  ALTER COLUMN "profileVisibility" TYPE "ProfileVisibility_temp" 
  USING "profileVisibility"::text::"ProfileVisibility_temp";

-- Drop the old type
DROP TYPE "ProfileVisibility";

-- Rename the temporary type to the original name
ALTER TYPE "ProfileVisibility_temp" RENAME TO "ProfileVisibility";

-- Re-create default value constraint
ALTER TABLE "user_privacy_settings"
  ALTER COLUMN "profileVisibility" SET DEFAULT 'private';
