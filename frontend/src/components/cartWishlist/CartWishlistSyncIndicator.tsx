/**
 * CartWishlistSyncIndicator Component
 *
 * Visual indicator showing sync status
 * Following Phase 6 Milestone 3 specifications
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCartWishlistStore } from '@/store/cartWishlistStore';
import { formatSyncStatus, formatLastSyncTime } from '@/utils/cartWishlistUtils';

// ============================================================================
// Types
// ============================================================================

export interface SyncIndicatorProps {
  userId?: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  language?: 'en' | 'bn';
  className?: string;
  showDetails?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export const CartWishlistSyncIndicator: React.FC<SyncIndicatorProps> = ({
  userId,
  position = 'top-right',
  language = 'en',
  className = '',
  showDetails = false,
}) => {
  const [isOnline, setIsOnline] = useState(true);
  const [showSyncDetails, setShowSyncDetails] = useState(false);
  
  const {
    syncStatus,
    refreshSyncStatus,
    triggerManualSync,
    isSyncing,
  } = useCartWishlistStore();
  
  // Translations
  const translations = {
    en: {
      syncStatus: 'Sync Status',
      lastSync: 'Last sync',
      pending: 'Pending',
      syncing: 'Syncing',
      completed: 'Completed',
      failed: 'Failed',
      syncNow: 'Sync Now',
      pendingOperations: 'Pending operations',
      viewDetails: 'View Details',
      closeDetails: 'Close Details',
      online: 'Online',
      offline: 'Offline',
    },
    bn: {
      syncStatus: 'সিঙ্ক স্ট্যাটাস',
      lastSync: 'শেষ সিঙ্ক',
      pending: 'অপেক্ষমান',
      syncing: 'সিঙ্ক হচ্ছে',
      completed: 'সম্পন্ন',
      failed: 'ব্যর্থ হয়েছে',
      syncNow: 'এখন সিঙ্ক করুন',
      pendingOperations: 'অপেক্ষমান অপারেশন',
      viewDetails: 'বিস্তারিত দেখুন',
      closeDetails: 'বিস্তারিত বন্ধ করুন',
      online: 'অনলাইন',
      offline: 'অফলাইন',
    },
  };
  
  const t = translations[language];
  
  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial check
    setIsOnline(navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Auto-refresh sync status every 30 seconds
  useEffect(() => {
    if (!userId) return;
    
    const interval = setInterval(() => {
      refreshSyncStatus();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [userId, refreshSyncStatus]);
  
  // Get sync status info
  const statusInfo = formatSyncStatus(syncStatus.status);
  
  // Position classes
  const positionClasses: Record<string, string> = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };
  
  // Status color classes
  const statusColorClasses: Record<string, string> = {
    pending: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    syncing: 'bg-blue-100 border-blue-300 text-blue-800',
    completed: 'bg-green-100 border-green-300 text-green-800',
    failed: 'bg-red-100 border-red-300 text-red-800',
  };
  
  const StatusIcon = {
    pending: Clock,
    syncing: RefreshCw,
    completed: CheckCircle,
    failed: XCircle,
  };
  
  const Icon = StatusIcon[syncStatus.status] || Clock;
  
  const handleSyncNow = async () => {
    await triggerManualSync();
  };
  
  return (
    <div className={cn('fixed z-40', positionClasses[position], className)}>
      {/* Main Indicator */}
      <button
        type="button"
        onClick={() => setShowSyncDetails(!showSyncDetails)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg border shadow-lg',
          'transition-all duration-200 hover:shadow-xl',
          statusColorClasses[syncStatus.status]
        )}
        aria-label={`${t.syncStatus}: ${statusInfo.label}`}
        aria-expanded={showSyncDetails}
      >
        {/* Online/Offline Status */}
        <div
          className={cn(
            'p-1 rounded-full',
            isOnline ? 'bg-green-500' : 'bg-red-500'
          )}
          aria-label={isOnline ? t.online : t.offline}
        >
          {isOnline ? (
            <Wifi className="w-3 h-3 text-white" aria-hidden="true" />
          ) : (
            <WifiOff className="w-3 h-3 text-white" aria-hidden="true" />
          )}
        </div>
        
        {/* Sync Status */}
        <div className="flex items-center gap-2">
          {isSyncing ? (
            <Icon className="w-4 h-4 animate-spin" aria-hidden="true" />
          ) : (
            <Icon className="w-4 h-4" aria-hidden="true" />
          )}
          <span className="text-sm font-medium">
            {statusInfo.label}
          </span>
        </div>
        
        {/* Pending Operations Count */}
        {syncStatus.pendingOperations > 0 && (
          <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs font-medium">
            {syncStatus.pendingOperations}
          </span>
        )}
      </button>
      
      {/* Sync Details Panel */}
      {showSyncDetails && (
        <div
          className={cn(
            'absolute mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-4',
            'transition-all duration-200',
            position === 'top-right' || position === 'top-left'
              ? 'top-full'
              : 'bottom-full'
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby="sync-details-title"
        >
          <h3
            id="sync-details-title"
            className="text-sm font-semibold text-gray-900 mb-3"
          >
            {t.syncStatus}
          </h3>
          
          <div className="space-y-3">
            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t.lastSync}:</span>
              <span className="text-sm font-medium text-gray-900">
                {formatLastSyncTime(syncStatus.lastSyncAt)}
              </span>
            </div>
            
            {/* Pending Operations */}
            {syncStatus.pendingOperations > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t.pendingOperations}:</span>
                <span className="text-sm font-medium text-gray-900">
                  {syncStatus.pendingOperations}
                </span>
              </div>
            )}
            
            {/* Sync Now Button */}
            <button
              type="button"
              onClick={handleSyncNow}
              disabled={isSyncing || !isOnline}
              className={cn(
                'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md',
                'text-sm font-medium transition-colors',
                'bg-blue-600 text-white hover:bg-blue-700',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              aria-label={t.syncNow}
              aria-busy={isSyncing}
            >
              {isSyncing ? (
                <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
              )}
              <span>{t.syncNow}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartWishlistSyncIndicator;
