import { apiClient } from './client';
import {
  Role,
  RoleWithPermissions,
  Permission,
  PermissionWithRoles,
  UserRole,
  RoleEscalationRequest,
  UserWithRoles,
  PermissionCheckResponse,
  MultiplePermissionCheckResponse,
  RoleAssignmentCheckResponse,
  RoleLevelResponse,
  RoleListResponse,
  RoleDetailResponse,
  PermissionListResponse,
  PermissionDetailResponse,
  UserRoleListResponse,
  EscalationRequestListResponse,
  EscalationRequestDetailResponse,
  ResourceCategoriesResponse,
  RoleHierarchyResponse,
  CreateRoleData,
  UpdateRoleData,
  CreatePermissionData,
  UpdatePermissionData,
  AssignRoleData,
  UpdateUserRoleData,
  CreateEscalationRequestData,
  ReviewEscalationRequestData,
  PaginatedResponse,
  UserListWithRolesResponse,
} from '@/types/rbac';

/**
 * RBAC API Client
 * 
 * Provides all CRUD operations for roles, permissions, user roles,
 * role escalation requests, and permission checks.
 */

// ==================== Role Management ====================

export const roleApi = {
  /**
   * Get all roles
   */
  list: async (): Promise<RoleListResponse> => {
    const response = await apiClient.get<RoleListResponse>('/rbac/roles');
    
    // FIX: Return full response object, not response.data
    // The API returns { success: true, data: [...], count: N }
    // So we need to return the entire response, not response.data
    return response;
  },

  /**
   * Get role hierarchy
   */
  getHierarchy: async (): Promise<RoleHierarchyResponse> => {
    const response = await apiClient.get<RoleHierarchyResponse>('/rbac/roles/hierarchy');
    return response.data;
  },

  /**
   * Get role details by ID
   */
  get: async (id: string): Promise<RoleDetailResponse> => {
    const response = await apiClient.get<RoleDetailResponse>(`/rbac/roles/${id}`);
    return response.data;
  },

  /**
   * Create new role (Admin/Super Admin only)
   */
  create: async (data: CreateRoleData): Promise<RoleDetailResponse> => {
    const response = await apiClient.post<RoleDetailResponse>('/rbac/roles', data);
    return response.data;
  },

  /**
   * Update role (Admin/Super Admin only)
   */
  update: async (id: string, data: UpdateRoleData): Promise<RoleDetailResponse> => {
    const response = await apiClient.put<RoleDetailResponse>(`/rbac/roles/${id}`, data);
    return response.data;
  },

  /**
   * Delete role (Super Admin only)
   */
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/rbac/roles/${id}`);
    return response.data;
  },
};

// ==================== Permission Management ====================

export const permissionApi = {
  /**
   * Get all permissions
   * @param resource - Optional filter by resource
   */
  list: async (resource?: string): Promise<PermissionListResponse> => {
    const url = resource ? `/rbac/permissions?resource=${resource}` : '/rbac/permissions';
    const response = await apiClient.get<PermissionListResponse>(url);
    return response.data;
  },

  /**
   * Get all unique resource categories
   */
  getResources: async (): Promise<ResourceCategoriesResponse> => {
    const response = await apiClient.get<ResourceCategoriesResponse>('/rbac/permissions/resources');
    return response.data;
  },

  /**
   * Get permission details by ID
   */
  get: async (id: string): Promise<PermissionDetailResponse> => {
    const response = await apiClient.get<PermissionDetailResponse>(`/rbac/permissions/${id}`);
    return response.data;
  },

  /**
   * Create new permission (Admin/Super Admin only)
   */
  create: async (data: CreatePermissionData): Promise<PermissionDetailResponse> => {
    const response = await apiClient.post<PermissionDetailResponse>('/rbac/permissions', data);
    return response.data;
  },

  /**
   * Update permission (Admin/Super Admin only)
   */
  update: async (id: string, data: UpdatePermissionData): Promise<PermissionDetailResponse> => {
    const response = await apiClient.put<PermissionDetailResponse>(`/rbac/permissions/${id}`, data);
    return response.data;
  },

  /**
   * Delete permission (Super Admin only)
   */
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/rbac/permissions/${id}`);
    return response.data;
  },
};

// ==================== Role-Permission Assignment ====================

export const rolePermissionApi = {
  /**
   * Get all permissions for a role
   */
  getRolePermissions: async (roleId: string): Promise<PermissionListResponse> => {
    const response = await apiClient.get<PermissionListResponse>(`/rbac/role-permissions/${roleId}/permissions`);
    return response.data;
  },

  /**
   * Assign permission to role (Admin/Super Admin only)
   */
  assignPermission: async (roleId: string, permissionId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      `/rbac/role-permissions/${roleId}/permissions/${permissionId}`
    );
    return response.data;
  },

  /**
   * Remove permission from role (Admin/Super Admin only)
   */
  removePermission: async (roleId: string, permissionId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(
      `/rbac/role-permissions/${roleId}/permissions/${permissionId}`
    );
    return response.data;
  },
};

// ==================== User Role Assignment ====================

export const userRoleApi = {
  /**
   * Get all roles for a user
   */
  getUserRoles: async (userId: string): Promise<UserRoleListResponse> => {
    const response = await apiClient.get<UserRoleListResponse>(`/rbac/users/${userId}/roles`);
    return response.data;
  },

  /**
   * Assign role to user (Admin/Super Admin only)
   */
  assignRole: async (userId: string, data: AssignRoleData): Promise<UserRoleListResponse> => {
    const response = await apiClient.post<UserRoleListResponse>(
      `/rbac/users/${userId}/roles/${data.roleId}`,
      { expiresAt: data.expiresAt }
    );
    return response.data;
  },

  /**
   * Remove role from user (Admin/Super Admin only)
   */
  removeRole: async (userId: string, roleId: string): Promise<UserRoleListResponse> => {
    const response = await apiClient.delete<UserRoleListResponse>(`/rbac/users/${userId}/roles/${roleId}`);
    return response.data;
  },

  /**
   * Update user role (Admin/Super Admin only)
   */
  updateUserRole: async (userId: string, roleId: string, data: UpdateUserRoleData): Promise<UserRoleListResponse> => {
    const response = await apiClient.put<UserRoleListResponse>(`/rbac/users/${userId}/roles/${roleId}`, data);
    return response.data;
  },

  /**
   * Get paginated list of users with a specific role (Admin/Super Admin only)
   */
  getUsersByRole: async (roleId: string, page = 1, limit = 20): Promise<UserListWithRolesResponse> => {
    const response = await apiClient.get<UserListWithRolesResponse>(
      `/rbac/roles/${roleId}/users?page=${page}&limit=${limit}`
    );
    return response.data;
  },
};

// ==================== Role Escalation Requests ====================

export const escalationApi = {
  /**
   * Get all escalation requests (Admin/Super Admin only)
   */
  list: async (status?: string): Promise<EscalationRequestListResponse> => {
    const url = status ? `/rbac/role-escalation-requests?status=${status}` : '/rbac/role-escalation-requests';
    const response = await apiClient.get<EscalationRequestListResponse>(url);
    return response.data;
  },

  /**
   * Get pending escalation requests (Admin/Super Admin only)
   */
  getPending: async (): Promise<EscalationRequestListResponse> => {
    const response = await apiClient.get<EscalationRequestListResponse>('/rbac/role-escalation-requests/pending');
    return response.data;
  },

  /**
   * Get escalation request details
   */
  get: async (id: string): Promise<EscalationRequestDetailResponse> => {
    const response = await apiClient.get<EscalationRequestDetailResponse>(`/rbac/role-escalation-requests/${id}`);
    return response.data;
  },

  /**
   * Create role escalation request (Authenticated users)
   */
  create: async (data: CreateEscalationRequestData): Promise<EscalationRequestDetailResponse> => {
    const response = await apiClient.post<EscalationRequestDetailResponse>('/rbac/role-escalation-requests', data);
    return response.data;
  },

  /**
   * Approve escalation request (Admin/Super Admin only)
   */
  approve: async (id: string, data: ReviewEscalationRequestData): Promise<EscalationRequestDetailResponse> => {
    const response = await apiClient.put<EscalationRequestDetailResponse>(
      `/rbac/role-escalation-requests/${id}/approve`,
      data
    );
    return response.data;
  },

  /**
   * Reject escalation request (Admin/Super Admin only)
   */
  reject: async (id: string, data: ReviewEscalationRequestData): Promise<EscalationRequestDetailResponse> => {
    const response = await apiClient.put<EscalationRequestDetailResponse>(
      `/rbac/role-escalation-requests/${id}/reject`,
      data
    );
    return response.data;
  },

  /**
   * Cancel escalation request (Request owner only)
   */
  cancel: async (id: string): Promise<EscalationRequestDetailResponse> => {
    const response = await apiClient.delete<EscalationRequestDetailResponse>(`/rbac/role-escalation-requests/${id}`);
    return response.data;
  },

  /**
   * Get escalation requests for current user
   */
  getMyRequests: async (): Promise<EscalationRequestListResponse> => {
    const response = await apiClient.get<EscalationRequestListResponse>('/rbac/role-escalation-requests/my-requests');
    return response.data;
  },
};

// ==================== Permission Check ====================

export const authCheckApi = {
  /**
   * Get current user permissions
   */
  getPermissions: async (): Promise<PermissionListResponse> => {
    const response = await apiClient.get<PermissionListResponse>('/rbac/auth/permissions');
    return response.data;
  },

  /**
   * Get current user roles
   */
  getRoles: async (): Promise<UserRoleListResponse> => {
    const response = await apiClient.get<UserRoleListResponse>('/rbac/auth/roles');
    return response.data;
  },

  /**
   * Check if user has specific permission
   */
  hasPermission: async (permission: string): Promise<PermissionCheckResponse> => {
    const response = await apiClient.get<PermissionCheckResponse>(`/rbac/auth/has-permission/${permission}`);
    return response.data;
  },

  /**
   * Check if user has multiple permissions
   * @param permissions - Array of permission names
   * @param mode - 'any' or 'all' (default: 'any')
   */
  checkPermissions: async (
    permissions: string[],
    mode: 'any' | 'all' = 'any'
  ): Promise<MultiplePermissionCheckResponse> => {
    const response = await apiClient.post<MultiplePermissionCheckResponse>('/rbac/auth/check-permissions', {
      permissions,
      mode,
    });
    return response.data;
  },

  /**
   * Check if current user can assign specified role
   */
  canAssignRole: async (role: string): Promise<RoleAssignmentCheckResponse> => {
    const response = await apiClient.get<RoleAssignmentCheckResponse>(`/rbac/auth/can-assign-role/${role}`);
    return response.data;
  },

  /**
   * Get current user's maximum role hierarchy level
   */
  getRoleLevel: async (): Promise<RoleLevelResponse> => {
    const response = await apiClient.get<RoleLevelResponse>('/rbac/auth/role-level');
    return response.data;
  },
};

// Export all APIs
export const rbacApi = {
  roles: roleApi,
  permissions: permissionApi,
  rolePermissions: rolePermissionApi,
  userRoles: userRoleApi,
  escalations: escalationApi,
  authCheck: authCheckApi,
};

export default rbacApi;
