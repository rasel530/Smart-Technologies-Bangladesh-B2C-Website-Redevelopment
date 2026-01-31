-- Migration: Add SearchLog table for Phase 4 Milestone 2
-- Created: 2026-01-27
-- Purpose: Track search analytics for Elasticsearch search integration
-- Status: Already exists in database (verified via prisma db push)

-- 1. Create SearchLog table if it doesn't exist
CREATE TABLE IF NOT EXISTS search_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query VARCHAR(255) NOT NULL,
    user_id VARCHAR(255),
    results_count INTEGER DEFAULT 0,
    execution_time FLOAT DEFAULT 0,
    filters JSONB DEFAULT '{}',
    ip_address VARCHAR(50),
    user_agent VARCHAR(500),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id_fk VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL
);

-- 2. Create indexes for SearchLog table
CREATE INDEX IF NOT EXISTS idx_search_logs_user_id ON search_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_search_logs_timestamp ON search_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_search_logs_query ON search_logs(query);

-- 3. Verify no existing data is affected
-- This migration only adds a new table, no modifications to existing tables
-- The table was already created via Prisma schema synchronization

-- Verification queries:
-- SELECT * FROM search_logs LIMIT 5;
-- SELECT COUNT(*) FROM search_logs;
-- \d search_logs
-- \di *search_logs*
