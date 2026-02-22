'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, AlertCircle, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * OfflineCartIndicator Component
 * Show offline status for cart
 * Features:
 * - Show offline status
 * - Display sync progress
 * - Show last sync time
 * - Allow manual sync
 */
interface OfflineCartIndicatorProps {
  isOnline?: boolean;
  lastSyncTime?: string | null;
  isSyncing?: boolean;
  onSync?: () => void;
  language?: 'en' | 'bn';
  className?: string;
  showSyncProgress?: boolean;
  syncProgress?: number;
}

const OfflineCartIndicator: React.FC<OfflineCartIndicatorProps> = ({
  isOnline = true,
  lastSyncTime,
  isSyncing = false,
  onSync,
  language = 'en',
  className,
  showSyncProgress = false,
  syncProgress = 0
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const formatTime = (dateString: string | null): string => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) {
      return language === 'bn' ? 'এখনই' : 'Just now';
    } else if (diffMins < 60) {
      return language === 'bn' 
        ? `${diffMins} মিনিট আগে` 
        : `${diffMins} min ago`;
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      return language === 'bn' 
        ? `${hours} ঘন্টা আগে` 
        : `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffMins / 1440);
      return language === 'bn' 
        ? `${days} দিন আগে` 
        : `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  const formatSyncProgress = (): string => {
    return `${Math.round(syncProgress)}%`;
  };

  const handleSync = () => {
    onSync?.();
  };

  // Don't show indicator if online and not syncing
  if (isOnline && !isSyncing && !showSyncProgress) {
    return null;
  }

  return (
    <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-gray-200">
        {isOnline ? (
          <CheckCircle className="w-5 h-5 text-green-600" aria-hidden="true" />
        ) : (
          <WifiOff className="w-5 h-5 text-orange-600" aria-hidden="true" />
        )}
        <h2 className="text-lg font-semibold text-gray-900">
          {language === 'bn' ? 'কার্ট স্থিতি' : 'Cart Status'}
        </h2>
      </div>

      {/* Status Content */}
      <div className="p-4">
        {/* Online Status */}
        {isOnline && !isSyncing && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" aria-hidden="true" />
              <div className="flex-1">
                <p className="font-semibold text-green-900">
                  {language === 'bn' ? 'অনলাইন' : 'Online'}
                </p>
                <p className="text-sm text-green-700 mt-1">
                  {language === 'bn' 
                    ? 'আপনার কার্ট সিঙ্ক করা হয়েছে।'
                    : 'Your cart is synced.'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Offline Status */}
        {!isOnline && (
          <div className="bg-orange-50 border border-orange-200 rounded-md p-4 mb-4">
            <div className="flex items-center gap-3">
              <WifiOff className="w-6 h-6 text-orange-600 flex-shrink-0" aria-hidden="true" />
              <div className="flex-1">
                <p className="font-semibold text-orange-900">
                  {language === 'bn' ? 'অফলাইন' : 'Offline'}
                </p>
                <p className="text-sm text-orange-700 mt-1">
                  {language === 'bn' 
                    ? 'আপনি বর্তমানে অফলাইনে আছেন। কার্ট অফলাইনে সংরক্ষিত থাকবে।'
                    : 'You are currently offline. Your cart will be saved offline.'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Syncing Status */}
        {isSyncing && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin flex-shrink-0" aria-hidden="true" />
              <div className="flex-1">
                <p className="font-semibold text-blue-900">
                  {language === 'bn' ? 'সিঙ্ক হচ্ছে...' : 'Syncing...'}
                </p>
                {showSyncProgress && (
                  <p className="text-sm text-blue-700 mt-1">
                    {language === 'bn' 
                      ? `অগ্রস: ${formatSyncProgress()}`
                      : `Progress: ${formatSyncProgress()}`
                    }
                  </p>
                )}
                {/* Progress Bar */}
                {showSyncProgress && syncProgress > 0 && (
                  <div className="mt-3 w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${syncProgress}%` }}
                      role="progressbar"
                      aria-valuenow={syncProgress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Last Sync Time */}
        {lastSyncTime && (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-600 flex-shrink-0" aria-hidden="true" />
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">
                    {language === 'bn' ? 'শেষ সিঙ্ক:' : 'Last Sync:'}
                  </span>{' '}
                  {formatTime(lastSyncTime)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sync Button */}
        {!isSyncing && (
          <button
            onClick={handleSync}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500',
              isOnline
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            )}
            aria-label={language === 'bn' ? 'সিঙ্ক করুন' : 'Sync now'}
          >
            <RefreshCw className="w-5 h-5" aria-hidden="true" />
            <span>
              {language === 'bn' ? 'সিঙ্ক করুন' : 'Sync Now'}
            </span>
          </button>
        )}

        {/* Info Note */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-xs text-blue-800">
              {language === 'bn' 
                ? 'অফলাইনে থাকার সময়, আপনার কার্ট স্থানীয়ভাবে সংরক্ষিত থাকবে এবং অনলাইনে ফিরে আসার সাথে সাথে সিঙ্ক হবে।'
                : 'While offline, your cart will be saved locally and will sync when you come back online.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfflineCartIndicator;
