'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut } from 'lucide-react';
import { withAuth } from '@/components/auth/withAuth';

function AdminDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const adminFeatures = [
    {
      title: 'RBAC Management',
      description: 'Manage roles, permissions, and access control',
      icon: '🔐',
      href: '/admin/rbac',
      color: 'indigo'
    },
    {
      title: 'User Management',
      description: 'View and manage user accounts',
      icon: '👤',
      href: '#',
      color: 'green',
      disabled: true
    },
    {
      title: 'Product Management',
      description: 'Manage products and inventory',
      icon: '📦',
      href: '/admin/products',
      color: 'purple'
    },
    {
      title: 'Order Management',
      description: 'View and process orders',
      icon: '🛒',
      href: '#',
      color: 'orange',
      disabled: true
    },
    {
      title: 'Analytics',
      description: 'View system analytics and reports',
      icon: '📊',
      href: '#',
      color: 'pink',
      disabled: true
    },
    {
      title: 'System Settings',
      description: 'Configure system settings',
      icon: '⚙️',
      href: '#',
      color: 'gray',
      disabled: true
    }
  ];

  const colorClasses = {
    blue: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
    green: 'bg-green-50 hover:bg-green-100 border-green-200',
    purple: 'bg-purple-50 hover:bg-purple-100 border-purple-200',
    orange: 'bg-orange-50 hover:bg-orange-100 border-orange-200',
    pink: 'bg-pink-50 hover:bg-pink-100 border-pink-200',
    gray: 'bg-gray-50 hover:bg-gray-100 border-gray-200',
    indigo: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="mt-1 text-sm text-gray-600">
                Welcome to administration panel
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={logout}
                className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-3xl">👥</div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900">--</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-3xl">📦</div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Products</p>
                <p className="text-2xl font-semibold text-gray-900">--</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-3xl">🛒</div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Orders</p>
                <p className="text-2xl font-semibold text-gray-900">--</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-3xl">💰</div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">--</p>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Features Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Admin Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminFeatures.map((feature) => (
              <Link
                key={feature.href}
                href={feature.href}
                className={`relative group p-6 rounded-lg border-2 transition-all duration-200 ${
                  feature.disabled
                    ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-60'
                    : colorClasses[feature.color as keyof typeof colorClasses]
                }`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 text-4xl mb-4">
                    {feature.icon}
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {feature.description}
                    </p>
                    {feature.disabled && (
                      <span className="inline-block mt-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                        Coming Soon
                      </span>
                    )}
                  </div>
                </div>
                {!feature.disabled && (
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M9 5l7 7-7 7"></path>
                    </svg>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/admin/rbac"
              className="flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              RBAC Management
            </Link>
            <button
              disabled
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-400 bg-gray-100 cursor-not-allowed"
            >
              View Reports
            </button>
            <button
              disabled
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-400 bg-gray-100 cursor-not-allowed"
            >
              System Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrap the component with withAuth HOC for authentication and role-based access control
export default withAuth(AdminDashboard, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/unauthorized'
});
