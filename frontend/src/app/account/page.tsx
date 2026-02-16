'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { User as UserType } from '@/types/auth';
import { withAuth } from '@/components/auth/withAuth';
import { formatDate, getInitials } from '@/lib/utils';
import { ProfileAPI, UserProfile } from '@/lib/api/profile';
import { apiClient } from '@/lib/api/client';
import ProfileEditForm from '@/components/profile/ProfileEditForm';
import ProfilePictureUpload from '@/components/profile/ProfilePictureUpload';
import EmailPhoneChange from '@/components/profile/EmailPhoneChange';
import AddressesTab from '@/components/profile/AddressesTab';
import {
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  MapPin,
  LogOut,
  Package,
  Heart,
  CreditCard,
  ChevronRight,
  Edit,
  FileText,
  DollarSign,
  Loader2,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

interface Order {
  id: string;
  orderDate: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  total: number;
  itemCount: number;
}

const formatCurrency = (amount: number): string => {
  return `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatOrderDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatStatus = (status: string): string => {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending':
    case 'confirmed':
    case 'processing':
      return 'bg-blue-100 text-blue-800';
    case 'shipped':
      return 'bg-yellow-100 text-yellow-800';
    case 'delivered':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    case 'refunded':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

interface AccountPageProps {}

const AccountPage: React.FC<AccountPageProps> = () => {
  const { user, logout, updateUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const profileLoadedRef = React.useRef(false);

  useEffect(() => {
    // Only load profile data once to prevent duplicate API calls
    if (!profileLoadedRef.current && user) {
      loadProfileData();
      profileLoadedRef.current = true;
    }
  }, [user]);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['profile', 'orders', 'wishlist', 'payment', 'addresses'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const loadProfileData = async () => {
    // Only load profile data if not already loaded
    if (!profileLoadedRef.current && user) {
      try {
        const response = await ProfileAPI.getProfile();
        setProfileData(response.user);
        // Also update AuthContext user state to prevent stale data
        updateUser(response.user as unknown as any);
        // Mark profile as loaded
        profileLoadedRef.current = true;
      } catch (error) {
        console.error('Failed to load profile data:', error);
      }
    }
  };

  const handleProfileUpdate = (updatedUser: UserProfile) => {
    setProfileData(updatedUser);
    // Also update AuthContext user state to prevent logout on refresh
    updateUser(updatedUser as unknown as any);
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
      // Only redirect to home if user was logged in
      if (user) {
        router.push('/');
      }
      // Reset profile loaded ref on logout
      profileLoadedRef.current = false;
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoading(false);
    }
  };

  const handleLanguageChange = (lang: 'en' | 'bn') => {
    setLanguage(lang);
    localStorage.setItem('preferredLanguage', lang);
  };

  const menuItems = [
    {
      id: 'profile',
      label: language === 'en' ? 'Profile' : 'প্রোফাইল',
      labelBn: 'প্রোফাইল',
      icon: UserIcon,
    },
    {
      id: 'orders',
      label: language === 'en' ? 'Orders' : 'অর্ডার',
      labelBn: 'অর্ডার',
      icon: Package,
    },
    {
      id: 'wishlist',
      label: language === 'en' ? 'Wishlist' : 'ইচ্ছা',
      labelBn: 'ইচ্ছা',
      icon: Heart,
    },
    {
      id: 'payment',
      label: language === 'en' ? 'Payment Methods' : 'পেমেন্ট পদ্ধতি',
      labelBn: 'পেমেন্ট পদ্ধতি',
      icon: CreditCard,
    },
    {
      id: 'addresses',
      label: language === 'en' ? 'Addresses' : 'ঠিকানা',
      labelBn: 'ঠিকানা',
      icon: MapPin,
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return isEditing
          ? <ProfileEditForm
              user={profileData || (user as unknown as UserProfile)}
              language={language}
              onUpdate={handleProfileUpdate}
              onCancel={() => setIsEditing(false)}
            />
          : <ProfileTab user={profileData || user} language={language} onEdit={() => setIsEditing(true)} onUpdate={handleProfileUpdate} />;
      case 'orders':
        return <OrdersTab language={language} />;
      case 'wishlist':
        return <WishlistTab language={language} />;
      case 'payment':
        return <PaymentTab language={language} />;
      case 'addresses':
        return <AddressesTab language={language} />;
      default:
        return <ProfileTab user={profileData || user} language={language} onEdit={() => setIsEditing(true)} onUpdate={handleProfileUpdate} />;
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* User Avatar */}
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {getInitials(user.firstName, user.lastName)}
              </div>
              
              {/* User Info */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.firstName} {user.lastName}
                </h1>
                <p className="text-sm text-gray-500">
                  {language === 'en' ? 'Member since' : 'সদস্য থেকে সদস্য'} {formatDate(new Date(user.createdAt), language)}
                </p>
              </div>
            </div>

            {/* Language Toggle */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {language === 'en' ? 'Language:' : 'ভাষা:'}
              </span>
              <button
                onClick={() => handleLanguageChange('en')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  language === 'en'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                English
              </button>
              <button
                onClick={() => handleLanguageChange('bn')}
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

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Menu */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeTab === item.id
                          ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">
                        {language === 'en' ? item.label : item.labelBn}
                      </span>
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:w-3/4">
            <div className="bg-white rounded-lg shadow-sm p-6">
              {renderTabContent()}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleLogout}
            disabled={isLoading}
            className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut className="h-5 w-5" />
            <span>
              {isLoading
                ? language === 'en'
                  ? 'Logging out...'
                  : 'লগ আউট হচ্ছে...'
                : language === 'en'
                ? 'Logout'
                : 'লগ আউট'
              }
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Tab Components
const ProfileTab: React.FC<{ user: UserType | UserProfile | null; language: 'en' | 'bn'; onEdit: () => void; onUpdate: (user: UserProfile) => void }> = ({ user, language, onEdit, onUpdate }) => {
  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          {language === 'en' ? 'Profile Information' : 'প্রোফাইল তথ্য'}
        </h2>
        <button
          onClick={onEdit}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          <Edit className="h-4 w-4" />
          <span>{language === 'en' ? 'Edit Profile' : 'প্রোফাইল সম্পাদনা'}</span>
        </button>
      </div>

      <ProfilePictureUpload
        user={user as UserProfile}
        language={language}
        onUpdate={onUpdate}
        key={user?.image || 'default'}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {language === 'en' ? 'First Name' : 'প্রথম নাম'}
            </label>
            <div className="p-3 bg-gray-50 rounded-md">
              {user.firstName}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {language === 'en' ? 'Email' : 'ইমেইল'}
            </label>
            <div className="p-3 bg-gray-50 rounded-md flex items-center">
              <Mail className="h-4 w-4 mr-2 text-gray-400" />
              {user.email || 'Not provided'}
              {user.email && (
                <span className={`ml-2 px-2 py-1 text-xs rounded ${
                  (user as any).emailVerified || (user as any).isEmailVerified
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {(user as any).emailVerified || (user as any).isEmailVerified
                    ? (language === 'en' ? 'Verified' : 'যাচাইকৃত')
                    : (language === 'en' ? 'Not Verified' : 'যাচাইকৃত নয়')
                  }
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {language === 'en' ? 'Last Name' : 'শেষ নাম'}
            </label>
            <div className="p-3 bg-gray-50 rounded-md">
              {user.lastName}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {language === 'en' ? 'Phone' : 'ফোন'}
            </label>
            <div className="p-3 bg-gray-50 rounded-md flex items-center">
              <Phone className="h-4 w-4 mr-2 text-gray-400" />
              {user.phone || 'Not provided'}
              {user.phone && (
                <span className={`ml-2 px-2 py-1 text-xs rounded ${
                  (user as any).phoneVerified || (user as any).isPhoneVerified
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {(user as any).phoneVerified || (user as any).isPhoneVerified
                    ? (language === 'en' ? 'Verified' : 'যাচাইকৃত')
                    : (language === 'en' ? 'Not Verified' : 'যাচাইকৃত নয়')
                  }
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <EmailPhoneChange user={user} language={language} onUpdate={() => {}} />
      </div>
    </div>
  );
};

const OrdersTab: React.FC<{ language: 'en' | 'bn' }> = ({ language }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get('/orders');
      const orders = response.orders.map((order: any) => ({
        ...order,
        orderDate: order.createdAt,
        itemCount: order.items?.length || 0
      }));
      setOrders(orders);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(language === 'en' ? 'Failed to load orders. Please try again.' : 'অর্ডার লোড করতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">
          {language === 'en' ? 'Loading your orders...' : 'আপনার অর্ডার লোড হচ্ছে...'}
        </p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="h-8 w-8 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {language === 'en' ? 'Error Loading Orders' : 'অর্ডার লোড করতে সমস্যা হয়েছে'}
        </h3>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={fetchOrders}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          {language === 'en' ? 'Try Again' : 'আবার চেষ্টা করুন'}
        </button>
      </div>
    );
  }

  // Empty State
  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {language === 'en' ? 'No orders yet' : 'এখনও কোনো অর্ডার নেই'}
        </h3>
        <p className="text-gray-600">
          {language === 'en' 
            ? 'When you place your first order, it will appear here.'
            : 'যখনও আপনার প্রথম অর্ডার করবেন, তখনও এখানে দেখাবে।'
          }
        </p>
      </div>
    );
  }

  // Orders List
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          {language === 'en' ? `Your Orders (${orders.length})` : `আপনার অর্ডার (${orders.length})`}
        </h2>
      </div>

      {orders.map((order) => (
        <div
          key={order.id}
          className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow border border-gray-200"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Order Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-gray-900">{order.id}</span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatOrderDate(order.orderDate)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  <span>{order.itemCount} {order.itemCount === 1 
                    ? (language === 'en' ? 'item' : 'আইটেম') 
                    : (language === 'en' ? 'items' : 'আইটেম')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  <span className="font-semibold text-gray-900">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Status Badge and View Button */}
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {formatStatus(order.status)}
              </span>
              <Link
                href={`/orders/${order.id}`}
                className="inline-flex items-center gap-1 px-4 py-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
              >
                {language === 'en' ? 'View Details' : 'বিস্তারিত দেখুন'}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const WishlistTab: React.FC<{ language: 'en' | 'bn' }> = ({ language }) => (
  <div className="text-center py-12">
    <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">
      {language === 'en' ? 'Your wishlist is empty' : 'আপনার ইচ্ছা তালিকা খালি'}
    </h3>
    <p className="text-gray-600">
      {language === 'en' 
        ? 'Add items to your wishlist and they will appear here.'
        : 'আইটেম আপনার ইচ্ছাতে যোগ করুন, তারা এখানে প্রদর্শন করা হবে।'
      }
    </p>
  </div>
);

const PaymentTab: React.FC<{ language: 'en' | 'bn' }> = ({ language }) => (
  <div className="text-center py-12">
    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">
      {language === 'en' ? 'No payment methods' : 'কোনো পেমেন্ট পদ্ধতি নেই'}
    </h3>
    <p className="text-gray-600">
      {language === 'en' 
        ? 'Add a payment method to make checkout faster.'
        : 'চেকআউট দ্রুত করার জন্য পেমেন্ট পদ্ধতি যোগ করুন।'
      }
    </p>
  </div>
);

export default withAuth(AccountPage);
