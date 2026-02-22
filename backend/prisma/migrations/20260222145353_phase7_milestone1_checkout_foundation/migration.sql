-- Phase 7 Milestone 1: Checkout Foundation Tables
-- This migration adds three new tables for checkout functionality:
-- 1. checkout_sessions - Track active checkout sessions
-- 2. checkout_abandonment - Track abandoned checkouts for recovery
-- 3. guest_sessions - Session tracking for guest users
-- Also updates the AddressType enum to include home, work, other values

-- Update AddressType enum to add new values
ALTER TYPE "AddressType" ADD VALUE 'home';
ALTER TYPE "AddressType" ADD VALUE 'work';
ALTER TYPE "AddressType" ADD VALUE 'other';

-- Create checkout_sessions table
CREATE TABLE "checkout_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "session_id" TEXT,
    "current_step" TEXT NOT NULL DEFAULT 'address',
    "shipping_address_id" TEXT,
    "billing_address_id" TEXT,
    "shipping_method" TEXT,
    "payment_method" TEXT,
    "cart_id" TEXT NOT NULL,
    "metadata" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "completed_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checkout_sessions_pkey" PRIMARY KEY ("id")
);

-- Create checkout_abandonment table
CREATE TABLE "checkout_abandonment" (
    "id" TEXT NOT NULL,
    "checkout_session_id" TEXT NOT NULL,
    "user_id" TEXT,
    "session_id" TEXT,
    "abandonment_step" TEXT NOT NULL,
    "abandonment_reason" TEXT,
    "cart_value" DECIMAL(12,2) NOT NULL,
    "item_count" INTEGER NOT NULL,
    "recovery_email_sent" BOOLEAN NOT NULL DEFAULT false,
    "recovery_email_sent_at" TIMESTAMP(3),
    "recovered" BOOLEAN NOT NULL DEFAULT false,
    "recovered_at" TIMESTAMP(3),
    "recovery_attempts" INTEGER NOT NULL DEFAULT 0,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checkout_abandonment_pkey" PRIMARY KEY ("id")
);

-- Create guest_sessions table
CREATE TABLE "guest_sessions" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "cart_id" TEXT NOT NULL,
    "metadata" JSONB,
    "last_activity_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "converted_to_user_id" TEXT,
    "converted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guest_sessions_pkey" PRIMARY KEY ("id")
);

-- Create indexes for checkout_sessions
CREATE INDEX "idx_checkout_sessions_session_id" ON "checkout_sessions"("session_id");
CREATE INDEX "idx_checkout_sessions_user_id" ON "checkout_sessions"("user_id");
CREATE INDEX "idx_checkout_sessions_cart_id" ON "checkout_sessions"("cart_id");
CREATE INDEX "idx_checkout_sessions_status" ON "checkout_sessions"("status");

-- Create indexes for checkout_abandonment
CREATE INDEX "idx_checkout_abandonment_checkout_session_id" ON "checkout_abandonment"("checkout_session_id");
CREATE INDEX "idx_checkout_abandonment_user_id" ON "checkout_abandonment"("user_id");
CREATE INDEX "idx_checkout_abandonment_session_id" ON "checkout_abandonment"("session_id");
CREATE INDEX "idx_checkout_abandonment_recovered" ON "checkout_abandonment"("recovered");

-- Create indexes for guest_sessions
CREATE UNIQUE INDEX "guest_sessions_session_id_key" ON "guest_sessions"("session_id");
CREATE INDEX "idx_guest_sessions_session_id" ON "guest_sessions"("session_id");
CREATE INDEX "idx_guest_sessions_cart_id" ON "guest_sessions"("cart_id");
CREATE INDEX "idx_guest_sessions_expires_at" ON "guest_sessions"("expires_at");

-- Add foreign key constraints for checkout_sessions
ALTER TABLE "checkout_sessions" ADD CONSTRAINT "checkout_sessions_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "checkout_sessions" ADD CONSTRAINT "checkout_sessions_shipping_address_id_fkey" FOREIGN KEY ("shipping_address_id") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "checkout_sessions" ADD CONSTRAINT "checkout_sessions_billing_address_id_fkey" FOREIGN KEY ("billing_address_id") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add foreign key constraint for checkout_abandonment
ALTER TABLE "checkout_abandonment" ADD CONSTRAINT "checkout_abandonment_checkout_session_id_fkey" FOREIGN KEY ("checkout_session_id") REFERENCES "checkout_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add foreign key constraint for guest_sessions
ALTER TABLE "guest_sessions" ADD CONSTRAINT "guest_sessions_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
