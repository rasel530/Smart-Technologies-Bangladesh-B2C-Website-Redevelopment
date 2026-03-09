/**
 * Order Confirmation Page
 * 
 * Display order confirmation after successful checkout with success animation,
 * order summary, customer information, and action buttons.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useOrderConfirmation, useOrderInvoices, useOrderSharing, useOrderTracking } from '@/hooks/useOrderConfirmation';
import OrderShare from '@/components/orders/OrderShare';
import InvoiceDownload from '@/components/orders/InvoiceDownload';
import TrackingInformation from '@/components/orders/TrackingInformation';

export default function OrderConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const { confirmation, loading, error, trackConfirmationView } = useOrderConfirmation(orderId);
  const { invoices } = useOrderInvoices(orderId);
  const { shareLinks } = useOrderSharing(orderId);
  const { tracking } = useOrderTracking(orderId, true, 60000);

  const [showShareModal, setShowShareModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [animationPlayed, setAnimationPlayed] = useState(false);

  useEffect(() => {
    // Track page view
    trackConfirmationView({
      userAgent: navigator.userAgent,
      referrer: document.referrer,
    });

    // Play success animation
    setTimeout(() => setAnimationPlayed(true), 100);
  }, [orderId, trackConfirmationView]);

  const statusLabels: Record<string, { en: string; bn: string; color: string }> = {
    pending: { en: 'Pending', bn: 'অপেক্ষমাণ', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
    confirmed: { en: 'Confirmed', bn: 'নিশ্চিত', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    processing: { en: 'Processing', bn: 'প্রক্রিয়াকরণ', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
    shipped: { en: 'Shipped', bn: 'প্রেরিত', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' },
    delivered: { en: 'Delivered', bn: 'বিতরণ করা হয়েছে', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    cancelled: { en: 'Cancelled', bn: 'বাতিল', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
    refunded: { en: 'Refunded', bn: 'ফেরত', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' },
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

  const formatCurrency = (amount: number | string | null | undefined) => {
    if (amount === null || amount === undefined) return '৳0.00';
    // Convert to number if it's a string
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return '৳0.00';
    return `৳${numAmount.toFixed(2)}`;
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!confirmation) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Order Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The order you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/orders')}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = statusLabels[confirmation.status] || statusLabels.confirmed;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Success Animation Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className={`mb-6 transition-all duration-1000 ${animationPlayed ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
              <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full shadow-lg">
                <svg
                  className="w-12 h-12 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-2">Order Confirmed!</h1>
            <p className="text-xl text-green-100">Thank you for your purchase</p>
            <p className="mt-4 text-green-200">
              Order Number: <span className="font-semibold">{confirmation.orderNumber}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Badge */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${statusInfo.color}`}>
                {statusInfo.en}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                Placed on {formatDate(confirmation.createdAt)}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowShareModal(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share Order
              </button>
              <button
                onClick={() => setShowInvoiceModal(true)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium flex items-center gap-2 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Invoice
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium flex items-center gap-2 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
            </div>
          </div>
        </div>

        {/* Order Items and Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Order Items */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Order Items
              </h2>
              {confirmation.items && confirmation.items.length > 0 ? (
                <div className="space-y-4">
                  {confirmation.items.map((item) => (
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Order Summary
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span>{formatCurrency(confirmation.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Tax</span>
                  <span>{formatCurrency(confirmation.tax)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Shipping</span>
                  <span>{formatCurrency(confirmation.shipping)}</span>
                </div>
                {confirmation.discount > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>Discount</span>
                    <span>-{formatCurrency(confirmation.discount)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between text-lg font-bold text-gray-900 dark:text-gray-100">
                  <span>Total</span>
                  <span>{formatCurrency(confirmation.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Info */}
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Customer Information
              </h2>
              <div className="space-y-2">
                <p className="text-gray-900 dark:text-gray-100">
                  <span className="font-medium">Name:</span> {confirmation.customer.firstName} {confirmation.customer.lastName}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Email:</span> {confirmation.customer.email}
                </p>
                {confirmation.customer.phone && (
                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Phone:</span> {confirmation.customer.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Shipping Address
              </h2>
              <div className="space-y-1 text-gray-600 dark:text-gray-400">
                <p className="text-gray-900 dark:text-gray-100 font-medium">
                  {confirmation.shippingAddress.firstName} {confirmation.shippingAddress.lastName}
                </p>
                {confirmation.shippingAddress.phone && (
                  <p>{confirmation.shippingAddress.phone}</p>
                )}
                <p>{confirmation.shippingAddress.addressLine1}</p>
                {confirmation.shippingAddress.addressLine2 && (
                  <p>{confirmation.shippingAddress.addressLine2}</p>
                )}
                <p>
                  {confirmation.shippingAddress.city}, {confirmation.shippingAddress.state} {confirmation.shippingAddress.postalCode}
                </p>
                <p>{confirmation.shippingAddress.country}</p>
              </div>
            </div>

            {/* Estimated Delivery */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
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
                    {formatDate(confirmation.estimatedDeliveryDate)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Estimated arrival date
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tracking Information */}
        {tracking && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <TrackingInformation orderId={orderId} />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.push('/orders')}
            className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-lg"
          >
            View Order Details
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-lg dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
          >
            Continue Shopping
          </button>
        </div>
      </div>

      {/* Modals */}
      <OrderShare
        orderId={orderId}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />

      <InvoiceDownload
        orderId={orderId}
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
      />
    </div>
  );
}
