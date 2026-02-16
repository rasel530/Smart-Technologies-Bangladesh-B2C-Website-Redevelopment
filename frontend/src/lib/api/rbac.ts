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
  CreateUserData,
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
   * @returns Role[] (unwrapped from RoleListResponse by apiClient)
   */
  list: async (): Promise<Role[]> => {
    const response = await apiClient.get<RoleListResponse>('/rbac/roles');
    // apiClient unwraps { success: true, data: [...] } to return just the data part
    return response as unknown as Role[];
  },

  /**
   * Get role hierarchy
   */
  getHierarchy: async (): Promise<RoleHierarchyResponse> => {
    const response = await apiClient.get<RoleHierarchyResponse>('/rbac/roles/hierarchy');
    return response;
  },

  /**
   * Get role details by ID
   * @returns RoleWithPermissions (unwrapped from RoleDetailResponse by apiClient)
   */
  get: async (id: string): Promise<RoleWithPermissions> => {
    const response = await apiClient.get<RoleDetailResponse>(`/rbac/roles/${id}`);
    // apiClient unwraps { success: true, data: {...} } to return just the data part
    return response as unknown as RoleWithPermissions;
  },

  /**
   * Create new role (Admin/Super Admin only)
   * @returns RoleWithPermissions (unwrapped from RoleDetailResponse by apiClient)
   */
  create: async (data: CreateRoleData): Promise<RoleWithPermissions> => {
    const response = await apiClient.post<RoleDetailResponse>('/rbac/roles', data);
    // apiClient unwraps { success: true, data: {...} } to return just the data part
    return response as unknown as RoleWithPermissions;
  },

  /**
   * Update role (Admin/Super Admin only)
   * @returns RoleWithPermissions (unwrapped from RoleDetailResponse by apiClient)
   */
  update: async (id: string, data: UpdateRoleData): Promise<RoleWithPermissions> => {
    const response = await apiClient.put<RoleDetailResponse>(`/rbac/roles/${id}`, data);
    // apiClient unwraps { success: true, data: {...} } to return just the data part
    return response as unknown as RoleWithPermissions;
  },

  /**
   * Delete role (Super Admin only)
   * @returns { success: boolean; message: string } (unwrapped by apiClient)
   */
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/rbac/roles/${id}`);
    // apiClient unwraps { success: true, data: {...} } to return just the data part
    // For delete, backend returns { success: true, message: '...' } directly
    return response as unknown as { success: boolean; message: string };
  },
};

// ==================== Permission Management ====================

export const permissionApi = {
  /**
   * Get all permissions
   * @param resource - Optional filter by resource
   * @returns Permission[] (unwrapped from PermissionListResponse by apiClient)
   */
  list: async (resource?: string): Promise<Permission[]> => {
    const url = resource ? `/rbac/permissions?resource=${resource}` : '/rbac/permissions';
    const response = await apiClient.get<PermissionListResponse>(url);
    // apiClient unwraps { success: true, data: [...] } to return just the data part
    return response as unknown as Permission[];
  },

  /**
   * Get all unique resource categories
   * @returns string[] (unwrapped from ResourceCategoriesResponse by apiClient)
   */
  getResources: async (): Promise<string[]> => {
    const response = await apiClient.get<ResourceCategoriesResponse>('/rbac/permissions/resources');
    // apiClient unwraps { success: true, data: [...] } to return just the data part
    return response as unknown as string[];
  },

  /**
   * Get permission details by ID
   * @returns PermissionWithRoles (unwrapped from PermissionDetailResponse by apiClient)
   */
  get: async (id: string): Promise<PermissionWithRoles> => {
    const response = await apiClient.get<PermissionDetailResponse>(`/rbac/permissions/${id}`);
    // apiClient unwraps { success: true, data: {...} } to return just the data part
    return response as unknown as PermissionWithRoles;
  },

  /**
   * Create new permission (Admin/Super Admin only)
   * @returns PermissionWithRoles (unwrapped from PermissionDetailResponse by apiClient)
   */
  create: async (data: CreatePermissionData): Promise<PermissionWithRoles> => {
    const response = await apiClient.post<PermissionDetailResponse>('/rbac/permissions', data);
    // apiClient unwraps { success: true, data: {...} } to return just the data part
    return response as unknown as PermissionWithRoles;
  },

  /**
   * Update permission (Admin/Super Admin only)
   * @returns PermissionWithRoles (unwrapped from PermissionDetailResponse by apiClient)
   */
  update: async (id: string, data: UpdatePermissionData): Promise<PermissionWithRoles> => {
    const response = await apiClient.put<PermissionDetailResponse>(`/rbac/permissions/${id}`, data);
    // apiClient unwraps { success: true, data: {...} } to return just the data part
    return response as unknown as PermissionWithRoles;
  },

  /**
   * Delete permission (Super Admin only)
   * @returns { success: boolean; message: string } (unwrapped by apiClient)
   */
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/rbac/permissions/${id}`);
    // apiClient unwraps { success: true, data: {...} } to return just the data part
    // For delete, backend returns { success: true, message: '...' } directly
    return response as unknown as { success: boolean; message: string };
  },
};

// ==================== Role-Permission Assignment ====================

export const rolePermissionApi = {
  /**
   * Get all permissions for a role
   * @returns Permission[] (unwrapped from PermissionListResponse by apiClient)
   */
  getRolePermissions: async (roleId: string): Promise<Permission[]> => {
    const response = await apiClient.get<PermissionListResponse>(`/rbac/role-permissions/${roleId}/permissions`);
    // apiClient unwraps { success: true, data: [...] } to return just the data part
    return response as unknown as Permission[];
  },

  /**
   * Assign permission to role (Admin/Super Admin only)
   * @returns { success: boolean; message: string } (unwrapped by apiClient)
   */
  assignPermission: async (roleId: string, permissionId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      `/rbac/role-permissions/${roleId}/permissions/${permissionId}`
    );
    // apiClient unwraps { success: true, data: {...} } to return just the data part
    return response as unknown as { success: boolean; message: string };
  },

  /**
   * Remove permission from role (Admin/Super Admin only)
   * @returns { success: boolean; message: string } (unwrapped by apiClient)
   */
  removePermission: async (roleId: string, permissionId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(
      `/rbac/role-permissions/${roleId}/permissions/${permissionId}`
    );
    // apiClient unwraps { success: true, data: {...} } to return just the data part
    return response as unknown as { success: boolean; message: string };
  },

  /**
   * Update all permissions for a role (Admin/Super Admin only)
   * Replaces all existing permissions with the provided list
   * @returns { success: boolean; message: string } (unwrapped by apiClient)
   */
  updateRolePermissions: async (roleId: string, permissionIds: string[]): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.put<{ success: boolean; message: string }>(
      `/rbac/roles/${roleId}/permissions`,
      { permissions: permissionIds }
    );
    // apiClient unwraps { success: true, data: {...} } to return just the data part
    return response as unknown as { success: boolean; message: string };
  },
};

// ==================== User Role Assignment ====================

export const userRoleApi = {
  /**
   * Get all roles for a user
   * @returns UserRole[] (unwrapped from UserRoleListResponse by apiClient)
   */
  getUserRoles: async (userId: string): Promise<UserRole[]> => {
    const response = await apiClient.get<UserRoleListResponse>(`/rbac/users/${userId}/roles`);
    // apiClient unwraps { success: true, data: [...] } to return just the data part
    return response as unknown as UserRole[];
  },

  /**
   * Assign role to user (Admin/Super Admin only)
   * @returns UserRole[] (unwrapped from UserRoleListResponse by apiClient)
   */
  assignRole: async (userId: string, data: AssignRoleData): Promise<UserRole[]> => {
    const response = await apiClient.post<UserRoleListResponse>(
      `/rbac/users/${userId}/roles/${data.roleId}`,
      { expires_at: data.expiresAt }
    );
    // apiClient unwraps { success: true, data: [...] } to return just the data part
    return response as unknown as UserRole[];
  },

  /**
   * Remove role from user (Admin/Super Admin only)
   * @returns UserRole[] (unwrapped from UserRoleListResponse by apiClient)
   */
  removeRole: async (userId: string, roleId: string): Promise<UserRole[]> => {
    const response = await apiClient.delete<UserRoleListResponse>(`/rbac/users/${userId}/roles/${roleId}`);
    // apiClient unwraps { success: true, data: [...] } to return just the data part
    return response as unknown as UserRole[];
  },

  /**
   * Update user role (Admin/Super Admin only)
   * @returns UserRole[] (unwrapped from UserRoleListResponse by apiClient)
   */
  updateUserRole: async (userId: string, roleId: string, data: UpdateUserRoleData): Promise<UserRole[]> => {
    const response = await apiClient.put<UserRoleListResponse>(`/rbac/users/${userId}/roles/${roleId}`, data);
    // apiClient unwraps { success: true, data: [...] } to return just the data part
    return response as unknown as UserRole[];
  },

  /**
   * Get paginated list of users with a specific role (Admin/Super Admin only)
   * @returns UserListWithRolesResponse (full response with pagination metadata)
   */
  getUsersByRole: async (roleId: string, page = 1, limit = 20): Promise<UserListWithRolesResponse> => {
    const response = await apiClient.get<UserListWithRolesResponse>(
      `/rbac/roles/${roleId}/users?page=${page}&limit=${limit}`,
      { unwrapResponse: false }  // Return full response with pagination metadata
    );
    return response;
  },
};

// ==================== User Management ====================

export const usersApi = {
  /**
   * Get paginated list of users with roles (Admin/Super Admin only)
   * @returns UserListWithRolesResponse (full response with pagination metadata)
   */
  list: async (page = 1, limit = 20, search?: string): Promise<UserListWithRolesResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) {
      params.append('search', search);
    }
    const response = await apiClient.get<UserListWithRolesResponse>(
      `/rbac/users?${params.toString()}`,
      { unwrapResponse: false }  // Return full response with pagination metadata
    );
    
    // TRANSFORM: Convert snake_case to camelCase
    const transformedData = response.data.map((user: any) => ({
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.first_name,  // ← TRANSFORM from snake_case to camelCase
      lastName: user.last_name,    // ← TRANSFORM from snake_case to camelCase
      status: user.status,
      maxRoleLevel: user.maxRoleLevel,
      roles: user.roles.map((role: any) => ({
        id: role.id,
        roleId: role.id,        // ← Map 'id' to 'roleId'
        name: role.name,
        description: role.description,
        hierarchy_level: role.hierarchy_level,
        assigned_at: role.assigned_at,
      })),
      created_at: user.created_at,
      updated_at: user.updated_at,
    }));
    
    return {
      ...response,
      data: transformedData,
    };
  },

  /**
   * Create new user with roles (Admin/Super Admin only)
   * @returns UserWithRoles (unwrapped from RoleDetailResponse by apiClient)
   */
  create: async (data: CreateUserData): Promise<UserWithRoles> => {
    // Transform camelCase to snake_case for backend compatibility
    const backendData = {
      email: data.email,
      phone: data.phone,
      password: data.password,
      first_name: data.firstName,
      last_name: data.lastName,
      role_ids: data.roleIds,
    };
    const response = await apiClient.post<{ success: boolean; message: string; data: { user: any; roles: any[] } }>('/rbac/users', backendData);
    // apiClient unwraps { success: true, data: {...} } to return just the data part
    // Transform backend response { user, roles } to UserWithRoles format
    const backendResponse = response as unknown as { user: any; roles: any[] };
    return {
      id: backendResponse.user.id,
      email: backendResponse.user.email,
      phone: backendResponse.user.phone,
      firstName: backendResponse.user.firstName,
      lastName: backendResponse.user.lastName,
      status: backendResponse.user.status,
      maxRoleLevel: backendResponse.user.maxRoleLevel || 0,
      roles: backendResponse.roles,
      created_at: backendResponse.user.createdAt,
      updated_at: backendResponse.user.updatedAt,
    };
  },

  /**
   * Delete user (Admin/Super Admin only)
   * @param userId - User ID to delete
   * @returns Success message
   */
  delete: async (userId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(
      `/rbac/users/${userId}`
    );
    return response as unknown as { success: boolean; message: string };
  },
};

// ==================== Role Escalation Requests ====================

export const escalationApi = {
  /**
   * Get all escalation requests (Admin/Super Admin only)
   * @returns RoleEscalationRequest[] (unwrapped from EscalationRequestListResponse by apiClient)
   */
  list: async (status?: string): Promise<RoleEscalationRequest[]> => {
    const url = status ? `/rbac/role-escalation-requests?status=${status}` : '/rbac/role-escalation-requests';
    const response = await apiClient.get<EscalationRequestListResponse>(url);
    // apiClient unwraps { success: true, data: [...] } to return just the data part
    return response as unknown as RoleEscalationRequest[];
  },

  /**
   * Get pending escalation requests (Admin/Super Admin only)
   * @returns RoleEscalationRequest[] (unwrapped from EscalationRequestListResponse by apiClient)
   */
  getPending: async (): Promise<RoleEscalationRequest[]> => {
    const response = await apiClient.get<EscalationRequestListResponse>('/rbac/role-escalation-requests/pending');
    // apiClient unwraps { success: true, data: [...] } to return just the data part
    return response as unknown as RoleEscalationRequest[];
  },

  /**
   * Get escalation request details
   * @returns RoleEscalationRequest (unwrapped from EscalationRequestDetailResponse by apiClient)
   */
  get: async (id: string): Promise<RoleEscalationRequest> => {
    const response = await apiClient.get<EscalationRequestDetailResponse>(`/rbac/role-escalation-requests/${id}`);
    // apiClient unwraps { success: true, data: {...} } to return just the data part
    return response as unknown as RoleEscalationRequest;
  },

  /**
   * Create role escalation request (Authenticated users)
   * @returns RoleEscalationRequest (unwrapped from EscalationRequestDetailResponse by apiClient)
   */
  create: async (data: CreateEscalationRequestData): Promise<RoleEscalationRequest> => {
    const response = await apiClient.post<EscalationRequestDetailResponse>('/rbac/role-escalation-requests', data);
    // apiClient unwraps { success: true, data: {...} } to return just the data part
    return response as unknown as RoleEscalationRequest;
  },

  /**
   * Approve escalation request (Admin/Super Admin only)
   * @returns RoleEscalationRequest (unwrapped from EscalationRequestDetailResponse by apiClient)
   */
  approve: async (id: string, data: ReviewEscalationRequestData): Promise<RoleEscalationRequest> => {
    const response = await apiClient.put<EscalationRequestDetailResponse>(
      `/rbac/role-escalation-requests/${id}/approve`,
      data
    );
    // apiClient unwraps { success: true, data: {...} } to return just the data part
    return response as unknown as RoleEscalationRequest;
  },

  /**
   * Reject escalation request (Admin/Super Admin only)
   * @returns RoleEscalationRequest (unwrapped from EscalationRequestDetailResponse by apiClient)
   */
  reject: async (id: string, data: ReviewEscalationRequestData): Promise<RoleEscalationRequest> => {
    const response = await apiClient.put<EscalationRequestDetailResponse>(
      `/rbac/role-escalation-requests/${id}/reject`,
      data
    );
    // apiClient unwraps { success: true, data: {...} } to return just the data part
    return response as unknown as RoleEscalationRequest;
  },

  /**
   * Cancel escalation request (Request owner only)
   * @returns RoleEscalationRequest (unwrapped from EscalationRequestDetailResponse by apiClient)
   */
  cancel: async (id: string): Promise<RoleEscalationRequest> => {
    const response = await apiClient.delete<EscalationRequestDetailResponse>(`/rbac/role-escalation-requests/${id}`);
    // apiClient unwraps { success: true, data: {...} } to return just the data part
    return response as unknown as RoleEscalationRequest;
  },

  /**
   * Get escalation requests for current user
   * @returns RoleEscalationRequest[] (unwrapped from EscalationRequestListResponse by apiClient)
   */
  getMyRequests: async (): Promise<RoleEscalationRequest[]> => {
    const response = await apiClient.get<EscalationRequestListResponse>('/rbac/role-escalation-requests/my-requests');
    // apiClient unwraps { success: true, data: [...] } to return just the data part
    return response as unknown as RoleEscalationRequest[];
  },
};

// ==================== Permission Check ====================

export const authCheckApi = {
  /**
   * Get current user permissions
   * @returns Permission[] (unwrapped from PermissionListResponse by apiClient)
   */
  getPermissions: async (): Promise<Permission[]> => {
    const response = await apiClient.get<PermissionListResponse>('/rbac/auth/permissions');
    // apiClient unwraps { success: true, data: [...] } to return just the data part
    return response as unknown as Permission[];
  },

  /**
   * Get current user roles
   * @returns UserRole[] (unwrapped from UserRoleListResponse by apiClient)
   */
  getRoles: async (): Promise<UserRole[]> => {
    const response = await apiClient.get<UserRoleListResponse>('/rbac/auth/roles');
    // apiClient unwraps { success: true, data: [...] } to return just the data part
    return response as unknown as UserRole[];
  },

  /**
   * Check if user has specific permission
   * @returns PermissionCheckResponse (unwrapped by apiClient)
   */
  hasPermission: async (permission: string): Promise<PermissionCheckResponse> => {
    const response = await apiClient.get<PermissionCheckResponse>(`/rbac/auth/has-permission/${permission}`);
    // apiClient unwraps { success: true, data: {...} } to return just the data part
    return response as unknown as PermissionCheckResponse;
  },

  /**
   * Check if user has multiple permissions
   * @param permissions - Array of permission names
   * @param mode - 'any' or 'all' (default: 'any')
   * @returns MultiplePermissionCheckResponse (unwrapped by apiClient)
   */
  checkPermissions: async (
    permissions: string[],
    mode: 'any' | 'all' = 'any'
  ): Promise<MultiplePermissionCheckResponse> => {
    const response = await apiClient.post<MultiplePermissionCheckResponse>('/rbac/auth/check-permissions', {
      permissions,
      mode,
    });
    // apiClient unwraps { success: true, data: {...} } to return just the data part
    return response as unknown as MultiplePermissionCheckResponse;
  },

  /**
   * Check if current user can assign specified role
   * @returns RoleAssignmentCheckResponse (unwrapped by apiClient)
   */
  canAssignRole: async (role: string): Promise<RoleAssignmentCheckResponse> => {
    const response = await apiClient.get<RoleAssignmentCheckResponse>(`/rbac/auth/can-assign-role/${role}`);
    // apiClient unwraps { success: true, data: {...} } to return just the data part
    return response as unknown as RoleAssignmentCheckResponse;
  },

  /**
   * Get current user's maximum role hierarchy level
   * @returns RoleLevelResponse (unwrapped by apiClient)
   */
  getRoleLevel: async (): Promise<RoleLevelResponse> => {
    const response = await apiClient.get<RoleLevelResponse>('/rbac/auth/role-level');
    // apiClient unwraps { success: true, data: {...} } to return just the data part
    return response as unknown as RoleLevelResponse;
  },
};

// Export all APIs
export const rbacApi = {
  roles: roleApi,
  permissions: permissionApi,
  rolePermissions: rolePermissionApi,
  userRoles: userRoleApi,
  users: usersApi,
  escalations: escalationApi,
  authCheck: authCheckApi,
};

export default rbacApi;
