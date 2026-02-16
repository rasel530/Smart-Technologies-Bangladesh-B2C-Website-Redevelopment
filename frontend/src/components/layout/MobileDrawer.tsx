'use client';

import React, { useEffect, useRef, useState } from 'react';
import { User } from '@/types/auth';
import { CategoryTree } from '@/types/category';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SearchAutocomplete } from '@/components/product/SearchAutocomplete';

interface MobileDrawerProps {
  isOpen: boolean;
  user: User | null;
  language: 'en' | 'bn';
  pathname: string;
  onClose: () => void;
  onLogout: () => Promise<void>;
  cartCount: number;
  categoryTree: CategoryTree[];
  categoriesLoading: boolean;
}

const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  user,
  language,
  pathname,
  onClose,
  onLogout,
  cartCount,
  categoryTree,
  categoriesLoading
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const [menuExpanded, setMenuExpanded] = useState(false);

  // Close drawer on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const navigationItems = [
    {
      href: '/categories',
      label: language === 'bn' ? 'মেনু' : 'Menu',
      icon: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
        </svg>
      ),
      protected: true,
    },
    {
      href: '/cart',
      label: language === 'bn' ? 'কার্ট' : 'Cart',
      icon: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="21" r="1"></circle>
          <circle cx="19" cy="21" r="1"></circle>
          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
        </svg>
      ),
      protected: true,
    },
  ];

  const utilityLinks = [
    {
      href: '/help',
      label: language === 'bn' ? 'সাহায্য কেন্দ্র' : 'Help Center',
    },
    {
      href: '/contact',
      label: language === 'bn' ? 'যোগাযোগ করুন' : 'Contact Us',
    },
    {
      href: '/track-order',
      label: language === 'bn' ? 'অর্ডার ট্র্যাক করুন' : 'Track Order',
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

  // Recursive function to render nested category items in mobile menu
  const renderMobileCategoryItems = (categories: CategoryTree[], level: number = 0) => {
    return categories.map((category) => (
      <div key={category.id}>
        <a
          href={`/categories/${category.slug}`}
          className={cn(
            'block py-2 text-sm transition-colors',
            level === 0 
              ? 'text-gray-700 hover:bg-gray-100 font-medium' 
              : 'text-gray-600 hover:bg-gray-50'
          )}
          style={{ paddingLeft: `${12 + level * 16}px` }}
          onClick={onClose}
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
            {renderMobileCategoryItems(category.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={cn(
          'fixed top-0 right-0 h-full w-[85vw] max-w-[320px] bg-white shadow-xl z-50 md:hidden transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 id="drawer-title" className="text-lg font-bold text-dark-gray">
            {language === 'bn' ? 'মেনু' : 'Menu'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2"
            aria-label={language === 'bn' ? 'মেনু বন্ধ করুন' : 'Close menu'}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="p-4 overflow-y-auto h-full pb-20">
          {/* User Section (if authenticated) */}
          {user && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-blue rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-dark-gray">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-600">{user.email || user.phone}</p>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Search */}
          <div className="mb-6">
            <SearchAutocomplete
              placeholder={language === 'bn' ? 'পণ্য খুঁজুন...' : 'Search products...'}
              className="w-full"
            />
          </div>

          {/* Navigation Links */}
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              // Skip protected routes for non-authenticated users
              if (item.protected && !user) {
                return null;
              }

              // For dropdown items (Menu), make it expandable
              if (item.isDropdown) {
                return (
                  <div key="menu-item">
                    <button
                      onClick={() => setMenuExpanded(!menuExpanded)}
                      className={cn(
                        'flex items-center justify-between w-full space-x-3 px-4 py-3 text-sm font-medium transition-colors rounded-md',
                        {
                          'text-gray-700 hover:bg-gray-100': !isActive('/categories'),
                          'bg-primary-blue text-white': isActive('/categories')
                        }
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon />
                        <span>{item.label}</span>
                      </div>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={cn(
                          'transition-transform duration-200',
                          menuExpanded ? 'rotate-180' : ''
                        )}
                      >
                        <path d="m6 9 6 6 6-6"/>
                      </svg>
                    </button>
                    {/* Categories Dropdown with Multi-level Hierarchy - only show when expanded */}
                    {menuExpanded && (
                      <div className="mt-2 ml-4 space-y-1 border-l-2 border-gray-100">
                        <a
                          href="/categories"
                          className="block py-2 text-sm font-medium text-primary-blue hover:bg-gray-100 rounded-md transition-colors"
                          onClick={onClose}
                        >
                          📂 {language === 'bn' ? 'সব ক্যাটাগরি দেখুন' : 'View All Categories'}
                        </a>
                        {categoriesLoading ? (
                          <div className="py-2 text-sm text-gray-500">
                            {language === 'bn' ? 'লোড হচ্ছে...' : 'Loading...'}
                          </div>
                        ) : categoryTree.length > 0 ? (
                          <div className="mt-2">
                            {renderMobileCategoryItems(categoryTree)}
                          </div>
                        ) : (
                          <div className="py-2 text-sm text-gray-500">
                            {language === 'bn' ? 'কোনো ক্যাটাগরি নেই' : 'No categories'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center space-x-3 px-4 py-3 text-sm font-medium transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2',
                    {
                      'text-gray-700 hover:bg-gray-100': !isActive(item.href),
                      'bg-primary-blue text-white': isActive(item.href)
                    }
                  )}
                >
                  <Icon />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </div>

          {/* Utility Links */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="space-y-1">
              {utilityLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Logout Button (if authenticated) */}
          {user && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={async () => {
                  await onLogout();
                  onClose();
                }}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                <X className="h-5 w-5" />
                <span>{language === 'bn' ? 'লগ আউট' : 'Logout'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MobileDrawer;
