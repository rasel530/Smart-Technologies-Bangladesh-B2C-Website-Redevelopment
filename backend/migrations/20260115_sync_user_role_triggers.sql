-- ============================================
-- RBAC USER ROLE SYNC TRIGGERS
-- ============================================
-- This migration creates triggers to automatically synchronize the legacy
-- users.role column with the RBAC user_roles table to prevent access control
-- issues when roles are assigned/changed.
-- ============================================

-- ============================================
-- 1. CREATE FUNCTION TO UPDATE USER LEGACY ROLE
-- ============================================
-- This function updates the users.role column based on highest-level
-- RBAC role assigned to the user. If no active RBAC role exists, defaults to 'customer'.
CREATE OR REPLACE FUNCTION sync_user_legacy_role()
RETURNS TRIGGER AS $$
DECLARE
  v_highest_role_name VARCHAR(50);
  v_legacy_role VARCHAR(20);
BEGIN
  -- Get the highest hierarchy_level role for the affected user
  -- Only consider active roles that haven't expired
  SELECT r.name INTO v_highest_role_name
  FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  WHERE ur.user_id = COALESCE(NEW.user_id, OLD.user_id)
    AND ur.is_active = TRUE
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  ORDER BY r.hierarchy_level DESC
  LIMIT 1;

  -- Map RBAC role name to legacy UserRole enum
  IF v_highest_role_name IS NOT NULL THEN
    v_legacy_role := LOWER(v_highest_role_name);
  ELSE
    -- Default to customer if no active RBAC role exists
    v_legacy_role := 'customer';
  END IF;

  -- Update the users.role column
  UPDATE users
  SET role = v_legacy_role::"UserRole"
  WHERE id = COALESCE(NEW.user_id, OLD.user_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. CREATE TRIGGER FOR INSERT ON user_roles
-- ============================================
-- Automatically update users.role when a new role is assigned
DROP TRIGGER IF EXISTS trigger_sync_user_role_insert ON user_roles;
CREATE TRIGGER trigger_sync_user_role_insert
  AFTER INSERT ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_legacy_role();

-- ============================================
-- 3. CREATE TRIGGER FOR UPDATE ON user_roles
-- ============================================
-- Automatically update users.role when a role assignment is changed
DROP TRIGGER IF EXISTS trigger_sync_user_role_update ON user_roles;
CREATE TRIGGER trigger_sync_user_role_update
  AFTER UPDATE ON user_roles
  FOR EACH ROW
  WHEN (
    OLD.role_id IS DISTINCT FROM NEW.role_id OR
    OLD.is_active IS DISTINCT FROM NEW.is_active OR
    OLD.expires_at IS DISTINCT FROM NEW.expires_at
  )
  EXECUTE FUNCTION sync_user_legacy_role();

-- ============================================
-- 4. CREATE TRIGGER FOR DELETE ON user_roles
-- ============================================
-- Automatically update users.role when a role is removed
DROP TRIGGER IF EXISTS trigger_sync_user_role_delete ON user_roles;
CREATE TRIGGER trigger_sync_user_role_delete
  AFTER DELETE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_legacy_role();

-- ============================================
-- 5. CREATE FUNCTION TO SYNC ALL USERS (ONE-TIME FIX)
-- ============================================
-- This function can be called to synchronize all existing users
CREATE OR REPLACE FUNCTION sync_all_user_legacy_roles()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_update_count INTEGER;
BEGIN
  -- Update all users with their highest RBAC role
  UPDATE users u
  SET role = (
    SELECT LOWER(r.name)::"UserRole"
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = u.id
      AND ur.is_active = TRUE
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    ORDER BY r.hierarchy_level DESC
    LIMIT 1
  )
  WHERE EXISTS (
    SELECT 1 FROM user_roles ur2
    WHERE ur2.user_id = u.id
      AND ur2.is_active = TRUE
      AND (ur2.expires_at IS NULL OR ur2.expires_at > NOW())
  );

  GET DIAGNOSTICS v_update_count = ROW_COUNT;
  v_count := v_count + v_update_count;

  -- Set remaining users without active RBAC roles to 'customer'
  UPDATE users
  SET role = 'customer'::"UserRole"
  WHERE role IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = users.id
        AND ur.is_active = TRUE
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    );

  GET DIAGNOSTICS v_update_count = ROW_COUNT;
  v_count := v_count + v_update_count;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. ONE-TIME SYNC OF EXISTING USERS
-- ============================================
-- Execute the sync function to fix any existing mismatches
-- Comment this out if you want to run it manually
SELECT sync_all_user_legacy_roles() AS users_synced;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Summary:
-- - Created sync_user_legacy_role() function to update users.role based on RBAC
-- - Created INSERT trigger on user_roles table
-- - Created UPDATE trigger on user_roles table (with conditions)
-- - Created DELETE trigger on user_roles table
-- - Created sync_all_user_legacy_roles() function for one-time fix
-- - Executed one-time sync of all existing users
--
-- Role Mapping (RBAC -> Legacy):
-- - CUSTOMER -> customer
-- - CORPORATE -> corporate
-- - SUPPORT -> support
-- - ADMIN -> admin
-- - SUPER_ADMIN -> super_admin
--
-- Default: customer (when no active RBAC role exists)
-- ============================================
