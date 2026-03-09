'use client';

import React, { useEffect, useState } from 'react';
import {
  Search,
  Download,
  RefreshCw,
  ShoppingCart,
  Heart,
  ArrowRight,
  ArrowLeft,
  Clock,
  AlertTriangle,
  User,
  Mail,
} from 'lucide-react';
import { useAdminCartWishlistStore } from '@/store/adminCartWishlistStore';
import { withAuth } from '@/components/auth/withAuth';

interface UserBehaviorTrackerProps {
  language?: 'en' | 'bn';
}

const UserBehaviorTracker: React.FC<UserBehaviorTrackerProps> = ({ language = 'en' }) => {
  const {
    userBehavior,
    isLoading,
    error,
    searchUsers,
    fetchUserBehavior,
    clearError,
  } = useAdminCartWishlistStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchUsers(searchQuery);
        setShowResults(true);
      } else {
        setShowResults(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectUser = (userId: string) => {
    fetchUserBehavior(userId);
    setShowResults(false);
    setSearchQuery('');
  };

  const handleExport = () => {
    if (!userBehavior.selectedUser) return;

    const data = JSON.stringify(userBehavior.selectedUser, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user_behavior_${userBehavior.selectedUser.userId}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    if (document.body && a.parentNode === document.body) { document.body.removeChild(a); }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const translations = {
    en: {
      title: 'User Behavior Tracker',
      subtitle: 'Track individual user cart-wishlist behavior',
      searchPlaceholder: 'Search users by email or name...',
      search: 'Search',
      export: 'Export',
      refresh: 'Refresh',
      loading: 'Loading...',
      error: 'Error loading user data',
      retry: 'Retry',
      
      // User Info
      userInfo: 'User Information',
      cartActivity: 'Cart Activity',
      wishlistActivity: 'Wishlist Activity',
      moveHistory: 'Move History',
      syncHistory: 'Sync History',
      conflicts: 'Conflicts',
      
      // Stats
      totalAdds: 'Total Adds',
      totalRemoves: 'Total Removes',
      currentItems: 'Current Items',
      
      // Move Types
      cartToWishlist: 'Cart to Wishlist',
      wishlistToCart: 'Wishlist to Cart',
      
      // Status
      completed: 'Completed',
      failed: 'Failed',
      pending: 'Pending',
      
      // Empty states
      noUserSelected: 'Select a user to view their behavior data',
      noSearchResults: 'No users found',
      noMoveHistory: 'No move history',
      noSyncHistory: 'No sync history',
      noConflicts: 'No conflicts',
    },
    bn: {
      title: 'ব্যবহারকারী আচরণ ট্র্যাকার',
      subtitle: 'ব্যক্তিগত ব্যবহারকারীর কার্ট-উইশলিস্ট আচরণ ট্র্যাক করুন',
      searchPlaceholder: 'ইমেল বা নাম দিয়ে ব্যবহারকারী অনুসন্ধান করুন...',
      search: 'অনুসন্ধান',
      export: 'রপ্তানি',
      refresh: 'রিফ্রেশ',
      loading: 'লোড হচ্ছে...',
      error: 'ব্যবহারকারী ডেটা লোড করতে সমস্যা',
      retry: 'পুনরায় চেষ্টা করুন',
      
      // User Info
      userInfo: 'ব্যবহারকারী তথ্য',
      cartActivity: 'কার্ট অ্যাক্টিভিটি',
      wishlistActivity: 'উইশলিস্ট অ্যাক্টিভিটি',
      moveHistory: 'মুভ ইতিহাস',
      syncHistory: 'সিঙ্ক ইতিহাস',
      conflicts: 'কনফ্লিক্ট',
      
      // Stats
      totalAdds: 'মোট যোগ',
      totalRemoves: 'মোট অপসারণ',
      currentItems: 'বর্তমান আইটেম',
      
      // Move Types
      cartToWishlist: 'কার্ট থেকে উইশলিস্ট',
      wishlistToCart: 'উইশলিস্ট থেকে কার্ট',
      
      // Status
      completed: 'সম্পন্ন',
      failed: 'ব্যর্থ',
      pending: 'মুলতুবি',
      
      // Empty states
      noUserSelected: 'ব্যবহারকারী আচরণ ডেটা দেখতে একজন ব্যবহারকারী নির্বাচন করুন',
      noSearchResults: 'কোন ব্যবহারকারী পাওয়া যায়নি',
      noMoveHistory: 'কোন মুভ ইতিহাস',
      noSyncHistory: 'কোন সিঙ্ক ইতিহাস',
      noConflicts: 'কোন কনফ্লিক্ট',
    }
  };

  const t = translations[language];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
          <p className="text-gray-600 mt-1">{t.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (userBehavior.selectedUser) {
                fetchUserBehavior(userBehavior.selectedUser.userId);
              }
            }}
            disabled={isLoading || !userBehavior.selectedUser}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {t.refresh}
          </button>
          <button
            onClick={handleExport}
            disabled={!userBehavior.selectedUser}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {t.export}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-red-700">{t.error}: {error}</p>
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={() => {
                  clearError();
                  if (userBehavior.selectedUser) {
                    fetchUserBehavior(userBehavior.selectedUser.userId);
                  }
                }}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                {t.retry}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Search Results Dropdown */}
        {showResults && userBehavior.searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
            {userBehavior.searchResults.map((user) => (
              <button
                key={user.userId}
                onClick={() => handleSelectUser(user.userId)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.userName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {showResults && userBehavior.searchResults.length === 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500 text-center">{t.noSearchResults}</p>
          </div>
        )}
      </div>

      {/* User Behavior Data */}
      {userBehavior.selectedUser ? (
        <div className="space-y-6">
          {/* User Info Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.userInfo}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="text-lg font-medium text-gray-900">
                  {userBehavior.selectedUser.userName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-lg font-medium text-gray-900">
                  {userBehavior.selectedUser.email}
                </p>
              </div>
            </div>
          </div>

          {/* Cart Activity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              {t.cartActivity}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">{t.totalAdds}</p>
                <p className="text-2xl font-bold text-blue-600">
                  {userBehavior.selectedUser.cartActivity.totalAdds}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t.totalRemoves}</p>
                <p className="text-2xl font-bold text-red-600">
                  {userBehavior.selectedUser.cartActivity.totalRemoves}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t.currentItems}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {userBehavior.selectedUser.cartActivity.currentCartItems}
                </p>
              </div>
            </div>
          </div>

          {/* Wishlist Activity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-600" />
              {t.wishlistActivity}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">{t.totalAdds}</p>
                <p className="text-2xl font-bold text-pink-600">
                  {userBehavior.selectedUser.wishlistActivity.totalAdds}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t.totalRemoves}</p>
                <p className="text-2xl font-bold text-red-600">
                  {userBehavior.selectedUser.wishlistActivity.totalRemoves}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t.currentItems}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {userBehavior.selectedUser.wishlistActivity.currentWishlistItems}
                </p>
              </div>
            </div>
          </div>

          {/* Move History */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.moveHistory}</h3>
            {userBehavior.selectedUser.moveHistory.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">{t.noMoveHistory}</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {userBehavior.selectedUser.moveHistory.map((move, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className={`p-2 rounded-full ${
                      move.type === 'cart_to_wishlist' ? 'bg-pink-100' : 'bg-blue-100'
                    }`}>
                      {move.type === 'cart_to_wishlist' ? (
                        <ArrowRight className="h-4 w-4 text-pink-600" />
                      ) : (
                        <ArrowLeft className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {move.productName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {move.type === 'cart_to_wishlist' ? t.cartToWishlist : t.wishlistToCart}
                      </p>
                      <p className="text-xs text-gray-400">
                        Qty: {move.quantity}
                      </p>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(move.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sync History */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.syncHistory}</h3>
            {userBehavior.selectedUser.syncHistory.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">{t.noSyncHistory}</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {userBehavior.selectedUser.syncHistory.map((sync, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        sync.status === 'completed' ? 'text-green-600 bg-green-100' :
                        sync.status === 'failed' ? 'text-red-600 bg-red-100' :
                        'text-yellow-600 bg-yellow-100'
                      }`}>
                        {sync.status}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(sync.lastSyncAt)}
                      </div>
                    </div>
                    {sync.errorMessage && (
                      <p className="text-xs text-red-600">{sync.errorMessage}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Conflicts */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              {t.conflicts}
            </h3>
            {userBehavior.selectedUser.conflicts.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">{t.noConflicts}</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {userBehavior.selectedUser.conflicts.map((conflict, index) => (
                  <div key={index} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{conflict.type}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(conflict.createdAt)}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        conflict.status === 'resolved' ? 'text-green-600 bg-green-100' :
                        conflict.status === 'failed' ? 'text-red-600 bg-red-100' :
                        'text-yellow-600 bg-yellow-100'
                      }`}>
                        {conflict.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-lg text-gray-600">{t.noUserSelected}</p>
        </div>
      )}
    </div>
  );
};

export default withAuth(UserBehaviorTracker, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/unauthorized',
});
