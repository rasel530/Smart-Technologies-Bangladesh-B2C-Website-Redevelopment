'use client';

import React from 'react';
import { withAuth } from '@/components/auth/withAuth';
import Link from 'next/link';
import { 
  ShoppingCart, 
  AlertTriangle, 
  Users, 
  BarChart3, 
  Settings,
  ArrowRight
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';

/**
 * Admin Checkout Dashboard Page
 * 
 * This page provides a dashboard-style overview of all checkout management features.
 * Admins can navigate to various checkout-related pages from here.
 * 
 * Features:
 * - Overview of checkout management sections
 * - Quick navigation to all checkout sub-pages
 * - Dashboard-style card layout
 * - Mobile-responsive design
 */
function AdminCheckoutDashboardPage() {
  const checkoutSections = [
    {
      title: 'Checkout Sessions',
      description: 'View and manage all checkout sessions in the system',
      icon: ShoppingCart,
      href: '/admin/checkout/sessions',
      color: 'blue',
    },
    {
      title: 'Abandoned Checkouts',
      description: 'Monitor and recover abandoned checkout sessions',
      icon: AlertTriangle,
      href: '/admin/checkout/abandonment',
      color: 'yellow',
    },
    {
      title: 'Guest Checkout',
      description: 'Monitor and manage guest checkout sessions and conversions',
      icon: Users,
      href: '/admin/checkout/guest',
      color: 'purple',
    },
    {
      title: 'Checkout Analytics',
      description: 'Comprehensive checkout performance metrics and insights',
      icon: BarChart3,
      href: '/admin/checkout/analytics',
      color: 'indigo',
    },
    {
      title: 'Checkout Settings',
      description: 'Configure checkout behavior and options',
      icon: Settings,
      href: '/admin/checkout/settings',
      color: 'green',
    },
  ];

  const colorClasses = {
    blue: {
      bg: 'bg-blue-100',
      text: 'text-blue-600',
      border: 'border-blue-200',
      hover: 'hover:border-blue-300',
    },
    yellow: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-600',
      border: 'border-yellow-200',
      hover: 'hover:border-yellow-300',
    },
    purple: {
      bg: 'bg-purple-100',
      text: 'text-purple-600',
      border: 'border-purple-200',
      hover: 'hover:border-purple-300',
    },
    indigo: {
      bg: 'bg-indigo-100',
      text: 'text-indigo-600',
      border: 'border-indigo-200',
      hover: 'hover:border-indigo-300',
    },
    green: {
      bg: 'bg-green-100',
      text: 'text-green-600',
      border: 'border-green-200',
      hover: 'hover:border-green-300',
    },
  };

  return (
    <AdminLayout title="Checkout Management">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-lg">
            <ShoppingCart className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Checkout Management</h1>
            <p className="text-gray-600 mt-1">
              Manage checkout sessions, analytics, and settings
            </p>
          </div>
        </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">--</p>
            </div>
            <ShoppingCart className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Abandoned</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">--</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">--%</p>
            </div>
            <BarChart3 className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Guest Sessions</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">--</p>
            </div>
            <Users className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Checkout Sections */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Checkout Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {checkoutSections.map((section) => {
            const Icon = section.icon;
            const colors = colorClasses[section.color as keyof typeof colorClasses];
            
            return (
              <Link
                key={section.href}
                href={section.href}
                className={`bg-white rounded-lg shadow p-6 border-2 ${colors.border} ${colors.hover} transition-all duration-200 hover:shadow-lg group`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 ${colors.bg} rounded-lg`}>
                    <Icon className={`w-6 h-6 ${colors.text}`} />
                  </div>
                  <ArrowRight className={`w-5 h-5 ${colors.text} opacity-0 group-hover:opacity-100 transition-opacity`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {section.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {section.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Getting Started Section */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Getting Started</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">1.</span>
            <span>Use <strong>Checkout Sessions</strong> to view and manage all active and completed checkout sessions</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">2.</span>
            <span>Monitor <strong>Abandoned Checkouts</strong> and send recovery emails to recover lost sales</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">3.</span>
            <span>Track <strong>Guest Checkout</strong> sessions and convert guests to registered users</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">4.</span>
            <span>Analyze <strong>Checkout Analytics</strong> to understand conversion funnels and identify bottlenecks</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">5.</span>
            <span>Configure <strong>Checkout Settings</strong> to customize session timeout, abandonment detection, and recovery emails</span>
          </li>
        </ul>
      </div>
    </div>
    </AdminLayout>
  );
}

// Wrap with authentication HOC
export default withAuth(AdminCheckoutDashboardPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
