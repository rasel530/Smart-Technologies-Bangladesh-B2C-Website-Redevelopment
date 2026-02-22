/**
 * OfflineSyncQueue Component
 *
 * Component showing pending sync operations for offline mode
 * Following Phase 6 Milestone 3 specifications
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  WifiOff,
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCartWishlistStore } from '@/store/cartWishlistStore';
import { getOfflineQueueCount, isOnline } from '@/utils/cartWishlistUtils';

// ============================================================================
// Types
// ============================================================================

export interface OfflineSyncQueueProps {
  onSyncNow?: () => void;
  language?: 'en' | 'bn';
  className?: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

// ============================================================================
// Component
// ============================================================================

export const OfflineSyncQueue: React.FC<OfflineSyncQueueProps> = ({
  onSyncNow,
  language = 'en',
  className = '',
  position = 'bottom-right',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOnlineStatus, setIsOnlineStatus] = useState(true);
  
  const {
    offlineQueue,
    syncOfflineQueue,
    clearOfflineQueue,
    isSyncing,
  } = useCartWishlistStore();
  
  // Translations
  const translations = {
    en: {
      offlineQueue: 'Offline Queue',
      pendingOperations: 'Pending Operations',
      syncNow: 'Sync Now',
      clearQueue: 'Clear Queue',
      offline: 'Offline',
      online: 'Online',
      queueEmpty: 'No pending operations',
      operationTypes: {
        move_to_wishlist: 'Move to Wishlist',
        bulk_move_to_wishlist: 'Bulk Move to Wishlist',
        move_to_cart: 'Move to Cart',
        bulk_move_to_cart: 'Bulk Move to Cart',
      },
    },
    bn: {
      offlineQueue: 'অফলাইন সারি',
      pendingOperations: 'অপেক্ষমান অপারেশন',
      syncNow: 'এখন সিঙ্ক করুন',
      clearQueue: 'সারি সাফ করুন',
      offline: 'অফলাইন',
      online: 'অনলাইন',
      queueEmpty: 'কোনো অপেক্ষমান অপারেশন',
      operationTypes: {
        move_to_wishlist: 'উইশলিস্টে সরান',
        bulk_move_to_wishlist: 'বাল্ক উইশলিস্টে সরান',
        move_to_cart: 'কার্টে সরান',
        bulk_move_to_cart: 'বাল্ক কার্টে সরান',
      },
    },
  };
  
  const t = translations[language];
  
  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnlineStatus(true);
    const handleOffline = () => setIsOnlineStatus(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial check
    setIsOnlineStatus(navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnlineStatus && offlineQueue.length > 0 && !isSyncing) {
      const timer = setTimeout(() => {
        syncOfflineQueue();
      }, 2000); // Wait 2 seconds before auto-sync
      
      return () => clearTimeout(timer);
    }
  }, [isOnlineStatus, offlineQueue.length, isSyncing, syncOfflineQueue]);
  
  // Position classes
  const positionClasses: Record<string, string> = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };
  
  const queueCount = offlineQueue.length;
  const hasPendingItems = queueCount > 0;
  
  const handleSyncNow = async () => {
    await syncOfflineQueue();
    onSyncNow?.();
  };
  
  const handleClearQueue = () => {
    if (window.confirm(
      language === 'bn'
        ? 'আপনি কি সকল সারি সাফ করতে চান?'
        : 'Are you sure you want to clear the queue?'
    )) {
      clearOfflineQueue();
    }
  };
  
  return (
    <div className={cn('fixed z-40', positionClasses[position], className)}>
      {/* Queue Indicator */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg',
          'transition-all duration-200 hover:shadow-xl',
          isOnlineStatus
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        )}
        aria-label={`${t.offlineQueue}: ${queueCount} ${t.pendingOperations}`}
        aria-expanded={isExpanded}
      >
        {/* Online/Offline Icon */}
        {isOnlineStatus ? (
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
        ) : (
          <WifiOff className="w-4 h-4" aria-hidden="true" />
        )}
        
        {/* Queue Count */}
        <span className="text-sm font-medium">
          {queueCount}
        </span>
        
        {/* Expand/Collapse Icon */}
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" aria-hidden="true" />
        ) : (
          <ChevronDown className="w-4 h-4" aria-hidden="true" />
        )}
      </button>
      
      {/* Queue Details Panel */}
      {isExpanded && (
        <div
          className={cn(
            'absolute w-80 bg-white rounded-lg shadow-xl border border-gray-200',
            'transition-all duration-200',
            position === 'top-right' || position === 'top-left'
              ? 'top-full mt-2'
              : 'bottom-full mb-2'
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby="queue-details-title"
        >
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3
                id="queue-details-title"
                className="text-sm font-semibold text-gray-900"
              >
                {t.offlineQueue}
              </h3>
              <span className={cn(
                'text-xs px-2 py-1 rounded-full',
                isOnlineStatus ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              )}>
                {isOnlineStatus ? t.online : t.offline}
              </span>
            </div>
            
            {/* Queue Content */}
            {hasPendingItems ? (
              <>
                <div className="space-y-2 mb-4">
                  {offlineQueue.slice(0, 5).map((operation, index) => (
                    <div
                      key={operation.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      {/* Operation Type Icon */}
                      <div className="flex-shrink-0 p-2 bg-blue-100 rounded-full">
                        {operation.type.includes('wishlist') ? (
                          <RefreshCw className="w-4 h-4 text-blue-600" aria-hidden="true" />
                        ) : (
                          <RefreshCw className="w-4 h-4 text-blue-600" aria-hidden="true" />
                        )}
                      </div>
                      
                      {/* Operation Details */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {t.operationTypes[operation.type as keyof typeof t.operationTypes] || operation.type}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(operation.timestamp).toLocaleString()}
                        </p>
                      </div>
                      
                      {/* Status Badge */}
                      <span className={cn(
                        'text-xs px-2 py-1 rounded-full',
                        operation.status === 'pending' && 'bg-yellow-100 text-yellow-800',
                        operation.status === 'processing' && 'bg-blue-100 text-blue-800',
                        operation.status === 'completed' && 'bg-green-100 text-green-800',
                        operation.status === 'failed' && 'bg-red-100 text-red-800'
                      )}>
                        {operation.status}
                      </span>
                    </div>
                  ))}
                  
                  {queueCount > 5 && (
                    <p className="text-sm text-gray-500 text-center">
                      +{queueCount - 5} more {t.pendingOperations}
                    </p>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSyncNow}
                    disabled={isSyncing || !isOnlineStatus}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md',
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
                  
                  <button
                    type="button"
                    onClick={handleClearQueue}
                    disabled={isSyncing}
                    className={cn(
                      'flex items-center justify-center gap-2 px-3 py-2 rounded-md',
                      'text-sm font-medium transition-colors',
                      'bg-gray-100 text-gray-700 hover:bg-gray-200',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                    aria-label={t.clearQueue}
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </>
            ) : (
              /* Empty State */
              <div className="text-center py-8">
                <RefreshCw className="w-12 h-12 text-gray-300 mx-auto mb-3" aria-hidden="true" />
                <p className="text-sm text-gray-500">
                  {t.queueEmpty}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineSyncQueue;
