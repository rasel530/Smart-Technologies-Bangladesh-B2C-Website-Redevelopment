-- Create cod_settings table
CREATE TABLE IF NOT EXISTS "cod_settings" (
    "id" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "min_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "max_amount" DECIMAL(12,2) NOT NULL DEFAULT 100000,
    "available_divisions" TEXT[] NOT NULL DEFAULT ARRAY['dhaka', 'chittagong', 'khulna', 'rajshahi', 'sylhet', 'barishal', 'rangpur', 'mymensingh'],
    "unavailable_divisions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "additional_fee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "free_above_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "require_phone_verification" BOOLEAN NOT NULL DEFAULT false,
    "require_address_verification" BOOLEAN NOT NULL DEFAULT false,
    "max_daily_orders" INTEGER NOT NULL DEFAULT 5,
    "max_weekly_orders" INTEGER NOT NULL DEFAULT 10,
    "delivery_days" INTEGER NOT NULL DEFAULT 3,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cod_settings_pkey" PRIMARY KEY ("id")
);

-- Insert default COD settings for Bangladesh
INSERT INTO "cod_settings" (
    "id",
    "is_enabled",
    "min_amount",
    "max_amount",
    "available_divisions",
    "unavailable_divisions",
    "additional_fee",
    "free_above_amount",
    "require_phone_verification",
    "require_address_verification",
    "max_daily_orders",
    "max_weekly_orders",
    "delivery_days",
    "notes",
    "created_at",
    "updated_at"
)
VALUES (
    'default-cod-settings',
    true,
    0.00,
    100000.00,
    ARRAY['dhaka', 'chittagong', 'khulna', 'rajshahi', 'sylhet', 'barishal', 'rangpur', 'mymensingh'],
    ARRAY[]::TEXT[],
    50.00,
    1000.00,
    false,
    false,
    5,
    10,
    3,
    'Default COD settings for Bangladesh. Free for orders above BDT 1000, BDT 50 fee for orders below BDT 1000.',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;
