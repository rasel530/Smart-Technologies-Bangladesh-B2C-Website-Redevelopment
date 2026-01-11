-- Add preferredLanguage column to users table
-- This migration adds the missing preferredLanguage field

-- Alter users table to add preferredLanguage column
ALTER TABLE "users" ADD COLUMN "preferredLanguage" TEXT DEFAULT 'en';

-- Add comment to document the column
COMMENT ON COLUMN "users"."preferredLanguage" IS 'User preferred language setting (e.g., en, bn)';
