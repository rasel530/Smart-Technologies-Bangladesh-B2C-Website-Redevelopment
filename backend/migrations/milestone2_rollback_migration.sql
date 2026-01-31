-- Rollback: Remove SearchLog table for Phase 4 Milestone 2
-- Created: 2026-01-27
-- Purpose: Rollback search analytics tracking

-- 1. Drop SearchLog table and indexes
-- Note: CASCADE will also drop dependent objects if any
DROP TABLE IF EXISTS search_logs CASCADE;

-- 2. This migration only removes the new table, no modifications to existing tables
-- All existing data and tables remain intact

-- Verification queries after rollback:
-- SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'search_logs';
-- Should return 0 rows
