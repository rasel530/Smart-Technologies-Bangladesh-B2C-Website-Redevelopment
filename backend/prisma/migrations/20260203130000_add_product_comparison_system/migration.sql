-- CreateProductComparison
CREATE TABLE "product_comparisons" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3)
);

-- CreateProductComparisonItem
CREATE TABLE "product_comparison_items" (
    "id" TEXT NOT NULL,
    "comparisonId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT
);

-- CreateComparisonHistory
CREATE TABLE "comparison_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "comparisonId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create primary keys
ALTER TABLE "product_comparisons" ADD CONSTRAINT "product_comparisons_pkey" PRIMARY KEY ("id");

ALTER TABLE "product_comparison_items" ADD CONSTRAINT "product_comparison_items_pkey" PRIMARY KEY ("id");

ALTER TABLE "comparison_history" ADD CONSTRAINT "comparison_history_pkey" PRIMARY KEY ("id");

-- Create unique constraints
ALTER TABLE "product_comparison_items" ADD CONSTRAINT "product_comparison_items_comparisonId_productId_key" UNIQUE ("comparisonId", "productId");

-- Create foreign keys
ALTER TABLE "product_comparisons" ADD CONSTRAINT "product_comparisons_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "product_comparison_items" ADD CONSTRAINT "product_comparison_items_comparisonId_fkey" FOREIGN KEY ("comparisonId") REFERENCES "product_comparisons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_comparison_items" ADD CONSTRAINT "product_comparison_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "comparison_history" ADD CONSTRAINT "comparison_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes
CREATE INDEX "product_comparisons_userId_idx" ON "product_comparisons"("userId");

CREATE INDEX "product_comparisons_sessionId_idx" ON "product_comparisons"("sessionId");

CREATE INDEX "product_comparisons_expiresAt_idx" ON "product_comparisons"("expiresAt");

CREATE INDEX "product_comparison_items_comparisonId_idx" ON "product_comparison_items"("comparisonId");

CREATE INDEX "product_comparison_items_productId_idx" ON "product_comparison_items"("productId");

CREATE INDEX "comparison_history_userId_idx" ON "comparison_history"("userId");

CREATE INDEX "comparison_history_comparisonId_idx" ON "comparison_history"("comparisonId");

CREATE INDEX "comparison_history_createdAt_idx" ON "comparison_history"("createdAt");
