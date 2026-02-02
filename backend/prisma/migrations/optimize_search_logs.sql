-- ============================================================================
-- Index Optimization Script for search_logs Table
-- Phase 5 Milestone 2 - Search Functionality
-- ============================================================================
-- Purpose: Create composite indexes for common query patterns to improve
--          search analytics performance
--
-- IMPORTANT: This script is NON-DESTRUCTIVE
-- - Uses CREATE INDEX IF NOT EXISTS for all indexes
-- - Does not drop or modify existing indexes
-- - Zero data loss guaranteed
-- ============================================================================

-- ============================================================================
-- Composite Index 1: User Analytics
-- Purpose: Optimize queries that filter by user_id and order by timestamp
-- Use Case: User search history, user behavior analytics
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_search_logs_user_timestamp 
    ON search_logs(user_id, timestamp DESC);

-- ============================================================================
-- Composite Index 2: Popular Searches Analysis
-- Purpose: Optimize queries that analyze search queries over time
-- Use Case: Trending searches, search popularity metrics
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_search_logs_query_timestamp 
    ON search_logs(query, timestamp DESC);

-- ============================================================================
-- Composite Index 3: Performance Monitoring
-- Purpose: Optimize queries that filter by execution time for performance analysis
-- Use Case: Slow query detection, search performance optimization
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_search_logs_execution_time 
    ON search_logs(execution_time DESC, timestamp DESC);

-- ============================================================================
-- Composite Index 4: Results Count Analysis
-- Purpose: Optimize queries that analyze search result patterns
-- Use Case: Zero-result searches, search effectiveness metrics
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_search_logs_results_count 
    ON search_logs(results_count, timestamp DESC);

-- ============================================================================
-- Composite Index 5: Time-based Analytics
-- Purpose: Optimize queries that aggregate searches by time periods
-- Use Case: Daily/weekly/monthly search volume reports
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_search_logs_timestamp_user 
    ON search_logs(timestamp DESC, user_id);

-- ============================================================================
-- Composite Index 6: Filter Analysis
-- Purpose: Optimize queries that analyze search filter usage patterns
-- Use Case: Filter popularity, user search behavior
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_search_logs_filters 
    ON search_logs USING GIN (filters);

-- ============================================================================
-- Composite Index 7: IP-based Analytics
-- Purpose: Optimize queries that analyze search patterns by IP address
-- Use Case: Bot detection, security analysis, geographic analytics
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_search_logs_ip_timestamp 
    ON search_logs(ip_address, timestamp DESC);

-- ============================================================================
-- Composite Index 8: User Agent Analysis
-- Purpose: Optimize queries that analyze search patterns by device/browser
-- Use Case: Device-specific search optimization, mobile vs desktop analytics
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_search_logs_user_agent_timestamp 
    ON search_logs(user_agent, timestamp DESC);

-- ============================================================================
-- Composite Index 9: Comprehensive User Search Pattern
-- Purpose: Optimize queries that analyze complete user search patterns
-- Use Case: User journey analysis, search session tracking
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_search_logs_user_query_timestamp 
    ON search_logs(user_id, query, timestamp DESC);

-- ============================================================================
-- Composite Index 10: Query Performance by User
-- Purpose: Optimize queries that analyze search performance per user
-- Use Case: Personalized search optimization, user-specific performance metrics
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_search_logs_user_execution 
    ON search_logs(user_id, execution_time DESC, timestamp DESC);

-- ============================================================================
-- Add comments for documentation
-- ============================================================================

COMMENT ON INDEX idx_search_logs_user_timestamp IS 
    'Composite index for user search history analytics - filters by user_id and orders by timestamp DESC';

COMMENT ON INDEX idx_search_logs_query_timestamp IS 
    'Composite index for popular searches analysis - filters by query and orders by timestamp DESC';

COMMENT ON INDEX idx_search_logs_execution_time IS 
    'Composite index for performance monitoring - orders by execution_time DESC and timestamp DESC';

COMMENT ON INDEX idx_search_logs_results_count IS 
    'Composite index for results count analysis - filters by results_count and orders by timestamp DESC';

COMMENT ON INDEX idx_search_logs_timestamp_user IS 
    'Composite index for time-based analytics - orders by timestamp DESC and includes user_id';

COMMENT ON INDEX idx_search_logs_filters IS 
    'GIN index for JSONB filters column - enables efficient queries on filter patterns';

COMMENT ON INDEX idx_search_logs_ip_timestamp IS 
    'Composite index for IP-based analytics - filters by ip_address and orders by timestamp DESC';

COMMENT ON INDEX idx_search_logs_user_agent_timestamp IS 
    'Composite index for user agent analysis - filters by user_agent and orders by timestamp DESC';

COMMENT ON INDEX idx_search_logs_user_query_timestamp IS 
    'Composite index for comprehensive user search pattern analysis - filters by user_id and query, orders by timestamp DESC';

COMMENT ON INDEX idx_search_logs_user_execution IS 
    'Composite index for query performance by user - filters by user_id, orders by execution_time DESC and timestamp DESC';

-- ============================================================================
-- Index Statistics and Verification
-- ============================================================================
DO $$
DECLARE
    index_record RECORD;
    index_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=== search_logs Index Optimization Summary ===';
    RAISE NOTICE '';
    
    -- List all indexes on search_logs table
    FOR index_record IN 
        SELECT 
            indexname,
            indexdef
        FROM pg_indexes
        WHERE tablename = 'search_logs'
        ORDER BY indexname
    LOOP
        index_count := index_count + 1;
        RAISE NOTICE 'Index %: %', index_count, index_record.indexname;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Total indexes on search_logs: %', index_count;
    RAISE NOTICE '===========================================';
END $$;

-- ============================================================================
-- Performance Recommendations
-- ============================================================================
-- The following composite indexes have been created to optimize common query patterns:
--
-- 1. idx_search_logs_user_timestamp
--    - Best for: User search history, user behavior analytics
--    - Query example: SELECT * FROM search_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT 10
--
-- 2. idx_search_logs_query_timestamp
--    - Best for: Trending searches, search popularity metrics
--    - Query example: SELECT query, COUNT(*) FROM search_logs WHERE timestamp > ? GROUP BY query ORDER BY COUNT DESC
--
-- 3. idx_search_logs_execution_time
--    - Best for: Slow query detection, performance optimization
--    - Query example: SELECT * FROM search_logs ORDER BY execution_time DESC LIMIT 100
--
-- 4. idx_search_logs_results_count
--    - Best for: Zero-result searches, search effectiveness
--    - Query example: SELECT * FROM search_logs WHERE results_count = 0 ORDER BY timestamp DESC
--
-- 5. idx_search_logs_timestamp_user
--    - Best for: Time-based aggregation reports
--    - Query example: SELECT user_id, COUNT(*) FROM search_logs WHERE timestamp > ? GROUP BY user_id
--
-- 6. idx_search_logs_filters
--    - Best for: Filter usage pattern analysis
--    - Query example: SELECT * FROM search_logs WHERE filters @> '{"category": "electronics"}'
--
-- 7. idx_search_logs_ip_timestamp
--    - Best for: Bot detection, security analysis
--    - Query example: SELECT * FROM search_logs WHERE ip_address = ? ORDER BY timestamp DESC
--
-- 8. idx_search_logs_user_agent_timestamp
--    - Best for: Device-specific search optimization
--    - Query example: SELECT * FROM search_logs WHERE user_agent LIKE '%Mobile%' ORDER BY timestamp DESC
--
-- 9. idx_search_logs_user_query_timestamp
--    - Best for: User journey analysis, search session tracking
--    - Query example: SELECT * FROM search_logs WHERE user_id = ? AND query = ? ORDER BY timestamp DESC
--
-- 10. idx_search_logs_user_execution
--     - Best for: Personalized search performance metrics
--     - Query example: SELECT AVG(execution_time) FROM search_logs WHERE user_id = ? GROUP BY user_id
--
-- Maintenance Notes:
-- - These indexes will increase storage requirements but significantly improve query performance
-- - Consider running ANALYZE search_logs after large data imports to update index statistics
-- - Monitor index usage with pg_stat_user_indexes to identify unused indexes
-- - For very large tables, consider partitioning by timestamp for better performance
-- ============================================================================

-- ============================================================================
-- Migration completed successfully
-- ============================================================================
-- This migration is non-destructive and can be run multiple times safely
-- All existing data is preserved
-- All existing indexes remain unchanged
-- ============================================================================
