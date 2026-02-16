'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Search, 
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Shield,
  Calendar,
  UserPlus,
  Filter,
  X,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Trash2
} from 'lucide-react';
import { UserRole, UserWithRoles, Role, CreateUserData } from '@/types/rbac';
import { rbacApi } from '@/lib/api/rbac';
import { getRoleDisplayName } from '@/lib/rbac/utils';
import { withAuth } from '@/components/auth/withAuth';

/**
 * User Role Management Page
 * 
 * Admin page for managing user roles.
 * Lists users with their roles, allows creating new users,
 * assigning/removing roles, viewing role history, and handling role escalations.
 */

// Password strength levels
type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

function UserRoleManagementPage() {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [limit] = useState(20);

  // Assign role form state
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [assigning, setAssigning] = useState(false);

  // Create User modal state
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Create User form state
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    roleIds: [] as string[],
  });

  // Form validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    fetchData();
  }, [currentPage, limit, searchTerm]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [rolesResponse, usersResponse] = await Promise.all([
        rbacApi.roles.list(),
        rbacApi.users.list(currentPage, limit, searchTerm || undefined),
      ]);

      setRoles(rolesResponse || []);
      
      // Handle paginated users response
      if (usersResponse && 'data' in usersResponse) {
        setUsers(usersResponse.data || []);
        setTotalPages(usersResponse.pagination?.totalPages || 1);
        setTotalUsers(usersResponse.pagination?.total || 0);
      } else {
        setUsers([]);
        setTotalPages(1);
        setTotalUsers(0);
      }
    } catch (error: any) {
      console.error('[UserRoleManagement] Error fetching data:', error);
      setError(error.message || 'Failed to load data');
      setUsers([]);
      setTotalPages(1);
      setTotalUsers(0);
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
        // Transform UserRole[] to UserRoleSimple[] to match new backend structure
        const transformedRoles = (userRolesResponse || []).map((ur) => {
          console.log('[UserRoleManagement] Transforming user role:', JSON.stringify(ur));
          const transformed = {
            id: ur.id,
            roleId: ur.role_id,
            name: ur.role_name,
            description: ur.role_description,
            hierarchy_level: ur.hierarchy_level,
            assigned_at: ur.assigned_at,
            expiresAt: ur.expires_at,
          };
          console.log('[UserRoleManagement] Transformed role:', JSON.stringify(transformed));
          return transformed;
        });
        setSelectedUser({
          ...selectedUser,
          roles: transformedRoles,
        });
      }
      
      // Refresh users list to update max role level
      fetchData();
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

    if (!roleId) {
      console.error('[UserRoleManagement] Cannot remove role: roleId is undefined');
      alert('Error: Role ID is missing. Please refresh the page and try again.');
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
        // Transform UserRole[] to UserRoleSimple[] to match new backend structure
        const transformedRoles = (userRolesResponse || []).map((ur) => {
          console.log('[UserRoleManagement] Transforming user role:', JSON.stringify(ur));
          const transformed = {
            id: ur.id,
            roleId: ur.role_id,
            name: ur.role_name,
            description: ur.role_description,
            hierarchy_level: ur.hierarchy_level,
            assigned_at: ur.assigned_at,
            expiresAt: ur.expires_at,
          };
          console.log('[UserRoleManagement] Transformed role:', JSON.stringify(transformed));
          return transformed;
        });
        setSelectedUser({
          ...selectedUser,
          roles: transformedRoles,
        });
      }
      
      // Refresh users list to update max role level
      fetchData();
    } catch (error: any) {
      console.error('[UserRoleManagement] Error removing role:', error);
      setError(error.message || 'Failed to remove role');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingUserId(userId);
      setError('');
      setSuccess('');

      await rbacApi.users.delete(userId);

      setSuccess('User deleted successfully');
      
      // Refresh users list
      fetchData();
      
      // Close user details panel if open
      if (selectedUser?.id === userId) {
        setSelectedUser(null);
      }
    } catch (error: any) {
      console.error('[UserRoleManagement] Error deleting user:', error);
      setError(error.message || 'Failed to delete user');
    } finally {
      setDeletingUserId(null);
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

  // Password strength validation
  const getPasswordStrength = (password: string): PasswordStrength => {
    if (!password) return 'weak';
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    if (strength <= 2) return 'weak';
    if (strength <= 3) return 'fair';
    if (strength <= 4) return 'good';
    return 'strong';
  };

  const getPasswordStrengthColor = (strength: PasswordStrength): string => {
    switch (strength) {
      case 'weak': return 'bg-red-500';
      case 'fair': return 'bg-yellow-500';
      case 'good': return 'bg-blue-500';
      case 'strong': return 'bg-green-500';
    }
  };

  const getPasswordStrengthText = (strength: PasswordStrength): string => {
    switch (strength) {
      case 'weak': return 'Weak';
      case 'fair': return 'Fair';
      case 'good': return 'Good';
      case 'strong': return 'Strong';
    }
  };

  // Form validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    // Phone validation (optional)
    if (formData.phone && !/^[\d\s\-\+\(\)]{10,}$/.test(formData.phone)) {
      errors.phone = 'Invalid phone format';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (getPasswordStrength(formData.password) === 'weak') {
      errors.password = 'Password is too weak';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // First name validation
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    // Roles validation
    if (formData.roleIds.length === 0) {
      errors.roleIds = 'At least one role must be selected';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setCreating(true);
      setError('');
      setSuccess('');

      const userData: CreateUserData = {
        email: formData.email,
        phone: formData.phone || undefined,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        roleIds: formData.roleIds,
      };

      await rbacApi.users.create(userData);

      setSuccess('User created successfully');
      setShowCreateUserModal(false);
      resetCreateUserForm();
      
      // Refresh users list
      fetchData();
    } catch (error: any) {
      console.error('[UserRoleManagement] Error creating user:', error);
      if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
        setError('A user with this email or phone already exists');
      } else if (error.message?.includes('403') || error.message?.includes('insufficient')) {
        setError('You do not have permission to create users');
      } else {
        setError(error.message || 'Failed to create user');
      }
    } finally {
      setCreating(false);
    }
  };

  const resetCreateUserForm = () => {
    setFormData({
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      roleIds: [],
    });
    setValidationErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const toggleRoleSelection = (roleId: string) => {
    setFormData(prev => {
      const newRoleIds = prev.roleIds.includes(roleId)
        ? prev.roleIds.filter(id => id !== roleId)
        : [...prev.roleIds, roleId];
      return { ...prev, roleIds: newRoleIds };
    });
    // Clear validation error when roles are selected
    if (validationErrors.roleIds) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.roleIds;
        return newErrors;
      });
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.phone && user.phone.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole =
      roleFilter === 'all' ||
      user.roles.some((role) => role.name === roleFilter);

    return matchesSearch && matchesRole;
  });

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
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
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCreateUserModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Create User
          </button>
          <Link
            href="/admin"
            className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </Link>
        </div>
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
      <div className="flex items-center justify-between bg-white border rounded-lg p-4">
        <div className="flex items-center space-x-4">
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
            {totalUsers} users
          </div>
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
          <div className="overflow-x-auto">
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
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
                      <div className="flex flex-wrap gap-1">
                        {user.roles.length > 0 ? (
                          user.roles.map((userRole) => (
                            <span
                              key={userRole.id}
                              className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                            >
                              {getRoleDisplayName(userRole.name)}
                            </span>
                          ))
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium border border-gray-300">
                            No Role
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        Level {user.maxRoleLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            toggleExpand(user.id);
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          Manage Roles
                        </button>
                        
                        <button
                          onClick={() => handleDeleteUser(user.id, `${user.firstName} ${user.lastName}`)}
                          disabled={deletingUserId === user.id}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors text-sm flex items-center"
                        >
                          {deletingUserId === user.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages} ({totalUsers} users)
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      )}

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
              <X className="w-5 h-5 text-gray-600" />
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
                          {getRoleDisplayName(userRole.name)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Level {userRole.hierarchy_level}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>{formatDate(userRole.assigned_at)}</span>
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

      {/* Create User Modal */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <UserPlus className="w-5 h-5 mr-2" />
                    Create New User
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Create a new user and assign roles
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowCreateUserModal(false);
                    resetCreateUserForm();
                  }}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleCreateUser} className="space-y-4">
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => {
                        setFormData({ ...formData, firstName: e.target.value });
                        if (validationErrors.firstName) {
                          setValidationErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.firstName;
                            return newErrors;
                          });
                        }
                      }}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        validationErrors.firstName ? 'border-red-300' : 'border-gray-300'
                      }`}
                      required
                    />
                    {validationErrors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => {
                        setFormData({ ...formData, lastName: e.target.value });
                        if (validationErrors.lastName) {
                          setValidationErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.lastName;
                            return newErrors;
                          });
                        }
                      }}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        validationErrors.lastName ? 'border-red-300' : 'border-gray-300'
                      }`}
                      required
                    />
                    {validationErrors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.lastName}</p>
                    )}
                  </div>
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (validationErrors.email) {
                        setValidationErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.email;
                          return newErrors;
                        });
                      }
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    required
                  />
                  {validationErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                  )}
                </div>

                {/* Phone Field */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value });
                      if (validationErrors.phone) {
                        setValidationErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.phone;
                          return newErrors;
                        });
                      }
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.phone ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.phone && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={formData.password}
                      onChange={(e) => {
                        setFormData({ ...formData, password: e.target.value });
                        if (validationErrors.password) {
                          setValidationErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.password;
                            return newErrors;
                          });
                        }
                      }}
                      className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        validationErrors.password ? 'border-red-300' : 'border-gray-300'
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getPasswordStrengthColor(getPasswordStrength(formData.password))}`}
                            style={{
                              width: getPasswordStrength(formData.password) === 'weak' ? '25%' :
                                     getPasswordStrength(formData.password) === 'fair' ? '50%' :
                                     getPasswordStrength(formData.password) === 'good' ? '75%' : '100%'
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-600">
                          {getPasswordStrengthText(getPasswordStrength(formData.password))}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Use 8+ characters with a mix of letters, numbers, and symbols
                      </p>
                    </div>
                  )}
                  {validationErrors.password && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={(e) => {
                        setFormData({ ...formData, confirmPassword: e.target.value });
                        if (validationErrors.confirmPassword) {
                          setValidationErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.confirmPassword;
                            return newErrors;
                          });
                        }
                      }}
                      className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        validationErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {validationErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.confirmPassword}</p>
                  )}
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <div className="mt-1 flex items-center text-sm text-green-600">
                      <Check className="w-4 h-4 mr-1" />
                      Passwords match
                    </div>
                  )}
                </div>

                {/* Roles Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Roles <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {roles.map((role) => (
                      <label
                        key={role.id}
                        className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={formData.roleIds.includes(role.id)}
                          onChange={() => toggleRoleSelection(role.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="ml-3 flex-1">
                          <div className="font-medium text-gray-900">
                            {getRoleDisplayName(role.name)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Level {role.hierarchy_level} - {role.description}
                          </div>
                        </div>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          Level {role.hierarchy_level}
                        </span>
                      </label>
                    ))}
                  </div>
                  {validationErrors.roleIds && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.roleIds}</p>
                  )}
                </div>

                {/* Form Actions */}
                <div className="flex space-x-3 pt-4 border-t">
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
                  >
                    {creating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Create User
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateUserModal(false);
                      resetCreateUserForm();
                    }}
                    disabled={creating}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(UserRoleManagementPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
