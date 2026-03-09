/**
 * Shared Order Page
 * 
 * Display shared order information with read-only access.
 * Handles password-protected links and view limits.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useOrderSharing } from '@/hooks/useOrderConfirmation';
import { OrderConfirmationData } from '@/lib/api/orderConfirmation';

export default function SharedOrderPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const { getSharedOrder, loading, error } = useOrderSharing('');
  const [order, setOrder] = useState<OrderConfirmationData | null>(null);
  const [password, setPassword] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [viewLimitReached, setViewLimitReached] = useState(false);

  useEffect(() => {
    loadSharedOrder();
  }, [token]);

  const loadSharedOrder = async () => {
    try {
      const data = await getSharedOrder(token);
      setOrder(data);
    } catch (err: any) {
      if (err.message?.includes('expired')) {
        setIsExpired(true);
      } else if (err.message?.includes('limit')) {
        setViewLimitReached(true);
      }
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await getSharedOrder(token, password);
      setOrder(data);
    } catch (err: any) {
      console.error('Failed to access shared order:', err);
    }
  };

  const formatCurrency = (amount: number | string | null | undefined) => {
    if (amount === null || amount === undefined) return '৳0.00';
    // Convert to number if it's a string
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return '৳0.00';
    return `৳${numAmount.toFixed(2)}`;
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const statusLabels: Record<string, { en: string; bn: string; color: string }> = {
    pending: { en: 'Pending', bn: 'অপেক্ষমাণ', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
    confirmed: { en: 'Confirmed', bn: 'নিশ্চিত', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    processing: { en: 'Processing', bn: 'প্রক্রিয়াকরণ', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
    shipped: { en: 'Shipped', bn: 'প্রেরিত', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' },
    delivered: { en: 'Delivered', bn: 'বিতরণ করা হয়েছে', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    cancelled: { en: 'Cancelled', bn: 'বাতিল', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
    refunded: { en: 'Refunded', bn: 'ফেরত', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' },
  };

  const maskEmail = (email: string) => {
    const [username, domain] = email.split('@');
    const maskedUsername = username.length > 2
      ? username.substring(0, 2) + '*'.repeat(username.length - 2)
      : username;
    return maskedUsername + '@' + domain;
  };

  const maskPhone = (phone: string) => {
    if (phone.length <= 4) return phone;
    return phone.substring(0, 2) + '*'.repeat(phone.length - 4) + phone.substring(phone.length - 2);
  };

  const maskAddress = (address: any) => {
    return {
      ...address,
      addressLine1: address.addressLine1?.replace(/\d/g, '*'),
      addressLine2: address.addressLine2?.replace(/\d/g, '*'),
      postalCode: address.postalCode?.replace(/\d/g, '*'),
    };
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Error states
  if (isExpired) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏰</div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Link Expired</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This share link has expired. Please contact the order owner for a new link.
          </p>
        </div>
      </div>
    );
  }

  if (viewLimitReached) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">View Limit Reached</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This one-time link has reached its maximum view limit.
          </p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    // Check if error is due to password requirement
    if (error.includes('password') || error.includes('Password')) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-8">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🔒</div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Password Protected
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                This order is password protected. Please enter the password to view.
              </p>
            </div>
            <form onSubmit={handlePasswordSubmit}>
              <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                  placeholder="Enter password"
                  required
                />
              </div>
              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'View Order'}
              </button>
            </form>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Link Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This share link is invalid or has been deleted.
          </p>
        </div>
      </div>
    );
  }

  // Order display
  if (!order) {
    return null;
  }

  const statusInfo = statusLabels[order.status] || statusLabels.confirmed;
  const maskedShippingAddress = maskAddress(order.shippingAddress);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {order.orderNumber}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                  {statusInfo.en}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Placed on {formatDate(order.createdAt)}
                </span>
              </div>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Shared Order View
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Order Items */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Order Items
          </h2>
          {order.items && order.items.length > 0 ? (
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-20 h-20 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {item.productImage ? (
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl">📦</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      {item.productName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      SKU: {item.sku || 'N/A'}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Qty: {item.quantity}
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(item.price)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(item.total)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No items in this order</p>
          )}
        </div>

        {/* Order Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Order Summary
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Tax</span>
              <span>{formatCurrency(order.tax)}</span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Shipping</span>
              <span>{formatCurrency(order.shipping)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>Discount</span>
                <span>-{formatCurrency(order.discount)}</span>
              </div>
            )}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between text-lg font-bold text-gray-900 dark:text-gray-100">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Customer Information (Masked) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Customer Information
          </h2>
          <div className="space-y-2">
            <p className="text-gray-900 dark:text-gray-100">
              <span className="font-medium">Name:</span> {order.customer.firstName} {order.customer.lastName}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              <span className="font-medium">Email:</span> {maskEmail(order.customer.email)}
            </p>
            {order.customer.phone && (
              <p className="text-gray-600 dark:text-gray-400">
                <span className="font-medium">Phone:</span> {maskPhone(order.customer.phone)}
              </p>
            )}
          </div>
        </div>

        {/* Shipping Address (Masked) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Shipping Address
          </h2>
          <div className="space-y-1 text-gray-600 dark:text-gray-400">
            <p className="text-gray-900 dark:text-gray-100 font-medium">
              {maskedShippingAddress.firstName} {maskedShippingAddress.lastName}
            </p>
            {maskedShippingAddress.phone && (
              <p>{maskPhone(maskedShippingAddress.phone)}</p>
            )}
            <p>{maskedShippingAddress.addressLine1}</p>
            {maskedShippingAddress.addressLine2 && (
              <p>{maskedShippingAddress.addressLine2}</p>
            )}
            <p>
              {maskedShippingAddress.city}, {maskedShippingAddress.state} {maskedShippingAddress.postalCode}
            </p>
            <p>{maskedShippingAddress.country}</p>
          </div>
        </div>

        {/* Estimated Delivery */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Estimated Delivery
          </h2>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatDate(order.estimatedDeliveryDate)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Estimated arrival date
              </p>
            </div>
          </div>
        </div>

        {/* Tracking Information */}
        {order.tracking && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Tracking Information
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Tracking Number:</span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  {order.tracking.trackingNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Courier:</span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  {order.tracking.courierService}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Current Status:</span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  {order.tracking.currentStatus}
                </span>
              </div>
              {order.tracking.estimatedDeliveryDate && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Estimated Delivery:</span>
                  <span className="text-gray-900 dark:text-gray-100 font-medium">
                    {formatDate(order.tracking.estimatedDeliveryDate)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Note */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            This is a shared view of the order. Some information may be masked for privacy purposes.
          </p>
        </div>
      </div>
    </div>
  );
}
