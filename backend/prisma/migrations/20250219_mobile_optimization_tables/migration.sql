-- CreateMobileOptimizationTables
-- Migration for Milestone 5: Mobile Optimization Backend Features

-- Create cart_sms_subscription table
CREATE TABLE "cart_sms_subscription" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "phoneNumber" VARCHAR(20) NOT NULL,
    "events" TEXT[] NOT NULL DEFAULT ARRAY['item_added', 'item_removed', 'price_changed', 'cart_abandoned']::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "unsubscribedAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "cart_sms_subscription_userId_unique" UNIQUE ("userId")
);

CREATE INDEX "idx_cart_sms_subscription_userId" ON "cart_sms_subscription"("userId");
CREATE INDEX "idx_cart_sms_subscription_phoneNumber" ON "cart_sms_subscription"("phoneNumber");
CREATE INDEX "idx_cart_sms_subscription_isActive" ON "cart_sms_subscription"("isActive");
CREATE INDEX "idx_cart_sms_subscription_createdAt" ON "cart_sms_subscription"("createdAt" DESC);

ALTER TABLE "cart_sms_subscription"
ADD CONSTRAINT "fk_cart_sms_subscription_userId"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;

-- Create cart_offline_sync table
CREATE TABLE "cart_offline_sync" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "deviceId" VARCHAR(255),
    "lastSyncAt" TIMESTAMP NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "syncedItemsCount" INTEGER NOT NULL DEFAULT 0,
    "conflictsResolved" INTEGER NOT NULL DEFAULT 0,
    "syncStatus" VARCHAR(50) NOT NULL DEFAULT 'idle',
    "lastError" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "cart_offline_sync_syncStatus_check" 
        CHECK ("syncStatus" IN ('idle', 'syncing', 'completed', 'failed'))
);

CREATE INDEX "idx_cart_offline_sync_userId" ON "cart_offline_sync"("userId");
CREATE INDEX "idx_cart_offline_sync_deviceId" ON "cart_offline_sync"("deviceId");
CREATE INDEX "idx_cart_offline_sync_lastSyncAt" ON "cart_offline_sync"("lastSyncAt" DESC);
CREATE INDEX "idx_cart_offline_sync_syncStatus" ON "cart_offline_sync"("syncStatus");

ALTER TABLE "cart_offline_sync"
ADD CONSTRAINT "fk_cart_offline_sync_userId"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;

-- Create cart_sms_log table
CREATE TABLE "cart_sms_log" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "subscriptionId" UUID NOT NULL,
    "eventType" VARCHAR(50) NOT NULL,
    "phoneNumber" VARCHAR(20) NOT NULL,
    "messageId" VARCHAR(255),
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "cart_sms_log_eventType_check" 
        CHECK ("eventType" IN ('item_added', 'item_removed', 'price_changed', 'cart_abandoned', 'subscription_confirmation')),
    CONSTRAINT "cart_sms_log_status_check" 
        CHECK ("status" IN ('pending', 'sent', 'failed', 'delivered'))
);

CREATE INDEX "idx_cart_sms_log_userId" ON "cart_sms_log"("userId");
CREATE INDEX "idx_cart_sms_log_subscriptionId" ON "cart_sms_log"("subscriptionId");
CREATE INDEX "idx_cart_sms_log_eventType" ON "cart_sms_log"("eventType");
CREATE INDEX "idx_cart_sms_log_status" ON "cart_sms_log"("status");
CREATE INDEX "idx_cart_sms_log_sentAt" ON "cart_sms_log"("sentAt" DESC);

ALTER TABLE "cart_sms_log"
ADD CONSTRAINT "fk_cart_sms_log_userId"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "cart_sms_log"
ADD CONSTRAINT "fk_cart_sms_log_subscriptionId"
FOREIGN KEY ("subscriptionId") REFERENCES "cart_sms_subscription"("id") ON DELETE CASCADE;

-- Create offline_cart_change table (if not exists)
CREATE TABLE IF NOT EXISTS "offline_cart_change" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID,
    "sessionId" VARCHAR(255),
    "deviceId" VARCHAR(255) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "productId" UUID,
    "variantId" UUID,
    "quantity" INTEGER,
    "previousValue" JSONB,
    "newValue" JSONB,
    "isSynced" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" TIMESTAMP,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "offline_cart_change_action_check" 
        CHECK ("action" IN ('add', 'update', 'remove', 'clear'))
);

CREATE INDEX "idx_offline_cart_change_userId" ON "offline_cart_change"("userId");
CREATE INDEX "idx_offline_cart_change_sessionId" ON "offline_cart_change"("sessionId");
CREATE INDEX "idx_offline_cart_change_deviceId" ON "offline_cart_change"("deviceId");
CREATE INDEX "idx_offline_cart_change_isSynced" ON "offline_cart_change"("isSynced");
CREATE INDEX "idx_offline_cart_change_createdAt" ON "offline_cart_change"("createdAt" DESC);

ALTER TABLE "offline_cart_change"
ADD CONSTRAINT "fk_offline_cart_change_userId"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL;

ALTER TABLE "offline_cart_change"
ADD CONSTRAINT "fk_offline_cart_change_productId"
FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL;

ALTER TABLE "offline_cart_change"
ADD CONSTRAINT "fk_offline_cart_change_variantId"
FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE SET NULL;

-- Create update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic updatedAt updates
CREATE TRIGGER "cart_sms_subscription_updated_at"
    BEFORE UPDATE ON "cart_sms_subscription"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER "cart_offline_sync_updated_at"
    BEFORE UPDATE ON "cart_offline_sync"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER "offline_cart_change_updated_at"
    BEFORE UPDATE ON "offline_cart_change"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
