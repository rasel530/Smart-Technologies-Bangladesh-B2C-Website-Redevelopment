-- Cleanup backup tables
-- This script removes temporary backup tables created during schema migrations

-- Drop backup table 1
DROP TABLE IF EXISTS product_images_backup_20260128020128;

-- Drop backup table 2
DROP TABLE IF EXISTS product_images_backup_20260128050134;

-- Verify cleanup
SELECT 
  'Backup tables cleanup completed' AS status,
  COUNT(*) AS remaining_backup_tables
FROM information_schema.tables 
WHERE table_name LIKE 'product_images_backup_%';
