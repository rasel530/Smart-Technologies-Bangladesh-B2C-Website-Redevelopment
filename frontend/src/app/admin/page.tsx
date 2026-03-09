 'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { withAuth } from '@/components/auth/withAuth';
import { StatsGrid } from '@/components/design-system';
import { Badge } from '@/components/design-system';
import { AdminLayout } from '@/components/admin/AdminLayout';

function AdminDashboard() {
  const adminFeatures = [
    {
      title: 'RBAC Management',
      description: 'Manage roles, permissions, and access control',
      icon: '🔐',
      href: '/admin/rbac',
      color: 'primary' as const,
    },
    {
      title: 'User Management',
      description: 'View and manage user accounts',
      icon: '👤',
      href: '#',
      color: 'success' as const,
      disabled: true
    },
    {
      title: 'Product Management',
      description: 'Manage products and inventory',
      icon: '📦',
      href: '/admin/products',
      color: 'primary' as const,
    },
    {
      title: 'Order Management',
      description: 'View and process orders',
      icon: '🛒',
      href: '/admin/orders',
      color: 'success' as const
    },
    {
      title: 'Analytics',
      description: 'View system analytics and reports',
      icon: '📊',
      href: '#',
      color: 'danger' as const,
      disabled: true
    },
    {
      title: 'System Settings',
      description: 'Configure system settings',
      icon: '⚙️',
      href: '#',
      color: 'neutral' as const,
      disabled: true
    }
  ];

  const stats = [
    {
      title: 'Total Users',
      value: '0',
      icon: '👥',
      color: 'primary' as const,
    },
    {
      title: 'Products',
      value: '0',
      icon: '📦',
      color: 'success' as const,
    },
    {
      title: 'Orders',
      value: '0',
      icon: '🛒',
      color: 'warning' as const,
    },
    {
      title: 'Revenue',
      value: '$0',
      icon: '💰',
      color: 'danger' as const,
    },
  ];

  return (
    <AdminLayout title="Dashboard Overview" description="Welcome to the administration panel. Manage your system from here.">
      {/* Quick Stats */}
      <StatsGrid stats={stats.map(stat => ({
        title: stat.title,
        value: stat.value,
        icon: <span className="text-3xl">{stat.icon}</span>,
        color: stat.color,
      }))} />

      {/* Section Divider */}
      <div className="border-t border-gray-200 my-8"></div>

      {/* Admin Features Grid */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Admin Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminFeatures.map((feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              className={`relative group p-6 rounded-xl border-2 transition-all duration-200 ${
                feature.disabled
                  ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-60'
                  : 'bg-white border-gray-200 hover:border-primary-200 hover:shadow-md'
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
                    <Badge color="neutral" size="sm" className="mt-2">
                      Coming Soon
                    </Badge>
                  )}
                </div>
              </div>
              {!feature.disabled && (
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Section Divider */}
      <div className="border-t border-gray-200 my-8"></div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/rbac"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            RBAC Management
          </Link>
          <button
            disabled
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-400 bg-gray-50 cursor-not-allowed"
          >
            View Reports
          </button>
          <button
            disabled
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-400 bg-gray-50 cursor-not-allowed"
          >
            System Logs
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}

// Wrap the component with withAuth HOC for authentication and role-based access control
export default withAuth(AdminDashboard, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/unauthorized'
});
