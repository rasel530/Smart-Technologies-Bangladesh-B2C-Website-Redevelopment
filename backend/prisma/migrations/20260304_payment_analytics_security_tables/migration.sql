-- ============================================
-- Phase 7 Milestone 4: Payment Analytics & Security
-- Migration: Add payment analytics and security tables
-- ============================================

-- Create PaymentAnalytics table - Daily/monthly aggregated analytics
CREATE TABLE "payment_analytics" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "period" VARCHAR(20) NOT NULL,
    "total_revenue" DECIMAL(10,2) NOT NULL,
    "total_transactions" INTEGER NOT NULL,
    "success_rate" DECIMAL(5,2) NOT NULL,
    "failed_transactions" INTEGER NOT NULL,
    "refunded_amount" DECIMAL(10,2) NOT NULL,
    "gateway_breakdown" JSONB NOT NULL DEFAULT '{}',
    "method_breakdown" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_analytics_pkey" PRIMARY KEY ("id")
);

-- Create PaymentMetrics table - Key performance indicators
CREATE TABLE "payment_metrics" (
    "id" TEXT NOT NULL,
    "metric_name" VARCHAR(100) NOT NULL,
    "metric_value" DECIMAL(10,2) NOT NULL,
    "metric_type" VARCHAR(50) NOT NULL,
    "period" VARCHAR(20) NOT NULL,
    "gateway" VARCHAR(50),
    "payment_method" VARCHAR(50),
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_metrics_pkey" PRIMARY KEY ("id")
);

-- Create FraudDetection table - Fraud detection rules and scores
CREATE TABLE "fraud_detection" (
    "id" TEXT NOT NULL,
    "user_id" UUID,
    "transaction_id" UUID NOT NULL,
    "risk_score" INTEGER NOT NULL,
    "risk_level" VARCHAR(20) NOT NULL,
    "detection_rules" JSONB NOT NULL DEFAULT '[]',
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "resolved_by" UUID,
    "resolution_notes" TEXT,

    CONSTRAINT "fraud_detection_pkey" PRIMARY KEY ("id")
);

-- Create SecurityAudit table - Security event audit trail
CREATE TABLE "security_audit" (
    "id" TEXT NOT NULL,
    "event_type" VARCHAR(100) NOT NULL,
    "severity" VARCHAR(20) NOT NULL,
    "description" TEXT NOT NULL,
    "affected_user_id" UUID,
    "affected_transaction_id" UUID,
    "ip_address" INET,
    "user_agent" TEXT,
    "event_data" JSONB,
    "performed_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "resolved_by" UUID,

    CONSTRAINT "security_audit_pkey" PRIMARY KEY ("id")
);

-- Create PaymentQueue table - Payment processing queue
CREATE TABLE "payment_queue" (
    "id" TEXT NOT NULL,
    "transaction_id" UUID NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "last_attempt_at" TIMESTAMP(3),
    "next_attempt_at" TIMESTAMP(3) NOT NULL,
    "queue_data" JSONB NOT NULL DEFAULT '{}',
    "error_messages" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_queue_pkey" PRIMARY KEY ("id")
);

-- Create PaymentCache table - Payment response caching
CREATE TABLE "payment_cache" (
    "id" TEXT NOT NULL,
    "cache_key" VARCHAR(255) NOT NULL,
    "cached_response" JSONB NOT NULL DEFAULT '{}',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_cache_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- Create Indexes
-- ============================================

-- PaymentAnalytics indexes
CREATE INDEX "idx_payment_analytics_date_period" ON "payment_analytics"("date", "period");

-- PaymentMetrics indexes
CREATE INDEX "idx_payment_metrics_name_period_timestamp" ON "payment_metrics"("metric_name", "period", "timestamp");
CREATE INDEX "idx_payment_metrics_timestamp" ON "payment_metrics"("timestamp");

-- FraudDetection indexes
CREATE INDEX "idx_fraud_detection_user_id" ON "fraud_detection"("user_id");
CREATE INDEX "idx_fraud_detection_transaction_id" ON "fraud_detection"("transaction_id");
CREATE INDEX "idx_fraud_detection_risk_level" ON "fraud_detection"("risk_level");
CREATE INDEX "idx_fraud_detection_detected_at" ON "fraud_detection"("detected_at");

-- SecurityAudit indexes
CREATE INDEX "idx_security_audit_event_type" ON "security_audit"("event_type");
CREATE INDEX "idx_security_audit_severity" ON "security_audit"("severity");
CREATE INDEX "idx_security_audit_affected_user_id" ON "security_audit"("affected_user_id");
CREATE INDEX "idx_security_audit_transaction_id" ON "security_audit"("affected_transaction_id");
CREATE INDEX "idx_security_audit_created_at" ON "security_audit"("created_at");

-- PaymentQueue indexes
CREATE INDEX "idx_payment_queue_status_next_attempt" ON "payment_queue"("status", "next_attempt_at");
CREATE INDEX "idx_payment_queue_transaction_id" ON "payment_queue"("transaction_id");
CREATE INDEX "idx_payment_queue_priority" ON "payment_queue"("priority");

-- PaymentCache indexes
CREATE UNIQUE INDEX "payment_cache_cache_key_key" ON "payment_cache"("cache_key");
CREATE INDEX "idx_payment_cache_key" ON "payment_cache"("cache_key");
CREATE INDEX "idx_payment_cache_expires_at" ON "payment_cache"("expires_at");
