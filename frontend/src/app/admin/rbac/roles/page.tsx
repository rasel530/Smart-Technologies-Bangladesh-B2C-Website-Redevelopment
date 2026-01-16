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
  Lock
} from 'lucide-react';
import { Role, RoleWithPermissions } from '@/types/rbac';
import { rbacApi } from '@/lib/api/rbac';
import { getRoleDisplayName } from '@/lib/rbac/utils';

/**
 * Role Management Page
 * 
 * Admin page for managing system roles.
 * Lists all roles with hierarchy, allows creating/editing/deleting roles,
 * viewing role permissions, and managing role-permission assignments.
 */
// Allowed role names as per backend validation
const ALLOWED_ROLE_NAMES = [
  'CUSTOMER',
  'SUPPORT',
  'CORPORATE',
  'ADMIN',
  'SUPER_ADMIN',
] as const;

// Default hierarchy levels for each role name
const DEFAULT_HIERARCHY_LEVELS: Record<string, number> = {
  CUSTOMER: 0,
  SUPPORT: 25,
  CORPORATE: 50,
  ADMIN: 75,
  SUPER_ADMIN: 100,
};

export default function RoleManagementPage() {
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
      
      // DIAGNOSTIC LOGS - Remove after fixing the issue
      console.log('[RoleManagement] fetchRoles - Full API response:', response);
      console.log('[RoleManagement] fetchRoles - response type:', typeof response);
      console.log('[RoleManagement] fetchRoles - response.data:', response.data);
      console.log('[RoleManagement] fetchRoles - response.data type:', typeof response.data);
      console.log('[RoleManagement] fetchRoles - response.data is array?', Array.isArray(response.data));
      console.log('[RoleManagement] fetchRoles - response.data length:', response.data?.length);
      console.log('[RoleManagement] fetchRoles - First role object:', response.data?.[0]);
      console.log('[RoleManagement] fetchRoles - First role properties:', response.data?.[0] ? Object.keys(response.data[0]) : 'N/A');
      console.log('[RoleManagement] fetchRoles - Setting roles to:', response.data || []);
      
      setRoles(response.data || []);
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
      setSelectedRole(response.data);
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

      await rbacApi.roles.create(formData);

      setSuccess('Role created successfully');
      setShowCreateForm(false);
      setFormData({ name: '', description: '', hierarchy_level: 0 });
      
      fetchRoles();
    } catch (error: any) {
      console.error('[RoleManagement] Error creating role:', error);
      
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
                <input
                  type="number"
                  id="hierarchy_level"
                  value={formData.hierarchy_level}
                  onChange={(e) => setFormData({ ...formData, hierarchy_level: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 100"
                  required
                  min="0"
                  max="100"
                />
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
    </div>
  );
}
