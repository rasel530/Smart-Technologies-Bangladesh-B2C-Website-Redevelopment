-- ============================================
-- NOTIFICATION PREFERENCES COLUMN RENAME MIGRATION
-- ============================================
-- This migration renames columns in the user_notification_preferences table
-- to match the updated Prisma schema naming convention (PascalCase)
-- 
-- Changes:
-- - marketingCommunications → promotionalEmails
-- - orderupdates → orderUpdates
-- - pushnotifications → pushNotifications
-- - securityalerts → securityAlerts
-- 
-- This migration preserves all existing data by using RENAME COLUMN
-- instead of dropping and recreating columns.
-- ============================================

-- ============================================
-- RENAME COLUMNS IN user_notification_preferences TABLE
-- ============================================

-- Rename marketingCommunications to promotionalEmails
ALTER TABLE "user_notification_preferences" 
  RENAME COLUMN "marketingCommunications" TO "promotionalEmails";

-- Rename orderupdates to orderUpdates
ALTER TABLE "user_notification_preferences" 
  RENAME COLUMN "orderupdates" TO "orderUpdates";

-- Rename pushnotifications to pushNotifications
ALTER TABLE "user_notification_preferences" 
  RENAME COLUMN "pushnotifications" TO "pushNotifications";

-- Rename securityalerts to securityAlerts
ALTER TABLE "user_notification_preferences" 
  RENAME COLUMN "securityalerts" TO "securityAlerts";

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- After running this migration, verify the column names have been updated:
-- 
-- SELECT column_name 
-- FROM information_schema.columns 
-- WHERE table_name = 'user_notification_preferences' 
-- ORDER BY ordinal_position;
-- 
-- Expected output should show:
-- - promotionalEmails (not marketingCommunications)
-- - orderUpdates (not orderupdates)
-- - pushNotifications (not pushnotifications)
-- - securityAlerts (not securityalerts)
-- ============================================

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Summary:
-- - Renamed 4 columns in user_notification_preferences table
-- - All existing data has been preserved
-- - Column names now match Prisma schema expectations
-- ============================================
