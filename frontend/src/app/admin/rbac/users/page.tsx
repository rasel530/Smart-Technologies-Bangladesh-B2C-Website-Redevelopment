'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Search, 
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Shield,
  Calendar,
  UserPlus,
  Filter
} from 'lucide-react';
import { UserRole, UserWithRoles, Role } from '@/types/rbac';
import { rbacApi } from '@/lib/api/rbac';
import { getRoleDisplayName } from '@/lib/rbac/utils';

/**
 * User Role Management Page
 * 
 * Admin page for managing user roles.
 * Lists users with their roles, allows assigning/removing roles,
 * viewing role history, and handling role escalations.
 */
export default function UserRoleManagementPage() {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  // Assign role form state
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [rolesResponse] = await Promise.all([
        rbacApi.roles.list(),
      ]);

      setRoles(rolesResponse.data || []);
      
      // Note: In a real implementation, you would fetch users with roles
      // For now, we'll use a placeholder approach
      // This would be: const usersResponse = await rbacApi.userRoles.getUsersWithRoles();
      setUsers([]);
    } catch (error: any) {
      console.error('[UserRoleManagement] Error fetching data:', error);
      setError(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async (userId: string) => {
    if (!selectedRole) {
      setError('Please select a role');
      return;
    }

    try {
      setAssigning(true);
      setError('');
      setSuccess('');

      const response = await rbacApi.userRoles.assignRole(userId, {
        roleId: selectedRole,
        expiresAt: expiresAt || null,
      });

      setSuccess('Role assigned successfully');
      setShowAssignForm(false);
      setSelectedRole('');
      setExpiresAt('');
      
      // Refresh user roles
      if (selectedUser?.id === userId) {
        const userRolesResponse = await rbacApi.userRoles.getUserRoles(userId);
        setSelectedUser({
          ...selectedUser,
          roles: userRolesResponse.data || [],
        });
      }
    } catch (error: any) {
      console.error('[UserRoleManagement] Error assigning role:', error);
      setError(error.message || 'Failed to assign role');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveRole = async (userId: string, roleId: string) => {
    if (!confirm('Are you sure you want to remove this role?')) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      await rbacApi.userRoles.removeRole(userId, roleId);

      setSuccess('Role removed successfully');
      
      // Refresh user roles
      if (selectedUser?.id === userId) {
        const userRolesResponse = await rbacApi.userRoles.getUserRoles(userId);
        setSelectedUser({
          ...selectedUser,
          roles: userRolesResponse.data || [],
        });
      }
    } catch (error: any) {
      console.error('[UserRoleManagement] Error removing role:', error);
      setError(error.message || 'Failed to remove role');
    }
  };

  const toggleExpand = (userId: string) => {
    setExpandedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.phone && user.phone.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole =
      roleFilter === 'all' ||
      user.roles.some((ur) => ur.role?.name === roleFilter);

    return matchesSearch && matchesRole;
  });

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
            <Users className="w-8 h-8 mr-3" />
            User Role Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage user roles and permissions
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

      {/* Filters */}
      <div className="flex items-center space-x-4 bg-white border rounded-lg p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Roles</option>
            {roles.map((role) => (
              <option key={role.id} value={role.name}>
                {getRoleDisplayName(role.name)}
              </option>
            ))}
          </select>
        </div>
        <div className="text-sm text-gray-600">
          {filteredUsers.length} users
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white border rounded-lg overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No users found</p>
            <p className="text-gray-500 text-sm mt-2">
              {searchTerm || roleFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No users available'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Roles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Max Level
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">
                          {user.firstName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">ID: {user.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="space-y-1">
                      {user.email && <div>{user.email}</div>}
                      {user.phone && <div>{user.phone}</div>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-900">
                        {user.roles.length} role{user.roles.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      Level {user.maxRoleLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        toggleExpand(user.id);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Manage Roles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* User Details Panel */}
      {selectedUser && expandedUsers.has(selectedUser.id) && (
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              User: {selectedUser.firstName} {selectedUser.lastName}
            </h3>
            <button
              onClick={() => setSelectedUser(null)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ×
            </button>
          </div>

          {/* Current Roles */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Current Roles</h4>
            {selectedUser.roles.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-600">
                No roles assigned
              </div>
            ) : (
              <div className="space-y-3">
                {selectedUser.roles.map((userRole) => (
                  <div
                    key={userRole.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-gray-600" />
                      <div>
                        <div className="font-medium text-gray-900">
                          {getRoleDisplayName(userRole.role?.name || '')}
                        </div>
                        <div className="text-sm text-gray-500">
                          Level {userRole.role?.hierarchy_level || 0}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>{formatDate(userRole.assignedAt)}</span>
                      </div>
                      {userRole.expiresAt && (
                        <div className="text-sm text-gray-500">
                          Expires: {formatDate(userRole.expiresAt)}
                        </div>
                      )}
                      <button
                        onClick={() => handleRemoveRole(selectedUser.id, userRole.roleId)}
                        className="px-3 py-1 text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assign Role Form */}
          {!showAssignForm && (
            <button
              onClick={() => setShowAssignForm(true)}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Assign New Role
            </button>
          )}

          {showAssignForm && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Assign Role</h4>
              <div className="space-y-3">
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    id="role"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a role</option>
                    {roles
                      .filter((role) => !selectedUser.roles.some((ur) => ur.roleId === role.id))
                      .map((role) => (
                        <option key={role.id} value={role.id}>
                          {getRoleDisplayName(role.name)} (Level {role.hierarchy_level})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-700 mb-2">
                    Expiration Date (Optional)
                  </label>
                  <input
                    type="date"
                    id="expiresAt"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Leave empty for permanent assignment
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => handleAssignRole(selectedUser.id)}
                    disabled={assigning || !selectedRole}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {assigning ? 'Assigning...' : 'Assign Role'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAssignForm(false);
                      setSelectedRole('');
                      setExpiresAt('');
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
