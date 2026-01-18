'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { CorporateUserAPI } from '@/lib/api/corporate';
import { CorporateUser, CorporateUserRole } from '@/types/corporate';
import { useCorporateAccount } from '@/hooks/useCorporateAccount';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Shield,
  Clock,
  Building2,
} from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const CorporateUsersPage = () => {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { accountId, isLoading: accountLoading, error: accountError } = useCorporateAccount();
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userSuccess, setUserSuccess] = useState<string | null>(null);
  const [users, setUsers] = useState<CorporateUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<CorporateUser | null>(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activityLog, setActivityLog] = useState<any[]>([]);
  
  // Add User form state
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('REQUESTER');
  const [newUserExpiresDate, setNewUserExpiresDate] = useState('');
  
  // Edit User form state
  const [editUserRole, setEditUserRole] = useState('');
  const [editUserIsActive, setEditUserIsActive] = useState(true);
  const [editUserExpiresDate, setEditUserExpiresDate] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      if (!accountId) return;

      try {
        setIsLoading(true);
        const userData = await CorporateUserAPI.getUsers(accountId);
        setUsers(userData);
      } catch (err: any) {
        setError(err.message || (language === 'en' ? 'Failed to load users' : 'ব্যবহার লোগ করতে হবেন'));
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [accountId]);

  const filteredUsers = users.filter(u => {
    if (roleFilter === 'ALL') return true;
    return u.role === roleFilter;
  });

  const handleAddUser = () => {
    setShowAddUserModal(true);
  };

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId || !newUserEmail || !newUserRole) return;

    try {
      setIsLoading(true);
      
      // Find user by email
      const usersResponse = await fetch(`/api/users?email=${newUserEmail}`);
      const usersData = await usersResponse.json();
      
      if (!usersData.success || !usersData.data.users.length) {
        setError('User not found with this email');
        setIsLoading(false);
        return;
      }

      const userToAdd = usersData.data.users[0];
      
      // Add user to corporate account
      await CorporateUserAPI.addUser(accountId, {
        userId: userToAdd.id,
        role: newUserRole
      });

      // Refresh users list
      const userData = await CorporateUserAPI.getUsers(accountId);
      setUsers(userData);
      
      setShowAddUserModal(false);
      setNewUserEmail('');
      setNewUserRole('REQUESTER');
      setNewUserExpiresDate('');
      setUserSuccess('User added successfully');
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to add user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = (user: CorporateUser) => {
    setSelectedUser(user);
    setEditUserRole(user.role);
    setEditUserIsActive(user.status === 'ACTIVE');
    setEditUserExpiresDate('');
    setShowEditUserModal(true);
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId || !selectedUser) return;

    try {
      setIsLoading(true);
      
      await CorporateUserAPI.updateUserRole(accountId, selectedUser.userId, editUserRole);

      // Refresh users list
      const userData = await CorporateUserAPI.getUsers(accountId);
      setUsers(userData);
      
      setShowEditUserModal(false);
      setSelectedUser(null);
      setUserSuccess('User updated successfully');
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveUser = (user: CorporateUser) => {
    setSelectedUser(user);
    setShowRemoveModal(true);
  };

  const handleViewActivity = (user: CorporateUser) => {
    setSelectedUser(user);
    setActivityLog([
      { action: 'Account Created',
        timestamp: new Date().toISOString(),
        details: `User ${user.user.firstName} ${user.user.lastName} was added to corporate account`,
      },
      { action: 'Role Changed',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        details: `Role changed from ${user.role} to ${user.role}`,
      },
    ]);
    setShowActivityModal(true);
  };

  const handleRemoveUserConfirm = async () => {
    if (!selectedUser) return;

    try {
      setIsLoading(true);
      await CorporateUserAPI.removeUser(accountId!, selectedUser.id);
      
      // Remove from local state
      setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
      setShowRemoveModal(false);
      setSelectedUser(null);
      setError(null);
    } catch (err: any) {
      setError(err.message || (language === 'en' ? 'Failed to remove user' : 'ব্যবহার লোগ করতে হবেন'));
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadgeColor = (role: CorporateUserRole) => {
    switch (role) {
      case 'CORPORATE_ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'APPROVER':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'REQUESTER':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRoleBadgeText = (role: CorporateUserRole) => {
    switch (role) {
      case 'CORPORATE_ADMIN':
        return language === 'en' ? 'Admin' : 'অ্যাক';
      case 'APPROVER':
        return language === 'en' ? 'Approver' : 'অনুমতিক';
      case 'REQUESTER':
        return language === 'en' ? 'Requester' : 'অনুমতিক';
      default:
        return language === 'en' ? 'User' : 'ব্যবহার';
    }
  };

  if (!currentUser || accountLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (accountError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{accountError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Building2 className="w-8 h-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                {language === 'en' ? 'Corporate User Management' : 'কর্পোরেট ব্যবহার ব্যবহার'}
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  language === 'en'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('bn')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  language === 'bn'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                বাংলা
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {userSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-800">{userSuccess}</p>
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1 w-full md:w-1/3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={language === 'en' ? 'Search users...' : 'ব্যবহার অনুমতিক...'}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {language === 'en' ? 'Filter by role:' : 'ভূমিক দ্বার অনুমতিক:'}
              </span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="ALL">{language === 'en' ? 'All Roles' : 'সবর ভূমিক'}</option>
                <option value="CORPORATE_ADMIN">{language === 'en' ? 'Corporate Admin' : 'কর্পোরেট অ্যাক'}</option>
                <option value="APPROVER">{language === 'en' ? 'Approver' : 'অনুমতিক'}</option>
                <option value="REQUESTER">{language === 'en' ? 'Requester' : 'অনুমতিক'}</option>
              </select>
            </div>

            <button
              onClick={handleAddUser}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              <UserPlus className="w-5 h-5" />
              <span className="font-medium">
                {language === 'en' ? 'Add User' : 'ব্যবহার যোগ'}
              </span>
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {language === 'en' ? 'User' : 'ব্যবহার'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {language === 'en' ? 'Email' : 'ইমেইল'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {language === 'en' ? 'Role' : 'ভূমিক'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {language === 'en' ? 'Status' : 'অবস্থা'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {language === 'en' ? 'Actions' : 'কার্য়'}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm">
                      {language === 'en' ? 'No users found' : 'কোন ব্যবহার পাও'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((corporateUser) => (
                  <tr key={corporateUser.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold">
                          {corporateUser.user.firstName.charAt(0)}
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {corporateUser.user.firstName} {corporateUser.user.lastName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {corporateUser.user.email || '-'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">
                        {corporateUser.user.email || '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(corporateUser.role as CorporateUserRole)}`}>
                        {getRoleBadgeText(corporateUser.role as CorporateUserRole)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${corporateUser.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {corporateUser.status}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewActivity(corporateUser)}
                          className="text-blue-600 hover:text-blue-700 transition-colors"
                          title={language === 'en' ? 'View Activity' : 'কার্য়'}
                        >
                          <Clock className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditUser(corporateUser)}
                          className="text-gray-600 hover:text-gray-800 transition-colors"
                          title={language === 'en' ? 'Edit Role' : 'ভূমিক পরিবর'}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {(corporateUser.role !== 'CORPORATE_ADMIN' || corporateUser.userId !== currentUser?.id) && (
                          <button
                            onClick={() => handleRemoveUser(corporateUser)}
                            className="text-red-600 hover:text-red-700 transition-colors"
                            title={language === 'en' ? 'Remove User' : 'ব্যবহার লোগ'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Add User Modal */}
        {showAddUserModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {language === 'en' ? 'Add New User' : 'নতুন ব্যবহার যোগ'}
                </h2>
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <span className="sr-only">{language === 'en' ? 'Close' : 'বন্ধন'}</span>
                </button>
              </div>

              <form onSubmit={handleAddUserSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'en' ? 'User Email' : 'ব্যবহার ইমেইল'}
                  </label>
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder={language === 'en' ? 'Enter email address' : 'ইমেইল ঠিকানা লিখুন'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'en' ? 'Role' : 'ভূমিক'}
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="REQUESTER">{language === 'en' ? 'Requester' : 'অনুমতিক'}</option>
                    <option value="APPROVER">{language === 'en' ? 'Approver' : 'অনুমতিক'}</option>
                    <option value="CORPORATE_ADMIN">{language === 'en' ? 'Corporate Admin' : 'কর্পোরেট অ্যাক'}</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner />
                      <span>{language === 'en' ? 'Adding...' : 'যোগ হচ্ছে...'}</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      <span className="font-medium">
                        {language === 'en' ? 'Add User' : 'ব্যবহার যোগ'}
                      </span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditUserModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {language === 'en' ? 'Edit User Role' : 'ব্যবহার ভূমিক পরিবর'}
                </h2>
                <button
                  onClick={() => setShowEditUserModal(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <span className="sr-only">{language === 'en' ? 'Close' : 'বন্ধন'}</span>
                </button>
              </div>

              <form onSubmit={handleEditUserSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'en' ? 'User' : 'ব্যবহার'}
                  </label>
                  <p className="text-gray-900 font-medium">
                    {selectedUser.user.firstName} {selectedUser.user.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{selectedUser.user.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'en' ? 'Role' : 'ভূমিক'}
                  </label>
                  <select
                    value={editUserRole}
                    onChange={(e) => setEditUserRole(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="REQUESTER">{language === 'en' ? 'Requester' : 'অনুমতিক'}</option>
                    <option value="APPROVER">{language === 'en' ? 'Approver' : 'অনুমতিক'}</option>
                    <option value="CORPORATE_ADMIN">{language === 'en' ? 'Corporate Admin' : 'কর্পোরেট অ্যাক'}</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="editUserIsActive"
                    checked={editUserIsActive}
                    onChange={(e) => setEditUserIsActive(e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="editUserIsActive" className="text-sm font-medium text-gray-700">
                    {language === 'en' ? 'Active' : 'সক্রিয়'}
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'en' ? 'Expiration Date (Optional)' : 'মেয়াদ শেষ (ঐচ্ছিক)'}
                  </label>
                  <input
                    type="date"
                    value={editUserExpiresDate}
                    onChange={(e) => setEditUserExpiresDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner />
                      <span>{language === 'en' ? 'Saving...' : 'সংরক্ষণ হচ্ছে...'}</span>
                    </>
                  ) : (
                    <>
                      <Edit className="w-5 h-5" />
                      <span className="font-medium">
                        {language === 'en' ? 'Save Changes' : 'পরিবর্তন সংরক্ষণ'}
                      </span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Remove User Confirmation Modal */}
        {showRemoveModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {language === 'en' ? 'Remove User' : 'ব্যবহার লোগ'}
                </h2>
                <button
                  onClick={() => setShowRemoveModal(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <span className="sr-only">{language === 'en' ? 'Close' : 'বন্ধন'}</span>
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  {language === 'en'
                    ? `Are you sure you want to remove ${selectedUser.user.firstName} ${selectedUser.user.lastName} from corporate account?`
                    : `আপনি নিশ্চিত করতে হবেন থেকে থেকে ${selectedUser.user.firstName} ${selectedUser.user.lastName} কর্পোরেট অ্যাক ব্যবহার লোগ করতে হবেন?`}
                </p>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setShowRemoveModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  {language === 'en' ? 'Cancel' : 'বাত'}
                </button>
                <button
                  onClick={handleRemoveUserConfirm}
                  disabled={isLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner />
                      <span>{language === 'en' ? 'Removing...' : 'সরিয়া হচ্ছে...'}</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5" />
                      <span className="font-medium">
                        {language === 'en' ? 'Remove' : 'সরিয়া'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Activity Modal */}
        {showActivityModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {language === 'en' ? 'User Activity' : 'ব্যবহার কার্য়'}
                </h2>
                <button
                  onClick={() => setShowActivityModal(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <span className="sr-only">{language === 'en' ? 'Close' : 'বন্ধন'}</span>
                </button>
              </div>

              <div className="space-y-4">
                {activityLog.map((activity, index) => (
                  <div key={index} className="p-4 border-b border-gray-200">
                    <div className="flex items-start space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getRoleBadgeColor(selectedUser.role as CorporateUserRole)}`}>
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{activity.details}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.timestamp).toLocaleString('en-BD')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CorporateUsersPage;
