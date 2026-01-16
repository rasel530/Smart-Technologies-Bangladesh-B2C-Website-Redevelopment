'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Search,
  Filter,
  Layers
} from 'lucide-react';
import { Permission, PermissionWithRoles } from '@/types/rbac';
import { rbacApi } from '@/lib/api/rbac';
import { formatPermissionName } from '@/lib/rbac/utils';

/**
 * Permission Management Page
 * 
 * Admin page for managing system permissions.
 * Lists all permissions grouped by resource, allows creating/editing/deleting permissions,
 * and viewing which roles have each permission.
 */
export default function PermissionManagementPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermission, setSelectedPermission] = useState<PermissionWithRoles | null>(null);
  const [resources, setResources] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [resourceFilter, setResourceFilter] = useState<string>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    resource: '',
    action: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [permsResponse, resourcesResponse] = await Promise.all([
        rbacApi.permissions.list(),
        rbacApi.permissions.getResources(),
      ]);

      setPermissions(permsResponse.data || []);
      setResources(resourcesResponse.data || []);
    } catch (error: any) {
      console.error('[PermissionManagement] Error fetching permissions:', error);
      setError(error.message || 'Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissionDetails = async (permissionId: string) => {
    try {
      setError('');
      const response = await rbacApi.permissions.get(permissionId);
      setSelectedPermission(response.data);
    } catch (error: any) {
      console.error('[PermissionManagement] Error fetching permission details:', error);
      setError(error.message || 'Failed to load permission details');
    }
  };

  const handleCreatePermission = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      await rbacApi.permissions.create(formData);

      setSuccess('Permission created successfully');
      setShowCreateForm(false);
      setFormData({ name: '', displayName: '', description: '', resource: '', action: '' });

      fetchData();
    } catch (error: any) {
      console.error('[PermissionManagement] Error creating permission:', error);
      setError(error.message || 'Failed to create permission');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePermission = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPermission) return;

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      await rbacApi.permissions.update(selectedPermission.id, {
        displayName: formData.displayName,
        description: formData.description,
      });

      setSuccess('Permission updated successfully');
      setShowEditForm(false);

      fetchData();
      if (selectedPermission) {
        fetchPermissionDetails(selectedPermission.id);
      }
    } catch (error: any) {
      console.error('[PermissionManagement] Error updating permission:', error);
      setError(error.message || 'Failed to update permission');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePermission = async (permissionId: string, permissionName: string) => {
    if (!confirm(`Are you sure you want to delete permission "${permissionName}"?`)) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      await rbacApi.permissions.delete(permissionId);

      setSuccess('Permission deleted successfully');

      if (selectedPermission?.id === permissionId) {
        setSelectedPermission(null);
      }

      fetchData();
    } catch (error: any) {
      console.error('[PermissionManagement] Error deleting permission:', error);
      setError(error.message || 'Failed to delete permission');
    }
  };

  const openEditForm = (permission: Permission) => {
    setFormData({
      name: permission.name,
      displayName: permission.displayName,
      description: permission.description,
      resource: permission.resource,
      action: permission.action,
    });
    setShowEditForm(true);
  };

  const filteredPermissions = permissions.filter((permission) => {
    const matchesSearch =
      permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesResource = resourceFilter === 'all' || permission.resource === resourceFilter;

    return matchesSearch && matchesResource;
  });

  const groupedPermissions = filteredPermissions.reduce((acc, permission) => {
    if (!acc[permission.resource]) {
      acc[permission.resource] = [];
    }
    acc[permission.resource].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

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
            Permission Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage system permissions and their assignments
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
              placeholder="Search permissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={resourceFilter}
              onChange={(e) => setResourceFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Resources</option>
              {resources.map((resource) => (
                <option key={resource} value={resource}>
                  {resource.charAt(0).toUpperCase() + resource.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="text-sm text-gray-600">
            {filteredPermissions.length} permissions
          </div>
        </div>
        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Permission
          </button>
        )}
      </div>

      {/* Create/Edit Permission Form */}
      {(showCreateForm || showEditForm) && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {showCreateForm ? 'Create New Permission' : 'Edit Permission'}
          </h3>
          <form onSubmit={showCreateForm ? handleCreatePermission : handleUpdatePermission} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="resource" className="block text-sm font-medium text-gray-700 mb-2">
                  Resource
                </label>
                <input
                  type="text"
                  id="resource"
                  value={formData.resource}
                  onChange={(e) => setFormData({ ...formData, resource: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., user"
                  required
                  disabled={showEditForm}
                />
                {showEditForm && (
                  <p className="mt-1 text-sm text-gray-500">Resource cannot be changed</p>
                )}
              </div>
              <div>
                <label htmlFor="action" className="block text-sm font-medium text-gray-700 mb-2">
                  Action
                </label>
                <input
                  type="text"
                  id="action"
                  value={formData.action}
                  onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., create"
                  required
                  disabled={showEditForm}
                />
                {showEditForm && (
                  <p className="mt-1 text-sm text-gray-500">Action cannot be changed</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Permission Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., user:create"
                required
                disabled={showEditForm}
              />
              <p className="mt-1 text-sm text-gray-500">
                Format: resource:action (e.g., user:create)
              </p>
            </div>

            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <input
                type="text"
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Create User"
                required
              />
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
                placeholder="Describe what this permission allows..."
                required
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {submitting ? 'Saving...' : showCreateForm ? 'Create Permission' : 'Update Permission'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setShowEditForm(false);
                  setFormData({ name: '', displayName: '', description: '', resource: '', action: '' });
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Permissions List */}
      {Object.keys(groupedPermissions).length === 0 ? (
        <div className="bg-white border rounded-lg p-12 text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No permissions found</p>
          <p className="text-gray-500 text-sm mt-2">
            {searchTerm || resourceFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create a new permission to get started'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedPermissions).map(([resource, perms]) => (
            <div key={resource} className="bg-white border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Layers className="w-5 h-5 mr-2" />
                  {resource.charAt(0).toUpperCase() + resource.slice(1)}
                </h3>
                <span className="ml-2 text-sm text-gray-500">
                  ({perms.length} permissions)
                </span>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Permission
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {perms.map((permission) => (
                    <tr key={permission.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            {formatPermissionName(permission.name)}
                          </div>
                          <div className="text-sm text-gray-500">{permission.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {permission.description}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {permission.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              fetchPermissionDetails(permission.id);
                              setSelectedPermission(permission as any);
                            }}
                            className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                            title="View roles"
                          >
                            <Shield className="w-4 h-4 text-blue-600" />
                          </button>
                          <button
                            onClick={() => openEditForm(permission)}
                            className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Edit permission"
                          >
                            <Edit className="w-4 h-4 text-blue-600" />
                          </button>
                          <button
                            onClick={() => handleDeletePermission(permission.id, permission.displayName)}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete permission"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Permission Details Panel */}
      {selectedPermission && (
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Roles with this permission
            </h3>
            <button
              onClick={() => setSelectedPermission(null)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ×
            </button>
          </div>

          {selectedPermission.roles && selectedPermission.roles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectedPermission.roles.map((role) => (
                <div
                  key={role.id}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                >
                  <Shield className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="font-medium text-gray-900">{role.name}</div>
                    <div className="text-sm text-gray-500">
                      Level {role.hierarchy_level}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">
              No roles have this permission assigned
            </div>
          )}
        </div>
      )}
    </div>
  );
}
