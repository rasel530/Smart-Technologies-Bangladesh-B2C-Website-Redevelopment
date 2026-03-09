-- Migration: Phase 7 Milestone 2 - Payment Gateway Integration
-- Description: Create tables for SSLCommerz, bKash, and Nagad payment gateway integration
-- Date: 2026-02-26
-- Author: System

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. payment_transaction Table
-- =====================================================
-- Stores all payment transactions from all payment gateways
-- =====================================================

CREATE TABLE "payment_transaction" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "orderId" TEXT NOT NULL REFERENCES "orders"(id) ON DELETE CASCADE,
  "paymentMethod" "PaymentMethod" NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BDT',
  "transactionId" VARCHAR(255) UNIQUE,
  "gatewayTransactionId" VARCHAR(255),
  "paymentId" VARCHAR(255),
  "merchantInvoiceNumber" VARCHAR(255),
  "customerMsisdn" VARCHAR(20),
  "status" "PaymentStatus" DEFAULT 'pending',
  "gatewayResponse" JSONB,
  "callbackResponse" JSONB,
  "failureReason" TEXT,
  "refundAmount" DECIMAL(10,2),
  "refundedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Indexes for payment_transaction
CREATE INDEX "payment_transaction_orderId_idx" ON "payment_transaction"("orderId");
CREATE INDEX "payment_transaction_transactionId_idx" ON "payment_transaction"("transactionId");
CREATE INDEX "payment_transaction_status_idx" ON "payment_transaction"("status");
CREATE INDEX "payment_transaction_paymentMethod_idx" ON "payment_transaction"("paymentMethod");
CREATE INDEX "payment_transaction_createdAt_idx" ON "payment_transaction"("createdAt");

-- =====================================================
-- 2. payment_gateway_settings Table
-- =====================================================
-- Stores configuration settings for each payment gateway
-- =====================================================

CREATE TABLE "payment_gateway_settings" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway VARCHAR(50) NOT NULL UNIQUE,
  "isActive" BOOLEAN DEFAULT true,
  "isTestMode" BOOLEAN DEFAULT true,
  "merchantId" VARCHAR(255),
  "storeId" VARCHAR(255),
  "apiKey" VARCHAR(255),
  "apiSecret" VARCHAR(255),
  "publicKey" TEXT,
  "privateKey" TEXT,
  "webhookUrl" VARCHAR(500),
  "returnUrl" VARCHAR(500),
  "config" JSONB,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Indexes for payment_gateway_settings
CREATE INDEX "payment_gateway_settings_gateway_idx" ON "payment_gateway_settings"(gateway);
CREATE INDEX "payment_gateway_settings_isActive_idx" ON "payment_gateway_settings"("isActive");
CREATE INDEX "payment_gateway_settings_isTestMode_idx" ON "payment_gateway_settings"("isTestMode");

-- =====================================================
-- 3. payment_log Table (Security & Audit)
-- =====================================================
-- Logs all payment-related events for security and audit purposes
-- =====================================================

CREATE TABLE "payment_log" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "transactionId" UUID REFERENCES "payment_transaction"(id) ON DELETE CASCADE,
  "orderId" TEXT REFERENCES "orders"(id) ON DELETE CASCADE,
  "eventType" VARCHAR(50) NOT NULL,
  "eventData" JSONB NOT NULL,
  "ipAddress" INET,
  "userAgent" TEXT,
  "riskScore" INTEGER,
  "isSuspicious" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Indexes for payment_log
CREATE INDEX "payment_log_transactionId_idx" ON "payment_log"("transactionId");
CREATE INDEX "payment_log_orderId_idx" ON "payment_log"("orderId");
CREATE INDEX "payment_log_eventType_idx" ON "payment_log"("eventType");
CREATE INDEX "payment_log_createdAt_idx" ON "payment_log"("createdAt");
CREATE INDEX "payment_log_isSuspicious_idx" ON "payment_log"("isSuspicious");

-- =====================================================
-- Trigger to update updatedAt timestamp
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for PaymentTransaction
CREATE TRIGGER update_payment_transaction_updated_at
    BEFORE UPDATE ON "payment_transaction"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for PaymentGatewaySettings
CREATE TRIGGER update_payment_gateway_settings_updated_at
    BEFORE UPDATE ON "payment_gateway_settings"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Insert default payment gateway settings
-- =====================================================

-- SSLCommerz settings (default test mode)
INSERT INTO "payment_gateway_settings" (gateway, "isActive", "isTestMode", "config")
VALUES (
  'sslcommerz',
  true,
  true,
  '{
    "store_id": "",
    "store_passwd": "",
    "currency": "BDT",
    "success_url": "/api/payments/sslcommerz/success",
    "fail_url": "/api/payments/sslcommerz/fail",
    "cancel_url": "/api/payments/sslcommerz/cancel",
    "ipn_url": "/api/payments/sslcommerz/ipn",
    "multi_card_name": "bkash,visa,mastercard,amex"
  }'::jsonb
) ON CONFLICT (gateway) DO NOTHING;

-- bKash settings (default test mode)
INSERT INTO "payment_gateway_settings" (gateway, "isActive", "isTestMode", "config")
VALUES (
  'bkash',
  true,
  true,
  '{
    "app_key": "",
    "app_secret": "",
    "username": "",
    "password": "",
    "currency": "BDT",
    "intent": "sale",
    "merchant_invoice_number": "Inv-{timestamp}",
    "execute_payment_url": "/api/payments/bkash/execute",
    "create_payment_url": "/api/payments/bkash/create",
    "callback_url": "/api/payments/bkash/callback"
  }'::jsonb
) ON CONFLICT (gateway) DO NOTHING;

-- Nagad settings (default test mode)
INSERT INTO "payment_gateway_settings" (gateway, "isActive", "isTestMode", "config")
VALUES (
  'nagad',
  true,
  true,
  '{
    "merchant_id": "",
    "merchant_account_no": "",
    "merchant_private_key": "",
    "merchant_public_key": "",
    "currency": "BDT",
    "intent": "sale",
    "payment_callback_url": "/api/payments/nagad/callback",
    "ipn_url": "/api/payments/nagad/ipn",
    "merchant_additional_info": "Smart Tech E-commerce"
  }'::jsonb
) ON CONFLICT (gateway) DO NOTHING;

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON TABLE "PaymentTransaction" IS 'Stores all payment transactions from SSLCommerz, bKash, and Nagad payment gateways';
COMMENT ON COLUMN "PaymentTransaction"."orderId" IS 'Reference to the order associated with this payment';
COMMENT ON COLUMN "PaymentTransaction"."paymentMethod" IS 'Payment method used (credit_card, bkash, nagad, etc.)';
COMMENT ON COLUMN "PaymentTransaction"."transactionId" IS 'Unique transaction ID generated by our system';
COMMENT ON COLUMN "PaymentTransaction"."gatewayTransactionId" IS 'Transaction ID from the payment gateway';
COMMENT ON COLUMN "PaymentTransaction"."customerMsisdn" IS 'Customer mobile number for mobile wallet payments';
COMMENT ON COLUMN "PaymentTransaction"."gatewayResponse" IS 'Full response from payment gateway (JSON)';
COMMENT ON COLUMN "PaymentTransaction"."callbackResponse" IS 'IPN/webhook callback data (JSON)';

COMMENT ON TABLE "payment_gateway_settings" IS 'Stores configuration settings for each payment gateway';
COMMENT ON COLUMN "payment_gateway_settings".gateway IS 'Gateway identifier (sslcommerz, bkash, nagad)';
COMMENT ON COLUMN "payment_gateway_settings"."isActive" IS 'Whether this gateway is currently active';
COMMENT ON COLUMN "payment_gateway_settings"."isTestMode" IS 'Whether test mode is enabled';
COMMENT ON COLUMN "payment_gateway_settings"."config" IS 'Additional gateway-specific configuration (JSON)';

COMMENT ON TABLE "payment_log" IS 'Logs all payment-related events for security and audit purposes';
COMMENT ON COLUMN "payment_log"."transactionId" IS 'Reference to payment transaction (optional)';
COMMENT ON COLUMN "payment_log"."eventType" IS 'Type of event (initiate, success, fail, callback, etc.)';
COMMENT ON COLUMN "payment_log"."eventData" IS 'Event-specific data (JSON)';
COMMENT ON COLUMN "payment_log"."riskScore" IS 'Fraud risk score (0-100)';
COMMENT ON COLUMN "payment_log"."isSuspicious" IS 'Whether this event is flagged as suspicious';

-- =====================================================
-- Migration Complete
-- =====================================================
-- All tables created successfully with:
-- - Proper foreign key relationships
-- - Performance indexes
-- - JSONB fields for flexible data storage
-- - Default values (currency='BDT', status='PENDING', etc.)
-- - Timestamps (createdAt, updatedAt)
-- - Update triggers for updatedAt
-- - Default gateway settings
-- =====================================================
