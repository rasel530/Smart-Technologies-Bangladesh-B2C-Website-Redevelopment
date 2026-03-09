'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  ShoppingCart,
  FileEdit,
  XCircle,
  Package,
  Share2,
  BarChart3,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  CheckCircle,
  Truck,
  Bell,
  PieChart,
  FileText,
  Shield,
  Users,
  Settings,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Home,
  LogOut,
  Tag,
  FolderTree,
  CreditCard,
  Search,
  Scale,
  Database,
  Lock,
  UserCog,
  Smartphone,
  Clock,
  Activity,
  Zap,
  Layers,
  GitBranch,
  Filter,
  Heart,
  RotateCcw,
  ArrowRightLeft,
  Eye,
  Ban,
  Sliders,
  UserPlus,
  Wallet,
  Calendar,
  DollarSign,
  Building2,
  Globe,
  Archive,
  HardDrive,
  Gavel,
  KeyRound,
  UserCheck,
  BarChart2,
  Target,
  Sparkles,
  History,
  Flame,
  FileSearch,
  ShoppingBag,
  Plus,
  Image as ImageIcon,
  Edit3,
  Trash2
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  href: string;
  icon: any;
  badge?: number;
  disabled?: boolean;
}

interface MenuCategory {
  id: string;
  title: string;
  icon: any;
  items: MenuItem[];
}

const menuCategories: MenuCategory[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: LayoutDashboard,
    items: [
      { id: 'dashboard-overview', label: 'Dashboard Overview', href: '/admin', icon: LayoutDashboard },
    ],
  },
  {
    id: 'orders',
    title: 'Orders',
    icon: ShoppingCart,
    items: [
      { id: 'all-orders', label: 'All Orders', href: '/admin/orders', icon: ShoppingCart },
      { id: 'order-modifications', label: 'Order Modifications', href: '/admin/orders/modifications', icon: FileEdit },
      { id: 'order-cancellations', label: 'Order Cancellations', href: '/admin/orders/cancellations', icon: XCircle },
      { id: 'order-fulfillments', label: 'Order Fulfillments', href: '/admin/orders/fulfillments', icon: Package },
      { id: 'order-sharing', label: 'Order Sharing', href: '/admin/orders/sharing', icon: Share2 },
    ],
  },
  {
    id: 'tracking',
    title: 'Tracking & Delivery',
    icon: BarChart3,
    items: [
      { id: 'tracking-analytics', label: 'Tracking Analytics', href: '/admin/tracking/analytics', icon: BarChart3 },
      { id: 'tracking-issues', label: 'Tracking Issues', href: '/admin/tracking/issues', icon: AlertTriangle },
      { id: 'tracking-sync', label: 'Tracking Sync', href: '/admin/tracking/sync', icon: RefreshCw },
      { id: 'delivery-performance', label: 'Delivery Performance', href: '/admin/delivery/performance', icon: TrendingUp },
      { id: 'delivery-confirmations', label: 'Delivery Confirmations', href: '/admin/delivery/confirmations', icon: CheckCircle },
    ],
  },
  {
    id: 'couriers',
    title: 'Courier Services',
    icon: Truck,
    items: [
      { id: 'courier-services', label: 'Manage Couriers', href: '/admin/courier-services', icon: Truck },
    ],
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: Bell,
    items: [
      { id: 'notifications', label: 'All Notifications', href: '/admin/notifications', icon: Bell },
      { id: 'notification-stats', label: 'Notification Statistics', href: '/admin/notifications/stats', icon: PieChart },
    ],
  },
  {
    id: 'invoices',
    title: 'Invoices',
    icon: FileText,
    items: [
      { id: 'invoices', label: 'Invoice Management', href: '/admin/invoices', icon: FileText },
    ],
  },
  {
    id: 'products',
    title: 'Products & Catalog',
    icon: Package,
    items: [
      { id: 'products', label: 'Product Management', href: '/admin/products', icon: Package },
      { id: 'products-new', label: 'New Product', href: '/admin/products/new', icon: Plus },
      { id: 'brands', label: 'Brand Management', href: '/admin/brands', icon: Tag },
      { id: 'brands-new', label: 'New Brand', href: '/admin/brands/new', icon: Plus },
      { id: 'categories', label: 'Category Management', href: '/admin/categories', icon: Layers },
      { id: 'categories-new', label: 'New Category', href: '/admin/categories/new', icon: Plus },
      { id: 'categories-tree', label: 'Category Tree', href: '/admin/categories/tree', icon: FolderTree },
    ],
  },
  {
    id: 'cart',
    title: 'Cart & Wishlist',
    icon: ShoppingCart,
    items: [
      { id: 'cart', label: 'Cart Overview', href: '/admin/cart', icon: ShoppingCart },
      { id: 'cart-analytics', label: 'Cart Analytics', href: '/admin/cart/analytics', icon: BarChart2 },
      { id: 'cart-recovery', label: 'Cart Recovery', href: '/admin/cart/recovery', icon: RotateCcw },
      { id: 'cart-recovery-settings', label: 'Recovery Settings', href: '/admin/cart/recovery/settings', icon: Sliders },
      { id: 'cart-recovery-stats', label: 'Recovery Statistics', href: '/admin/cart/recovery/stats', icon: BarChart2 },
      { id: 'cart-wishlist-analytics', label: 'Cart-Wishlist Analytics', href: '/admin/cart-wishlist/analytics', icon: BarChart2 },
      { id: 'cart-wishlist-conflicts', label: 'Cart-Wishlist Conflicts', href: '/admin/cart-wishlist/conflicts', icon: AlertTriangle },
      { id: 'cart-wishlist-move-history', label: 'Move History', href: '/admin/cart-wishlist/move-history', icon: History },
      { id: 'cart-wishlist-sync', label: 'Sync Dashboard', href: '/admin/cart-wishlist/sync-dashboard', icon: RefreshCw },
      { id: 'cart-wishlist-behavior', label: 'User Behavior Overview', href: '/admin/cart-wishlist/user-behavior', icon: Activity },
      { id: 'wishlists', label: 'Wishlist Management', href: '/admin/wishlists', icon: Heart },
      { id: 'wishlists-analytics', label: 'Wishlist Analytics', href: '/admin/wishlists/analytics', icon: BarChart2 },
      { id: 'wishlists-moderation', label: 'Wishlist Moderation', href: '/admin/wishlists/moderation', icon: Ban },
      { id: 'wishlists-products', label: 'Wishlist Products', href: '/admin/wishlists/products', icon: Package },
      { id: 'wishlists-settings', label: 'Wishlist Settings', href: '/admin/wishlists/settings', icon: Sliders },
      { id: 'wishlists-users', label: 'Wishlist Users', href: '/admin/wishlists/users', icon: Users },
    ],
  },
  {
    id: 'checkout',
    title: 'Checkout & Payments',
    icon: CreditCard,
    items: [
      { id: 'checkout', label: 'Checkout Overview', href: '/admin/checkout', icon: CreditCard },
      { id: 'checkout-abandonment', label: 'Checkout Abandonment', href: '/admin/checkout/abandonment', icon: XCircle },
      { id: 'checkout-analytics', label: 'Checkout Analytics', href: '/admin/checkout/analytics', icon: BarChart2 },
      { id: 'checkout-guest', label: 'Guest Checkout', href: '/admin/checkout/guest', icon: UserPlus },
      { id: 'checkout-sessions', label: 'Checkout Sessions', href: '/admin/checkout/sessions', icon: Clock },
      { id: 'checkout-settings', label: 'Checkout Settings', href: '/admin/checkout/settings', icon: Sliders },
      { id: 'payments', label: 'Payments Overview', href: '/admin/payments', icon: Wallet },
      { id: 'payments-analytics', label: 'Payments Analytics', href: '/admin/payments/analytics', icon: BarChart2 },
      { id: 'payments-gateways', label: 'Payment Gateways', href: '/admin/payments/gateways', icon: CreditCard },
      { id: 'cod', label: 'COD Settings', href: '/admin/cod', icon: DollarSign },
      { id: 'emi', label: 'EMI Overview', href: '/admin/emi', icon: Calendar },
      { id: 'emi-plans', label: 'EMI Plans', href: '/admin/emi/plans', icon: Layers },
      { id: 'emi-providers', label: 'EMI Providers', href: '/admin/emi/providers', icon: Building2 },
      { id: 'local-payment', label: 'Local Payment Settings', href: '/admin/local-payment', icon: Globe },
      { id: 'local-payment-subscriptions', label: 'Local Payment Subscriptions', href: '/admin/local-payment/subscriptions', icon: Archive },
    ],
  },
  {
    id: 'search',
    title: 'Search & Discovery',
    icon: Search,
    items: [
      { id: 'search', label: 'Search Overview', href: '/admin/search', icon: Search },
      { id: 'search-analytics', label: 'Search Analytics', href: '/admin/search/analytics', icon: BarChart2 },
      { id: 'search-optimization', label: 'Search Optimization', href: '/admin/search/optimization', icon: Sparkles },
      { id: 'search-performance', label: 'Search Performance', href: '/admin/search/performance', icon: Zap },
      { id: 'search-personalization', label: 'Search Personalization', href: '/admin/search/personalization', icon: Target },
      { id: 'search-queries', label: 'Search Queries', href: '/admin/search/queries', icon: FileSearch },
      { id: 'search-trending', label: 'Trending Searches', href: '/admin/search/trending', icon: Flame },
      { id: 'comparisons', label: 'Comparisons Management', href: '/admin/comparisons', icon: Scale },
      { id: 'comparisons-analytics', label: 'Comparisons Analytics', href: '/admin/comparisons/analytics', icon: BarChart2 },
    ],
  },
  {
    id: 'system',
    title: 'System & Infrastructure',
    icon: Settings,
    items: [
      { id: 'rbac', label: 'RBAC Overview', href: '/admin/rbac', icon: Shield },
      { id: 'rbac-escalations', label: 'RBAC Escalations', href: '/admin/rbac/escalations', icon: AlertTriangle },
      { id: 'rbac-permissions', label: 'RBAC Permissions', href: '/admin/rbac/permissions', icon: KeyRound },
      { id: 'rbac-roles', label: 'RBAC Roles', href: '/admin/rbac/roles', icon: Lock },
      { id: 'rbac-users', label: 'RBAC Users', href: '/admin/rbac/users', icon: UserCheck },
      { id: 'roles', label: 'Roles Management', href: '/admin/roles', icon: UserCog },
      { id: 'elasticsearch', label: 'Elasticsearch Overview', href: '/admin/elasticsearch', icon: Database },
      { id: 'elasticsearch-backups', label: 'Elasticsearch Backups', href: '/admin/elasticsearch/backups', icon: Archive },
      { id: 'elasticsearch-indices', label: 'Elasticsearch Indices', href: '/admin/elasticsearch/indices', icon: Layers },
      { id: 'elasticsearch-performance', label: 'Elasticsearch Performance', href: '/admin/elasticsearch/performance', icon: Zap },
      { id: 'elasticsearch-synonyms', label: 'Elasticsearch Synonyms', href: '/admin/elasticsearch/synonyms', icon: GitBranch },
      { id: 'mobile', label: 'Mobile Management', href: '/admin/mobile', icon: Smartphone },
    ],
  },
];

interface AdminSidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export function AdminSidebar({ isMobileOpen, onMobileClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Load expanded categories from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('admin-sidebar-expanded-categories');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setExpandedCategories(new Set(parsed));
      } catch (error) {
        console.error('Failed to parse expanded categories from localStorage:', error);
      }
    }
  }, []);

  // Save expanded categories to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('admin-sidebar-expanded-categories', JSON.stringify([...expandedCategories]));
  }, [expandedCategories]);

  // Auto-expand category based on current path
  useEffect(() => {
    const activeCategory = menuCategories.find(category =>
      category.items.some(item => pathname === item.href || pathname.startsWith(item.href + '/'))
    );
    if (activeCategory) {
      setExpandedCategories(prev => new Set([...prev, activeCategory.id]));
    }
  }, [pathname]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(categoryId)) {
        newExpanded.delete(categoryId);
      } else {
        newExpanded.add(categoryId);
      }
      return newExpanded;
    });
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = async () => {
    // Use AuthContext's logout function for consistent logout behavior
    await logout();
    // Close the logout confirmation dialog
    setShowLogoutDialog(false);
  };

  const cancelLogout = () => {
    setShowLogoutDialog(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => onMobileClose()}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6 text-gray-700" />
      </button>

      {/* Sidebar Overlay for Mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Logout Confirmation Dialog */}
      {showLogoutDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={cancelLogout} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <LogOut className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Confirm Logout</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to logout from the admin panel? You will need to login again to access the admin features.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200
          transform transition-transform duration-300 ease-in-out z-50
          flex flex-col
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-white" />
            <h2 className="text-lg font-bold text-white">Admin Panel</h2>
          </div>
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1 hover:bg-white/20 rounded transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {menuCategories.map((category) => (
            <div key={category.id} className="mb-2">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between p-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <category.icon className="w-4 h-4 text-gray-500 group-hover:text-blue-600 transition-colors" />
                  <span>{category.title}</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                    expandedCategories.has(category.id) ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Category Items */}
              {expandedCategories.has(category.id) && (
                <div className="mt-1 ml-4 space-y-1">
                  {category.items.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={onMobileClose}
                      className={`
                        flex items-center gap-2 p-2 text-sm rounded-lg transition-all duration-200
                        ${isActive(item.href)
                          ? 'bg-blue-50 text-blue-700 font-medium border-l-4 border-blue-600'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }
                        ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                      aria-current={isActive(item.href) ? 'page' : undefined}
                    >
                      <item.icon className={`w-4 h-4 flex-shrink-0 ${
                        isActive(item.href) ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                          {item.badge}
                        </span>
                      )}
                      {item.disabled && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Soon</span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 p-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors group"
          >
            <LogOut className="w-4 h-4 text-red-500 group-hover:text-red-700 transition-colors" />
            <span>Logout</span>
            <ChevronRight className="w-4 h-4 ml-auto text-red-400 group-hover:text-red-700 transition-colors" />
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 p-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors group"
          >
            <Home className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
            <span>Back to Website</span>
            <ChevronRight className="w-4 h-4 ml-auto text-gray-400 group-hover:text-blue-600 transition-colors" />
          </Link>
        </div>
      </aside>

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }
      `}</style>
    </>
  );
}
