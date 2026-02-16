-- Check for invalid UUID references in wishlist tables
SELECT 'wishlists' as table_name, COUNT(*) as count FROM wishlists WHERE "userId" = 'test-superadmin-001'
UNION ALL
SELECT 'wishlist_analytics' as table_name, COUNT(*) as count FROM wishlist_analytics WHERE "userId" = 'test-superadmin-001';
