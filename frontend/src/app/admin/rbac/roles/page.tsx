'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Eye,
  ArrowLeft,
  Search,
  ChevronDown,
  ChevronUp,
  Layers,
  Lock,
  CheckSquare,
  Square,
  X,
  Info,
  Check,
  AlertCircle
} from 'lucide-react';
import { Role, RoleWithPermissions, Permission } from '@/types/rbac';
import { rbacApi } from '@/lib/api/rbac';
import { getRoleDisplayName } from '@/lib/rbac/utils';
import { withAuth } from '@/components/auth/withAuth';
import { AdminLayout } from '@/components/admin/AdminLayout';

/**
 * Role Management Page
 * 
 * Admin page for managing system roles.
 * Lists all roles with hierarchy, allows creating/editing/deleting roles,
 * viewing role permissions, and managing role-permission assignments.
 */
// Allowed role names as per backend validation
const ALLOWED_ROLE_NAMES = [
  'customer',
  'support',
  'corporate',
  'manager',
  'admin',
  'super_admin',
] as const;

// Default hierarchy levels for each role name
const DEFAULT_HIERARCHY_LEVELS: Record<string, number> = {
  customer: 0,
  support: 1,
  corporate: 2,
  manager: 3,
  admin: 4,
  super_admin: 5,
};

function RoleManagementPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<RoleWithPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());

  // Edit Permissions modal state
  const [showEditPermissionsModal, setShowEditPermissionsModal] = useState(false);
  const [editPermissionsRole, setEditPermissionsRole] = useState<RoleWithPermissions | null>(null);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [modalError, setModalError] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    hierarchy_level: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await rbacApi.roles.list();
      
      // API client already unwraps response from { success: true, data: {...} } format
      // response is already Role[] (the data part)
      setRoles(Array.isArray(response) ? response : []);
    } catch (error: any) {
      console.error('[RoleManagement] Error fetching roles:', error);
      setError(error.message || 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoleDetails = async (roleId: string) => {
    try {
      setError('');
      const response = await rbacApi.roles.get(roleId);
      // API client already unwraps response from { success: true, data: {...} } format
      setSelectedRole(response);
    } catch (error: any) {
      console.error('[RoleManagement] Error fetching role details:', error);
      setError(error.message || 'Failed to load role details');
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      // DIAGNOSTIC LOGGING - Remove after fixing issue
      console.log('[RoleManagement] Creating role with data:', formData);
      console.log('[RoleManagement] Form data JSON:', JSON.stringify(formData));
      console.log('[RoleManagement] Form data length:', JSON.stringify(formData).length);

      await rbacApi.roles.create(formData);

      setSuccess('Role created successfully');
      setShowCreateForm(false);
      setFormData({ name: '', description: '', hierarchy_level: 0 });
      
      fetchRoles();
    } catch (error: any) {
      console.error('[RoleManagement] Error creating role:', error);
      console.error('[RoleManagement] Error details:', error.response?.data || error.message);
      console.error('[RoleManagement] Full error object:', JSON.stringify(error, null, 2));
      
      // Check if it's a duplicate role error and provide helpful guidance
      if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
        const existingRole = roles.find(r => r.name === formData.name);
        if (existingRole) {
          setError(
            `Role "${formData.name}" already exists. Click the "Edit" button next to this role in the list below to modify its hierarchy level and description.`
          );
          // Auto-scroll to the existing role
          setTimeout(() => {
            const roleRow = document.getElementById(`role-row-${existingRole.id}`);
            if (roleRow) {
              roleRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
              roleRow.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
              setTimeout(() => {
                roleRow.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
              }, 3000);
            }
          }, 100);
        } else {
          setError(error.message || 'Failed to create role');
        }
      } else {
        setError(error.message || 'Failed to create role');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRole) return;

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      await rbacApi.roles.update(selectedRole.id, {
        description: formData.description,
        hierarchy_level: formData.hierarchy_level,
      });

      setSuccess('Role updated successfully');
      setShowEditForm(false);
      
      fetchRoles();
      if (selectedRole) {
        fetchRoleDetails(selectedRole.id);
      }
    } catch (error: any) {
      console.error('[RoleManagement] Error updating role:', error);
      setError(error.message || 'Failed to update role');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (!confirm(`Are you sure you want to delete the role "${roleName}"?`)) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      await rbacApi.roles.delete(roleId);

      setSuccess('Role deleted successfully');
      
      if (selectedRole?.id === roleId) {
        setSelectedRole(null);
      }
      
      fetchRoles();
    } catch (error: any) {
      console.error('[RoleManagement] Error deleting role:', error);
      setError(error.message || 'Failed to delete role');
    }
  };

  const toggleExpand = (roleId: string) => {
    setExpandedRoles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(roleId)) {
        newSet.delete(roleId);
      } else {
        newSet.add(roleId);
      }
      return newSet;
    });
  };

  const openEditForm = (role: Role) => {
    setFormData({
      name: role.name,
      description: role.description,
      hierarchy_level: role.hierarchy_level,
    });
    setShowEditForm(true);
  };

  // Edit Permissions handlers
  const openEditPermissionsModal = async (role: Role) => {
    try {
      setLoadingPermissions(true);
      setModalError('');
      
      // Fetch all permissions and role details
      const [allPerms, roleDetails] = await Promise.all([
        rbacApi.permissions.list(),
        rbacApi.roles.get(role.id),
      ]);
      
      setAllPermissions(allPerms);
      setEditPermissionsRole(roleDetails);
      
      // Set currently assigned permissions as selected
      const assignedPermissionIds = new Set(
        roleDetails.permissions.map(p => p.id)
      );
      setSelectedPermissions(assignedPermissionIds);
      
      setShowEditPermissionsModal(true);
    } catch (error: any) {
      console.error('[RoleManagement] Error opening edit permissions modal:', error);
      setModalError(error.message || 'Failed to load permissions');
    } finally {
      setLoadingPermissions(false);
    }
  };

  const closeEditPermissionsModal = () => {
    setShowEditPermissionsModal(false);
    setEditPermissionsRole(null);
    setAllPermissions([]);
    setSelectedPermissions(new Set());
    setModalError('');
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(permissionId)) {
        newSet.delete(permissionId);
      } else {
        newSet.add(permissionId);
      }
      return newSet;
    });
  };

  const toggleResourcePermissions = (resource: string, permissions: Permission[]) => {
    const resourcePermissionIds = permissions.map(p => p.id);
    const allSelected = resourcePermissionIds.every(id => selectedPermissions.has(id));
    
    setSelectedPermissions((prev) => {
      const newSet = new Set(prev);
      if (allSelected) {
        // Deselect all
        resourcePermissionIds.forEach(id => newSet.delete(id));
      } else {
        // Select all
        resourcePermissionIds.forEach(id => newSet.add(id));
      }
      return newSet;
    });
  };

  const handleSavePermissions = async () => {
    if (!editPermissionsRole) return;

    try {
      setSavingPermissions(true);
      setModalError('');

      await rbacApi.rolePermissions.updateRolePermissions(
        editPermissionsRole.id,
        Array.from(selectedPermissions)
      );

      setSuccess('Permissions updated successfully');
      closeEditPermissionsModal();
      
      // Refresh role data
      if (editPermissionsRole) {
        await fetchRoleDetails(editPermissionsRole.id);
      }
    } catch (error: any) {
      console.error('[RoleManagement] Error saving permissions:', error);
      if (error.message?.includes('403') || error.message?.includes('insufficient')) {
        setModalError('You do not have permission to modify role permissions');
      } else {
        setModalError(error.message || 'Failed to save permissions');
      }
    } finally {
      setSavingPermissions(false);
    }
  };

  // Group permissions by resource
  const getGroupedPermissions = () => {
    const groups: Record<string, Permission[]> = {};
    allPermissions.forEach((permission) => {
      if (!groups[permission.resource]) {
        groups[permission.resource] = [];
      }
      groups[permission.resource].push(permission);
    });
    return groups;
  };

  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // DIAGNOSTIC LOGS - Remove after fixing the issue
  console.log('[RoleManagement] Render - roles state:', roles);
  console.log('[RoleManagement] Render - roles length:', roles.length);
  console.log('[RoleManagement] Render - searchTerm:', searchTerm);
  console.log('[RoleManagement] Render - filteredRoles length:', filteredRoles.length);
  console.log('[RoleManagement] Render - filteredRoles:', filteredRoles);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AdminLayout title="RBAC Roles">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Shield className="w-8 h-8 mr-3" />
            Role Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage system roles and their permissions
          </p>
        </div>
        <Link
          href="/admin"
          className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Admin
        </Link>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 text-sm">{success}</p>
        </div>
      )}

      {/* Actions Bar */}
      <div className="flex items-center justify-between bg-white border rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>
          <div className="text-sm text-gray-600">
            {filteredRoles.length} roles
          </div>
        </div>
        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Role
          </button>
        )}
      </div>

      {/* Create/Edit Role Form */}
      {(showCreateForm || showEditForm) && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {showCreateForm ? 'Create New Role' : 'Edit Role'}
          </h3>
          <form onSubmit={showCreateForm ? handleCreateRole : handleUpdateRole} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Role Name
                </label>
                <select
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    const selectedRole = e.target.value;
                    setFormData({
                      ...formData,
                      name: selectedRole,
                      hierarchy_level: DEFAULT_HIERARCHY_LEVELS[selectedRole] || 0,
                    });
                  }}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white ${showEditForm ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}`}
                  required
                  disabled={showEditForm}
                >
                  <option value="">Select a role name</option>
                  {ALLOWED_ROLE_NAMES.map((roleName) => (
                    <option key={roleName} value={roleName}>
                      {roleName}
                    </option>
                  ))}
                </select>
                {showEditForm && (
                  <div className="mt-2 flex items-center space-x-2 text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-md border border-amber-200">
                    <Lock className="w-4 h-4" />
                    <span className="font-medium">Role name cannot be changed</span>
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="hierarchy_level" className="block text-sm font-medium text-gray-700 mb-2">
                  Hierarchy Level
                </label>
                <select
                  id="hierarchy_level"
                  value={formData.hierarchy_level}
                  onChange={(e) => setFormData({ ...formData, hierarchy_level: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  required
                >
                  <option value="0">0 - Customer</option>
                  <option value="1">1 - Support</option>
                  <option value="2">2 - Corporate</option>
                  <option value="3">3 - Manager</option>
                  <option value="4">4 - Admin</option>
                  <option value="5">5 - Super Admin</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">Higher level = more permissions</p>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the role's purpose..."
                required
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {submitting ? 'Saving...' : showCreateForm ? 'Create Role' : 'Update Role'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setShowEditForm(false);
                  setFormData({ name: '', description: '', hierarchy_level: 0 });
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Roles List */}
      <div className="bg-white border rounded-lg overflow-hidden">
        {filteredRoles.length === 0 ? (
          <div className="p-12 text-center">
            <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No roles found</p>
            <p className="text-gray-500 text-sm mt-2">
              {searchTerm ? 'Try adjusting your search' : 'Create a new role to get started'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permissions
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRoles.map((role) => (
                <tr id={`role-row-${role.id}`} key={role.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-gray-600" />
                      <div>
                        <div className="font-medium text-gray-900">
                          {getRoleDisplayName(role.name)}
                        </div>
                        <div className="text-sm text-gray-500">{role.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <Layers className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-900">{role.hierarchy_level}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                    {role.description}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => {
                          fetchRoleDetails(role.id);
                          toggleExpand(role.id);
                        }}
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => openEditPermissionsModal(role)}
                        className="flex items-center space-x-2 text-green-600 hover:text-green-700"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => openEditForm(role)}
                        className="flex items-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
                        title="Edit role"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        <span className="text-sm font-medium">Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteRole(role.id, role.name)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete role"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Role Details Panel */}
      {selectedRole && expandedRoles.has(selectedRole.id) && (
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Role Permissions: {getRoleDisplayName(selectedRole.name)}
            </h3>
            <button
              onClick={() => setSelectedRole(null)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {selectedRole.permissions && selectedRole.permissions.length > 0 ? (
            <div className="space-y-2">
              {selectedRole.permissions.map((permission) => (
                <div
                  key={permission.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-gray-900">{permission.displayName}</div>
                    <div className="text-sm text-gray-500">{permission.name}</div>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {permission.resource}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">
              No permissions assigned to this role
            </div>
          )}
        </div>
      )}

      {/* Edit Permissions Modal */}
      {showEditPermissionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Edit Permissions
                  </h2>
                  {editPermissionsRole && (
                    <p className="text-sm text-gray-600 mt-1">
                      Role: {getRoleDisplayName(editPermissionsRole.name)}
                    </p>
                  )}
                </div>
                <button
                  onClick={closeEditPermissionsModal}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingPermissions ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : modalError ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                  <p className="text-red-800 text-sm">{modalError}</p>
                </div>
              ) : (
                <>
                  {/* Permission Summary */}
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CheckSquare className="w-5 h-5 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-blue-900">
                          {selectedPermissions.size} of {allPermissions.length} permissions selected
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            const allIds = allPermissions.map(p => p.id);
                            setSelectedPermissions(new Set(allIds));
                          }}
                          className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        >
                          Select All
                        </button>
                        <button
                          onClick={() => setSelectedPermissions(new Set())}
                          className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                        >
                          Deselect All
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Permission Groups */}
                  {Object.entries(getGroupedPermissions()).map(([resource, permissions]) => {
                    const resourcePermissionIds = permissions.map(p => p.id);
                    const allSelected = resourcePermissionIds.every(id => selectedPermissions.has(id));
                    const someSelected = resourcePermissionIds.some(id => selectedPermissions.has(id));

                    return (
                      <div key={resource} className="mb-6">
                        {/* Resource Header */}
                        <div className="flex items-center justify-between mb-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <Layers className="w-4 h-4 text-gray-600 mr-2" />
                            <h3 className="font-semibold text-gray-900 capitalize">{resource}</h3>
                            <span className="ml-2 text-sm text-gray-500">
                              ({permissions.length} permissions)
                            </span>
                          </div>
                          <button
                            onClick={() => toggleResourcePermissions(resource, permissions)}
                            className="text-sm px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center"
                          >
                            {allSelected ? (
                              <>
                                <CheckSquare className="w-4 h-4 mr-1 text-blue-600" />
                                <span>Deselect All</span>
                              </>
                            ) : someSelected ? (
                              <>
                                <Square className="w-4 h-4 mr-1 text-gray-600" />
                                <span>Select All</span>
                              </>
                            ) : (
                              <>
                                <Square className="w-4 h-4 mr-1 text-gray-400" />
                                <span>Select All</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Permission List */}
                        <div className="space-y-2 ml-4">
                          {permissions.map((permission) => {
                            const isSelected = selectedPermissions.has(permission.id);
                            return (
                              <div
                                key={permission.id}
                                className="flex items-start p-3 border rounded-lg hover:bg-gray-50 transition-colors group"
                              >
                                <button
                                  onClick={() => togglePermission(permission.id)}
                                  className="mt-0.5 mr-3 flex-shrink-0"
                                  aria-label={isSelected ? 'Deselect permission' : 'Select permission'}
                                >
                                  {isSelected ? (
                                    <CheckSquare className="w-5 h-5 text-blue-600" />
                                  ) : (
                                    <Square className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                                  )}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="font-medium text-gray-900">
                                        {permission.displayName}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {permission.name}
                                      </div>
                                    </div>
                                    {permission.description && (
                                      <div className="relative group/tooltip">
                                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                                        <div className="absolute right-0 bottom-full mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-opacity z-10">
                                          {permission.description}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <div className="mt-1 flex items-center space-x-2">
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                      {permission.action}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
              <button
                onClick={closeEditPermissionsModal}
                disabled={savingPermissions}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePermissions}
                disabled={savingPermissions || loadingPermissions}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center"
              >
                {savingPermissions ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </AdminLayout>
  );
}

export default withAuth(RoleManagementPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
