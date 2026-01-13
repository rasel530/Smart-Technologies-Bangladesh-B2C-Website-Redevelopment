-- ============================================
-- ADD ACCOUNT PREFERENCES FEATURES TO EXISTING TABLES
-- ============================================
-- This migration adds missing columns, indexes, and triggers
-- to the existing account preferences tables
-- ============================================

-- ============================================
-- 1. ADD MISSING COLUMNS TO user_notification_preferences
-- ============================================
DO $$
BEGIN
  -- Add push_notifications column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_notification_preferences' AND column_name = 'pushNotifications'
  ) THEN
    ALTER TABLE user_notification_preferences ADD COLUMN pushNotifications BOOLEAN DEFAULT true;
  END IF;

  -- Add order_updates column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_notification_preferences' AND column_name = 'orderUpdates'
  ) THEN
    ALTER TABLE user_notification_preferences ADD COLUMN orderUpdates BOOLEAN DEFAULT true;
  END IF;

  -- Add security_alerts column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_notification_preferences' AND column_name = 'securityAlerts'
  ) THEN
    ALTER TABLE user_notification_preferences ADD COLUMN securityAlerts BOOLEAN DEFAULT true;
  END IF;
END $$;

-- ============================================
-- 2. ADD MISSING COLUMNS TO user_privacy_settings
-- ============================================
DO $$
BEGIN
  -- Add two_factor_method column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_privacy_settings' AND column_name = 'twoFactorMethod'
  ) THEN
    ALTER TABLE user_privacy_settings ADD COLUMN twoFactorMethod TEXT;
  END IF;
END $$;

-- ============================================
-- 3. ADD DELETION TRACKING COLUMNS TO users TABLE
-- ============================================
DO $$
BEGIN
  -- Add account_status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'accountStatus'
  ) THEN
    ALTER TABLE users ADD COLUMN accountStatus TEXT DEFAULT 'active';
  END IF;
  
  -- Add deletion_requested_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'deletionRequestedAt'
  ) THEN
    ALTER TABLE users ADD COLUMN deletionRequestedAt TIMESTAMP;
  END IF;
  
  -- Add deleted_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'deletedAt'
  ) THEN
    ALTER TABLE users ADD COLUMN deletedAt TIMESTAMP;
  END IF;
  
  -- Add deletion_reason column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'deletionReason'
  ) THEN
    ALTER TABLE users ADD COLUMN deletionReason TEXT;
  END IF;
END $$;

-- ============================================
-- 4. ADD CONSTRAINT FOR account_status
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'valid_account_status'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT valid_account_status
      CHECK ("accountStatus" IN ('active', 'pending_deletion', 'deleted'));
  END IF;
END $$;

-- ============================================
-- 5. CREATE UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. CREATE TRIGGERS FOR UPDATED_AT
-- ============================================
-- Trigger for user_notification_preferences table
DROP TRIGGER IF EXISTS update_user_notification_preferences_updated_at ON user_notification_preferences;
CREATE TRIGGER update_user_notification_preferences_updated_at
  BEFORE UPDATE ON user_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_communication_preferences table
DROP TRIGGER IF EXISTS update_user_communication_preferences_updated_at ON user_communication_preferences;
CREATE TRIGGER update_user_communication_preferences_updated_at
  BEFORE UPDATE ON user_communication_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_privacy_settings table
DROP TRIGGER IF EXISTS update_user_privacy_settings_updated_at ON user_privacy_settings;
CREATE TRIGGER update_user_privacy_settings_updated_at
  BEFORE UPDATE ON user_privacy_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. ADD MISSING INDEXES
-- ============================================
-- Index for account_deletion_requests status
CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_status ON account_deletion_requests(status);

-- Index for account_deletion_requests expiresAt
CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_expiresAt ON account_deletion_requests("expiresAt");

-- Index for user_data_exports status
CREATE INDEX IF NOT EXISTS idx_user_data_exports_status ON user_data_exports(status);

-- Index for user_data_exports expiresAt
CREATE INDEX IF NOT EXISTS idx_user_data_exports_expiresAt ON user_data_exports("expiresAt");

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
