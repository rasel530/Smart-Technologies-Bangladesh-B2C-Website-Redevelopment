'use client';

import React from 'react';
import { User } from '@/types/auth';
import { CategoryTree } from '@/types/category';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationBarProps {
  user: User | null;
  language: 'en' | 'bn';
  pathname: string;
  onMobileMenuToggle: () => void;
  isMobileMenuOpen: boolean;
  categoryTree: CategoryTree[];
  categoriesLoading: boolean;
  className?: string;
}

const NavigationBar: React.FC<NavigationBarProps> = ({
  user,
  language,
  pathname,
  onMobileMenuToggle,
  isMobileMenuOpen,
  categoryTree,
  categoriesLoading,
  className
}) => {
  const navigationItems = [
    {
      label: language === 'bn' ? 'মেনু' : 'Menu',
      icon: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
      ),
      protected: false,
      isDropdown: true,
    },
    {
      href: '/account',
      label: language === 'bn' ? 'অ্যাকাউন্ট' : 'Account',
      icon: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      ),
      protected: true,
    },
    {
      href: '/orders',
      label: language === 'bn' ? 'অর্ডার' : 'Orders',
      icon: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m7.5 4.27 9 5.15"></path>
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path>
          <path d="m3.3 7 8.7 5 8.7-5"></path>
          <path d="M12 22v-9"></path>
        </svg>
      ),
      protected: true,
    },
    {
      href: '/wishlist',
      label: language === 'bn' ? 'ইচ্ছা' : 'Wishlist',
      icon: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
        </svg>
      ),
      protected: true,
    },
    {
      href: '/cart',
      label: language === 'bn' ? 'কার্ট' : 'Cart',
      icon: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="21" r="1"></circle>
          <circle cx="19" cy="21" r="1"></circle>
          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
        </svg>
      ),
      protected: true,
    },
  ];

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path);
  };

  // Get category name based on language
  const getCategoryName = (category: CategoryTree) => {
    if (language === 'bn' && category.nameBn) {
      return category.nameBn;
    }
    return category.nameEn || category.name;
  };

  // Recursive function to render nested category items
  const renderCategoryItems = (categories: CategoryTree[], level: number = 0) => {
    return categories.map((category) => (
      <div key={category.id}>
        <a
          href={`/categories/${category.slug}`}
          className={cn(
            'block px-4 py-2 text-sm transition-colors',
            level === 0 
              ? 'text-gray-700 hover:bg-gray-100 font-medium' 
              : 'text-gray-600 hover:bg-gray-50'
          )}
          style={{ paddingLeft: `${12 + level * 16}px` }}
        >
          {getCategoryName(category)}
          {category.children && category.children.length > 0 && (
            <span className="ml-2 text-xs text-gray-400">
              ({category.children.length})
            </span>
          )}
        </a>
        {/* Render subcategories */}
        {category.children && category.children.length > 0 && (
          <div className="mt-1">
            {renderCategoryItems(category.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className={cn('h-11 bg-primary-blue', className)}>
      <div className="max-w-[98rem] mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Left: Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item, index) => {
              const Icon = item.icon;
              // Skip protected routes for non-authenticated users
              if (item.protected && !user) {
                return null;
              }

              // For dropdown items (Categories), render as dropdown trigger
              if (item.isDropdown) {
                return (
                  <div key={`dropdown-${index}`} className="relative group">
                    <button
                      className={cn(
                        'flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-blue',
                        {
                          'text-white hover:bg-primary-dark': !isActive('/categories'),
                          'bg-orange-accent text-white': isActive('/categories')
                        }
                      )}
                    >
                      <Icon />
                      <span>{item.label}</span>
                    </button>
                    {/* Dropdown Menu with Multi-level Category Hierarchy */}
                    <div className="absolute left-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 max-h-96 overflow-y-auto">
                      <a
                        href="/categories"
                        className="block px-4 py-2 text-sm font-medium text-primary-blue hover:bg-gray-100 transition-colors rounded-t-lg border-b border-gray-100 sticky top-0 bg-white"
                      >
                        {language === 'bn' ? '📂 সব ক্যাটাগরি' : '📂 All Categories'}
                      </a>
                      {/* Category Items with Nested Hierarchy */}
                      {categoriesLoading ? (
                        <div className="px-4 py-3 text-sm text-gray-500">
                          {language === 'bn' ? 'লোড হচ্ছে...' : 'Loading...'}
                        </div>
                      ) : categoryTree.length > 0 ? (
                        <div className="py-2">
                          {renderCategoryItems(categoryTree)}
                        </div>
                      ) : (
                        <div className="px-4 py-3 text-sm text-gray-500">
                          {language === 'bn' ? 'কোনো ক্যাটাগরি নেই' : 'No categories'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-blue',
                    {
                      'text-white hover:bg-primary-dark': !isActive(item.href),
                      'bg-orange-accent text-white': isActive(item.href)
                    }
                  )}
                >
                  <Icon />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>

          {/* Right: Mobile Menu Button */}
          <button
            onClick={onMobileMenuToggle}
            aria-label={language === 'bn' ? 'মেনু খুলুন' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
            className="md:hidden flex items-center space-x-2 px-3 py-2 rounded-md text-white hover:bg-primary-dark transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-blue"
          >
            <Menu className="h-5 w-5" />
            <span className="text-sm font-medium">
              {language === 'bn' ? 'মেনু' : 'Menu'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NavigationBar;
