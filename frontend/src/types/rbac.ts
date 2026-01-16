// RBAC Type Definitions

// Role types
export interface Role {
  id: string;
  name: string;
  description: string;
  hierarchy_level: number;
  createdAt: string;
  updatedAt: string;
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

// Permission types
export interface Permission {
  id: string;
  name: string;
  displayName: string;
  description: string;
  resource: string;
  action: string;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionWithRoles extends Permission {
  roles: Role[];
}

// User Role types
export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  role: Role;
  assignedAt: string;
  expiresAt?: string | null;
  isActive: boolean;
  assignedBy?: string | null;
}

// Role Escalation Request types
export type EscalationStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface RoleEscalationRequest {
  id: string;
  userId: string;
  currentRoleId: string;
  currentRole: Role;
  requestedRoleId: string;
  requestedRole: Role;
  reason: string;
  status: EscalationStatus;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

// User with roles
export interface UserWithRoles {
  id: string;
  email?: string;
  phone?: string;
  firstName: string;
  lastName: string;
  roles: UserRole[];
  maxRoleLevel: number;
}

// Permission check response
export interface PermissionCheckResponse {
  hasPermission: boolean;
  permissionName: string;
}

export interface MultiplePermissionCheckResponse {
  mode: 'any' | 'all';
  hasPermissions: boolean;
  permissions: {
    name: string;
    hasPermission: boolean;
  }[];
}

export interface RoleAssignmentCheckResponse {
  canAssign: boolean;
  roleName: string;
  reason?: string;
}

export interface RoleLevelResponse {
  roleLevel: number;
  roleName: string;
}

// API Response wrappers
export interface RoleListResponse {
  success: boolean;
  message: string;
  data: Role[];
}

export interface RoleDetailResponse {
  success: boolean;
  message: string;
  data: RoleWithPermissions;
}

export interface PermissionListResponse {
  success: boolean;
  message: string;
  data: Permission[];
}

export interface PermissionDetailResponse {
  success: boolean;
  message: string;
  data: PermissionWithRoles;
}

export interface UserRoleListResponse {
  success: boolean;
  message: string;
  data: UserRole[];
}

export interface EscalationRequestListResponse {
  success: boolean;
  message: string;
  data: RoleEscalationRequest[];
}

export interface EscalationRequestDetailResponse {
  success: boolean;
  message: string;
  data: RoleEscalationRequest;
}

export interface ResourceCategoriesResponse {
  success: boolean;
  message: string;
  data: string[];
}

// Form data types
export interface CreateRoleData {
  name: string;
  description: string;
  hierarchy_level: number;
}

export interface UpdateRoleData {
  description?: string;
  hierarchy_level?: number;
}

export interface CreatePermissionData {
  name: string;
  displayName: string;
  description: string;
  resource: string;
  action: string;
}

export interface UpdatePermissionData {
  displayName?: string;
  description?: string;
}

export interface AssignRoleData {
  roleId: string;
  expiresAt?: string | null;
}

export interface UpdateUserRoleData {
  expiresAt?: string | null;
  isActive?: boolean;
}

export interface CreateEscalationRequestData {
  requestedRoleId: string;
  reason: string;
}

export interface ReviewEscalationRequestData {
  reviewNotes?: string;
}

// Permission groups for UI
export interface PermissionGroup {
  resource: string;
  permissions: Permission[];
}

export interface RolePermissionAssignment {
  roleId: string;
  permissionId: string;
  granted: boolean;
}

// Hierarchy information
export interface RoleHierarchy {
  role: Role;
  canAssignTo: Role[];
  canBeAssignedBy: Role[];
}

export interface RoleHierarchyResponse {
  success: boolean;
  message: string;
  data: RoleHierarchy[];
}

// Pagination types
export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// User list with roles for admin
export interface UserListWithRolesResponse extends PaginatedResponse<UserWithRoles> {}

// Error types
export interface RBACError {
  message: string;
  code?: string;
  details?: any;
}
