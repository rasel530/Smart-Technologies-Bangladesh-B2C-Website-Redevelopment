-- CreateSearchAnalytics
CREATE TABLE "search_analytics" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "resultsCount" INTEGER NOT NULL DEFAULT 0,
    "responseTime" INTEGER NOT NULL DEFAULT 0,
    "clickedResults" JSONB NOT NULL DEFAULT '[]',
    "filtersApplied" JSONB NOT NULL DEFAULT '{}',
    "sortBy" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceType" TEXT,
    "conversionType" TEXT,
    "productId" TEXT
);

-- CreateSearchPerformanceMetrics
CREATE TABLE "search_performance_metrics" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "queryCount" INTEGER NOT NULL DEFAULT 0,
    "avgResponseTime" INTEGER NOT NULL DEFAULT 0,
    "p95ResponseTime" INTEGER NOT NULL DEFAULT 0,
    "p99ResponseTime" INTEGER NOT NULL DEFAULT 0,
    "cacheHitRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "zeroResultQueries" INTEGER NOT NULL DEFAULT 0
);

-- CreateSearchTrending
CREATE TABLE "search_trending" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "searchCount" INTEGER NOT NULL DEFAULT 0,
    "trendScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastSearchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category" TEXT,
    "isTrending" BOOLEAN NOT NULL DEFAULT false
);

-- CreateSearchOptimizationExperiments
CREATE TABLE "search_optimization_experiments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "algorithmVariant" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metrics" JSONB NOT NULL DEFAULT '{}',
    "sampleSize" INTEGER NOT NULL DEFAULT 0
);

-- CreateUserSearchPreferences
CREATE TABLE "user_search_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferredCategories" JSONB NOT NULL DEFAULT '[]',
    "preferredBrands" JSONB NOT NULL DEFAULT '[]',
    "priceRangeMin" INTEGER,
    "priceRangeMax" INTEGER,
    "searchHistory" JSONB NOT NULL DEFAULT '[]'
);

-- CreateSearchRecommendations
CREATE TABLE "search_recommendations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "recommendationType" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clicked" BOOLEAN NOT NULL DEFAULT false,
    "converted" BOOLEAN NOT NULL DEFAULT false
);

-- CreateSearchClickTracking
CREATE TABLE "search_click_tracking" (
    "id" TEXT NOT NULL,
    "searchAnalyticsId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "clickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dwellTime" INTEGER NOT NULL DEFAULT 0
);

-- Create primary keys
ALTER TABLE "search_analytics" ADD CONSTRAINT "search_analytics_pkey" PRIMARY KEY ("id");

ALTER TABLE "search_performance_metrics" ADD CONSTRAINT "search_performance_metrics_pkey" PRIMARY KEY ("id");

ALTER TABLE "search_trending" ADD CONSTRAINT "search_trending_pkey" PRIMARY KEY ("id");

ALTER TABLE "search_optimization_experiments" ADD CONSTRAINT "search_optimization_experiments_pkey" PRIMARY KEY ("id");

ALTER TABLE "user_search_preferences" ADD CONSTRAINT "user_search_preferences_pkey" PRIMARY KEY ("id");

ALTER TABLE "search_recommendations" ADD CONSTRAINT "search_recommendations_pkey" PRIMARY KEY ("id");

ALTER TABLE "search_click_tracking" ADD CONSTRAINT "search_click_tracking_pkey" PRIMARY KEY ("id");

-- Create unique constraints
ALTER TABLE "search_trending" ADD CONSTRAINT "search_trending_query_key" UNIQUE ("query");

ALTER TABLE "user_search_preferences" ADD CONSTRAINT "user_search_preferences_userId_key" UNIQUE ("userId");

-- Create foreign keys
ALTER TABLE "search_analytics" ADD CONSTRAINT "search_analytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "search_recommendations" ADD CONSTRAINT "search_recommendations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "search_recommendations" ADD CONSTRAINT "search_recommendations_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "search_click_tracking" ADD CONSTRAINT "search_click_tracking_searchAnalyticsId_fkey" FOREIGN KEY ("searchAnalyticsId") REFERENCES "search_analytics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "search_click_tracking" ADD CONSTRAINT "search_click_tracking_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_search_preferences" ADD CONSTRAINT "user_search_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes
CREATE INDEX "search_analytics_userId_idx" ON "search_analytics"("userId");

CREATE INDEX "search_analytics_sessionId_idx" ON "search_analytics"("sessionId");

CREATE INDEX "search_analytics_query_idx" ON "search_analytics"("query");

CREATE INDEX "search_analytics_timestamp_idx" ON "search_analytics"("timestamp");

CREATE INDEX "search_performance_metrics_timestamp_idx" ON "search_performance_metrics"("timestamp");

CREATE INDEX "search_trending_query_idx" ON "search_trending"("query");

CREATE INDEX "search_trending_isTrending_idx" ON "search_trending"("isTrending");

CREATE INDEX "search_trending_trendScore_idx" ON "search_trending"("trendScore");

CREATE INDEX "search_trending_lastSearchedAt_idx" ON "search_trending"("lastSearchedAt");

CREATE INDEX "search_optimization_experiments_isActive_idx" ON "search_optimization_experiments"("isActive");

CREATE INDEX "search_optimization_experiments_startDate_idx" ON "search_optimization_experiments"("startDate");

CREATE INDEX "search_optimization_experiments_algorithmVariant_idx" ON "search_optimization_experiments"("algorithmVariant");

CREATE INDEX "user_search_preferences_userId_idx" ON "user_search_preferences"("userId");

CREATE INDEX "search_recommendations_userId_idx" ON "search_recommendations"("userId");

CREATE INDEX "search_recommendations_productId_idx" ON "search_recommendations"("productId");

CREATE INDEX "search_recommendations_recommendationType_idx" ON "search_recommendations"("recommendationType");

CREATE INDEX "search_recommendations_score_idx" ON "search_recommendations"("score");

CREATE INDEX "search_recommendations_createdAt_idx" ON "search_recommendations"("createdAt");

CREATE INDEX "search_click_tracking_searchAnalyticsId_idx" ON "search_click_tracking"("searchAnalyticsId");

CREATE INDEX "search_click_tracking_productId_idx" ON "search_click_tracking"("productId");

CREATE INDEX "search_click_tracking_clickedAt_idx" ON "search_click_tracking"("clickedAt");
