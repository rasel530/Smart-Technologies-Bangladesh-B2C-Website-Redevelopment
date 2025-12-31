'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types/auth';
import {
  ShoppingCart,
  Search,
  Menu,
  X,
  ChevronDown,
  User as UserIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className }) => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [language, setLanguage] = useState<'en' | 'bn'>('en');

  useEffect(() => {
    // Load language preference from localStorage
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage && ['en', 'bn'].includes(savedLanguage)) {
      setLanguage(savedLanguage as 'en' | 'bn');
    }
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleLanguageChange = (lang: 'en' | 'bn') => {
    setLanguage(lang);
    localStorage.setItem('preferredLanguage', lang);
  };

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path);
  };

  const navigationItems = [
    {
      href: '/',
      label: language === 'bn' ? 'হোম' : 'Home',
      icon: UserIcon,
    },
    {
      href: '/products',
      label: language === 'bn' ? 'পণ্য়ার' : 'Products',
      icon: Search,
    },
    {
      href: '/account',
      label: language === 'bn' ? 'অ্যাকাউন্ট' : 'Account',
      icon: UserIcon,
      protected: true,
    },
    {
      href: '/orders',
      label: language === 'bn' ? 'অর্ডার' : 'Orders',
      icon: ShoppingCart,
      protected: true,
    },
    {
      href: '/wishlist',
      label: language === 'bn' ? 'ইচ্ছা' : 'Wishlist',
      icon: UserIcon,
      protected: true,
    },
    {
      href: '/cart',
      label: language === 'bn' ? 'কার্ট' : 'Cart',
      icon: ShoppingCart,
      protected: true,
    },
  ];

  return (
    <div className={cn('bg-white shadow-sm sticky top-0 z-50', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">ST</span>
            </div>
            <div className="ml-3">
              <h1 className="text-xl font-bold text-gray-900">
                {language === 'bn' ? 'স্মার্ট টেকনোব্স' : 'Smart Tech'}
              </h1>
              <p className="text-sm text-gray-600">
                {language === 'bn' ? 'বাংলাদেশ প্রক্ষর' : 'Technologies Bangladesh'}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            <div className="flex-1 md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-6">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                // Skip protected routes for non-authenticated users
                if (item.protected && !user) {
                  return null;
                }

                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center px-3 py-2 text-sm font-medium transition-colors',
                      {
                        'text-gray-700 hover:text-primary-700': !isActive(item.href),
                        'text-primary-700': isActive(item.href)
                      }
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="ml-2">{item.label}</span>
                  </a>
                );
              })}
            </div>
          </div>

          {/* User Menu */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center space-x-2 p-2 rounded-md text-gray-600 hover:bg-gray-100 md:hidden"
              >
                <UserIcon className="h-6 w-6" />
                <ChevronDown className="h-4 w-4" />
              </button>

              {/* Language Toggle */}
              <div className="hidden md:flex md:items-center md:space-x-2">
                <span className="text-sm text-gray-600 mr-2">
                  {language === 'bn' ? 'ভাষা:' : 'Language:'}
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
                  বাংলা
                </button>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
                <span className="hidden md:inline">{language === 'bn' ? 'লগ আউট' : 'Logout'}</span>
              </button>
            </div>
          )}

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="absolute top-16 right-4 w-64 bg-white rounded-lg shadow-lg z-50 md:hidden">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900">
                    {language === 'bn' ? 'মেনু' : 'Menu'}
                  </h2>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-1 rounded-md text-gray-600 hover:bg-gray-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-2">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    // Skip protected routes for non-authenticated users
                    if (item.protected && !user) {
                      return null;
                    }

                    return (
                      <a
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center px-3 py-2 text-sm font-medium transition-colors block w-full',
                          {
                            'text-gray-700 hover:text-primary-700': !isActive(item.href),
                            'text-primary-700': isActive(item.href)
                          }
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="ml-2">{item.label}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
