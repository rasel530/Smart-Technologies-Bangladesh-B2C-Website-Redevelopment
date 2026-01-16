import { rbacApi } from '../api/rbac';
import { Role, Permission, UserRole } from '@/types/rbac';

/**
 * RBAC Utility Functions
 * 
 * Provides helper functions for checking user roles, permissions,
 * and role hierarchy levels.
 */

// Cache for user roles and permissions
let cachedRoles: Role[] | null = null;
let cachedPermissions: Permission[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Clear cached RBAC data
 */
export const clearRBACCache = (): void => {
  cachedRoles = null;
  cachedPermissions = null;
  cacheTimestamp = 0;
};

/**
 * Check if cache is valid
 */
const isCacheValid = (): boolean => {
  return Date.now() - cacheTimestamp < CACHE_DURATION;
};

/**
 * Get user roles from API
 * @param userId - User ID (optional, defaults to current user)
 * @returns Array of user roles
 */
export const getUserRoles = async (userId?: string): Promise<UserRole[]> => {
  try {
    const response = await rbacApi.authCheck.getRoles();
    return response.data || [];
  } catch (error) {
    console.error('[RBAC Utils] Error fetching user roles:', error);
    return [];
  }
};

/**
 * Get user permissions from API
 * @returns Array of user permissions
 */
export const getUserPermissions = async (): Promise<Permission[]> => {
  try {
    const response = await rbacApi.authCheck.getPermissions();
    return response.data || [];
  } catch (error) {
    console.error('[RBAC Utils] Error fetching user permissions:', error);
    return [];
  }
};

/**
 * Check if user has specific permission
 * @param permissionName - Permission name to check (e.g., 'user:create')
 * @returns Promise<boolean> - True if user has permission
 */
export const userHasPermission = async (permissionName: string): Promise<boolean> => {
  try {
    const response = await rbacApi.authCheck.hasPermission(permissionName);
    return response.hasPermission || false;
  } catch (error) {
    console.error('[RBAC Utils] Error checking permission:', error);
    return false;
  }
};

/**
 * Check if user has any of the specified permissions
 * @param permissionNames - Array of permission names
 * @returns Promise<boolean> - True if user has any permission
 */
export const userHasAnyPermission = async (permissionNames: string[]): Promise<boolean> => {
  try {
    const response = await rbacApi.authCheck.checkPermissions(permissionNames, 'any');
    return response.hasPermissions || false;
  } catch (error) {
    console.error('[RBAC Utils] Error checking permissions:', error);
    return false;
  }
};

/**
 * Check if user has all of the specified permissions
 * @param permissionNames - Array of permission names
 * @returns Promise<boolean> - True if user has all permissions
 */
export const userHasAllPermissions = async (permissionNames: string[]): Promise<boolean> => {
  try {
    const response = await rbacApi.authCheck.checkPermissions(permissionNames, 'all');
    return response.hasPermissions || false;
  } catch (error) {
    console.error('[RBAC Utils] Error checking permissions:', error);
    return false;
  }
};

/**
 * Check if user has specific role
 * @param roleName - Role name to check (e.g., 'admin')
 * @returns Promise<boolean> - True if user has role
 */
export const userHasRole = async (roleName: string): Promise<boolean> => {
  try {
    const roles = await getUserRoles();
    return roles.some(
      (userRole) => userRole.role?.name?.toLowerCase() === roleName.toLowerCase() && userRole.isActive
    );
  } catch (error) {
    console.error('[RBAC Utils] Error checking user role:', error);
    return false;
  }
};

/**
 * Check if user has any of the specified roles
 * @param roleNames - Array of role names
 * @returns Promise<boolean> - True if user has any role
 */
export const userHasAnyRole = async (roleNames: string[]): Promise<boolean> => {
  try {
    const roles = await getUserRoles();
    const normalizedRoleNames = roleNames.map((name) => name.toLowerCase());
    return roles.some(
      (userRole) =>
        userRole.role?.name &&
        normalizedRoleNames.includes(userRole.role.name.toLowerCase()) &&
        userRole.isActive
    );
  } catch (error) {
    console.error('[RBAC Utils] Error checking user roles:', error);
    return false;
  }
};

/**
 * Check if user meets minimum role level
 * @param level - Minimum hierarchy level required
 * @returns Promise<boolean> - True if user meets minimum level
 */
export const userHasMinimumRoleLevel = async (level: number): Promise<boolean> => {
  try {
    const response = await rbacApi.authCheck.getRoleLevel();
    return (response.roleLevel || 0) >= level;
  } catch (error) {
    console.error('[RBAC Utils] Error checking role level:', error);
    return false;
  }
};

/**
 * Get user's maximum role hierarchy level
 * @returns Promise<number> - Maximum role level
 */
export const getUserMaxRoleLevel = async (): Promise<number> => {
  try {
    const response = await rbacApi.authCheck.getRoleLevel();
    return response.roleLevel || 0;
  } catch (error) {
    console.error('[RBAC Utils] Error getting role level:', error);
    return 0;
  }
};

/**
 * Check if current user can assign a specific role
 * @param roleName - Role name to check
 * @returns Promise<boolean> - True if user can assign role
 */
export const canAssignRole = async (roleName: string): Promise<boolean> => {
  try {
    const response = await rbacApi.authCheck.canAssignRole(roleName);
    return response.canAssign || false;
  } catch (error) {
    console.error('[RBAC Utils] Error checking role assignment:', error);
    return false;
  }
};

/**
 * Get all available roles (with caching)
 * @returns Promise<Role[]> - Array of all roles
 */
export const getAllRoles = async (): Promise<Role[]> => {
  if (cachedRoles && isCacheValid()) {
    return cachedRoles;
  }

  try {
    const response = await rbacApi.roles.list();
    cachedRoles = response.data || [];
    cacheTimestamp = Date.now();
    return cachedRoles;
  } catch (error) {
    console.error('[RBAC Utils] Error fetching roles:', error);
    return [];
  }
};

/**
 * Get all available permissions (with caching)
 * @returns Promise<Permission[]> - Array of all permissions
 */
export const getAllPermissions = async (): Promise<Permission[]> => {
  if (cachedPermissions && isCacheValid()) {
    return cachedPermissions;
  }

  try {
    const response = await rbacApi.permissions.list();
    cachedPermissions = response.data || [];
    cacheTimestamp = Date.now();
    return cachedPermissions;
  } catch (error) {
    console.error('[RBAC Utils] Error fetching permissions:', error);
    return [];
  }
};

/**
 * Get permissions grouped by resource
 * @returns Promise<Record<string, Permission[]>> - Permissions grouped by resource
 */
export const getPermissionsByResource = async (): Promise<Record<string, Permission[]>> => {
  try {
    const permissions = await getAllPermissions();
    const grouped: Record<string, Permission[]> = {};
    
    permissions.forEach((permission) => {
      if (!grouped[permission.resource]) {
        grouped[permission.resource] = [];
      }
      grouped[permission.resource].push(permission);
    });

    return grouped;
  } catch (error) {
    console.error('[RBAC Utils] Error grouping permissions:', error);
    return {};
  }
};

/**
 * Get all unique resource categories
 * @returns Promise<string[]> - Array of resource names
 */
export const getResourceCategories = async (): Promise<string[]> => {
  try {
    const response = await rbacApi.permissions.getResources();
    return response.data || [];
  } catch (error) {
    console.error('[RBAC Utils] Error fetching resource categories:', error);
    return [];
  }
};

/**
 * Get role hierarchy
 * @returns Promise<Role[]> - Roles sorted by hierarchy level
 */
export const getRoleHierarchy = async (): Promise<Role[]> => {
  try {
    const response = await rbacApi.roles.getHierarchy();
    // Extract roles from hierarchy objects
    return response.data.map((hierarchy) => hierarchy.role) || [];
  } catch (error) {
    console.error('[RBAC Utils] Error fetching role hierarchy:', error);
    return [];
  }
};

/**
 * Check if user is admin
 * @returns Promise<boolean> - True if user has admin or super_admin role
 */
export const isAdmin = async (): Promise<boolean> => {
  return await userHasAnyRole(['admin', 'super_admin']);
};

/**
 * Check if user is super admin
 * @returns Promise<boolean> - True if user has super_admin role
 */
export const isSuperAdmin = async (): Promise<boolean> => {
  return await userHasRole('super_admin');
};

/**
 * Check if user has support access
 * @returns Promise<boolean> - True if user has support, admin, or super_admin role
 */
export const hasSupportAccess = async (): Promise<boolean> => {
  return await userHasAnyRole(['support', 'admin', 'super_admin']);
};

/**
 * Check if user has corporate access
 * @returns Promise<boolean> - True if user has corporate, admin, or super_admin role
 */
export const hasCorporateAccess = async (): Promise<boolean> => {
  return await userHasAnyRole(['corporate', 'admin', 'super_admin']);
};

/**
 * Format permission name for display
 * @param permissionName - Permission name (e.g., 'user:create')
 * @returns Formatted string (e.g., 'User: Create')
 */
export const formatPermissionName = (permissionName: string): string => {
  const [resource, action] = permissionName.split(':');
  if (!resource || !action) return permissionName;
  
  const formattedResource = resource.charAt(0).toUpperCase() + resource.slice(1);
  const formattedAction = action.charAt(0).toUpperCase() + action.slice(1);
  
  return `${formattedResource}: ${formattedAction}`;
};

/**
 * Get role display name
 * @param roleName - Role name (e.g., 'super_admin')
 * @returns Formatted display name (e.g., 'Super Admin')
 */
export const getRoleDisplayName = (roleName: string): string => {
  const roleNames: Record<string, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    support: 'Support',
    corporate: 'Corporate',
    customer: 'Customer',
  };
  
  return roleNames[roleName.toLowerCase()] || roleName;
};

/**
 * Get role hierarchy level
 * @param roleName - Role name
 * @returns Hierarchy level or 0 if not found
 */
export const getRoleLevel = async (roleName: string): Promise<number> => {
  try {
    const roles = await getAllRoles();
    const role = roles.find((r) => r.name.toLowerCase() === roleName.toLowerCase());
    return role?.hierarchy_level || 0;
  } catch (error) {
    console.error('[RBAC Utils] Error getting role level:', error);
    return 0;
  }
};

/**
 * Compare two role levels
 * @param role1Name - First role name
 * @param role2Name - Second role name
 * @returns Promise<number> - 1 if role1 > role2, -1 if role1 < role2, 0 if equal
 */
export const compareRoleLevels = async (role1Name: string, role2Name: string): Promise<number> => {
  const level1 = await getRoleLevel(role1Name);
  const level2 = await getRoleLevel(role2Name);
  
  if (level1 > level2) return 1;
  if (level1 < level2) return -1;
  return 0;
};

// Export all utility functions
export default {
  getUserRoles,
  getUserPermissions,
  userHasPermission,
  userHasAnyPermission,
  userHasAllPermissions,
  userHasRole,
  userHasAnyRole,
  userHasMinimumRoleLevel,
  getUserMaxRoleLevel,
  canAssignRole,
  getAllRoles,
  getAllPermissions,
  getPermissionsByResource,
  getResourceCategories,
  getRoleHierarchy,
  isAdmin,
  isSuperAdmin,
  hasSupportAccess,
  hasCorporateAccess,
  formatPermissionName,
  getRoleDisplayName,
  getRoleLevel,
  compareRoleLevels,
  clearRBACCache,
};
