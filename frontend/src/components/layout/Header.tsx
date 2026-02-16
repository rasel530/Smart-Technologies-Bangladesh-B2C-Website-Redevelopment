'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types/auth';
import { CategoryTree } from '@/types/category';
import { cn } from '@/lib/utils';
import { getCategoryTree } from '@/lib/api/categories';
import UtilityBar from './UtilityBar';
import MainHeaderRow from './MainHeaderRow';
import NavigationBar from './NavigationBar';
import MobileDrawer from './MobileDrawer';
import { useCart } from '@/contexts/CartContext';

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className }) => {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  const [categoryTree, setCategoryTree] = useState<CategoryTree[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [localCartCount, setLocalCartCount] = useState(0);
  const [isGuestCartMounted, setIsGuestCartMounted] = useState(false);

  useEffect(() => {
    // Load language preference from localStorage
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage && ['en', 'bn'].includes(savedLanguage)) {
      setLanguage(savedLanguage as 'en' | 'bn');
    }
  }, []);

  useEffect(() => {
    // Load initial cart count from localStorage for guest users
    const loadGuestCartCount = () => {
      try {
        const savedCart = localStorage.getItem('smart_tech_guest_cart');
        if (savedCart) {
          const cartData = JSON.parse(savedCart);
          setLocalCartCount(cartData.items?.length || 0);
        }
      } catch (e) {
        console.error('Error loading guest cart:', e);
      }
    };

    loadGuestCartCount();
    setIsGuestCartMounted(true);

    // Listen for cart-updated events from CartContext (for both guest and logged-in users)
    const handleCartUpdate = (event: Event) => {
      // CartContext dispatches cart-updated event
      // For guest users, reload cart count from localStorage
      if (!user) {
        try {
          const savedCart = localStorage.getItem('smart_tech_guest_cart');
          if (savedCart) {
            const cartData = JSON.parse(savedCart);
            setLocalCartCount(cartData.items?.length || 0);
          } else {
            setLocalCartCount(0);
          }
        } catch (e) {
          console.error('Error loading guest cart:', e);
        }
      }
      // For logged-in users, CartContext will provide the count via useCart hook
    };

    window.addEventListener('cart-updated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate);
    };
  }, []);

  // Use CartContext itemCount for ALL users (both guest and logged-in)
  // Zustand store handles reactivity automatically
  const displayCartCount = itemCount;

  // Fetch category tree for navigation dropdown with multi-level hierarchy
  useEffect(() => {
    const fetchCategoryTree = async () => {
      try {
        const response = await getCategoryTree('active');
        if (response && response.tree) {
          setCategoryTree(response.tree);
        }
      } catch (error) {
        console.error('Error fetching category tree for navigation:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategoryTree();
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

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className={cn('sticky top-0 z-50 bg-white shadow-sm', className)}>
      {/* Row 1: Utility Bar (32px) */}
      <UtilityBar
        language={language}
        onLanguageChange={handleLanguageChange}
      />

      {/* Row 2: Main Header Row (80px) */}
      <MainHeaderRow
        user={user}
        language={language}
        cartCount={displayCartCount}
        onLogout={handleLogout}
      />

      {/* Row 3: Navigation Bar (44px) */}
      <NavigationBar
        user={user}
        language={language}
        pathname={pathname}
        onMobileMenuToggle={handleMobileMenuToggle}
        isMobileMenuOpen={isMobileMenuOpen}
        categoryTree={categoryTree}
        categoriesLoading={categoriesLoading}
      />

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={isMobileMenuOpen}
        user={user}
        language={language}
        pathname={pathname}
        onClose={() => setIsMobileMenuOpen(false)}
        onLogout={handleLogout}
        cartCount={displayCartCount}
        categoryTree={categoryTree}
        categoriesLoading={categoriesLoading}
      />
    </div>
  );
};

export default Header;
