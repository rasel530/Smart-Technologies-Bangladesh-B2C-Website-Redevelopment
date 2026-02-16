-- Fix the invalid user ID by replacing it with a valid UUID
BEGIN;

-- Generate a new valid UUID for the test-superadmin-001 user
UPDATE users SET id = gen_random_uuid() WHERE id = 'test-superadmin-001';

COMMIT;
