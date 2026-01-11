-- ============================================
-- ACCOUNT PREFERENCES DATABASE MIGRATION
-- ============================================
-- Phase 3, Milestone 3, Task 3: Account Preferences
-- This migration creates tables for notification preferences,
-- privacy settings, account deletion, and data export functionality.
-- ============================================

-- ============================================
-- 1. CREATE user_notification_preferences TABLE
-- ============================================
-- Stores user notification preferences
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT true,
  whatsapp_notifications BOOLEAN DEFAULT false,
  push_notifications BOOLEAN DEFAULT true,
  order_updates BOOLEAN DEFAULT true,
  promotional_emails BOOLEAN DEFAULT true,
  security_alerts BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_user_notification_preferences UNIQUE (user_id)
);

-- ============================================
-- 2. CREATE user_communication_preferences TABLE
-- ============================================
-- Stores user communication preferences
CREATE TABLE IF NOT EXISTS user_communication_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  preferred_language VARCHAR(10) DEFAULT 'en',
  preferred_timezone VARCHAR(50) DEFAULT 'UTC',
  preferred_contact_method VARCHAR(20) DEFAULT 'email',
  marketing_consent BOOLEAN DEFAULT false,
  data_sharing_consent BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_user_communication_preferences UNIQUE (user_id)
);

-- ============================================
-- 3. CREATE user_privacy_settings TABLE
-- ============================================
-- Stores user privacy settings
CREATE TABLE IF NOT EXISTS user_privacy_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  profile_visibility VARCHAR(20) DEFAULT 'private',
  show_email BOOLEAN DEFAULT false,
  show_phone BOOLEAN DEFAULT false,
  show_address BOOLEAN DEFAULT false,
  allow_search_by_email BOOLEAN DEFAULT false,
  allow_search_by_phone BOOLEAN DEFAULT false,
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_method VARCHAR(50),
  two_factor_secret TEXT,
  data_sharing_enabled BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_user_privacy_settings UNIQUE (user_id),
  CONSTRAINT valid_profile_visibility CHECK (profile_visibility IN ('PUBLIC', 'PRIVATE')),
  CONSTRAINT valid_two_factor_method CHECK (two_factor_method IS NULL OR two_factor_method IN ('sms', 'authenticator_app'))
);

-- ============================================
-- 4. CREATE updated_at COLUMN TRIGGER
-- ============================================
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
-- 2. CREATE account_deletion_requests TABLE
-- ============================================
-- Tracks account deletion requests and their status
CREATE TABLE IF NOT EXISTS account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Deletion Details
  deletion_token UUID NOT NULL DEFAULT gen_random_uuid(),
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'cancelled', 'completed'
  
  -- Timestamps
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  CONSTRAINT valid_deletion_status CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'))
);

-- ============================================
-- 3. CREATE user_data_exports TABLE
-- ============================================
-- Tracks user data export requests and their status
CREATE TABLE IF NOT EXISTS user_data_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Export Details
  export_token UUID NOT NULL DEFAULT gen_random_uuid(),
  data_types JSONB NOT NULL, -- Array of data types requested
  format VARCHAR(10) NOT NULL, -- 'json' or 'csv'
  file_url TEXT,
  status VARCHAR(20) DEFAULT 'processing', -- 'processing', 'ready', 'expired'
  
  -- Timestamps
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ready_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  CONSTRAINT valid_export_format CHECK (format IN ('json', 'csv')),
  CONSTRAINT valid_export_status CHECK (status IN ('processing', 'ready', 'expired'))
);

-- ============================================
-- 4. UPDATE users TABLE WITH DELETION TRACKING COLUMNS
-- ============================================
-- Add columns to track account status and deletion
-- Note: Some columns may already exist from previous migrations
DO $$
BEGIN
  -- Add account_status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'account_status'
  ) THEN
    ALTER TABLE users ADD COLUMN account_status VARCHAR(20) DEFAULT 'active';
  END IF;
  
  -- Add deletion_requested_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'deletion_requested_at'
  ) THEN
    ALTER TABLE users ADD COLUMN deletion_requested_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Add deleted_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Add deletion_reason column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'deletion_reason'
  ) THEN
    ALTER TABLE users ADD COLUMN deletion_reason TEXT;
  END IF;
END $$;

-- Add constraint for account_status if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_account_status'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT valid_account_status 
      CHECK (account_status IN ('active', 'pending_deletion', 'deleted'));
  END IF;
END $$;

-- ============================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ============================================
-- Indexes for user_preferences table
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Indexes for account_deletion_requests table
CREATE INDEX IF NOT EXISTS idx_account_deletion_user_id ON account_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_account_deletion_token ON account_deletion_requests(deletion_token);
CREATE INDEX IF NOT EXISTS idx_account_deletion_status ON account_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_account_deletion_expires_at ON account_deletion_requests(expires_at);

-- Indexes for user_data_exports table
CREATE INDEX IF NOT EXISTS idx_user_data_exports_user_id ON user_data_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_user_data_exports_token ON user_data_exports(export_token);
CREATE INDEX IF NOT EXISTS idx_user_data_exports_status ON user_data_exports(status);
CREATE INDEX IF NOT EXISTS idx_user_data_exports_expires_at ON user_data_exports(expires_at);

-- ============================================
-- 6. CREATE TRIGGER FOR UPDATED_AT TIMESTAMP
-- ============================================
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_preferences table
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
