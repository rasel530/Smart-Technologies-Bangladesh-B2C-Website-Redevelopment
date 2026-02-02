-- ============================================================================
-- Non-Destructive Migration Script for search_logs Table
-- Phase 5 Milestone 2 - Search Functionality
-- ============================================================================
-- Purpose: Verify and ensure search_logs table exists with all required
--          columns, indexes, and constraints without destroying existing data
--
-- IMPORTANT: This script is NON-DESTRUCTIVE
-- - Uses CREATE TABLE IF NOT EXISTS
-- - Uses ALTER TABLE ... ADD COLUMN IF NOT EXISTS
-- - Uses CREATE INDEX IF NOT EXISTS
-- - Zero data loss guaranteed
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- Create search_logs table if it doesn't exist
-- ============================================================================
CREATE TABLE IF NOT EXISTS search_logs (
    -- Primary key with UUID generation
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Search query (required field)
    query VARCHAR(255) NOT NULL,
    
    -- User reference (optional, allows anonymous searches)
    user_id VARCHAR(255),
    
    -- Search metrics
    results_count INTEGER DEFAULT 0,
    execution_time FLOAT DEFAULT 0,
    
    -- Search filters stored as JSONB for flexibility
    filters JSONB DEFAULT '{}',
    
    -- Client information for analytics
    ip_address VARCHAR(50),
    user_agent VARCHAR(500),
    
    -- Timestamp for tracking when search was performed
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraint to users table
    -- ON DELETE SET NULL ensures search logs are preserved even if user is deleted
    CONSTRAINT fk_search_logs_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE SET NULL
);

-- ============================================================================
-- Add columns if they don't exist (non-destructive)
-- ============================================================================

-- Add id column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'search_logs' 
        AND column_name = 'id'
    ) THEN
        ALTER TABLE search_logs ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();
        RAISE NOTICE 'Added id column to search_logs table';
    END IF;
END $$;

-- Add query column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'search_logs' 
        AND column_name = 'query'
    ) THEN
        ALTER TABLE search_logs ADD COLUMN query VARCHAR(255) NOT NULL;
        RAISE NOTICE 'Added query column to search_logs table';
    END IF;
END $$;

-- Add user_id column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'search_logs' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE search_logs ADD COLUMN user_id VARCHAR(255);
        RAISE NOTICE 'Added user_id column to search_logs table';
    END IF;
END $$;

-- Add results_count column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'search_logs' 
        AND column_name = 'results_count'
    ) THEN
        ALTER TABLE search_logs ADD COLUMN results_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added results_count column to search_logs table';
    END IF;
END $$;

-- Add execution_time column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'search_logs' 
        AND column_name = 'execution_time'
    ) THEN
        ALTER TABLE search_logs ADD COLUMN execution_time FLOAT DEFAULT 0;
        RAISE NOTICE 'Added execution_time column to search_logs table';
    END IF;
END $$;

-- Add filters column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'search_logs' 
        AND column_name = 'filters'
    ) THEN
        ALTER TABLE search_logs ADD COLUMN filters JSONB DEFAULT '{}';
        RAISE NOTICE 'Added filters column to search_logs table';
    END IF;
END $$;

-- Add ip_address column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'search_logs' 
        AND column_name = 'ip_address'
    ) THEN
        ALTER TABLE search_logs ADD COLUMN ip_address VARCHAR(50);
        RAISE NOTICE 'Added ip_address column to search_logs table';
    END IF;
END $$;

-- Add user_agent column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'search_logs' 
        AND column_name = 'user_agent'
    ) THEN
        ALTER TABLE search_logs ADD COLUMN user_agent VARCHAR(500);
        RAISE NOTICE 'Added user_agent column to search_logs table';
    END IF;
END $$;

-- Add timestamp column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'search_logs' 
        AND column_name = 'timestamp'
    ) THEN
        ALTER TABLE search_logs ADD COLUMN timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added timestamp column to search_logs table';
    END IF;
END $$;

-- ============================================================================
-- Add foreign key constraint if it doesn't exist
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'search_logs' 
        AND constraint_name = 'fk_search_logs_user'
    ) THEN
        ALTER TABLE search_logs 
        ADD CONSTRAINT fk_search_logs_user 
            FOREIGN KEY (user_id) 
            REFERENCES users(id) 
            ON DELETE SET NULL;
        RAISE NOTICE 'Added fk_search_logs_user constraint to search_logs table';
    END IF;
END $$;

-- ============================================================================
-- Create required indexes if they don't exist
-- ============================================================================

-- Index on user_id for user analytics queries
CREATE INDEX IF NOT EXISTS idx_search_logs_user_id 
    ON search_logs(user_id);

-- Index on timestamp for time-based analytics
CREATE INDEX IF NOT EXISTS idx_search_logs_timestamp 
    ON search_logs(timestamp);

-- Index on query for search pattern analysis
CREATE INDEX IF NOT EXISTS idx_search_logs_query 
    ON search_logs(query);

-- ============================================================================
-- Add comments for documentation
-- ============================================================================
COMMENT ON TABLE search_logs IS 'Stores search query logs for analytics and performance monitoring';
COMMENT ON COLUMN search_logs.id IS 'Unique identifier for each search log entry';
COMMENT ON COLUMN search_logs.query IS 'The search query string entered by the user';
COMMENT ON COLUMN search_logs.user_id IS 'Reference to the user who performed the search (nullable for anonymous searches)';
COMMENT ON COLUMN search_logs.results_count IS 'Number of results returned for the search query';
COMMENT ON COLUMN search_logs.execution_time IS 'Time taken to execute the search query in milliseconds';
COMMENT ON COLUMN search_logs.filters IS 'JSONB object storing applied search filters (category, price range, etc.)';
COMMENT ON COLUMN search_logs.ip_address IS 'IP address of the user for analytics and security';
COMMENT ON COLUMN search_logs.user_agent IS 'User agent string for analytics and device detection';
COMMENT ON COLUMN search_logs.timestamp IS 'Timestamp when the search was performed';
COMMENT ON INDEX idx_search_logs_user_id IS 'Index for user-based search analytics queries';
COMMENT ON INDEX idx_search_logs_timestamp IS 'Index for time-based search analytics queries';
COMMENT ON INDEX idx_search_logs_query IS 'Index for search pattern and popular query analysis';

-- ============================================================================
-- Verification output
-- ============================================================================
DO $$
DECLARE
    table_exists BOOLEAN;
    column_count INTEGER;
    index_count INTEGER;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'search_logs'
    ) INTO table_exists;
    
    -- Count columns
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_name = 'search_logs';
    
    -- Count indexes
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE tablename = 'search_logs';
    
    RAISE NOTICE '=== search_logs Table Verification ===';
    RAISE NOTICE 'Table exists: %', table_exists;
    RAISE NOTICE 'Column count: %', column_count;
    RAISE NOTICE 'Index count: %', index_count;
    RAISE NOTICE '====================================';
END $$;

-- ============================================================================
-- Migration completed successfully
-- ============================================================================
-- This migration is non-destructive and can be run multiple times safely
-- All existing data is preserved
-- ============================================================================
