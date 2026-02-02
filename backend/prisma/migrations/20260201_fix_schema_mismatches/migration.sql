-- Migration: Fix Schema Mismatches Between Prisma and Database
-- Date: 2026-02-01
-- Description: This migration fixes schema mismatches found during comprehensive audit

-- ============================================
-- ISSUE 1: product_images table has extra columns
-- ============================================
-- Problem: Database has extra columns 'url' and 'alt' that are NOT in Prisma schema
-- Prisma expects: original_url, alt_text_bn, alt_text_en
-- Code is trying to INSERT into these extra columns causing errors

-- Remove extra 'url' column (data should be in original_url)
ALTER TABLE product_images DROP COLUMN IF EXISTS url;

-- Remove extra 'alt' column (data should be in alt_text_en or alt_text_bn)
ALTER TABLE product_images DROP COLUMN IF EXISTS alt;

-- ============================================
-- ISSUE 2: user_privacy_settings table has duplicate columns
-- ============================================
-- Problem: Database has BOTH 'profileVisibility' and 'profile_visibility' columns
-- Prisma expects only 'profileVisibility' (which maps to 'profile_visibility')
-- The 'profile_visibility' column is a duplicate and should be removed

-- Remove duplicate 'profile_visibility' column (keep 'profileVisibility')
ALTER TABLE user_privacy_settings DROP COLUMN IF EXISTS profile_visibility;

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify product_images table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'product_images'
ORDER BY ordinal_position;

-- Verify user_privacy_settings table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'user_privacy_settings'
ORDER BY ordinal_position;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE '- Removed extra columns from product_images: url, alt';
  RAISE NOTICE '- Removed duplicate column from user_privacy_settings: profile_visibility';
END $$;
