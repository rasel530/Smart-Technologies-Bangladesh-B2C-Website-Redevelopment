-- Migration: Rename Payment Tables from CamelCase to Snake Case
-- Date: 2026-02-26
-- Description: Renames payment-related tables to match Prisma schema @@map directives
--
-- Tables to rename:
--   PaymentTransaction -> payment_transaction
--   PaymentGatewaySettings -> payment_gateway_settings
--   PaymentLog -> payment_log
--
-- This migration is idempotent - it can be run multiple times safely.

BEGIN;

-- Check if tables exist with camelCase names and rename them
-- Rename PaymentTransaction to payment_transaction
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' 
               AND table_name = 'PaymentTransaction') THEN
        ALTER TABLE "PaymentTransaction" RENAME TO "payment_transaction";
        RAISE NOTICE 'Renamed PaymentTransaction to payment_transaction';
    ELSE
        RAISE NOTICE 'PaymentTransaction table does not exist or already renamed';
    END IF;
END $$;

-- Rename PaymentGatewaySettings to payment_gateway_settings
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' 
               AND table_name = 'PaymentGatewaySettings') THEN
        ALTER TABLE "PaymentGatewaySettings" RENAME TO "payment_gateway_settings";
        RAISE NOTICE 'Renamed PaymentGatewaySettings to payment_gateway_settings';
    ELSE
        RAISE NOTICE 'PaymentGatewaySettings table does not exist or already renamed';
    END IF;
END $$;

-- Rename PaymentLog to payment_log
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' 
               AND table_name = 'PaymentLog') THEN
        ALTER TABLE "PaymentLog" RENAME TO "payment_log";
        RAISE NOTICE 'Renamed PaymentLog to payment_log';
    ELSE
        RAISE NOTICE 'PaymentLog table does not exist or already renamed';
    END IF;
END $$;

-- Rename indexes to match new table names
-- Note: PostgreSQL automatically renames indexes when tables are renamed,
-- but we need to update any indexes that reference the old table name in their name

-- Update payment_transaction indexes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes 
               WHERE schemaname = 'public' 
               AND tablename = 'payment_transaction'
               AND indexname LIKE 'PaymentTransaction_%') THEN
        -- Rename indexes that still have the old table name prefix
        IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PaymentTransaction_orderId_idx') THEN
            ALTER INDEX "PaymentTransaction_orderId_idx" RENAME TO "payment_transaction_orderId_idx";
            RAISE NOTICE 'Renamed index PaymentTransaction_orderId_idx to payment_transaction_orderId_idx';
        END IF;
        
        IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PaymentTransaction_transactionId_idx') THEN
            ALTER INDEX "PaymentTransaction_transactionId_idx" RENAME TO "payment_transaction_transactionId_idx";
            RAISE NOTICE 'Renamed index PaymentTransaction_transactionId_idx to payment_transaction_transactionId_idx';
        END IF;
        
        IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PaymentTransaction_status_idx') THEN
            ALTER INDEX "PaymentTransaction_status_idx" RENAME TO "payment_transaction_status_idx";
            RAISE NOTICE 'Renamed index PaymentTransaction_status_idx to payment_transaction_status_idx';
        END IF;
        
        IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PaymentTransaction_paymentMethod_idx') THEN
            ALTER INDEX "PaymentTransaction_paymentMethod_idx" RENAME TO "payment_transaction_paymentMethod_idx";
            RAISE NOTICE 'Renamed index PaymentTransaction_paymentMethod_idx to payment_transaction_paymentMethod_idx';
        END IF;
        
        IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PaymentTransaction_createdAt_idx') THEN
            ALTER INDEX "PaymentTransaction_createdAt_idx" RENAME TO "payment_transaction_createdAt_idx";
            RAISE NOTICE 'Renamed index PaymentTransaction_createdAt_idx to payment_transaction_createdAt_idx';
        END IF;
    END IF;
END $$;

-- Update payment_gateway_settings indexes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes 
               WHERE schemaname = 'public' 
               AND tablename = 'payment_gateway_settings'
               AND indexname LIKE 'PaymentGatewaySettings_%') THEN
        -- Rename indexes that still have the old table name prefix
        IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PaymentGatewaySettings_gateway_idx') THEN
            ALTER INDEX "PaymentGatewaySettings_gateway_idx" RENAME TO "payment_gateway_settings_gateway_idx";
            RAISE NOTICE 'Renamed index PaymentGatewaySettings_gateway_idx to payment_gateway_settings_gateway_idx';
        END IF;
        
        IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PaymentGatewaySettings_isActive_idx') THEN
            ALTER INDEX "PaymentGatewaySettings_isActive_idx" RENAME TO "payment_gateway_settings_isActive_idx";
            RAISE NOTICE 'Renamed index PaymentGatewaySettings_isActive_idx to payment_gateway_settings_isActive_idx';
        END IF;
        
        IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PaymentGatewaySettings_isTestMode_idx') THEN
            ALTER INDEX "PaymentGatewaySettings_isTestMode_idx" RENAME TO "payment_gateway_settings_isTestMode_idx";
            RAISE NOTICE 'Renamed index PaymentGatewaySettings_isTestMode_idx to payment_gateway_settings_isTestMode_idx';
        END IF;
    END IF;
END $$;

-- Update payment_log indexes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes 
               WHERE schemaname = 'public' 
               AND tablename = 'payment_log'
               AND indexname LIKE 'PaymentLog_%') THEN
        -- Rename indexes that still have the old table name prefix
        IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PaymentLog_transactionId_idx') THEN
            ALTER INDEX "PaymentLog_transactionId_idx" RENAME TO "payment_log_transactionId_idx";
            RAISE NOTICE 'Renamed index PaymentLog_transactionId_idx to payment_log_transactionId_idx';
        END IF;
        
        IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PaymentLog_orderId_idx') THEN
            ALTER INDEX "PaymentLog_orderId_idx" RENAME TO "payment_log_orderId_idx";
            RAISE NOTICE 'Renamed index PaymentLog_orderId_idx to payment_log_orderId_idx';
        END IF;
        
        IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PaymentLog_eventType_idx') THEN
            ALTER INDEX "PaymentLog_eventType_idx" RENAME TO "payment_log_eventType_idx";
            RAISE NOTICE 'Renamed index PaymentLog_eventType_idx to payment_log_eventType_idx';
        END IF;
        
        IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PaymentLog_createdAt_idx') THEN
            ALTER INDEX "PaymentLog_createdAt_idx" RENAME TO "payment_log_createdAt_idx";
            RAISE NOTICE 'Renamed index PaymentLog_createdAt_idx to payment_log_createdAt_idx';
        END IF;
        
        IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PaymentLog_isSuspicious_idx') THEN
            ALTER INDEX "PaymentLog_isSuspicious_idx" RENAME TO "payment_log_isSuspicious_idx";
            RAISE NOTICE 'Renamed index PaymentLog_isSuspicious_idx to payment_log_isSuspicious_idx';
        END IF;
    END IF;
END $$;

-- Verify the tables were renamed successfully
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('payment_transaction', 'payment_gateway_settings', 'payment_log');
    
    IF table_count = 3 THEN
        RAISE NOTICE '✓ All 3 tables successfully renamed to snake_case';
    ELSE
        RAISE NOTICE '⚠ Warning: Expected 3 tables, found %', table_count;
    END IF;
END $$;

COMMIT;

-- Migration completed successfully
-- Tables renamed:
--   PaymentTransaction -> payment_transaction
--   PaymentGatewaySettings -> payment_gateway_settings
--   PaymentLog -> payment_log
--
-- Note: This migration preserves all data, indexes, constraints, and foreign keys.
-- PostgreSQL automatically updates references when tables are renamed.
