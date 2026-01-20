-- Verify permission tables after migration
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('permission', 'permissions')
ORDER BY table_name;
