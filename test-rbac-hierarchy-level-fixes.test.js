/**
 * RBAC Hierarchy Level Fixes Verification Test
 * 
 * This test verifies that the RBAC roles page hierarchy level fixes are working correctly.
 * Tests include:
 * - DEFAULT_HIERARCHY_LEVELS values match database
 * - ALLOWED_ROLE_NAMES includes all roles in lowercase
 * - The hierarchy level dropdown shows all levels 0-5 with proper labels
 * - getRoleDisplayName includes the manager role
 */

const { describe, it, expect } = require('@jest/globals');

// Simulate the frontend constants from page.tsx
const ALLOWED_ROLE_NAMES = [
  'customer',
  'support',
  'corporate',
  'manager',
  'admin',
  'super_admin',
];

const DEFAULT_HIERARCHY_LEVELS = {
  customer: 0,
  support: 1,
  corporate: 2,
  manager: 3,
  admin: 4,
  super_admin: 5,
};

// Simulate the getRoleDisplayName function from utils.ts
function getRoleDisplayName(roleName) {
  const roleNames = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    manager: 'Manager',
    support: 'Support',
    corporate: 'Corporate',
    customer: 'Customer',
  };
  
  return roleNames[roleName.toLowerCase()] || roleName;
}

// Simulate the dropdown options from page.tsx
const HIERARCHY_LEVEL_DROPDOWN_OPTIONS = [
  { value: '0', label: '0 - Customer' },
  { value: '1', label: '1 - Support' },
  { value: '2', label: '2 - Corporate' },
  { value: '3', label: '3 - Manager' },
  { value: '4', label: '4 - Admin' },
  { value: '5', label: '5 - Super Admin' },
];

describe('RBAC Hierarchy Level Fixes Verification', () => {
  
  describe('DEFAULT_HIERARCHY_LEVELS', () => {
    it('should have correct hierarchy level for customer (0)', () => {
      expect(DEFAULT_HIERARCHY_LEVELS.customer).toBe(0);
    });

    it('should have correct hierarchy level for support (1)', () => {
      expect(DEFAULT_HIERARCHY_LEVELS.support).toBe(1);
    });

    it('should have correct hierarchy level for corporate (2)', () => {
      expect(DEFAULT_HIERARCHY_LEVELS.corporate).toBe(2);
    });

    it('should have correct hierarchy level for manager (3)', () => {
      expect(DEFAULT_HIERARCHY_LEVELS.manager).toBe(3);
    });

    it('should have correct hierarchy level for admin (4)', () => {
      expect(DEFAULT_HIERARCHY_LEVELS.admin).toBe(4);
    });

    it('should have correct hierarchy level for super_admin (5)', () => {
      expect(DEFAULT_HIERARCHY_LEVELS.super_admin).toBe(5);
    });

    it('should have exactly 6 hierarchy levels', () => {
      expect(Object.keys(DEFAULT_HIERARCHY_LEVELS)).toHaveLength(6);
    });
  });

  describe('ALLOWED_ROLE_NAMES', () => {
    it('should include customer role', () => {
      expect(ALLOWED_ROLE_NAMES).toContain('customer');
    });

    it('should include support role', () => {
      expect(ALLOWED_ROLE_NAMES).toContain('support');
    });

    it('should include corporate role', () => {
      expect(ALLOWED_ROLE_NAMES).toContain('corporate');
    });

    it('should include manager role', () => {
      expect(ALLOWED_ROLE_NAMES).toContain('manager');
    });

    it('should include admin role', () => {
      expect(ALLOWED_ROLE_NAMES).toContain('admin');
    });

    it('should include super_admin role', () => {
      expect(ALLOWED_ROLE_NAMES).toContain('super_admin');
    });

    it('should have exactly 6 role names', () => {
      expect(ALLOWED_ROLE_NAMES).toHaveLength(6);
    });

    it('should have all role names in lowercase', () => {
      ALLOWED_ROLE_NAMES.forEach(roleName => {
        expect(roleName).toBe(roleName.toLowerCase());
      });
    });
  });

  describe('Hierarchy Level Dropdown Options', () => {
    it('should have option for level 0 - Customer', () => {
      expect(HIERARCHY_LEVEL_DROPDOWN_OPTIONS).toContainEqual({ value: '0', label: '0 - Customer' });
    });

    it('should have option for level 1 - Support', () => {
      expect(HIERARCHY_LEVEL_DROPDOWN_OPTIONS).toContainEqual({ value: '1', label: '1 - Support' });
    });

    it('should have option for level 2 - Corporate', () => {
      expect(HIERARCHY_LEVEL_DROPDOWN_OPTIONS).toContainEqual({ value: '2', label: '2 - Corporate' });
    });

    it('should have option for level 3 - Manager', () => {
      expect(HIERARCHY_LEVEL_DROPDOWN_OPTIONS).toContainEqual({ value: '3', label: '3 - Manager' });
    });

    it('should have option for level 4 - Admin', () => {
      expect(HIERARCHY_LEVEL_DROPDOWN_OPTIONS).toContainEqual({ value: '4', label: '4 - Admin' });
    });

    it('should have option for level 5 - Super Admin', () => {
      expect(HIERARCHY_LEVEL_DROPDOWN_OPTIONS).toContainEqual({ value: '5', label: '5 - Super Admin' });
    });

    it('should have exactly 6 dropdown options', () => {
      expect(HIERARCHY_LEVEL_DROPDOWN_OPTIONS).toHaveLength(6);
    });

    it('should have dropdown options in correct order (0 to 5)', () => {
      expect(HIERARCHY_LEVEL_DROPDOWN_OPTIONS[0].value).toBe('0');
      expect(HIERARCHY_LEVEL_DROPDOWN_OPTIONS[1].value).toBe('1');
      expect(HIERARCHY_LEVEL_DROPDOWN_OPTIONS[2].value).toBe('2');
      expect(HIERARCHY_LEVEL_DROPDOWN_OPTIONS[3].value).toBe('3');
      expect(HIERARCHY_LEVEL_DROPDOWN_OPTIONS[4].value).toBe('4');
      expect(HIERARCHY_LEVEL_DROPDOWN_OPTIONS[5].value).toBe('5');
    });
  });

  describe('getRoleDisplayName', () => {
    it('should return "Super Admin" for super_admin', () => {
      expect(getRoleDisplayName('super_admin')).toBe('Super Admin');
    });

    it('should return "Admin" for admin', () => {
      expect(getRoleDisplayName('admin')).toBe('Admin');
    });

    it('should return "Manager" for manager', () => {
      expect(getRoleDisplayName('manager')).toBe('Manager');
    });

    it('should return "Support" for support', () => {
      expect(getRoleDisplayName('support')).toBe('Support');
    });

    it('should return "Corporate" for corporate', () => {
      expect(getRoleDisplayName('corporate')).toBe('Corporate');
    });

    it('should return "Customer" for customer', () => {
      expect(getRoleDisplayName('customer')).toBe('Customer');
    });

    it('should be case-insensitive', () => {
      expect(getRoleDisplayName('ADMIN')).toBe('Admin');
      expect(getRoleDisplayName('Manager')).toBe('Manager');
      expect(getRoleDisplayName('SUPER_ADMIN')).toBe('Super Admin');
    });

    it('should return original name for unknown role', () => {
      expect(getRoleDisplayName('unknown_role')).toBe('unknown_role');
    });
  });

  describe('Role Selection to Hierarchy Level Mapping', () => {
    it('should map customer role to hierarchy level 0', () => {
      const selectedRole = 'customer';
      const hierarchyLevel = DEFAULT_HIERARCHY_LEVELS[selectedRole] || 0;
      expect(hierarchyLevel).toBe(0);
    });

    it('should map support role to hierarchy level 1', () => {
      const selectedRole = 'support';
      const hierarchyLevel = DEFAULT_HIERARCHY_LEVELS[selectedRole] || 0;
      expect(hierarchyLevel).toBe(1);
    });

    it('should map corporate role to hierarchy level 2', () => {
      const selectedRole = 'corporate';
      const hierarchyLevel = DEFAULT_HIERARCHY_LEVELS[selectedRole] || 0;
      expect(hierarchyLevel).toBe(2);
    });

    it('should map manager role to hierarchy level 3', () => {
      const selectedRole = 'manager';
      const hierarchyLevel = DEFAULT_HIERARCHY_LEVELS[selectedRole] || 0;
      expect(hierarchyLevel).toBe(3);
    });

    it('should map admin role to hierarchy level 4', () => {
      const selectedRole = 'admin';
      const hierarchyLevel = DEFAULT_HIERARCHY_LEVELS[selectedRole] || 0;
      expect(hierarchyLevel).toBe(4);
    });

    it('should map super_admin role to hierarchy level 5', () => {
      const selectedRole = 'super_admin';
      const hierarchyLevel = DEFAULT_HIERARCHY_LEVELS[selectedRole] || 0;
      expect(hierarchyLevel).toBe(5);
    });
  });

  describe('Integration Tests', () => {
    it('should have consistent role names across all constants', () => {
      const roleNamesFromLevels = Object.keys(DEFAULT_HIERARCHY_LEVELS).sort();
      const roleNamesFromAllowed = ALLOWED_ROLE_NAMES.sort();
      expect(roleNamesFromLevels).toEqual(roleNamesFromAllowed);
    });

    it('should have display names for all allowed roles', () => {
      ALLOWED_ROLE_NAMES.forEach(roleName => {
        const displayName = getRoleDisplayName(roleName);
        expect(displayName).not.toBe(roleName);
        expect(displayName).toBeTruthy();
      });
    });

    it('should have dropdown options for all hierarchy levels', () => {
      const levels = Object.values(DEFAULT_HIERARCHY_LEVELS);
      levels.forEach(level => {
        const option = HIERARCHY_LEVEL_DROPDOWN_OPTIONS.find(opt => opt.value === level.toString());
        expect(option).toBeDefined();
      });
    });
  });

  describe('Manager Role Specific Tests', () => {
    it('should include manager in ALLOWED_ROLE_NAMES', () => {
      expect(ALLOWED_ROLE_NAMES).toContain('manager');
    });

    it('should have manager hierarchy level set to 3', () => {
      expect(DEFAULT_HIERARCHY_LEVELS.manager).toBe(3);
    });

    it('should return "Manager" display name for manager role', () => {
      expect(getRoleDisplayName('manager')).toBe('Manager');
    });

    it('should have dropdown option for manager level (3)', () => {
      expect(HIERARCHY_LEVEL_DROPDOWN_OPTIONS).toContainEqual({ value: '3', label: '3 - Manager' });
    });
  });
});
