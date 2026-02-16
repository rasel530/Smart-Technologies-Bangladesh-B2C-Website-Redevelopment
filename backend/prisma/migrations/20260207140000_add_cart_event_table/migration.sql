-- Migration: Add CartEvent Table (Phase 6, Milestone 1 - DB-CRIT-001 Fix)
-- Description: Creates the CartEvent table for tracking user interactions with shopping cart
-- - Individual events tracking for analytics and user behavior analysis
-- - Supports event types: item_added, item_removed, item_updated, cart_viewed, cart_abandoned, cart_converted
-- - Proper indexes for performance optimization
-- - Foreign key to carts table with CASCADE delete

-- ============================================================================
-- PART 1: Create cart_events table (new table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "cart_events" (
    "id" TEXT NOT NULL,
    "cart_id" TEXT NOT NULL,
    "user_id" TEXT,
    "event_type" VARCHAR(50) NOT NULL,
    "product_id" TEXT,
    "quantity" INTEGER,
    "price" DECIMAL(12,2),
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PART 2: Add constraints and indexes
-- ============================================================================

-- Add primary key to cart_events
ALTER TABLE "cart_events" ADD CONSTRAINT "cart_events_pkey" PRIMARY KEY ("id");

-- Create foreign key from cart_events to carts
ALTER TABLE "cart_events" ADD CONSTRAINT "cart_events_cart_id_fkey" 
    FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes for cart_events table
CREATE INDEX IF NOT EXISTS "cart_events_cart_id_idx" ON "cart_events"("cart_id");
CREATE INDEX IF NOT EXISTS "cart_events_user_id_idx" ON "cart_events"("user_id");
CREATE INDEX IF NOT EXISTS "cart_events_event_type_idx" ON "cart_events"("event_type");
CREATE INDEX IF NOT EXISTS "cart_events_timestamp_idx" ON "cart_events"("timestamp");
CREATE INDEX IF NOT EXISTS "cart_events_cart_id_timestamp_idx" ON "cart_events"("cart_id", "timestamp");

-- ============================================================================
-- PART 3: Add foreign key to carts table for cartEvents relation
-- ============================================================================

-- Note: The relation is already defined in the schema, no additional SQL needed
-- The cart_events table references carts table via cart_id foreign key
