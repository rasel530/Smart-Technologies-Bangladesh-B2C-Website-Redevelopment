-- Create local_payment_methods table
CREATE TABLE IF NOT EXISTS "local_payment_methods" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "minAmount" DECIMAL(12,2) NOT NULL DEFAULT 10,
    "maxAmount" DECIMAL(12,2) NOT NULL DEFAULT 200000,
    "processingFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "processingFeePercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "requiresPhone" BOOLEAN NOT NULL DEFAULT true,
    "requiresPin" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "instructions" TEXT,
    "supportedNetworks" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "local_payment_methods_pkey" PRIMARY KEY ("id")
);

-- Create unique index on code
CREATE UNIQUE INDEX IF NOT EXISTS "local_payment_methods_code_key" ON "local_payment_methods"("code");

-- Create index on isActive
CREATE INDEX IF NOT EXISTS "local_payment_methods_isActive_idx" ON "local_payment_methods"("isActive");

-- Create sms_subscriptions table
CREATE TABLE IF NOT EXISTS "sms_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "isSubscribed" BOOLEAN NOT NULL DEFAULT true,
    "transactionId" TEXT,
    "lastPaymentAt" TIMESTAMP(3),
    "nextPaymentAt" TIMESTAMP(3),
    "amount" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sms_subscriptions_pkey" PRIMARY KEY ("id")
);

-- Create unique index on userId
CREATE UNIQUE INDEX IF NOT EXISTS "sms_subscriptions_userId_key" ON "sms_subscriptions"("userId");

-- Create unique index on phoneNumber
CREATE UNIQUE INDEX IF NOT EXISTS "sms_subscriptions_phoneNumber_key" ON "sms_subscriptions"("phoneNumber");

-- Create index on paymentMethod
CREATE INDEX IF NOT EXISTS "sms_subscriptions_paymentMethod_idx" ON "sms_subscriptions"("paymentMethod");

-- Insert default local payment methods for Bangladesh

-- bKash
INSERT INTO "local_payment_methods" (id, name, code, "displayName", "logoUrl", "isActive", minAmount, maxAmount, processingFee, "processingFeePercent", requiresPhone, requiresPin, description, instructions, "supportedNetworks", createdAt, updatedAt)
VALUES ('bkash-001', 'bKash', 'bkash', 'বিকাশ / bKash', NULL, true, 10.00, 200000.00, 0.00, 1.50, true, false, 'Bangladesh''s leading mobile financial service',
'[{"step":1,"title_en":"Open your bKash app","title_bn":"আপনার বিকাশ অ্যাপ খুলুন","description_en":"Go to ''Send Money'' option","description_bn":"''টাকা পাঠান'' অপশনে যান"},{"step":2,"title_en":"Enter merchant number","title_bn":"মার্চেন্ট নম্বর লিখুন","description_en":"Enter 017XXXXXXXX","description_bn":"017XXXXXXXX লিখুন"}]',
ARRAY['GP','Robi','Banglalink','Teletalk'], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Nagad
INSERT INTO "local_payment_methods" (id, name, code, "displayName", "logoUrl", "isActive", minAmount, maxAmount, processingFee, "processingFeePercent", requiresPhone, requiresPin, description, instructions, "supportedNetworks", createdAt, updatedAt)
VALUES ('nagad-001', 'Nagad', 'nagad', 'নগদ / Nagad', NULL, true, 10.00, 200000.00, 0.00, 1.50, true, false, 'Digital financial service of Bangladesh Postal Department',
'[{"step":1,"title_en":"Open your Nagad app","title_bn":"আপনার নগদ অ্যাপ খুলুন","description_en":"Go to ''Send Money'' option","description_bn":"''টাকা পাঠান'' অপশনে যান"},{"step":2,"title_en":"Enter merchant number","title_bn":"মার্চেন্ট নম্বর লিখুন","description_en":"Enter 018XXXXXXXX","description_bn":"018XXXXXXXX লিখুন"}]',
ARRAY['GP','Robi','Banglalink','Teletalk'], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Rocket
INSERT INTO "local_payment_methods" (id, name, code, "displayName", "logoUrl", "isActive", minAmount, maxAmount, processingFee, "processingFeePercent", requiresPhone, requiresPin, description, instructions, "supportedNetworks", createdAt, updatedAt)
VALUES ('rocket-001', 'Rocket', 'rocket', 'রকেট / Rocket', NULL, true, 10.00, 200000.00, 0.00, 1.50, true, false, 'Mobile financial service of Dutch-Bangla Bank',
'[{"step":1,"title_en":"Open your Rocket app","title_bn":"আপনার রকেট অ্যাপ খুলুন","description_en":"Go to ''Send Money'' option","description_bn":"''টাকা পাঠান'' অপশনে যান"},{"step":2,"title_en":"Enter merchant number","title_bn":"মার্চেন্ট নম্বর লিখুন","description_en":"Enter 016XXXXXXXX","description_bn":"016XXXXXXXX লিখুন"}]',
ARRAY['GP','Robi','Banglalink','Teletalk'], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- SureCash
INSERT INTO "local_payment_methods" (id, name, code, "displayName", "logoUrl", "isActive", minAmount, maxAmount, processingFee, "processingFeePercent", requiresPhone, requiresPin, description, instructions, "supportedNetworks", createdAt, updatedAt)
VALUES ('surecash-001', 'SureCash', 'surecash', 'সিওরক্যাশ / SureCash', NULL, true, 10.00, 50000.00, 0.00, 1.50, true, false, 'Mobile financial service for easy transactions',
'[{"step":1,"title_en":"Open your SureCash app","title_bn":"আপনার সিওরক্যাশ অ্যাপ খুলুন","description_en":"Go to ''Send Money'' option","description_bn":"''টাকা পাঠান'' অপশনে যান"},{"step":2,"title_en":"Enter merchant number","title_bn":"মার্চেন্ট নম্বর লিখুন","description_en":"Enter 019XXXXXXXX","description_bn":"019XXXXXXXX লিখুন"}]',
ARRAY['GP','Robi','Banglalink','Teletalk'], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
