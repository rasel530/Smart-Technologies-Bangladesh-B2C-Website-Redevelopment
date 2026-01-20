'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { CorporateAPI, NotificationAPI } from '@/lib/api/corporate';
import { CorporateDashboardStats, CorporateStatus, Notification } from '@/types/corporate';
import { useCorporateAccount } from '@/hooks/useCorporateAccount';
import {
  Building2,
  FileText,
  ShoppingBag,
  Users,
  CreditCard,
  Bell,
  Plus,
  CheckCircle,
  AlertCircle,
  Download,
} from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const CorporateDashboardPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { accountId, isLoading: accountLoading, error: accountError } = useCorporateAccount();
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardStats, setDashboardStats] = useState<CorporateDashboardStats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchDashboardData = async () => {
    if (!accountId) return;

    setIsLoading(true);
    setError(null);

    try {
      const stats = await CorporateAPI.getDashboardStats(accountId);
      setDashboardStats(stats);

      const notifs = await NotificationAPI.getNotifications(accountId);
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n: Notification) => !n.isRead).length);
    } catch (err: any) {
      setError(err.message || (language === 'en' ? 'Failed to load dashboard data' : 'প্রোডবোর্ড লোড করতে ব্যর্থ'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (accountId) {
      fetchDashboardData();
    }
  }, [accountId]);

  const getStatusColor = (status: CorporateStatus) => {
    switch (status) {
      case CorporateStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case CorporateStatus.ACTIVE:
        return 'bg-green-100 text-green-800 border-green-300';
      case CorporateStatus.SUSPENDED:
        return 'bg-red-100 text-red-800 border-red-300';
      case CorporateStatus.REJECTED:
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusBadge = (status: CorporateStatus) => {
    switch (status) {
      case CorporateStatus.PENDING:
        return language === 'en' ? 'Pending' : 'অপেক্তিঙ';
      case CorporateStatus.ACTIVE:
        return language === 'en' ? 'Active' : 'সক্রিয়';
      case CorporateStatus.SUSPENDED:
        return language === 'en' ? 'Suspended' : 'স্থগিত';
      case CorporateStatus.REJECTED:
        return language === 'en' ? 'Rejected' : 'প্রত্য়';
      default:
        return language === 'en' ? 'Unknown' : 'অজানা';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'ORDER':
        return 'bg-blue-600';
      case 'INVOICE':
        return 'bg-green-600';
      case 'CREDIT':
        return 'bg-purple-600';
      case 'SYSTEM':
        return 'bg-gray-600';
      default:
        return 'bg-gray-600';
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await NotificationAPI.markAsRead(accountId!, notificationId);
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await NotificationAPI.markAllAsRead(accountId!);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'new-po':
        router.push('/account/corporate/purchase-orders?action=create');
        break;
      case 'quotation':
        router.push('/account/corporate/pricing');
        break;
      case 'invoices':
        router.push('/account/corporate/invoices');
        break;
      case 'users':
        router.push('/account/corporate/users');
        break;
      case 'credit':
        router.push('/account/corporate/credit');
        break;
    }
  };

  if (!user || accountLoading) {
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
                {language === 'en' ? 'Corporate Dashboard' : 'কর্পোরেট ড্যাশবোর্ড'}
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

        {/* Stats Cards Row */}
        <div className="flex flex-wrap gap-6 mb-6">
          {/* Account Status Card */}
          <div className={`flex-1 min-w-[250px] bg-white rounded-lg shadow-sm p-6 ${getStatusColor(dashboardStats?.accountStatus || CorporateStatus.PENDING)}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {language === 'en' ? 'Account Status' : 'অ্যাকাউন্ট অবস্থা'}
              </h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(dashboardStats?.accountStatus || CorporateStatus.PENDING)}`}>
                {getStatusBadge(dashboardStats?.accountStatus || CorporateStatus.PENDING)}
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {language === 'en' ? 'Credit Limit' : 'ক্রেডিট লিমিট'}
                </span>
                <span className="text-2xl font-bold text-gray-900">
                  ৳{dashboardStats?.creditLimit !== null && dashboardStats?.creditLimit !== undefined ? dashboardStats.creditLimit.toLocaleString('en-BD') : '0'}
                </span>
                <span className="text-sm text-gray-500">
                  / {language === 'en' ? 'BDT' : 'টাকা'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full"
                  style={{ width: `${dashboardStats?.creditLimit && dashboardStats?.creditLimit > 0 && dashboardStats?.usedCredit !== null && dashboardStats?.usedCredit !== undefined ? ((dashboardStats.usedCredit / dashboardStats.creditLimit) * 100).toFixed(1) : '0'}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {language === 'en' ? 'Used' : 'ব্যবহাও'}
                </span>
                <span className="font-semibold text-gray-900">
                  ৳{dashboardStats?.usedCredit !== null && dashboardStats?.usedCredit !== undefined ? dashboardStats.usedCredit.toLocaleString('en-BD') : '0'}
                </span>
                <span className="text-sm text-gray-500">
                  / {language === 'en' ? 'BDT' : 'টাকা'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {language === 'en' ? 'Available' : 'উপলব্ধ'}
                </span>
                <span className="font-semibold text-green-600">
                  ৳{dashboardStats?.creditLimit !== null && dashboardStats?.creditLimit !== undefined && dashboardStats?.usedCredit !== null && dashboardStats?.usedCredit !== undefined ? (dashboardStats.creditLimit - dashboardStats.usedCredit).toLocaleString('en-BD') : '0'}
                </span>
                <span className="text-sm text-gray-500">
                  / {language === 'en' ? 'BDT' : 'টাকা'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="flex-1 min-w-[250px] bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {language === 'en' ? 'Quick Actions' : 'দ্রুত ক্রিয়'}
            </h3>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => handleQuickAction('new-po')}
                className="flex-1 min-w-[140px] flex flex-col items-center p-4 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors"
              >
                <ShoppingBag className="w-10 h-10 text-primary-600 mb-2" />
                <span className="font-medium text-gray-900">
                  {language === 'en' ? 'New PO' : 'নতুন পিও'}
                </span>
                <span className="text-sm text-gray-600">
                  {language === 'en' ? 'Create purchase order' : 'ক্রেড লোড তৈরি করুন'}
                </span>
              </button>

              <button
                onClick={() => handleQuickAction('quotation')}
                className="flex-1 min-w-[140px] flex flex-col items-center p-4 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors"
              >
                <FileText className="w-10 h-10 text-primary-600 mb-2" />
                <span className="font-medium text-gray-900">
                  {language === 'en' ? 'Request Quotation' : 'কোট অনুর চাও'}
                </span>
                <span className="text-sm text-gray-600">
                  {language === 'en' ? 'Get pricing' : 'দাম প্রিত'}
                </span>
              </button>

              <button
                onClick={() => handleQuickAction('invoices')}
                className="flex-1 min-w-[140px] flex flex-col items-center p-4 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors"
              >
                <Download className="w-10 h-10 text-primary-600 mb-2" />
                <span className="font-medium text-gray-900">
                  {language === 'en' ? 'View Invoices' : 'চালান দেখা'}
                </span>
                <span className="text-sm text-gray-600">
                  {language === 'en' ? 'Manage invoices' : 'চালান পরিচালা'}
                </span>
              </button>

              <button
                onClick={() => handleQuickAction('users')}
                className="flex-1 min-w-[140px] flex flex-col items-center p-4 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors"
              >
                <Users className="w-10 h-10 text-primary-600 mb-2" />
                <span className="font-medium text-gray-900">
                  {language === 'en' ? 'Manage Users' : 'ব্যবহারকার'}
                </span>
                <span className="text-sm text-gray-600">
                  {language === 'en' ? 'Add/remove users' : 'ব্যবহারকার যোগ/সরান'}
                </span>
              </button>

              <button
                onClick={() => handleQuickAction('credit')}
                className="flex-1 min-w-[140px] flex flex-col items-center p-4 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors"
              >
                <CreditCard className="w-10 h-10 text-primary-600 mb-2" />
                <span className="font-medium text-gray-900">
                  {language === 'en' ? 'Manage Credit' : 'ক্রেডিট পরিচালা'}
                </span>
                <span className="text-sm text-gray-600">
                  {language === 'en' ? 'View credit limit' : 'ক্রেডিট পরিচালা'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Notifications Card */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {language === 'en' ? 'Notifications' : 'নোটিফিকেশন'}
            </h3>
            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {language === 'en' ? 'Mark All as Read' : 'সবর পড়ে হিত'}
            </button>
          </div>
          <div className="flex flex-col gap-4">
            {notifications.length > 0 ? (
              notifications.slice(0, 5).map((notification: Notification) => (
                <div 
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    notification.isRead 
                      ? 'bg-gray-50 border-gray-200' 
                      : 'bg-blue-50 border-blue-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                      {notification.type === 'ORDER' && <ShoppingBag className="w-5 h-5 text-white" />}
                      {notification.type === 'INVOICE' && <Download className="w-5 h-5 text-white" />}
                      {notification.type === 'CREDIT' && <CreditCard className="w-5 h-5 text-white" />}
                      {notification.type === 'SYSTEM' && <Bell className="w-5 h-5 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(notification.createdAt).toLocaleDateString('en-BD', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 rounded-full bg-primary-600"></div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-600">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm">
                  {language === 'en' ? 'No notifications' : 'কোন নোটিফিকেশন'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CorporateDashboardPage;
