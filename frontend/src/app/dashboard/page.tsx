'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { withAuth } from '@/components/auth/withAuth';
import { User } from '@/types/auth';
import {
  User as UserIcon,
  ShoppingBag,
  Heart,
  Package,
  Clock,
  CheckCircle,
  ArrowRight,
  LogOut,
  Settings,
  Shield,
  MapPin,
  CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate, getInitials } from '@/lib/utils';

interface DashboardPageProps {}

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  wishlistCount: number;
  addressesCount: number;
}

const DashboardPage: React.FC<DashboardPageProps> = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    wishlistCount: 0,
    addressesCount: 0,
  });

  useEffect(() => {
    // Load language preference from localStorage
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage && ['en', 'bn'].includes(savedLanguage)) {
      setLanguage(savedLanguage as 'en' | 'bn');
    }
  }, []);

  useEffect(() => {
    // Load dashboard stats (mock data for now)
    setStats({
      totalOrders: 0,
      pendingOrders: 0,
      wishlistCount: 0,
      addressesCount: 0,
    });
  }, [user]);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoading(false);
    }
  };

  const handleLanguageChange = (lang: 'en' | 'bn') => {
    setLanguage(lang);
    localStorage.setItem('preferredLanguage', lang);
  };

  const quickActions = [
    {
      id: 'browse-products',
      label: language === 'en' ? 'Browse Products' : 'Browse Products',
      labelBn: 'Browse Products',
      icon: ShoppingBag,
      href: '/products',
      color: 'bg-blue-500',
    },
    {
      id: 'view-orders',
      label: language === 'en' ? 'View Orders' : 'View Orders',
      labelBn: 'View Orders',
      icon: Package,
      href: '/orders',
      color: 'bg-green-500',
    },
    {
      id: 'wishlist',
      label: language === 'en' ? 'Wishlist' : 'Wishlist',
      labelBn: 'Wishlist',
      icon: Heart,
      href: '/wishlist',
      color: 'bg-pink-500',
    },
  ];

  const accountMenuItems = [
    {
      id: 'profile',
      label: language === 'en' ? 'Profile' : 'Profile',
      labelBn: 'Profile',
      icon: UserIcon,
      href: '/account',
    },
    {
      id: 'addresses',
      label: language === 'en' ? 'Addresses' : 'Addresses',
      labelBn: 'Addresses',
      icon: MapPin,
      href: '/account?tab=addresses',
    },
    {
      id: 'payment',
      label: language === 'en' ? 'Payment Methods' : 'Payment Methods',
      labelBn: 'Payment Methods',
      icon: CreditCard,
      href: '/account?tab=payment',
    },
    {
      id: 'security',
      label: language === 'en' ? 'Security' : 'Security',
      labelBn: 'Security',
      icon: Shield,
      href: '/account?tab=security',
    },
    {
      id: 'settings',
      label: language === 'en' ? 'Settings' : 'Settings',
      labelBn: 'Settings',
      icon: Settings,
      href: '/account?tab=settings',
    },
  ];

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {language === 'en' ? 'Dashboard' : 'Dashboard'}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {language === 'en' 
                  ? 'Welcome back!' 
                  : 'Welcome back!'
                }
              </p>
            </div>

            {/* Language Toggle */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {language === 'en' ? 'Language:' : 'Language:'}
              </span>
              <button
                onClick={() => handleLanguageChange('en')}
                className={cn(
                  'px-3 py-1 rounded-md text-sm font-medium transition-colors',
                  {
                    'bg-primary-600 text-white': language === 'en',
                    'bg-gray-200 text-gray-700 hover:bg-gray-300': language !== 'en'
                  }
                )}
              >
                English
              </button>
              <button
                onClick={() => handleLanguageChange('bn')}
                className={cn(
                  'px-3 py-1 rounded-md text-sm font-medium transition-colors',
                  {
                    'bg-primary-600 text-white': language === 'bn',
                    'bg-gray-200 text-gray-700 hover:bg-gray-300': language !== 'bn'
                  }
                )}
              >
                Bangla
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - User Info and Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Info Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center space-x-4">
                {/* Avatar */}
                <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                  {getInitials(user.firstName, user.lastName)}
                </div>

                {/* User Details */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900 truncate">
                    {user.firstName} {user.lastName}
                  </h2>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                    {user.email && (
                      <span className="flex items-center">
                        <span className={`w-2 h-2 rounded-full mr-1 ${
                          user.isEmailVerified ? 'bg-green-500' : 'bg-yellow-500'
                        }`}></span>
                        {user.email}
                      </span>
                    )}
                    {user.phone && (
                      <span className="flex items-center">
                        <span className={`w-2 h-2 rounded-full mr-1 ${
                          user.isPhoneVerified ? 'bg-green-500' : 'bg-yellow-500'
                        }`}></span>
                        {user.phone}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {language === 'en' ? 'Member since' : 'Member since'} {formatDate(new Date(user.createdAt), language)}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                title={language === 'en' ? 'Total Orders' : 'Total Orders'}
                titleBn="Total Orders"
                value={stats.totalOrders}
                icon={Package}
                color="bg-blue-500"
                language={language}
              />
              <StatCard
                title={language === 'en' ? 'Pending' : 'Pending'}
                titleBn="Pending"
                value={stats.pendingOrders}
                icon={Clock}
                color="bg-yellow-500"
                language={language}
              />
              <StatCard
                title={language === 'en' ? 'Wishlist' : 'Wishlist'}
                titleBn="Wishlist"
                value={stats.wishlistCount}
                icon={Heart}
                color="bg-pink-500"
                language={language}
              />
              <StatCard
                title={language === 'en' ? 'Addresses' : 'Addresses'}
                titleBn="Addresses"
                value={stats.addressesCount}
                icon={MapPin}
                color="bg-green-500"
                language={language}
              />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {language === 'en' ? 'Quick Actions' : 'Quick Actions'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <a
                      key={action.id}
                      href={action.href}
                      className={cn(
                        'flex flex-col items-center p-4 rounded-lg transition-colors',
                        action.color
                      )}
                    >
                      <Icon className="h-8 w-8 text-white mb-2" />
                      <span className="text-sm font-medium text-white text-center">
                        {language === 'en' ? action.label : action.labelBn}
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Recent Activity (Placeholder) */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {language === 'en' ? 'Recent Activity' : 'Recent Activity'}
              </h3>
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm">
                  {language === 'en' 
                    ? 'No recent activity to show' 
                    : 'No recent activity to show'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Account Menu */}
          <div className="space-y-6">
            {/* Account Menu */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {language === 'en' ? 'Account' : 'Account'}
              </h3>
              <nav className="space-y-1">
                {accountMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.id}
                      href={item.href}
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors text-gray-700 hover:bg-gray-50"
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">
                        {language === 'en' ? item.label : item.labelBn}
                      </span>
                      <ArrowRight className="h-4 w-4 ml-auto text-gray-400" />
                    </a>
                  );
                })}
              </nav>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogOut className="h-5 w-5" />
              <span>
                {isLoading
                  ? (language === 'en' ? 'Logging out...' : 'Logging out...')
                  : (language === 'en' ? 'Logout' : 'Logout')
                }
              </span>
            </button>

            {/* Help Section */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {language === 'en' ? 'Need Help?' : 'Need Help?'}
              </h3>
              <div className="space-y-2">
                <a href="/support" className="flex items-center space-x-2 px-4 py-3 rounded-lg text-left transition-colors text-gray-700 hover:bg-gray-50">
                  <Shield className="h-5 w-5" />
                  <span className="font-medium">
                    {language === 'en' ? 'Contact Support' : 'Contact Support'}
                  </span>
                </a>
                <a href="/faq" className="flex items-center space-x-2 px-4 py-3 rounded-lg text-left transition-colors text-gray-700 hover:bg-gray-50">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">
                    {language === 'en' ? 'FAQ' : 'FAQ'}
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
interface StatCardProps {
  title: string;
  titleBn: string;
  value: number;
  icon: any;
  color: string;
  language: 'en' | 'bn';
}

const StatCard: React.FC<StatCardProps> = ({ title, titleBn, value, icon: Icon, color, language }) => (
  <div className="bg-white rounded-lg shadow-sm p-4">
    <div className="flex items-center space-x-3">
      <div className={cn('p-3 rounded-lg', color)}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-gray-500">
          {language === 'en' ? title : titleBn}
        </p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
);

export default withAuth(DashboardPage);
