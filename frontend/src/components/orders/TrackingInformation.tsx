/**
 * Tracking Information Component
 * 
 * Display order tracking information with current status, tracking number,
 * courier service, tracking link, and tracking events timeline.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useOrderTracking } from '@/hooks/useOrderConfirmation';

interface TrackingInformationProps {
  orderId: string;
  isAdmin?: boolean;
}

export default function TrackingInformation({ orderId, isAdmin = false }: TrackingInformationProps) {
  const { tracking, loading, error, refreshTracking } = useOrderTracking(orderId, true, 60000);

  const [copied, setCopied] = useState(false);

  const handleCopyTrackingNumber = async () => {
    if (tracking?.trackingNumber) {
      try {
        await navigator.clipboard.writeText(tracking.trackingNumber);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy tracking number:', err);
      }
    }
  };

  const handleRefresh = async () => {
    await refreshTracking();
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      shipped: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      in_transit: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      out_for_delivery: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      returned: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    };
    return statusColors[status.toLowerCase()] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  };

  const getStatusIcon = (status: string) => {
    const statusIcons: Record<string, string> = {
      pending: '⏳',
      processing: '📦',
      shipped: '🚚',
      in_transit: '🚛',
      out_for_delivery: '🚚',
      delivered: '✅',
      failed: '❌',
      returned: '↩️',
    };
    return statusIcons[status.toLowerCase()] || '📦';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!tracking) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📦</div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No Tracking Information
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Tracking information will be available once your order is shipped.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Tracking Information
        </h2>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm flex items-center gap-2 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
              Refreshing...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Current Status */}
      <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-4">
          <div className="text-5xl">{getStatusIcon(tracking.currentStatus)}</div>
          <div className="flex-1">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Status</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {tracking.currentStatus.charAt(0).toUpperCase() + tracking.currentStatus.slice(1)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Last updated: {formatDate(tracking.lastUpdated)}
            </p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(tracking.currentStatus)}`}>
            {tracking.currentStatus.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Tracking Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Tracking Number */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tracking Number</p>
          <div className="flex items-center gap-2">
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {tracking.trackingNumber}
            </p>
            <button
              onClick={handleCopyTrackingNumber}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
              title="Copy tracking number"
            >
              {copied ? (
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Courier Service */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Courier Service</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {tracking.courierService}
          </p>
        </div>

        {/* Estimated Delivery */}
        {tracking.estimatedDeliveryDate && (
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Estimated Delivery</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {formatDate(tracking.estimatedDeliveryDate)}
            </p>
          </div>
        )}

        {/* Tracking Link */}
        {tracking.trackingUrl && (
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Track on Courier Website</p>
            <a
              href={tracking.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open Tracking Page
            </a>
          </div>
        )}
      </div>

      {/* Tracking Events Timeline */}
      {tracking.events && tracking.events.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Tracking History
          </h3>
          <div className="space-y-4">
            {tracking.events.map((event, index) => (
              <div key={event.id} className="flex gap-4">
                {/* Timeline Line */}
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    index === 0
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                  }`}>
                    {getStatusIcon(event.status)}
                  </div>
                  {index < tracking.events.length - 1 && (
                    <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-600 mt-2"></div>
                  )}
                </div>

                {/* Event Details */}
                <div className="flex-1 pb-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {event.description}
                        </p>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${getStatusColor(event.status)}`}>
                          {event.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(event.timestamp)}
                      </p>
                    </div>
                    {event.location && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {event.location}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Events */}
      {(!tracking.events || tracking.events.length === 0) && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📋</div>
          <p className="text-gray-600 dark:text-gray-400">
            No tracking events available yet.
          </p>
        </div>
      )}
    </div>
  );
}
