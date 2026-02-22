-- Create offline_cart_changes table
CREATE TABLE "offline_cart_changes" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "deviceId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "productId" TEXT,
    "variantId" TEXT,
    "quantity" INTEGER,
    "previousValue" JSONB,
    "newValue" JSONB,
    "isSynced" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" TIMESTAMP(3),
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "offline_cart_changes_pkey" PRIMARY KEY ("id")
);

-- Create indexes for offline_cart_changes
CREATE INDEX "offline_cart_changes_userId_idx" ON "offline_cart_changes"("userId");
CREATE INDEX "offline_cart_changes_sessionId_idx" ON "offline_cart_changes"("sessionId");
CREATE INDEX "offline_cart_changes_deviceId_idx" ON "offline_cart_changes"("deviceId");
CREATE INDEX "offline_cart_changes_isSynced_idx" ON "offline_cart_changes"("isSynced");

-- Create cart_analytics_bd table
CREATE TABLE "cart_analytics_bd" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "deviceId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "deviceType" TEXT,
    "browser" TEXT,
    "networkType" TEXT,
    "networkSpeed" TEXT,
    "screenResolution" TEXT,
    "cartId" TEXT,
    "action" TEXT NOT NULL,
    "productId" TEXT,
    "paymentMethod" TEXT,
    "emiPlanId" TEXT,
    "duration" INTEGER,
    "pageCount" INTEGER,
    "touchCount" INTEGER,
    "scrollDepth" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cart_analytics_bd_pkey" PRIMARY KEY ("id")
);

-- Create indexes for cart_analytics_bd
CREATE INDEX "cart_analytics_bd_userId_idx" ON "cart_analytics_bd"("userId");
CREATE INDEX "cart_analytics_bd_sessionId_idx" ON "cart_analytics_bd"("sessionId");
CREATE INDEX "cart_analytics_bd_deviceId_idx" ON "cart_analytics_bd"("deviceId");
CREATE INDEX "cart_analytics_bd_platform_idx" ON "cart_analytics_bd"("platform");
CREATE INDEX "cart_analytics_bd_action_idx" ON "cart_analytics_bd"("action");
CREATE INDEX "cart_analytics_bd_createdAt_idx" ON "cart_analytics_bd"("createdAt");
