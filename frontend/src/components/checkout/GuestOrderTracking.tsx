'use client';

import React, { useState } from 'react';
import { Search, Package, MapPin, CreditCard, Truck, CheckCircle, Clock, XCircle, AlertCircle, Loader2, Calendar, User, Mail, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { GuestOrder, GuestOrderTrackingProps } from '@/types/guestCheckout';

/**
 * Guest Order Tracking Component
 *
 * Provides order tracking interface for guest users including:
 * - Order number and email/phone input
 * - Order status display
 * - Order details view
 * - Mobile-friendly layout
 * - Loading states
 * - Error handling
 *
 * @example
 * ```tsx
 * <GuestOrderTracking
 *   onTrackOrder={(orderNumber, email, phone) => console.log('Track:', orderNumber)}
 *   language="en"
 * />
 * ```
 */

const ORDER_STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string; labelBn: string }> = {
  PENDING: {
    icon: <Clock className="w-5 h-5" />,
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    label: 'Pending',
    labelBn: 'মুলতুবি',
  },
  CONFIRMED: {
    icon: <CheckCircle className="w-5 h-5" />,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    label: 'Confirmed',
    labelBn: 'নিশ্চিত',
  },
  PROCESSING: {
    icon: <Package className="w-5 h-5" />,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    label: 'Processing',
    labelBn: 'প্রক্রিয়াকরণ',
  },
  SHIPPED: {
    icon: <Truck className="w-5 h-5" />,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    label: 'Shipped',
    labelBn: 'প্রেরিত',
  },
  DELIVERED: {
    icon: <CheckCircle className="w-5 h-5" />,
    color: 'text-green-600 bg-green-50 border-green-200',
    label: 'Delivered',
    labelBn: 'সরবরাহ করা হয়েছে',
  },
  CANCELLED: {
    icon: <XCircle className="w-5 h-5" />,
    color: 'text-red-600 bg-red-50 border-red-200',
    label: 'Cancelled',
    labelBn: 'বাতিল',
  },
  REFUNDED: {
    icon: <AlertCircle className="w-5 h-5" />,
    color: 'text-orange-600 bg-orange-50 border-orange-200',
    label: 'Refunded',
    labelBn: 'ফেরত',
  },
};

const PAYMENT_STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string; labelBn: string }> = {
  PENDING: {
    icon: <Clock className="w-4 h-4" />,
    color: 'text-yellow-600 bg-yellow-50',
    label: 'Pending',
    labelBn: 'মুলতুবি',
  },
  PAID: {
    icon: <CheckCircle className="w-4 h-4" />,
    color: 'text-green-600 bg-green-50',
    label: 'Paid',
    labelBn: 'পরিশোধিত',
  },
  FAILED: {
    icon: <XCircle className="w-4 h-4" />,
    color: 'text-red-600 bg-red-50',
    label: 'Failed',
    labelBn: 'ব্যর্থ',
  },
  REFUNDED: {
    icon: <AlertCircle className="w-4 h-4" />,
    color: 'text-orange-600 bg-orange-50',
    label: 'Refunded',
    labelBn: 'ফেরত',
  },
};

export const GuestOrderTracking: React.FC<GuestOrderTrackingProps> = ({
  onTrackOrder,
  isLoading = false,
  language = 'en',
  className = '',
}) => {
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<GuestOrder | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Validate order number format
   */
  const validateOrderNumber = (orderNumber: string): boolean => {
    // Order number should be alphanumeric and at least 6 characters
    return /^[A-Za-z0-9]{6,}$/.test(orderNumber);
  };

  /**
   * Validate email format
   */
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * Validate Bangladesh phone number format
   */
  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^01[3-9]\d{8}$/;
    return phoneRegex.test(phone);
  };

  /**
   * Handle order tracking
   */
  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setTrackedOrder(null);

    // Validate order number
    if (!orderNumber.trim()) {
      setError(language === 'bn' ? 'অর্ডার নম্বর প্রয়োজন' : 'Order number is required');
      toast.error(language === 'bn' ? 'অর্ডার নম্বর প্রয়োজন' : 'Order number is required');
      return;
    }

    if (!validateOrderNumber(orderNumber)) {
      setError(language === 'bn' ? 'অবৈধ অর্ডার নম্বর ফরম্যাট' : 'Invalid order number format');
      toast.error(language === 'bn' ? 'অবৈধ অর্ডার নম্বর ফরম্যাট' : 'Invalid order number format');
      return;
    }

    // Validate email or phone
    if (!email.trim() && !phone.trim()) {
      setError(language === 'bn' ? 'ইমেল বা ফোন নম্বর প্রয়োজন' : 'Email or phone number is required');
      toast.error(language === 'bn' ? 'ইমেল বা ফোন নম্বর প্রয়োজন' : 'Email or phone number is required');
      return;
    }

    if (email.trim() && !validateEmail(email)) {
      setError(language === 'bn' ? 'অবৈধ ইমেল ফরম্যাট' : 'Invalid email format');
      toast.error(language === 'bn' ? 'অবৈধ ইমেল ফরম্যাট' : 'Invalid email format');
      return;
    }

    if (phone.trim() && !validatePhone(phone)) {
      setError(language === 'bn' ? 'অবৈধ ফোন নম্বর ফরম্যাট (01XXXXXXXXX)' : 'Invalid phone number format (01XXXXXXXXX)');
      toast.error(language === 'bn' ? 'অবৈধ ফোন নম্বর ফরম্যাট (01XXXXXXXXX)' : 'Invalid phone number format (01XXXXXXXXX)');
      return;
    }

    setIsSearching(true);

    try {
      await onTrackOrder(orderNumber, email || undefined, phone || undefined);
      // The parent component will handle setting the tracked order
      // This is just triggering the tracking action
    } catch (err) {
      console.error('Order tracking error:', err);
      setError(language === 'bn' ? 'অর্ডার ট্র্যাক করতে ব্যর্থ' : 'Failed to track order');
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Format currency
   */
  const formatCurrency = (amount: number): string => {
    return `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  /**
   * Format date
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusConfig = trackedOrder ? ORDER_STATUS_CONFIG[trackedOrder.status] || ORDER_STATUS_CONFIG.PENDING : null;
  const paymentStatusConfig = trackedOrder ? PAYMENT_STATUS_CONFIG[trackedOrder.paymentStatus] || PAYMENT_STATUS_CONFIG.PENDING : null;

  return (
    <div className={cn('guest-order-tracking', className)}>
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Search className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            {language === 'bn' ? 'অর্ডার ট্র্যাক করুন' : 'Track Your Order'}
          </h2>
        </div>
        <p className="text-sm text-gray-600">
          {language === 'bn' 
            ? 'আপনার অর্ডার স্থিতি জানতে অর্ডার নম্বর লিখুন' 
            : 'Enter your order number to check your order status'}
        </p>
      </div>

      {/* Tracking Form */}
      <form onSubmit={handleTrackOrder} className="space-y-4 mb-6">
        {/* Order Number */}
        <div>
          <label htmlFor="orderNumber" className="block text-sm font-medium text-gray-700 mb-1">
            {language === 'bn' ? 'অর্ডার নম্বর' : 'Order Number'} *
          </label>
          <div className="relative">
            <input
              id="orderNumber"
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
              className={cn(
                'w-full px-4 py-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors',
                error ? 'border-red-500' : 'border-gray-300'
              )}
              placeholder={language === 'bn' ? 'অর্ডার নম্বর লিখুন' : 'Enter order number'}
              disabled={isSearching || isLoading}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            {language === 'bn' ? 'ইমেল' : 'Email'}
          </label>
          <div className="relative">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              placeholder={language === 'bn' ? 'ইমেল লিখুন' : 'Enter email (optional)'}
              disabled={isSearching || isLoading}
            />
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            {language === 'bn' ? 'ফোন নম্বর' : 'Phone Number'}
          </label>
          <div className="relative">
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={11}
              className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              placeholder="01XXXXXXXXX"
              disabled={isSearching || isLoading}
            />
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSearching || isLoading}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200',
            'bg-blue-600 text-white',
            'hover:bg-blue-700',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'active:scale-95'
          )}
        >
          {isSearching ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>
                {language === 'bn' ? 'অনুসন্ধান করা হচ্ছে...' : 'Searching...'}
              </span>
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              <span>
                {language === 'bn' ? 'অর্ডার ট্র্যাক করুন' : 'Track Order'}
              </span>
            </>
          )}
        </button>
      </form>

      {/* Order Details */}
      {trackedOrder && statusConfig && paymentStatusConfig && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
          {/* Order Status Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {language === 'bn' ? 'অর্ডার স্থিতি' : 'Order Status'}
              </h3>
              <span className={cn('px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2', statusConfig.color)}>
                {statusConfig.icon}
                {language === 'bn' ? statusConfig.labelBn : statusConfig.label}
              </span>
            </div>

            {/* Order Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">
                    {language === 'bn' ? 'অর্ডার নম্বর' : 'Order Number'}
                  </p>
                  <p className="font-semibold text-gray-900">{trackedOrder.orderNumber}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">
                    {language === 'bn' ? 'অর্ডার তারিখ' : 'Order Date'}
                  </p>
                  <p className="font-semibold text-gray-900">{formatDate(trackedOrder.createdAt)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">
                    {language === 'bn' ? 'পেমেন্ট স্থিতি' : 'Payment Status'}
                  </p>
                  <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium', paymentStatusConfig.color)}>
                    {paymentStatusConfig.icon}
                    {language === 'bn' ? paymentStatusConfig.labelBn : paymentStatusConfig.label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Address Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                {language === 'bn' ? 'শিপিং ঠিকানা' : 'Shipping Address'}
              </h3>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-gray-900">{trackedOrder.shippingAddress.fullName}</p>
              <p className="text-gray-600">{trackedOrder.shippingAddress.addressLine1}</p>
              {trackedOrder.shippingAddress.addressLine2 && (
                <p className="text-gray-600">{trackedOrder.shippingAddress.addressLine2}</p>
              )}
              <p className="text-gray-600">
                {trackedOrder.shippingAddress.city}, {trackedOrder.shippingAddress.district} {trackedOrder.shippingAddress.postalCode}
              </p>
              <p className="text-gray-600">{trackedOrder.shippingAddress.phone}</p>
            </div>
          </div>

          {/* Order Items Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {language === 'bn' ? 'অর্ডার আইটেম' : 'Order Items'}
            </h3>
            <div className="space-y-3">
              {trackedOrder.items.map((item) => (
                <div key={item.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                  {item.productImage && (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.productName}</p>
                    <p className="text-sm text-gray-600">
                      {language === 'bn' ? 'পরিমাণ:' : 'Quantity:'} {item.quantity}
                    </p>
                    <p className="text-sm font-semibold text-blue-600">
                      {formatCurrency(item.totalPrice)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {language === 'bn' ? 'অর্ডার সারাংশ' : 'Order Summary'}
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{language === 'bn' ? 'উপমোট:' : 'Subtotal:'}</span>
                <span className="font-medium text-gray-900">{formatCurrency(trackedOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{language === 'bn' ? 'শিপিং:' : 'Shipping:'}</span>
                <span className="font-medium text-gray-900">
                  {trackedOrder.shippingCost === 0 
                    ? (language === 'bn' ? 'বিনামূল্যে' : 'Free') 
                    : formatCurrency(trackedOrder.shippingCost)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{language === 'bn' ? 'কর:' : 'Tax:'}</span>
                <span className="font-medium text-gray-900">{formatCurrency(trackedOrder.tax)}</span>
              </div>
              {trackedOrder.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>{language === 'bn' ? 'ছাড়:' : 'Discount:'}</span>
                  <span className="font-medium">-{formatCurrency(trackedOrder.discount)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-base font-semibold text-gray-900">
                    {language === 'bn' ? 'মোট:' : 'Total:'}
                  </span>
                  <span className="text-xl font-bold text-gray-900">
                    {formatCurrency(trackedOrder.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestOrderTracking;
