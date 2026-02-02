-- Query to get all tables and their row counts
SELECT 
    schemaname,
    relname as tablename,
    n_live_tup as live_rows
FROM pg_stat_user_tables
ORDER BY relname;
