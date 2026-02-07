'use client';

import React from 'react';
import { User } from '@/types/auth';
import {
  ShoppingCart,
  ChevronDown,
  User as UserIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SearchAutocomplete } from '@/components/product/SearchAutocomplete';

interface MainHeaderRowProps {
  user: User | null;
  language: 'en' | 'bn';
  cartCount: number;
  onLogout: () => Promise<void>;
  className?: string;
}

const MainHeaderRow: React.FC<MainHeaderRowProps> = ({
  user,
  language,
  cartCount,
  onLogout,
  className
}) => {
  return (
    <div className={cn('h-20 bg-white border-b border-gray-200', className)}>
      <div className="max-w-[98rem] mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Left: Logo Section */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-primary-blue rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-xl md:text-2xl">ST</span>
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-dark-gray leading-tight">
                {language === 'bn' ? 'স্মার্ট টেকনোব্স' : 'Smart Tech'}
              </h1>
              <p className="text-xs text-gray-600">
                {language === 'bn' ? 'বাংলাদেশ প্রযুক্তি' : 'Technologies Bangladesh'}
              </p>
            </div>
          </div>

          {/* Center: Search Section */}
          <div className="hidden md:flex flex-1 max-w-xl lg:max-w-2xl mx-4 lg:mx-8">
            <div className="relative w-full">
              <SearchAutocomplete
                placeholder={language === 'bn' ? 'পণ্য খুঁজুন...' : 'Search products...'}
                className="w-full"
              />
            </div>
          </div>

          {/* Right: User Actions Section */}
          <div className="flex items-center space-x-4">
            {/* Authenticated User Menu */}
            {user ? (
              <div className="hidden md:flex items-center space-x-4">
                {/* User Dropdown */}
                <div className="relative group">
                  <button
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2"
                    aria-label="User menu"
                  >
                    <UserIcon className="h-5 w-5" />
                    <span className="text-sm font-medium hidden sm:inline">
                      {user.firstName}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <a
                      href="/account"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors rounded-t-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2"
                    >
                      {language === 'bn' ? 'অ্যাকাউন্ট' : 'Account'}
                    </a>
                    <a
                      href="/orders"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2"
                    >
                      {language === 'bn' ? 'অর্ডার' : 'Orders'}
                    </a>
                    <button
                      onClick={onLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition-colors rounded-b-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      {language === 'bn' ? 'লগ আউট' : 'Logout'}
                    </button>
                  </div>
                </div>

                {/* Cart Button */}
                <a
                  href="/cart"
                  aria-label={`Shopping cart with ${cartCount} items`}
                  className="relative flex items-center space-x-2 px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span className="text-sm font-medium hidden sm:inline">
                    {language === 'bn' ? 'কার্ট' : 'Cart'}
                  </span>
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange-accent text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </a>
              </div>
            ) : (
              /* Guest User */
              <div className="hidden md:flex items-center space-x-4">
                <a
                  href="/login"
                  className="text-sm font-medium text-gray-600 hover:text-primary-blue transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2"
                >
                  {language === 'bn' ? 'লগ ইন' : 'Sign In'}
                </a>
                <a
                  href="/register"
                  className="px-4 py-2 bg-orange-accent text-white text-sm font-medium rounded-md hover:bg-orange-hover transition-colors focus:outline-none focus:ring-2 focus:ring-orange-accent focus:ring-offset-2"
                >
                  {language === 'bn' ? 'নিবন্ধন' : 'Register'}
                </a>
                <a
                  href="/cart"
                  aria-label={`Shopping cart with ${cartCount} items`}
                  className="relative flex items-center space-x-2 px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange-accent text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainHeaderRow;
