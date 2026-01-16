'use client';

import { useState, useEffect } from 'react';
import {
  getAllRoles,
  getAllPermissions,
  getPermissionCategories,
  getRolePermissions,
  assignPermissionsToRole,
  getRoleStatistics,
  updateUserRole,
  getUsersByRole
} from '@/lib/api/roles';
import type { Role, Permission, PermissionCategory, RoleStatistics, UsersByRoleResponse } from '@/lib/api/roles';

export default function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [categories, setCategories] = useState<PermissionCategory[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('CUSTOMER');
  const [rolePermissions, setRolePermissions] = useState<Permission[]>([]);
  const [statistics, setStatistics] = useState<RoleStatistics | null>(null);
  const [usersByRole, setUsersByRole] = useState<UsersByRoleResponse | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'permissions' | 'users' | 'statistics'>('permissions');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedRole) {
      loadRolePermissions();
    }
  }, [selectedRole]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [rolesData, permissionsData, categoriesData, statsData] = await Promise.all([
        getAllRoles(),
        getAllPermissions(),
        getPermissionCategories(),
        getRoleStatistics()
      ]);

      setRoles(rolesData.roles);
      setPermissions(permissionsData.permissions);
      setCategories(categoriesData.categories);
      setStatistics(statsData.statistics);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRolePermissions = async () => {
    try {
      const data = await getRolePermissions(selectedRole);
      setRolePermissions(data.permissions);
    } catch (error) {
      console.error('Error loading role permissions:', error);
    }
  };

  const loadUsersByRole = async (page: number = 1) => {
    try {
      const data = await getUsersByRole(selectedRole, page);
      setUsersByRole(data);
    } catch (error) {
      console.error('Error loading users by role:', error);
    }
  };

  const handlePermissionToggle = async (permissionId: string, isGranted: boolean) => {
    try {
      setSaving(true);
      
      // Get current role permissions
      const currentRolePerms = rolePermissions.map(p => p.id);
      
      // Add or remove permission
      let newPermissions: string[];
      if (isGranted) {
        newPermissions = [...currentRolePerms, permissionId];
      } else {
        newPermissions = currentRolePerms.filter(id => id !== permissionId);
      }
      
      await assignPermissionsToRole(selectedRole, newPermissions);
      
      // Reload role permissions
      await loadRolePermissions();
    } catch (error) {
      console.error('Error updating permissions:', error);
      alert('Failed to update permissions. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkPermissionToggle = async (category: string, grant: boolean) => {
    try {
      setSaving(true);
      
      const categoryPermissions = permissions.filter(p => p.category === category);
      const permissionIds = categoryPermissions.map(p => p.id);
      
      if (grant) {
        // Add all permissions in category
        const currentRolePerms = rolePermissions.map(p => p.id);
        const newPermissions = Array.from(new Set([...currentRolePerms, ...permissionIds]));
        await assignPermissionsToRole(selectedRole, newPermissions);
      } else {
        // Remove all permissions in category
        const newPermissions = rolePermissions
          .filter(p => p.category !== category)
          .map(p => p.id);
        await assignPermissionsToRole(selectedRole, newPermissions);
      }
      
      await loadRolePermissions();
    } catch (error) {
      console.error('Error updating permissions:', error);
      alert('Failed to update permissions. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const filteredPermissions = selectedCategory
    ? permissions.filter(p => p.category === selectedCategory)
    : permissions;

  const groupedPermissions = filteredPermissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const selectedRoleInfo = roles.find(r => r.value === selectedRole);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Role Management</h1>
        <p className="text-gray-600">Manage user roles and their permissions</p>
      </div>

      {/* Role Selector */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Role
        </label>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          {roles.map(role => (
            <option key={role.value} value={role.value}>
              {role.label} - {role.description}
            </option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('permissions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'permissions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Permissions
            </button>
            <button
              onClick={() => {
                setActiveTab('users');
                loadUsersByRole();
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('statistics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'statistics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Statistics
            </button>
          </nav>
        </div>

        {/* Permissions Tab */}
        {activeTab === 'permissions' && (
          <div className="p-6">
            {/* Category Filter */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.name} value={cat.name}>
                    {cat.name} ({cat.count} permissions)
                  </option>
                ))}
              </select>
            </div>

            {/* Role Description */}
            {selectedRoleInfo && (
              <div className="mb-6 p-4 bg-blue-50 rounded-md">
                <h3 className="font-semibold text-blue-900 mb-1">
                  {selectedRoleInfo.label}
                </h3>
                <p className="text-sm text-blue-700">
                  {selectedRoleInfo.description}
                </p>
                <p className="text-sm text-blue-600 mt-2">
                  Currently has {rolePermissions.length} permissions assigned
                </p>
              </div>
            )}

            {/* Permissions List */}
            {Object.entries(groupedPermissions).map(([category, perms]) => (
              <div key={category} className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {category}
                  </h3>
                  <div className="space-x-2">
                    <button
                      onClick={() => handleBulkPermissionToggle(category, true)}
                      disabled={saving}
                      className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
                    >
                      Grant All
                    </button>
                    <button
                      onClick={() => handleBulkPermissionToggle(category, false)}
                      disabled={saving}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                    >
                      Revoke All
                    </button>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-md p-4">
                  {perms.map(permission => {
                    const isGranted = rolePermissions.some(p => p.id === permission.id);
                    return (
                      <div
                        key={permission.id}
                        className="flex items-center justify-between py-3 border-b border-gray-200 last:border-0"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {permission.name}
                          </div>
                          {permission.description && (
                            <div className="text-sm text-gray-600">
                              {permission.description}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            Resource: {permission.resource} | Action: {permission.action}
                          </div>
                        </div>
                        <button
                          onClick={() => handlePermissionToggle(permission.id, !isGranted)}
                          disabled={saving}
                          className={`ml-4 px-4 py-2 rounded-md text-sm font-medium ${
                            isGranted
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          } disabled:opacity-50`}
                        >
                          {isGranted ? 'Granted' : 'Grant'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Users with {selectedRoleInfo?.label} Role
            </h3>
            {usersByRole ? (
              <div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Login
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {usersByRole.users.map(user => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.firstName} {user.lastName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.status === 'ACTIVE'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.lastLoginAt
                              ? new Date(user.lastLoginAt).toLocaleDateString()
                              : 'Never'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {usersByRole.pagination.pages > 1 && (
                  <div className="mt-4 flex justify-center space-x-2">
                    {Array.from({ length: usersByRole.pagination.pages }, (_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => loadUsersByRole(i + 1)}
                        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No users found with this role.</p>
            )}
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'statistics' && statistics && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Role Statistics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-900">
                  {statistics.totalUsers}
                </div>
                <div className="text-sm text-blue-700">Total Users</div>
              </div>
              {Object.entries(statistics.roles).map(([role, data]) => (
                <div key={role} className="bg-gray-50 rounded-lg p-4">
                  <div className="text-lg font-bold text-gray-900">
                    {role}
                  </div>
                  <div className="text-sm text-gray-600">
                    {data.userCount} users
                  </div>
                  <div className="text-sm text-gray-600">
                    {data.permissionCount} permissions
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
