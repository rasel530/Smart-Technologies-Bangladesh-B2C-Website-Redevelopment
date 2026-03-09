/**
 * Order Tracking Page
 * 
 * Display real-time order tracking with status progress bar,
 * tracking timeline, courier info, and delivery countdown.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useOrderTracking } from '@/hooks/useOrderTracking';
import TrackingTimeline from '@/components/orders/TrackingTimeline';
import OTPVerification from '@/components/orders/OTPVerification';
import { OrderStatus } from '@/lib/api/orderManagement';

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = params.id as string;
  
  // Guest access via URL params
  const email = searchParams.get('email') || undefined;
  const phone = searchParams.get('phone') || undefined;

  const {
    isLoading,
    isRefreshing,
    error,
    orderStatus,
    realtimeStatus,
    trackingTimeline,
    trackingMilestones,
    notificationSubscriptions,
    deliveryConfirmation,
    getOrderStatus,
    getOrderStatusRealtime,
    enableAutoRefresh,
    disableAutoRefresh,
    isAutoRefreshEnabled,
    subscribeToNotifications,
    getNotificationSubscriptions,
    verifyDeliveryOTP,
    sendDeliveryOTP,
    clearError,
    refreshData,
  } = useOrderTracking();

  const [showOTPModal, setShowOTPModal] = useState(false);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [notificationChannels, setNotificationChannels] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (orderId) {
      loadTrackingData();
      // Enable auto-refresh every 30 seconds
      enableAutoRefresh(orderId, 30000, email, phone);
    }

    return () => {
      disableAutoRefresh();
    };
  }, [orderId]);

  const loadTrackingData = async () => {
    await refreshData(orderId, email, phone);
    setLastUpdated(new Date());
  };

  const handleRefresh = async () => {
    await loadTrackingData();
  };

  const handleSubscribeNotifications = async () => {
    if (notificationChannels.length === 0) {
      alert('Please select at least one notification channel');
      return;
    }

    const success = await subscribeToNotifications(orderId, {
      channels: notificationChannels as any[],
      phoneNumber: phone,
    });

    if (success) {
      setShowSubscribeModal(false);
      setNotificationChannels([]);
      alert('Successfully subscribed to notifications!');
    }
  };

  const handleVerifyOTP = async (otp: string) => {
    const success = await verifyDeliveryOTP(orderId, { otp });
    if (success) {
      setShowOTPModal(false);
      alert('Delivery confirmed successfully!');
      await loadTrackingData();
    }
  };

  const handleRequestOTP = async () => {
    const success = await sendDeliveryOTP(orderId);
    if (success) {
      setShowOTPModal(true);
    }
  };

  const statusLabels: Record<OrderStatus, { en: string; bn: string; icon: string; color: string }> = {
    pending: { en: 'Pending', bn: 'অপেক্ষমাণ', icon: '⏳', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
    confirmed: { en: 'Confirmed', bn: 'নিশ্চিত', icon: '✅', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    processing: { en: 'Processing', bn: 'প্রক্রিয়াকরণ', icon: '⚙️', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
    shipped: { en: 'Shipped', bn: 'প্রেরিত', icon: '🚚', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' },
    delivered: { en: 'Delivered', bn: 'বিতরণ করা হয়েছে', icon: '📦', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    cancelled: { en: 'Cancelled', bn: 'বাতিল', icon: '❌', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
    refunded: { en: 'Refunded', bn: 'ফেরত', icon: '💰', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' },
  };

  const statusSteps: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRelativeTime = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDate(date);
  };

  const getEstimatedDeliveryCountdown = (estimatedDelivery: Date | string | null | undefined) => {
    if (!estimatedDelivery) return null;
    const now = new Date();
    const deliveryDate = new Date(estimatedDelivery);
    const diffMs = deliveryDate.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Delivered!';
    
    const diffDays = Math.floor(diffMs / 86400000);
    const diffHours = Math.floor((diffMs % 86400000) / 3600000);
    const diffMins = Math.floor((diffMs % 3600000) / 60000);
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h ${diffMins}m`;
    }
    if (diffHours > 0) {
      return `${diffHours}h ${diffMins}m`;
    }
    return `${diffMins}m`;
  };

  const getCurrentStepIndex = () => {
    if (!orderStatus) return -1;
    return statusSteps.indexOf(orderStatus.status as OrderStatus);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!orderStatus) {
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

  const statusInfo = statusLabels[orderStatus.status as OrderStatus];
  const currentStepIndex = getCurrentStepIndex();
  const progress = currentStepIndex >= 0 ? ((currentStepIndex + 1) / statusSteps.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.push('/orders')}
                className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-2 inline-flex items-center gap-1"
              >
                ← Back to Orders
              </button>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Order Tracking
              </h1>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 disabled:opacity-50"
              >
                {isRefreshing ? 'Refreshing...' : '🔄 Refresh'}
              </button>
              <button
                onClick={() => setShowSubscribeModal(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                🔔 Subscribe
              </button>
              <button
                onClick={() => router.push('/contact')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
              >
                💬 Support
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={clearError}
                className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Current Status Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl ${statusInfo.color}`}>
                {statusInfo.icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {statusInfo.en}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Last updated: {lastUpdated ? formatRelativeTime(lastUpdated) : 'N/A'}
                </p>
              </div>
            </div>
            {isAutoRefreshEnabled && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <span className="animate-pulse">●</span>
                Auto-refreshing
              </div>
            )}
          </div>

          {/* Status Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Order Progress</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{Math.round(progress)}%</span>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-2">
              {statusSteps.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                return (
                  <div key={step} className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                        isCurrent
                          ? 'bg-blue-500 text-white ring-4 ring-blue-200 dark:ring-blue-800'
                          : isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                      }`}
                    >
                      {statusLabels[step].icon}
                    </div>
                    <span className="text-xs mt-1 text-gray-600 dark:text-gray-400 hidden sm:block">
                      {statusLabels[step].en}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tracking Number & Courier */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trackingTimeline?.trackingNumber && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tracking Number</p>
                <div className="flex items-center justify-between">
                  <p className="font-mono text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {trackingTimeline.trackingNumber}
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(trackingTimeline.trackingNumber!);
                      alert('Tracking number copied!');
                    }}
                    className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
            )}

            {trackingTimeline?.courierService && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Courier Service</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  🚚 {trackingTimeline.courierService}
                </p>
              </div>
            )}

            {trackingTimeline?.estimatedDelivery && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Estimated Delivery</p>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {formatDate(trackingTimeline.estimatedDelivery)}
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    {getEstimatedDeliveryCountdown(trackingTimeline.estimatedDelivery)}
                  </p>
                </div>
              </div>
            )}

            {orderStatus.status === 'shipped' && !deliveryConfirmation && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                  Verify delivery with OTP
                </p>
                <button
                  onClick={handleRequestOTP}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  Request OTP
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Map Placeholder */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Delivery Location
          </h3>
          <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">📍</div>
              <p className="text-gray-600 dark:text-gray-400">Map will be displayed here</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                (Integration with map service required)
              </p>
            </div>
          </div>
        </div>

        {/* Tracking Timeline */}
        {trackingTimeline && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <TrackingTimeline
              timeline={trackingTimeline.timeline}
              currentStatus={trackingTimeline.currentStatus}
            />
          </div>
        )}
      </div>

      {/* OTP Verification Modal */}
      <OTPVerification
        isOpen={showOTPModal}
        onClose={() => setShowOTPModal(false)}
        onVerify={handleVerifyOTP}
      />

      {/* Subscribe to Notifications Modal */}
      {showSubscribeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Subscribe to Notifications
              </h2>
              <button
                onClick={() => setShowSubscribeModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Get notified when your order status changes
              </p>
              <div className="space-y-2">
                {['email', 'sms', 'push'].map((channel) => (
                  <label key={channel} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationChannels.includes(channel)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNotificationChannels([...notificationChannels, channel]);
                        } else {
                          setNotificationChannels(notificationChannels.filter((c) => c !== channel));
                        }
                      }}
                      className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-gray-900 dark:text-gray-100 capitalize">{channel}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 rounded-b-lg flex gap-3">
              <button
                onClick={() => setShowSubscribeModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubscribeNotifications}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
