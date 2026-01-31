-- Fix failed migration blocking issue
-- This script marks the failed migration as resolved

-- Mark the failed migration as successfully applied
UPDATE _prisma_migrations
SET finished_at = NOW(),
    applied_steps_count = 1,
    logs = 'Manually resolved - categoryId column already removed'
WHERE migration_name = '20260126190700_remove_categoryid_from_products';

-- Verify the fix
SELECT migration_name, started_at, finished_at, applied_steps_count, logs
FROM _prisma_migrations
WHERE migration_name = '20260126190700_remove_categoryid_from_products';
