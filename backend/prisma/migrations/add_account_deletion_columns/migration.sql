-- Add account deletion columns to users table

-- Add account_status column
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "accountStatus" TEXT DEFAULT 'active';

-- Add deletion_requested_at column
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deletionRequestedAt" TIMESTAMP(3);

-- Add deletion_reason column
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deletionReason" TEXT;

-- Add deleted_at column (soft delete)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- Add preferred_language column
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "preferredLanguage" TEXT DEFAULT 'en';
