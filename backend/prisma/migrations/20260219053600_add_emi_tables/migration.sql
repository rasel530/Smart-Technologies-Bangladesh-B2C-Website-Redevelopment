-- Create emi_providers table
CREATE TABLE IF NOT EXISTS "emi_providers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo_url" TEXT,
    "website" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "min_amount" DECIMAL(12,2) NOT NULL,
    "max_amount" DECIMAL(12,2) NOT NULL,
    "processing_fee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "interest_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emi_providers_pkey" PRIMARY KEY ("id")
);

-- Create index on is_active for emi_providers
CREATE INDEX IF NOT EXISTS "idx_emi_providers_is_active" ON "emi_providers"("is_active");

-- Create emi_plans table
CREATE TABLE IF NOT EXISTS "emi_plans" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "interest_rate" DECIMAL(5,2) NOT NULL,
    "min_amount" DECIMAL(12,2) NOT NULL,
    "max_amount" DECIMAL(12,2) NOT NULL,
    "processing_fee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "down_payment" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emi_plans_pkey" PRIMARY KEY ("id")
);

-- Create index on provider_id for emi_plans
CREATE INDEX IF NOT EXISTS "idx_emi_plans_provider_id" ON "emi_plans"("provider_id");

-- Create index on is_active for emi_plans
CREATE INDEX IF NOT EXISTS "idx_emi_plans_is_active" ON "emi_plans"("is_active");

-- Add foreign key constraint for emi_plans
ALTER TABLE "emi_plans"
ADD CONSTRAINT "emi_plans_provider_id_fkey"
FOREIGN KEY ("provider_id") REFERENCES "emi_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Insert default EMI providers for Bangladesh
INSERT INTO "emi_providers" ("id", "name", "logo_url", "website", "is_active", "min_amount", "max_amount", "processing_fee", "interest_rate", "created_at", "updated_at")
VALUES 
    ('city-bank-001', 'City Bank', '/logos/city-bank.png', 'https://www.citybank.com.bd', true, 5000.00, 500000.00, 0.00, 12.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('brac-bank-001', 'BRAC Bank', '/logos/brac-bank.png', 'https://www.bracbank.com', true, 5000.00, 500000.00, 0.00, 12.50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('eastern-bank-001', 'Eastern Bank', '/logos/eastern-bank.png', 'https://www.ebl.com.bd', true, 5000.00, 500000.00, 0.00, 11.50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('dutch-bangla-001', 'Dutch-Bangla Bank', '/logos/dutch-bangla-bank.png', 'https://www.dutchbanglabank.com', true, 5000.00, 500000.00, 0.00, 13.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Insert default EMI plans for each provider
-- City Bank EMI Plans
INSERT INTO "emi_plans" ("id", "provider_id", "name", "duration", "interest_rate", "min_amount", "max_amount", "processing_fee", "down_payment", "is_active", "display_order", "created_at", "updated_at")
VALUES 
    ('city-bank-3m', 'city-bank-001', '3 Months EMI', 3, 0.00, 5000.00, 500000.00, 0.00, 0.00, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('city-bank-6m', 'city-bank-001', '6 Months EMI', 6, 5.00, 5000.00, 500000.00, 0.00, 0.00, true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('city-bank-9m', 'city-bank-001', '9 Months EMI', 9, 8.00, 10000.00, 500000.00, 0.00, 0.00, true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('city-bank-12m', 'city-bank-001', '12 Months EMI', 12, 10.00, 10000.00, 500000.00, 0.00, 0.00, true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('city-bank-18m', 'city-bank-001', '18 Months EMI', 18, 12.00, 20000.00, 500000.00, 0.00, 0.00, true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('city-bank-24m', 'city-bank-001', '24 Months EMI', 24, 14.00, 30000.00, 500000.00, 0.00, 0.00, true, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- BRAC Bank EMI Plans
INSERT INTO "emi_plans" ("id", "provider_id", "name", "duration", "interest_rate", "min_amount", "max_amount", "processing_fee", "down_payment", "is_active", "display_order", "created_at", "updated_at")
VALUES 
    ('brac-bank-3m', 'brac-bank-001', '3 Months EMI', 3, 0.00, 5000.00, 500000.00, 0.00, 0.00, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('brac-bank-6m', 'brac-bank-001', '6 Months EMI', 6, 5.50, 5000.00, 500000.00, 0.00, 0.00, true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('brac-bank-9m', 'brac-bank-001', '9 Months EMI', 9, 8.50, 10000.00, 500000.00, 0.00, 0.00, true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('brac-bank-12m', 'brac-bank-001', '12 Months EMI', 12, 11.00, 10000.00, 500000.00, 0.00, 0.00, true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('brac-bank-18m', 'brac-bank-001', '18 Months EMI', 18, 13.00, 20000.00, 500000.00, 0.00, 0.00, true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('brac-bank-24m', 'brac-bank-001', '24 Months EMI', 24, 15.00, 30000.00, 500000.00, 0.00, 0.00, true, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Eastern Bank EMI Plans
INSERT INTO "emi_plans" ("id", "provider_id", "name", "duration", "interest_rate", "min_amount", "max_amount", "processing_fee", "down_payment", "is_active", "display_order", "created_at", "updated_at")
VALUES 
    ('eastern-bank-3m', 'eastern-bank-001', '3 Months EMI', 3, 0.00, 5000.00, 500000.00, 0.00, 0.00, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('eastern-bank-6m', 'eastern-bank-001', '6 Months EMI', 6, 4.50, 5000.00, 500000.00, 0.00, 0.00, true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('eastern-bank-9m', 'eastern-bank-001', '9 Months EMI', 9, 7.50, 10000.00, 500000.00, 0.00, 0.00, true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('eastern-bank-12m', 'eastern-bank-001', '12 Months EMI', 12, 9.50, 10000.00, 500000.00, 0.00, 0.00, true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('eastern-bank-18m', 'eastern-bank-001', '18 Months EMI', 18, 11.50, 20000.00, 500000.00, 0.00, 0.00, true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('eastern-bank-24m', 'eastern-bank-001', '24 Months EMI', 24, 13.50, 30000.00, 500000.00, 0.00, 0.00, true, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Dutch-Bangla Bank EMI Plans
INSERT INTO "emi_plans" ("id", "provider_id", "name", "duration", "interest_rate", "min_amount", "max_amount", "processing_fee", "down_payment", "is_active", "display_order", "created_at", "updated_at")
VALUES 
    ('dutch-bangla-3m', 'dutch-bangla-001', '3 Months EMI', 3, 0.00, 5000.00, 500000.00, 0.00, 0.00, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('dutch-bangla-6m', 'dutch-bangla-001', '6 Months EMI', 6, 6.00, 5000.00, 500000.00, 0.00, 0.00, true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('dutch-bangla-9m', 'dutch-bangla-001', '9 Months EMI', 9, 9.00, 10000.00, 500000.00, 0.00, 0.00, true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('dutch-bangla-12m', 'dutch-bangla-001', '12 Months EMI', 12, 11.50, 10000.00, 500000.00, 0.00, 0.00, true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('dutch-bangla-18m', 'dutch-bangla-001', '18 Months EMI', 18, 13.50, 20000.00, 500000.00, 0.00, 0.00, true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('dutch-bangla-24m', 'dutch-bangla-001', '24 Months EMI', 24, 15.00, 30000.00, 500000.00, 0.00, 0.00, true, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;
