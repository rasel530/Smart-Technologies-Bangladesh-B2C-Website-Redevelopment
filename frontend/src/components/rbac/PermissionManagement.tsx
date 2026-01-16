'use client';

import { useEffect, useState } from 'react';
import { 
  Shield, 
  Check, 
  X, 
  Search,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { Permission, Role } from '@/types/rbac';
import { rbacApi } from '@/lib/api/rbac';
import { formatPermissionName } from '@/lib/rbac/utils';

interface PermissionManagementProps {
  roleId: string;
  roleName: string;
  onPermissionsChange?: (permissions: Permission[]) => void;
  readonly?: boolean;
}

/**
 * PermissionManagement Component
 * 
 * Displays available permissions grouped by resource.
 * Allows toggling permissions for a role.
 * Shows permission descriptions and visual indication of assigned/unassigned permissions.
 */
export default function PermissionManagement({
  roleId,
  roleName,
  onPermissionsChange,
  readonly = false,
}: PermissionManagementProps) {
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, [roleId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [allPermsResponse, rolePermsResponse] = await Promise.all([
        rbacApi.permissions.list(),
        rbacApi.rolePermissions.getRolePermissions(roleId),
      ]);

      setAllPermissions(allPermsResponse.data || []);
      setRolePermissions(rolePermsResponse.data || []);
    } catch (error) {
      console.error('[PermissionManagement] Error fetching permissions:', error);
      setError('Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (resource: string) => {
    setExpandedResources((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(resource)) {
        newSet.delete(resource);
      } else {
        newSet.add(resource);
      }
      return newSet;
    });
  };

  const handleTogglePermission = async (permissionId: string) => {
    if (readonly) return;

    const isAssigned = rolePermissions.some((p) => p.id === permissionId);
    
    try {
      setUpdating(true);
      setError('');
      setSuccess('');

      if (isAssigned) {
        await rbacApi.rolePermissions.removePermission(roleId, permissionId);
        setSuccess('Permission removed successfully');
      } else {
        await rbacApi.rolePermissions.assignPermission(roleId, permissionId);
        setSuccess('Permission assigned successfully');
      }

      // Refresh role permissions
      const response = await rbacApi.rolePermissions.getRolePermissions(roleId);
      setRolePermissions(response.data || []);
      
      if (onPermissionsChange) {
        onPermissionsChange(response.data || []);
      }
    } catch (error: any) {
      console.error('[PermissionManagement] Error toggling permission:', error);
      setError(error.message || 'Failed to update permission');
    } finally {
      setUpdating(false);
    }
  };

  const isPermissionAssigned = (permissionId: string) => {
    return rolePermissions.some((p) => p.id === permissionId);
  };

  const groupPermissionsByResource = (permissions: Permission[]) => {
    const grouped: Record<string, Permission[]> = {};
    permissions.forEach((permission) => {
      if (!grouped[permission.resource]) {
        grouped[permission.resource] = [];
      }
      grouped[permission.resource].push(permission);
    });
    return grouped;
  };

  const filterPermissions = (permissions: Permission[]) => {
    if (!searchTerm) return permissions;
    const lowerSearch = searchTerm.toLowerCase();
    return permissions.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerSearch) ||
        p.displayName.toLowerCase().includes(lowerSearch) ||
        p.resource.toLowerCase().includes(lowerSearch)
    );
  };

  const filteredPermissions = filterPermissions(allPermissions);
  const groupedPermissions = groupPermissionsByResource(filteredPermissions);

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

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Permissions for {roleName}
        </h3>
        <div className="text-sm text-gray-600">
          {rolePermissions.length} of {allPermissions.length} assigned
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search permissions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Permission Groups */}
      {Object.keys(groupedPermissions).length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No permissions found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedPermissions).map(([resource, permissions]) => (
            <div
              key={resource}
              className="bg-white border rounded-lg overflow-hidden"
            >
              {/* Resource Header */}
              <button
                onClick={() => toggleExpand(resource)}
                className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-900 capitalize">
                    {resource}
                  </span>
                  <span className="text-sm text-gray-500">
                    ({permissions.length} permissions)
                  </span>
                </div>
                {expandedResources.has(resource) ? (
                  <ChevronUp className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                )}
              </button>

              {/* Permission List */}
              {expandedResources.has(resource) && (
                <div className="p-4 space-y-3">
                  {permissions.map((permission) => {
                    const assigned = isPermissionAssigned(permission.id);
                    return (
                      <div
                        key={permission.id}
                        className={`flex items-start space-x-4 p-4 rounded-lg border-2 transition-colors ${
                          assigned
                            ? 'border-green-300 bg-green-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        {/* Toggle Button */}
                        {!readonly && (
                          <button
                            onClick={() => handleTogglePermission(permission.id)}
                            disabled={updating}
                            className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                              assigned
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-gray-200 hover:bg-gray-300'
                            }`}
                            title={assigned ? 'Remove permission' : 'Assign permission'}
                          >
                            {assigned ? (
                              <Check className="w-4 h-4 text-white" />
                            ) : (
                              <X className="w-4 h-4 text-gray-600" />
                            )}
                          </button>
                        )}

                        {/* Permission Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-gray-900">
                              {formatPermissionName(permission.name)}
                            </span>
                            <span className="text-sm text-gray-500">
                              ({permission.name})
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {permission.description}
                          </p>
                          <div className="flex items-center space-x-2 text-xs">
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                              {permission.action}
                            </span>
                            {assigned && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                                Assigned
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Info Icon */}
                        <button
                          className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Permission details"
                        >
                          <Info className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Legend</h4>
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
            <span className="text-gray-700">Assigned</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
              <X className="w-4 h-4 text-gray-600" />
            </div>
            <span className="text-gray-700">Not Assigned</span>
          </div>
        </div>
      </div>
    </div>
  );
}
