-- Migration: Add Cart Status Field
-- Date: 2026-02-07 13:00:00 UTC
-- Description: Add status field to Cart model with enum values (active, abandoned, converted, expired)
-- This migration is part of Phase 6, Milestone 1 critical fixes

-- Add CartStatus enum
CREATE TYPE "CartStatus" AS ENUM ('active', 'abandoned', 'converted', 'expired');

-- Add status column to carts table
ALTER TABLE "carts"
ADD COLUMN "status" "CartStatus" NOT NULL DEFAULT 'active';

-- Add index on status for better query performance
CREATE INDEX "idx_carts_status" ON "carts"("status");

-- Update existing carts to have 'active' status by default
UPDATE "carts"
SET "status" = 'active'
WHERE "status" IS NULL;

-- Add comment to the column
COMMENT ON COLUMN "carts"."status" IS 'Cart status: active, abandoned, converted, or expired';
