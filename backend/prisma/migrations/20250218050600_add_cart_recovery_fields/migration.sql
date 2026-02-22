-- Add cart recovery fields to Cart table
ALTER TABLE "carts" 
ADD COLUMN IF NOT EXISTS "abandoned_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "recovered_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "recovery_token" VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS "recovery_token_expires" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "recovery_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "recovery_email_sent_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "reminder_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "last_reminder_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "abandonment_reason" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "recovery_notes" TEXT,
ADD COLUMN IF NOT EXISTS "discount_code" VARCHAR(50),
ADD COLUMN IF NOT EXISTS "discount_amount" DECIMAL(10, 2);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS "idx_carts_recovery_token" ON "carts"("recovery_token");
CREATE INDEX IF NOT EXISTS "idx_carts_abandoned_at" ON "carts"("abandoned_at");
CREATE INDEX IF NOT EXISTS "idx_carts_recovered_at" ON "carts"("recovered_at");

-- Create CartRecoveryEvent table
CREATE TABLE IF NOT EXISTS "cart_recovery_events" (
    "id" TEXT NOT NULL,
    "cart_id" TEXT NOT NULL,
    "event_type" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255),
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cart_recovery_events_pkey" PRIMARY KEY ("id")
);

-- Create indexes for CartRecoveryEvent
CREATE INDEX IF NOT EXISTS "idx_cart_recovery_events_cart_id" ON "cart_recovery_events"("cart_id");
CREATE INDEX IF NOT EXISTS "idx_cart_recovery_events_event_type" ON "cart_recovery_events"("event_type");
CREATE INDEX IF NOT EXISTS "idx_cart_recovery_events_created_at" ON "cart_recovery_events"("created_at");

-- Add foreign key constraint
ALTER TABLE "cart_recovery_events" 
ADD CONSTRAINT "cart_recovery_events_cart_id_fkey" 
FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
