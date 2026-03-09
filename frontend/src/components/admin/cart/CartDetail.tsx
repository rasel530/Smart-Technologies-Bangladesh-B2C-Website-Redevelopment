'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Trash2,
  ShoppingCart,
  User,
  Calendar,
  Package,
  Edit,
  Download,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import adminCartApi, { AdminCart, AdminCartItem } from '@/lib/api/admin/cart';
import CartRecovery from './CartRecovery';
import DiscountManagement from './DiscountManagement';
import CartNotes from './CartNotes';
import CartAuditLog from './CartAuditLog';

interface CartDetailProps {
  cartId: string;
  language?: 'en' | 'bn';
}

interface CartReservationItem {
  reservationId: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  status: string;
  expiresAt: string;
  totalStock: number;
  reservedStock: number;
  availableStock: number;
}

const CartDetail: React.FC<CartDetailProps> = ({ cartId, language = 'en' }) => {
  const [cart, setCart] = useState<AdminCart | null>(null);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'inventory' | 'recovery' | 'discount' | 'notes' | 'history'>('details');
  const [reservations, setReservations] = useState<CartReservationItem[]>([]);
  const [reservationsLoading, setReservationsLoading] = useState(false);
  const [releasingReservations, setReleasingReservations] = useState(false);

  useEffect(() => {
    fetchCart();
  }, [cartId]);

  const fetchCart = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminCartApi.getCart(cartId);
      setCart(response);
    } catch (error: any) {
      console.error('[CartDetail] Error fetching cart:', error);
      let errorMessage = 'Failed to load cart. Please try again.';
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      if (error?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
      } else if (error?.status === 403) {
        errorMessage = 'You do not have permission to view this cart.';
      } else if (error?.status === 404) {
        errorMessage = 'Cart not found.';
      } else if (error?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      }

      setError(errorMessage);
      setCart(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchReservations = async () => {
    setReservationsLoading(true);
    try {
      // This would fetch reservations for this cart
      // For now, we'll derive from cart items
      const productIds = cart?.items?.map(item => item.productId) || [];
      
      // Get product stock info for each item
      const reservationItems: CartReservationItem[] = [];
      
      for (const item of cart?.items || []) {
        if (item.product) {
          reservationItems.push({
            reservationId: item.id,
            productId: item.productId,
            productName: item.product.name || 'Unknown',
            sku: item.product.sku || 'N/A',
            quantity: item.quantity,
            status: cart.status === 'active' ? 'pending' : 'released',
            expiresAt: (cart.expiresAt || new Date(Date.now() + 30 * 60 * 1000)).toISOString(),
            totalStock: 0,
            reservedStock: item.quantity,
            availableStock: 0
          });
        }
      }
      
      setReservations(reservationItems);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setReservationsLoading(false);
    }
  };

  const handleReleaseReservations = async () => {
    if (!confirm('Are you sure you want to release all stock reservations for this cart? This will make the stock available again.')) return;
    
    setReleasingReservations(true);
    try {
      const response = await fetch(`/api/v1/admin/carts/inventory-impact/release-by-cart/${cartId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          adminId: 'current-admin',
          reason: 'Manual release from cart detail'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Reservations released successfully');
        fetchReservations();
      } else {
        alert(data.error || 'Failed to release reservations');
      }
    } catch (error) {
      console.error('Error releasing reservations:', error);
      alert('Failed to release reservations');
    } finally {
      setReleasingReservations(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'inventory' && cart) {
      fetchReservations();
    }
  }, [activeTab, cart]);

  const handleRemoveItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to remove this item from the cart?')) return;

    try {
      await adminCartApi.removeCartItem(cartId, itemId);
      setCart(cart ? {
        ...cart,
        items: cart.items?.filter(item => item.id !== itemId) || []
      } : null);
    } catch (error) {
      console.error('Error removing cart item:', error);
      alert('Failed to remove cart item');
    }
  };

  const handleClearCart = async () => {
    if (!confirm('Are you sure you want to clear this cart?')) return;

    try {
      await adminCartApi.clearCart(cartId);
      setCart(cart ? { ...cart, items: [], total: 0, subtotal: 0 } : null);
    } catch (error) {
      console.error('Error clearing cart:', error);
      alert('Failed to clear cart');
    }
  };

  const handleUpdateItem = async (itemId: string, data: { quantity?: number; price?: number }) => {
    try {
      await adminCartApi.updateCartItem(cartId, itemId, data);
      setCart(cart ? {
        ...cart,
        items: cart.items?.map(item =>
          item.id === itemId ? { ...item, ...data } : item
        ) || []
      } : null);
      setEditingItem(null);
    } catch (error) {
      console.error('Error updating cart item:', error);
      alert('Failed to update cart item');
    }
  };

  // AP-HIGH-001: Export functionality
  const handleExport = async () => {
    setExportLoading(true);
    try {
      const blob = await adminCartApi.exportCart(cartId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cart_${cartId}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      if (document.body && a.parentNode === document.body) { document.body.removeChild(a); }
    } catch (error) {
      console.error('Error exporting cart:', error);
      alert('Failed to export cart');
    } finally {
      setExportLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      abandoned: 'bg-yellow-100 text-yellow-800',
      converted: 'bg-blue-100 text-blue-800',
      expired: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
      </span>
    );
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number): string => {
    if (typeof price !== 'number' || isNaN(price)) {
      return '৳0.00';
    }
    return `৳${price.toFixed(2)}`;
  };

  const translations = {
    en: {
      back: 'Back to Carts',
      cartDetails: 'Cart Details',
      cartId: 'Cart ID',
      user: 'User',
      guestUser: 'Guest User',
      email: 'Email',
      phone: 'Phone',
      status: 'Status',
      createdAt: 'Created At',
      updatedAt: 'Updated At',
      expiresAt: 'Expires At',
      items: 'Items',
      product: 'Product',
      quantity: 'Quantity',
      price: 'Price',
      subtotal: 'Subtotal',
      tax: 'Tax',
      shipping: 'Shipping',
      discount: 'Discount',
      total: 'Total',
      edit: 'Edit',
      remove: 'Remove',
      clearCart: 'Clear Cart',
      loading: 'Loading cart...',
      error: 'Error loading cart',
      retry: 'Retry',
      noItems: 'No items in this cart',
      variant: 'Variant',
      addedAt: 'Added At',
      actions: 'Actions',
      export: 'Export'
    },
    bn: {
      back: 'কার্টে ফিরে যান',
      cartDetails: 'কার্ট বিস্তারিত',
      cartId: 'কার্ট আইডি',
      user: 'ব্যবহারকারী',
      guestUser: 'গেস্ট ব্যবহারকারী',
      email: 'ইমেইল',
      phone: 'ফোন',
      status: 'স্ট্যাটাস',
      createdAt: 'তৈরি হয়েছে',
      updatedAt: 'আপডেট হয়েছে',
      expiresAt: 'মেয়াদোত্তীর্ণ',
      items: 'আইটেম',
      product: 'পণ্য',
      quantity: 'পরিমাণ',
      price: 'দাম',
      subtotal: 'উপ-সর্ব',
      tax: 'কর',
      shipping: 'শিপিং',
      discount: 'ডিসকাউন্ট',
      total: 'মোট',
      edit: 'সম্পাদনা',
      remove: 'সরান',
      clearCart: 'কার্ট সাফ করুন',
      loading: 'কার্ট লোড হচ্ছে...',
      error: 'কার্ট লোড করতে ত্রুটি',
      retry: 'পুনরায় চেষ্টা করুন',
      noItems: 'এই কার্টে কোন আইটেম নেই',
      variant: 'ভেরিয়েন্ট',
      addedAt: 'যোগ করা হয়েছে',
      actions: 'ক্রিয়া',
      export: 'রপ্তানি'
    }
  };

  const t = translations[language];

  const tabTranslations = {
    en: {
      details: 'Cart Details',
      inventory: 'Inventory Impact',
      recovery: 'Recovery',
      discount: 'Discount',
      notes: 'Notes',
      history: 'History',
      totalReserved: 'Total Reserved Quantity',
      noReservations: 'No inventory reservations for this cart'
    },
    bn: {
      details: 'কার্ট বিবরণ',
      inventory: 'ইনভেন্টরি ইমপ্যাক্ট',
      recovery: 'পুনরুদ্ধার',
      discount: 'ডিসকাউন্ট',
      notes: 'নোট',
      history: 'ইতিহাস',
      totalReserved: 'মোট সংরক্ষিত পরিমাণ',
      noReservations: 'এই কার্টের জন্য কোনো ইনভেন্টরি রিজার্ভেশন নেই'
    }
  };

  const tt = tabTranslations[language];

  const getTabClassName = (tab: string) => {
    const baseClass = 'px-4 py-2 rounded-lg transition-colors';
    if (activeTab === tab) {
      return `${baseClass} bg-blue-600 text-white`;
    }
    return `${baseClass} bg-gray-100 text-gray-700 hover:bg-gray-200`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">{t.loading}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <div className="flex-shrink-0">
            <button
              onClick={() => fetchCart()}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              {t.retry}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!cart) {
    return null;
  }

  // Inventory Tab Content
  if (activeTab === 'inventory') {
    const totalReserved = reservations.reduce((sum, r) => sum + r.quantity, 0);

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/cart"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              {t.back}
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{tt.inventory}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('details')}
              className="px-4 py-2 rounded-lg transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              {tt.details}
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className="px-4 py-2 rounded-lg transition-colors bg-blue-600 text-white"
            >
              {tt.inventory}
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className="px-4 py-2 rounded-lg transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              {tt.notes}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className="px-4 py-2 rounded-lg transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              {tt.history}
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{tt.totalReserved}</p>
                <p className="text-2xl font-bold text-gray-900">{totalReserved}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Items Reserved</p>
                <p className="text-2xl font-bold text-gray-900">{reservations.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Cart Status</p>
                <p className="text-2xl font-bold text-gray-900 capitalize">{cart.status}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reservations Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Reserved Items</h2>
            {cart.status === 'active' && reservations.length > 0 && (
              <button
                onClick={handleReleaseReservations}
                disabled={releasingReservations}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {releasingReservations ? 'Releasing...' : 'Release All Reservations'}
              </button>
            )}
          </div>
          {reservationsLoading ? (
            <div className="p-8 text-center text-gray-500">Loading reservations...</div>
          ) : reservations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">{tt.noReservations}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[800px] divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reserved Qty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expires At
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reservations.map((item) => (
                    <tr key={item.reservationId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.productName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.sku}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-blue-600">
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {item.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(item.expiresAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Recovery Tab Content
  if (activeTab === 'recovery') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/cart"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              {t.back}
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{tt.recovery}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('details')}
              className="px-4 py-2 rounded-lg transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              {tt.details}
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className="px-4 py-2 rounded-lg transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              {tt.inventory}
            </button>
            <button
              onClick={() => setActiveTab('recovery')}
              className="px-4 py-2 rounded-lg transition-colors bg-blue-600 text-white"
            >
              {tt.recovery}
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className="px-4 py-2 rounded-lg transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              {tt.notes}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className="px-4 py-2 rounded-lg transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              {tt.history}
            </button>
          </div>
        </div>

        {/* Cart Recovery Component */}
        <CartRecovery
          cartId={cartId}
          cartStatus={cart.status}
          language={language}
          onRecoveryComplete={() => {
            fetchCart();
          }}
        />
      </div>
    );
  }

  // Discount Tab Content
  if (activeTab === 'discount') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/cart"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              {t.back}
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{tt.discount}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('details')}
              className="px-4 py-2 rounded-lg transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              {tt.details}
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className="px-4 py-2 rounded-lg transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              {tt.inventory}
            </button>
            <button
              onClick={() => setActiveTab('recovery')}
              className="px-4 py-2 rounded-lg transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              {tt.recovery}
            </button>
            <button
              onClick={() => setActiveTab('discount')}
              className="px-4 py-2 rounded-lg transition-colors bg-blue-600 text-white"
            >
              {tt.discount}
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className="px-4 py-2 rounded-lg transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              {tt.notes}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className="px-4 py-2 rounded-lg transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              {tt.history}
            </button>
          </div>
        </div>

        {/* Discount Management Component */}
        <DiscountManagement
          cartId={cartId}
          language={language}
          onDiscountChange={() => {
            fetchCart();
          }}
        />
      </div>
    );
  }

  // Notes Tab Content
  if (activeTab === 'notes') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/cart"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              {t.back}
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{tt.notes}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('details')}
              className="px-4 py-2 rounded-lg transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              {tt.details}
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className="px-4 py-2 rounded-lg transition-colors bg-blue-600 text-white"
            >
              {tt.notes}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className="px-4 py-2 rounded-lg transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              {tt.history}
            </button>
          </div>
        </div>

        {/* Cart Notes Component */}
        <CartNotes
          cartId={cartId}
          language={language}
          onNoteChange={() => {
            fetchCart();
          }}
        />
      </div>
    );
  }

  // History Tab Content
  if (activeTab === 'history') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/cart"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              {t.back}
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{tt.history}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('details')}
              className="px-4 py-2 rounded-lg transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              {tt.details}
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className="px-4 py-2 rounded-lg transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              {tt.notes}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className="px-4 py-2 rounded-lg transition-colors bg-blue-600 text-white"
            >
              {tt.history}
            </button>
          </div>
        </div>

        {/* Cart Audit Log Component */}
        <CartAuditLog
          cartId={cartId}
          language={language}
          onRollback={() => {
            fetchCart();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/cart"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.back}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{t.cartDetails}</h1>
        </div>
        {/* Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('details')}
            className={getTabClassName('details')}
          >
            {tt.details}
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={getTabClassName('inventory')}
          >
            {tt.inventory}
          </button>
            <button
              onClick={() => setActiveTab('recovery')}
              className={getTabClassName('recovery')}
            >
              {tt.recovery}
            </button>
            <button
              onClick={() => setActiveTab('discount')}
              className={getTabClassName('discount')}
            >
              {tt.discount}
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={getTabClassName('notes')}
            >
              {tt.notes}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={getTabClassName('history')}
            >
              {tt.history}
            </button>
          </div>
        {/* AP-HIGH-001: Export button */}
        <button
          onClick={handleExport}
          disabled={exportLoading}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          {exportLoading ? 'Exporting...' : t.export}
        </button>
      </div>

      {/* Cart Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Cart ID */}
          <div className="flex items-start gap-3">
            <ShoppingCart className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">{t.cartId}</p>
              <p className="text-sm font-medium text-gray-900">{cart.id}</p>
            </div>
          </div>

          {/* User */}
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">{t.user}</p>
              {cart.user ? (
                <>
                  <p className="text-sm font-medium text-gray-900">
                    {cart.user.firstName} {cart.user.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{cart.user.email}</p>
                </>
              ) : (
                <p className="text-sm font-medium text-gray-900">{t.guestUser}</p>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="flex items-start gap-3">
            <Package className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">{t.status}</p>
              {getStatusBadge(cart.status)}
            </div>
          </div>

          {/* Created At */}
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">{t.createdAt}</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(cart.createdAt)}</p>
            </div>
          </div>

          {/* Updated At */}
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">{t.updatedAt}</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(cart.updatedAt)}</p>
            </div>
          </div>

          {/* Expires At */}
          {cart.expiresAt && (
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">{t.expiresAt}</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(cart.expiresAt)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cart Items */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{t.items}</h2>
        </div>
        {cart.items?.length === 0 ? (
          <div className="p-8 text-center text-gray-500">{t.noItems}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[800px] divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.product}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.variant}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.quantity}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.price}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.subtotal}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cart.items?.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {item.product?.images?.[0] && (
                          <img
                            src={item.product.images[0].url}
                            alt={item.product.name}
                            className="h-10 w-10 rounded object-cover mr-3"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.product?.name || 'Unknown Product'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.product?.sku || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.variant?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => setEditingItem(item.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPrice(item.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPrice(item.subtotal)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-600 hover:text-red-900 flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        {t.remove}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cart Totals */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Cart Totals</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">{t.subtotal}</span>
            <span className="text-gray-900 font-medium">{formatPrice(cart.subtotal)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">{t.tax}</span>
            <span className="text-gray-900 font-medium">{formatPrice(cart.tax)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">{t.shipping}</span>
            <span className="text-gray-900 font-medium">{formatPrice(cart.shippingCost)}</span>
          </div>
          {cart.discount > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">{t.discount}</span>
              <span className="text-red-600 font-medium">-{formatPrice(cart.discount)}</span>
            </div>
          )}
          <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">{t.total}</span>
            <span className="text-lg font-semibold text-gray-900">{formatPrice(cart.total)}</span>
          </div>
        </div>
      </div>

      {/* Clear Cart Button */}
      {cart.items?.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleClearCart}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {t.clearCart}
          </button>
        </div>
      )}
    </div>
  );
};

export default CartDetail;
