import { apiClient } from './client';

export interface Role {
  value: string;
  label: string;
  description: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string | null;
  category: string;
  resource: string;
  action: string;
  createdAt: string;
  updatedAt: string;
}

export interface RolePermission {
  roleId: string;
  permissionId: string;
  grantedAt: string;
  grantedBy: string | null;
  permission: Permission;
}

export interface RoleHierarchy {
  [parentRole: string]: string[];
}

export interface RoleStatistics {
  totalUsers: number;
  roles: {
    [role: string]: {
      userCount: number;
      permissionCount: number;
    };
  };
}

export interface PermissionCategory {
  name: string;
  count: number;
}

export interface UserPermissionsResponse {
  userId: string;
  role: string;
  permissions: Permission[];
  count: number;
}

export interface PermissionCheckResponse {
  userId: string;
  role: string;
  permission: string;
  hasPermission: boolean;
}

export interface UsersByRoleResponse {
  users: Array<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    role: string;
    status: string;
    createdAt: string;
    lastLoginAt: string | null;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Get all available roles
 */
export async function getAllRoles(): Promise<{ roles: Role[]; count: number }> {
  const response = await apiClient.get<{ roles: Role[]; count: number }>('/v1/roles/list');
  return response.data;
}

/**
 * Get role hierarchy
 */
export async function getRoleHierarchy(): Promise<{ hierarchy: RoleHierarchy }> {
  const response = await apiClient.get<{ hierarchy: RoleHierarchy }>('/v1/roles/hierarchy');
  return response.data;
}

/**
 * Get all permissions
 */
export async function getAllPermissions(category?: string): Promise<{ permissions: Permission[]; count: number }> {
  const endpoint = category ? `/v1/roles/permissions?category=${encodeURIComponent(category)}` : '/v1/roles/permissions';
  const response = await apiClient.get<{ permissions: Permission[]; count: number }>(endpoint);
  return response.data;
}

/**
 * Get permission categories
 */
export async function getPermissionCategories(): Promise<{ categories: PermissionCategory[] }> {
  const response = await apiClient.get<{ categories: PermissionCategory[] }>('/v1/roles/permissions/categories');
  return response.data;
}

/**
 * Get permissions for a specific role
 */
export async function getRolePermissions(role: string): Promise<{ role: string; permissions: Permission[]; count: number }> {
  const response = await apiClient.get<{ role: string; permissions: Permission[]; count: number }>(`/v1/roles/${role}/permissions`);
  return response.data;
}

/**
 * Get current user's permissions
 */
export async function getUserPermissions(): Promise<UserPermissionsResponse> {
  const response = await apiClient.get<UserPermissionsResponse>('/v1/roles/user/permissions');
  return response.data;
}

/**
 * Check if user has specific permission
 */
export async function checkUserPermission(permission: string): Promise<PermissionCheckResponse> {
  const response = await apiClient.post<PermissionCheckResponse>('/v1/roles/user/check-permission', { permission });
  return response.data;
}

/**
 * Assign permission to role
 */
export async function assignPermissionToRole(role: string, permissionId: string): Promise<{ message: string; rolePermission: RolePermission }> {
  const response = await apiClient.post<{ message: string; rolePermission: RolePermission }>(`/v1/roles/${role}/permissions/${permissionId}`);
  return response.data;
}

/**
 * Remove permission from role
 */
export async function removePermissionFromRole(role: string, permissionId: string): Promise<{ message: string }> {
  const response = await apiClient.delete<{ message: string }>(`/v1/roles/${role}/permissions/${permissionId}`);
  return response.data;
}

/**
 * Assign multiple permissions to role
 */
export async function assignPermissionsToRole(role: string, permissionIds: string[]): Promise<{ message: string; count: number; assignments: RolePermission[] }> {
  const response = await apiClient.post<{ message: string; count: number; assignments: RolePermission[] }>(`/v1/roles/${role}/permissions/bulk`, { permissionIds });
  return response.data;
}

/**
 * Update user role
 */
export async function updateUserRole(userId: string, role: string): Promise<{ message: string; user: any }> {
  const response = await apiClient.put<{ message: string; user: any }>(`/v1/roles/users/${userId}/role`, { role });
  return response.data;
}

/**
 * Get role statistics
 */
export async function getRoleStatistics(): Promise<{ statistics: RoleStatistics }> {
  const response = await apiClient.get<{ statistics: RoleStatistics }>('/v1/roles/statistics');
  return response.data;
}

/**
 * Get users by role
 */
export async function getUsersByRole(role: string, page: number = 1, limit: number = 20): Promise<UsersByRoleResponse> {
  const endpoint = `/v1/roles/${role}/users?page=${page}&limit=${limit}`;
  const response = await apiClient.get<UsersByRoleResponse>(endpoint);
  return response.data;
}
