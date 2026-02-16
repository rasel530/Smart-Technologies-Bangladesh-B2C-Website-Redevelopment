-- Migration: Add Cart Share Token Table (Phase 6, Milestone 1)
-- Description: Add cart_share_tokens table for cart sharing functionality
-- BE-CRIT-002: Missing POST /api/v1/cart/share endpoint

-- ============================================================================
-- PART 1: Create cart_share_tokens table
-- ============================================================================

CREATE TABLE IF NOT EXISTS "cart_share_tokens" (
    "id" TEXT NOT NULL,
    "cart_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PART 2: Add constraints and indexes
-- ============================================================================

-- Add primary key
ALTER TABLE "cart_share_tokens" ADD CONSTRAINT "cart_share_tokens_pkey" PRIMARY KEY ("id");

-- Add unique constraint on token
ALTER TABLE "cart_share_tokens" ADD CONSTRAINT "cart_share_tokens_token_key" UNIQUE ("token");

-- Create foreign key from cart_share_tokens to carts
ALTER TABLE "cart_share_tokens" ADD CONSTRAINT "cart_share_tokens_cart_id_fkey" 
    FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "cart_share_tokens_cart_id_idx" ON "cart_share_tokens"("cart_id");
CREATE INDEX IF NOT EXISTS "cart_share_tokens_token_idx" ON "cart_share_tokens"("token");
CREATE INDEX IF NOT EXISTS "cart_share_tokens_expires_at_idx" ON "cart_share_tokens"("expires_at");
