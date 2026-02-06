'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  Settings,
  LogOut,
  Shield,
  Tag,
  Layers,
  Search
} from 'lucide-react';
import Link from 'next/link';
import { ButtonDanger } from '@/components/design-system';

interface AdminLayoutProps {
  children: React.ReactNode;
}

function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path);
  };

  const adminNavigationItems = [
    {
      href: '/admin',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      href: '/admin/products',
      label: 'Products',
      icon: Package,
    },
    {
      href: '/admin/categories',
      label: 'Categories',
      icon: Tag,
    },
    {
      href: '/admin/brands',
      label: 'Brands',
      icon: Layers,
    },
    {
      href: '/admin/rbac',
      label: 'RBAC Management',
      icon: Shield,
    },
    {
      href: '/admin/elasticsearch',
      label: 'Elasticsearch',
      icon: Search,
    },
    {
      href: '/admin/search',
      label: 'Search Analytics',
      icon: Search,
    },
    {
      href: '/admin/users',
      label: 'Users',
      icon: Users,
    },
    {
      href: '/admin/orders',
      label: 'Orders',
      icon: ShoppingCart,
    },
    {
      href: '/admin/settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className="fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg lg:translate-x-0 lg:flex-shrink-0"
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">ST</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
                <p className="text-xs text-gray-600">Smart Technologies</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {adminNavigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive(item.href)
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span className="ml-3">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-gray-200 space-y-3">
            {user ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.firstName || ''} {user.lastName || ''}
                </p>
                <p className="text-xs text-gray-600 truncate">
                  {user.email || user.phone || 'No contact info'}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user.role || 'Admin'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-400">Loading user...</p>
                <p className="text-xs text-gray-300">Please wait</p>
              </div>
            )}
            <ButtonDanger
              size="sm"
              leftIcon={<LogOut className="w-4 h-4" />}
              onClick={handleLogout}
              className="w-full"
            >
              Logout
            </ButtonDanger>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen overflow-auto">
        {/* Desktop Header */}
        <div className="hidden lg:block bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600 truncate">
                  {user ? (
                    <>
                      {user.firstName || ''} {user.lastName || ''} • {user.email || user.phone || 'No contact info'} • {user.role || 'Admin'}
                    </>
                  ) : (
                    <span className="text-gray-400">Loading user info...</span>
                  )}
                </p>
              </div>
              <div className="flex items-center space-x-3 flex-shrink-0">
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

        {/* Page Content */}
        <section className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </section>
      </main>
    </div>
  );
}

// Export layout without withAuth wrapper (page handles authentication)
export default AdminLayout;
