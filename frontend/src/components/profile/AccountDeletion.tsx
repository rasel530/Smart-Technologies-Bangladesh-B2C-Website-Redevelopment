'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  AlertTriangle, 
  Trash2, 
  Lock, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  ShoppingBag, 
  Star,
  Bell,
  Shield,
  Loader2,
  Check,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { AccountDeletionAPI, AccountDeletionStatus } from '@/lib/api/profile';
import { removeToken } from '@/lib/api/client';

interface AccountDeletionProps {
  language: 'en' | 'bn';
}

const AccountDeletion: React.FC<AccountDeletionProps> = ({ language }) => {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [deletionStatus, setDeletionStatus] = useState<AccountDeletionStatus | null>(null);

  useEffect(() => {
    loadDeletionStatus();
  }, []);

  const loadDeletionStatus = async () => {
    setIsCheckingStatus(true);
    setError(null);

    try {
      const response = await AccountDeletionAPI.getDeletionStatus();
      setDeletionStatus(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load deletion status');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!password || !confirmed) {
      setError('Please enter your password and confirm the deletion');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await AccountDeletionAPI.deleteAccount(password);
      setSuccess(true);
      
      // Clear authentication token
      removeToken();
      
      // Redirect to home page after 3 seconds
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to delete account');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingStatus) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
      </div>
    );
  }

  if (deletionStatus?.isDeleted) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Check className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {language === 'en' ? 'Account Deleted' : 'অ্যাকাউন্ট মুছে ফেলা হয়েছে'}
            </h2>
            <p className="text-gray-600">
              {language === 'en'
                ? 'Your account has been permanently deleted. You will be redirected to the home page shortly.'
                : 'আপনার অ্যাকাউন্ট স্থায়ীভাবে মুছে ফেলা হয়েছে। আপনি শীঘ্রই হোম পেজে পুনঃনির্দেশিত হবেন।'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
          <Trash2 className="h-6 w-6 text-red-600" />
          <span>{language === 'en' ? 'Delete Account' : 'অ্যাকাউন্ট মুছে ফেলুন'}</span>
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          {language === 'en'
            ? 'Permanently delete your account and all associated data. This action cannot be undone.'
            : 'আপনার অ্যাকাউন্ট এবং সমস্ত সম্পর্কিত তথ্য স্থায়ীভাবে মুছে ফেলুন। এই ক্রিয়াটি পূর্বাবস্থায় ফেরানো যাবে না।'}
        </p>
      </div>

      {/* Warning Banner */}
      <div className="flex items-start space-x-3 bg-red-50 border border-red-200 rounded-md p-4">
        <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-red-900 mb-1">
            {language === 'en' ? 'Warning: Irreversible Action' : 'সতর্কতা: অপরিবর্তনীয় ক্রিয়া'}
          </h3>
          <p className="text-sm text-red-800">
            {language === 'en'
              ? 'Once you delete your account, there is no going back. Please be certain.'
              : 'একবার আপনি আপনার অ্যাকাউন্ট মুছে ফেললে, আর ফিরে যাওয়ার উপায় নেই। অনুগ্রহ করে নিশ্চিত হন।'}
          </p>
        </div>
      </div>

      {/* Active Orders Warning */}
      {deletionStatus?.hasActiveOrders && (
        <div className="flex items-start space-x-3 bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <ShoppingBag className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-900 mb-1">
              {language === 'en' ? 'Active Orders Detected' : 'সক্রিয় অর্ডার সনাক্ত হয়েছে'}
            </h3>
            <p className="text-sm text-yellow-800 mb-2">
              {language === 'en'
                ? `You have ${deletionStatus.activeOrdersCount} active order(s). Please complete or cancel your orders before deleting your account.`
                : `আপনার ${deletionStatus.activeOrdersCount} টি সক্রিয় অর্ডার আছে। অ্যাকাউন্ট মুছে ফেলার আগে অনুগ্রহ করে আপনার অর্ডারগুলি সম্পন্ন বা বাতিল করুন।`}
            </p>
            {deletionStatus.activeOrders.length > 0 && (
              <div className="mt-2 space-y-1">
                {deletionStatus.activeOrders.map((order) => (
                  <div key={order.id} className="text-xs bg-white p-2 rounded border border-yellow-300">
                    <span className="font-medium">{order.orderNumber}</span>
                    <span className="ml-2 text-yellow-700">({order.status})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Data to be Deleted */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {language === 'en' ? 'Data That Will Be Deleted' : 'যে তথ্য মুছে ফেলা হবে'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
            <User className="h-5 w-5 text-gray-600" />
            <span className="text-sm text-gray-700">
              {language === 'en' ? 'Profile Information' : 'প্রোফাইল তথ্য'}
            </span>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
            <Mail className="h-5 w-5 text-gray-600" />
            <span className="text-sm text-gray-700">
              {language === 'en' ? 'Email Address' : 'ইমেল ঠিকানা'}
            </span>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
            <Phone className="h-5 w-5 text-gray-600" />
            <span className="text-sm text-gray-700">
              {language === 'en' ? 'Phone Number' : 'ফোন নম্বর'}
            </span>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
            <MapPin className="h-5 w-5 text-gray-600" />
            <span className="text-sm text-gray-700">
              {language === 'en' ? 'All Addresses' : 'সমস্ত ঠিকানা'}
            </span>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
            <ShoppingBag className="h-5 w-5 text-gray-600" />
            <span className="text-sm text-gray-700">
              {language === 'en' ? 'Shopping Cart' : 'শপিং কার্ট'}
            </span>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
            <Star className="h-5 w-5 text-gray-600" />
            <span className="text-sm text-gray-700">
              {language === 'en' ? 'Wishlist' : 'উইশলিস্ট'}
            </span>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="text-sm text-gray-700">
              {language === 'en' ? 'Notification Preferences' : 'নোটিফিকেশন পছন্দ'}
            </span>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
            <Shield className="h-5 w-5 text-gray-600" />
            <span className="text-sm text-gray-700">
              {language === 'en' ? 'Privacy Settings' : 'গোপনীয়তা সেটিংস'}
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {language === 'en'
            ? 'Note: Your order history and reviews will be retained for audit purposes but will not be associated with your account.'
            : 'নোট: আপনার অর্ডার ইতিহাস এবং রিভিউ অডিট উদ্দেশ্যে সংরক্ষিত থাকবে কিন্তু আপনার অ্যাকাউন্টের সাথে যুক্ত থাকবে না।'}
        </p>
      </div>

      {/* Deletion Form */}
      <div className="space-y-4 p-4 bg-gray-50 rounded-md">
        <h3 className="text-lg font-semibold text-gray-900">
          {language === 'en' ? 'Confirm Deletion' : 'মোছার নিশ্চিতকরণ'}
        </h3>

        {/* Password Input */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            {language === 'en' ? 'Password' : 'পাসওয়ার্ড'}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading || deletionStatus?.hasActiveOrders}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder={language === 'en' ? 'Enter your password' : 'আপনার পাসওয়ার্ড লিখুন'}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {language === 'en'
              ? 'Enter your password to confirm account deletion'
              : 'অ্যাকাউন্ট মোছার নিশ্চিতকরণের জন্য আপনার পাসওয়ার্ড লিখুন'}
          </p>
        </div>

        {/* Confirmation Checkbox */}
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="confirm"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            disabled={isLoading || deletionStatus?.hasActiveOrders}
            className="mt-1 h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <label htmlFor="confirm" className="text-sm text-gray-700">
            {language === 'en'
              ? 'I understand that this action cannot be undone and I want to permanently delete my account'
              : 'আমি বুঝতে পারছি যে এই ক্রিয়াটি পূর্বাবস্থায় ফেরানো যাবে না এবং আমি আমার অ্যাকাউন্ট স্থায়ীভাবে মুছে ফেলতে চাই'}
          </label>
        </div>

        {/* Delete Button */}
        <button
          onClick={handleDeleteAccount}
          disabled={!password || !confirmed || isLoading || deletionStatus?.hasActiveOrders}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-600"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>{language === 'en' ? 'Deleting Account...' : 'অ্যাকাউন্ট মুছে ফেলা হচ্ছে...'}</span>
            </>
          ) : (
            <>
              <Trash2 className="h-5 w-5" />
              <span>{language === 'en' ? 'Delete Account Permanently' : 'অ্যাকাউন্ট স্থায়ীভাবে মুছে ফেলুন'}</span>
            </>
          )}
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="flex items-center space-x-2 bg-green-50 border border-green-200 rounded-md p-4">
          <Check className="h-5 w-5 text-green-600" />
          <p className="text-sm text-green-800">
            {language === 'en'
              ? 'Account deleted successfully! You will be redirected to the home page shortly.'
              : 'অ্যাকাউন্ট সফলভাবে মুছে ফেলা হয়েছে! আপনি শীঘ্রই হোম পেজে পুনঃনির্দেশিত হবেন।'}
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-start space-x-2 bg-red-50 border border-red-200 rounded-md p-4">
          <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Additional Information */}
      <div className="flex items-start space-x-3 bg-blue-50 border border-blue-200 rounded-md p-4">
        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-blue-900 mb-1">
            {language === 'en' ? 'Need Help?' : 'সাহায্য প্রয়োজন?'}
          </h4>
          <p className="text-sm text-blue-800">
            {language === 'en'
              ? 'If you have any questions or concerns about deleting your account, please contact our support team.'
              : 'আপনার অ্যাকাউন্ট মুছে ফেলা সম্পর্কে কোনো প্রশ্ন বা উদ্বেগ থাকলে, অনুগ্রহ করে আমাদের সমর্থন দলের সাথে যোগাযোগ করুন।'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccountDeletion;
