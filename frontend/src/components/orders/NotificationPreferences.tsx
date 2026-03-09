/**
 * Notification Preferences Component
 * 
 * Manage notification preferences for an order with channel selection,
 * notification type checkboxes, and subscription management.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useOrderNotifications } from '@/hooks/useOrderConfirmation';
import { NotificationChannel, NotificationType, NotificationSubscription } from '@/lib/api/orderConfirmation';

interface NotificationPreferencesProps {
  orderId: string;
}

export default function NotificationPreferences({ orderId }: NotificationPreferencesProps) {
  const { subscriptions, loading, error, getNotificationSubscriptions, subscribeToNotifications, updateNotificationSubscription, unsubscribeFromNotifications } = useOrderNotifications(orderId);

  const [selectedChannels, setSelectedChannels] = useState<NotificationChannel[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<NotificationType[]>([]);
  const [editingSubscription, setEditingSubscription] = useState<NotificationSubscription | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    getNotificationSubscriptions();
  }, [getNotificationSubscriptions]);

  const handleChannelToggle = (channel: NotificationChannel) => {
    setSelectedChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel]
    );
  };

  const handleTypeToggle = (type: NotificationType) => {
    setSelectedTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  const handleSubscribe = async () => {
    if (selectedChannels.length === 0 || selectedTypes.length === 0) {
      return;
    }

    setActionLoading(true);
    setSuccess(null);
    try {
      await subscribeToNotifications({
        channels: selectedChannels,
        notificationTypes: selectedTypes,
      });
      setSuccess('Notification preferences saved successfully!');
      setShowForm(false);
      setSelectedChannels([]);
      setSelectedTypes([]);
    } catch (err: any) {
      console.error('Failed to subscribe to notifications:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingSubscription || selectedChannels.length === 0 || selectedTypes.length === 0) {
      return;
    }

    setActionLoading(true);
    setSuccess(null);
    try {
      await updateNotificationSubscription(editingSubscription.id, {
        channels: selectedChannels,
        notificationTypes: selectedTypes,
      });
      setSuccess('Notification preferences updated successfully!');
      setEditingSubscription(null);
      setShowForm(false);
      setSelectedChannels([]);
      setSelectedTypes([]);
    } catch (err: any) {
      console.error('Failed to update notification subscription:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (subscription: NotificationSubscription) => {
    setEditingSubscription(subscription);
    setSelectedChannels(subscription.channels);
    setSelectedTypes(subscription.notificationTypes);
    setShowForm(true);
  };

  const handleUnsubscribe = async (subscriptionId: string) => {
    if (!confirm('Are you sure you want to unsubscribe from these notifications?')) {
      return;
    }

    setActionLoading(true);
    setSuccess(null);
    try {
      await unsubscribeFromNotifications(subscriptionId);
      setSuccess('Unsubscribed successfully!');
    } catch (err: any) {
      console.error('Failed to unsubscribe:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingSubscription(null);
    setShowForm(false);
    setSelectedChannels([]);
    setSelectedTypes([]);
  };

  const channelLabels: Record<NotificationChannel, { label: string; icon: string }> = {
    email: { label: 'Email', icon: '📧' },
    sms: { label: 'SMS', icon: '📱' },
    whatsapp: { label: 'WhatsApp', icon: '💬' },
    push: { label: 'Push Notifications', icon: '🔔' },
    in_app: { label: 'In-App', icon: '📱' },
  };

  const typeLabels: Record<NotificationType, { label: string; description: string }> = {
    order_confirmed: { label: 'Order Confirmed', description: 'When your order is confirmed' },
    order_shipped: { label: 'Order Shipped', description: 'When your order is shipped' },
    order_delivered: { label: 'Order Delivered', description: 'When your order is delivered' },
    order_cancelled: { label: 'Order Cancelled', description: 'When your order is cancelled' },
    payment_received: { label: 'Payment Received', description: 'When payment is received' },
    payment_failed: { label: 'Payment Failed', description: 'When payment fails' },
    refund_initiated: { label: 'Refund Initiated', description: 'When refund is initiated' },
    refund_completed: { label: 'Refund Completed', description: 'When refund is completed' },
    tracking_update: { label: 'Tracking Update', description: 'When tracking information updates' },
    delivery_reminder: { label: 'Delivery Reminder', description: 'Reminder before delivery' },
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Notification Preferences
        </h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm"
          >
            Add Subscription
          </button>
        )}
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Subscription Form */}
      {showForm && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            {editingSubscription ? 'Edit Subscription' : 'Create Subscription'}
          </h3>

          {/* Channel Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notification Channels *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(channelLabels).map(([key, { label, icon }]) => (
                <label
                  key={key}
                  className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                    selectedChannels.includes(key as NotificationChannel)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedChannels.includes(key as NotificationChannel)}
                    onChange={() => handleChannelToggle(key as NotificationChannel)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-xl">{icon}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Notification Type Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notification Types *
            </label>
            <div className="space-y-2">
              {Object.entries(typeLabels).map(([key, { label, description }]) => (
                <label
                  key={key}
                  className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                    selectedTypes.includes(key as NotificationType)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(key as NotificationType)}
                    onChange={() => handleTypeToggle(key as NotificationType)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={editingSubscription ? handleUpdate : handleSubscribe}
              disabled={actionLoading || selectedChannels.length === 0 || selectedTypes.length === 0}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                  Saving...
                </>
              ) : editingSubscription ? (
                'Update Subscription'
              ) : (
                'Subscribe'
              )}
            </button>
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Existing Subscriptions */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : subscriptions.length > 0 ? (
        <div className="space-y-4">
          {subscriptions.map((subscription) => (
            <div
              key={subscription.id}
              className={`p-4 border rounded-lg ${
                subscription.isActive
                  ? 'border-gray-200 dark:border-gray-700'
                  : 'border-gray-300 dark:border-gray-600 opacity-60'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      subscription.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                      {subscription.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Channels */}
                  <div className="mb-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Channels:</p>
                    <div className="flex flex-wrap gap-2">
                      {subscription.channels.map((channel) => (
                        <span
                          key={channel}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded text-xs"
                        >
                          <span>{channelLabels[channel].icon}</span>
                          {channelLabels[channel].label}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Notification Types */}
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Notification Types:</p>
                    <div className="flex flex-wrap gap-2">
                      {subscription.notificationTypes.map((type) => (
                        <span
                          key={type}
                          className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded text-xs"
                        >
                          {typeLabels[type].label}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Created/Updated Dates */}
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Created: {new Date(subscription.createdAt).toLocaleDateString()}
                    {subscription.updatedAt !== subscription.createdAt && (
                      <> • Updated: {new Date(subscription.updatedAt).toLocaleDateString()}</>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(subscription)}
                    className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleUnsubscribe(subscription.id)}
                    disabled={actionLoading}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Unsubscribe
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔔</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No Notification Subscriptions</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Subscribe to receive notifications about your order.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Create Subscription
          </button>
        </div>
      )}
    </div>
  );
}
