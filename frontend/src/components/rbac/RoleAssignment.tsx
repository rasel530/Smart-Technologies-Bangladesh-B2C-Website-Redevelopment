'use client';

import { useEffect, useState } from 'react';
import { 
  Shield, 
  ShieldCheck, 
  ShieldX, 
  Clock, 
  UserPlus, 
  UserMinus,
  Calendar,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { UserRole, Role } from '@/types/rbac';
import { rbacApi } from '@/lib/api/rbac';
import { getRoleDisplayName } from '@/lib/rbac/utils';

interface RoleAssignmentProps {
  userId: string;
  userRoles: UserRole[];
  onRolesChange?: (roles: UserRole[]) => void;
  readonly?: boolean;
}

/**
 * RoleAssignment Component
 * 
 * Displays current user roles and allows assigning/removing roles (for admins).
 * Shows role hierarchy and handles role expiration.
 */
export default function RoleAssignment({ 
  userId, 
  userRoles, 
  onRolesChange,
  readonly = false 
}: RoleAssignmentProps) {
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    fetchAvailableRoles();
  }, []);

  const fetchAvailableRoles = async () => {
    try {
      setLoading(true);
      const response = await rbacApi.roles.list();
      setAvailableRoles(response.data || []);
    } catch (error) {
      console.error('[RoleAssignment] Error fetching roles:', error);
      setError('Failed to load available roles');
    } finally {
      setLoading(false);
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

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      setSelectedRole('');
      setExpiresAt('');
      
      if (onRolesChange) {
        onRolesChange(response.data || []);
      }
    } catch (error: any) {
      console.error('[RoleAssignment] Error assigning role:', error);
      setError(error.message || 'Failed to assign role');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to remove this role?')) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      const response = await rbacApi.userRoles.removeRole(userId, roleId);

      setSuccess('Role removed successfully');
      
      if (onRolesChange) {
        onRolesChange(response.data || []);
      }
    } catch (error: any) {
      console.error('[RoleAssignment] Error removing role:', error);
      setError(error.message || 'Failed to remove role');
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isExpired = (expiresAt: string | null | undefined) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const getRoleIcon = (roleName: string) => {
    const name = roleName.toLowerCase();
    if (name === 'super_admin' || name === 'admin') {
      return <ShieldCheck className="w-5 h-5 text-green-600" />;
    }
    if (name === 'support') {
      return <Shield className="w-5 h-5 text-blue-600" />;
    }
    if (name === 'corporate') {
      return <Shield className="w-5 h-5 text-purple-600" />;
    }
    return <Shield className="w-5 h-5 text-gray-600" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      {/* Current Roles */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Current Roles
        </h3>

        {userRoles.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <ShieldX className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No roles assigned</p>
          </div>
        ) : (
          <div className="space-y-3">
            {userRoles.map((userRole) => (
              <div
                key={userRole.id}
                className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getRoleIcon(userRole.role?.name || '')}
                    <div>
                      <div className="font-medium text-gray-900">
                        {getRoleDisplayName(userRole.role?.name || '')}
                      </div>
                      <div className="text-sm text-gray-500">
                        Level {userRole.role?.hierarchy_level || 0}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Status Badge */}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        !userRole.isActive
                          ? 'bg-gray-100 text-gray-800'
                          : isExpired(userRole.expiresAt)
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {!userRole.isActive
                        ? 'Inactive'
                        : isExpired(userRole.expiresAt)
                        ? 'Expired'
                        : 'Active'}
                    </span>

                    {/* Expand Button */}
                    {userRole.expiresAt && (
                      <button
                        onClick={() => toggleExpand(userRole.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {expandedRoles.has(userRole.id) ? (
                          <ChevronUp className="w-4 h-4 text-gray-600" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-600" />
                        )}
                      </button>
                    )}

                    {/* Remove Button */}
                    {!readonly && userRole.isActive && !isExpired(userRole.expiresAt) && (
                      <button
                        onClick={() => handleRemoveRole(userRole.roleId)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                        title="Remove role"
                      >
                        <UserMinus className="w-4 h-4 text-red-600" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedRoles.has(userRole.id) && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>Assigned: {formatDate(userRole.assignedAt)}</span>
                      </div>
                      {userRole.expiresAt && (
                        <div className="flex items-center text-gray-600">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>Expires: {formatDate(userRole.expiresAt)}</span>
                        </div>
                      )}
                      {userRole.assignedBy && (
                        <div className="flex items-center text-gray-600">
                          <UserPlus className="w-4 h-4 mr-2" />
                          <span>Assigned by: {userRole.assignedBy}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assign Role Form */}
      {!readonly && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <UserPlus className="w-5 h-5 mr-2" />
            Assign New Role
          </h3>

          <form onSubmit={handleAssignRole} className="space-y-4">
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
                {availableRoles
                  .filter((role) => !userRoles.some((ur) => ur.roleId === role.id))
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

            <button
              type="submit"
              disabled={assigning || !selectedRole}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {assigning ? 'Assigning...' : 'Assign Role'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
