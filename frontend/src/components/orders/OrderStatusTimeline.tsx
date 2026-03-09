/**
 * OrderStatusTimeline Component
 * 
 * Visual timeline of order status changes with icons, dates, and details.
 */

'use client';

import React, { useState } from 'react';
import { OrderStatusHistory, OrderStatus } from '@/lib/api/orderManagement';

interface OrderStatusTimelineProps {
  statusHistory: OrderStatusHistory[];
  currentStatus: OrderStatus;
  language?: 'en' | 'bn';
  className?: string;
}

interface TimelineItem {
  history: OrderStatusHistory;
  status: OrderStatus;
  isCompleted: boolean;
  isCurrent: boolean;
  isPending: boolean;
}

const OrderStatusTimeline: React.FC<OrderStatusTimelineProps> = ({
  statusHistory,
  currentStatus,
  language = 'en',
  className = '',
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  // Define status order and labels
  const statusOrder: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
  
  const statusLabels: Record<OrderStatus, { en: string; bn: string; icon: string }> = {
    pending: { en: 'Pending', bn: 'অপেক্ষমাণ', icon: '⏳' },
    confirmed: { en: 'Confirmed', bn: 'নিশ্চিত', icon: '✅' },
    processing: { en: 'Processing', bn: 'প্রক্রিয়াকরণ', icon: '⚙️' },
    shipped: { en: 'Shipped', bn: 'প্রেরিত', icon: '🚚' },
    delivered: { en: 'Delivered', bn: 'বিতরণ করা হয়েছে', icon: '📦' },
    cancelled: { en: 'Cancelled', bn: 'বাতিল', icon: '❌' },
    refunded: { en: 'Refunded', bn: 'ফেরত', icon: '💰' },
  };

  const changedByLabels: Record<string, { en: string; bn: string }> = {
    admin: { en: 'Admin', bn: 'অ্যাডমিন' },
    customer: { en: 'Customer', bn: 'গ্রাহক' },
    system: { en: 'System', bn: 'সিস্টেম' },
  };

  // Get the current status index
  const currentStatusIndex = statusOrder.indexOf(currentStatus);

  // Build timeline items
  const timelineItems: TimelineItem[] = statusHistory.map((history) => {
    const statusIndex = statusOrder.indexOf(history.newStatus);
    const isCompleted = statusIndex < currentStatusIndex;
    const isCurrent = history.newStatus === currentStatus;
    const isPending = statusIndex > currentStatusIndex;

    return {
      history,
      status: history.newStatus,
      isCompleted,
      isCurrent,
      isPending,
    };
  });

  // Add initial order creation if not present
  if (timelineItems.length === 0 || timelineItems[0].status !== 'pending') {
    timelineItems.unshift({
      history: {
        id: 'initial',
        orderId: '',
        newStatus: 'pending',
        changedBy: 'system',
        reason: 'Order placed',
        createdAt: new Date(),
      },
      status: 'pending',
      isCompleted: currentStatus !== 'pending',
      isCurrent: currentStatus === 'pending',
      isPending: false,
    });
  }

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return language === 'bn'
      ? d.toLocaleDateString('bn-BD', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : d.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
  };

  const getChangedByLabel = (changedBy?: string) => {
    if (!changedBy) return '';
    const labels = changedByLabels[changedBy.toLowerCase()] || { en: changedBy, bn: changedBy };
    return language === 'bn' ? labels.bn : labels.en;
  };

  const getStatusInfo = (status: OrderStatus) => {
    return statusLabels[status] || { en: status, bn: status, icon: '📋' };
  };

  return (
    <div className={`order-status-timeline ${className}`}>
      <h3 className="text-lg font-semibold mb-4">
        {language === 'bn' ? 'অর্ডার স্ট্যাটাস টাইমলাইন' : 'Order Status Timeline'}
      </h3>
      
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
        
        {/* Timeline items */}
        <div className="space-y-6">
          {timelineItems.map((item) => {
            const statusInfo = getStatusInfo(item.status);
            const isExpanded = expandedItems.has(item.history.id);

            return (
              <div key={item.history.id} className="relative flex items-start">
                {/* Status icon */}
                <div
                  className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-4 ${
                    item.isCurrent
                      ? 'bg-blue-500 border-blue-200 dark:border-blue-800'
                      : item.isCompleted
                      ? 'bg-green-500 border-green-200 dark:border-green-800'
                      : item.isPending
                      ? 'bg-gray-200 border-gray-300 dark:bg-gray-700 dark:border-gray-600'
                      : 'bg-red-500 border-red-200 dark:border-red-800'
                  }`}
                >
                  <span className="text-xl">{statusInfo.icon}</span>
                </div>

                {/* Timeline content */}
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4
                        className={`font-semibold ${
                          item.isCurrent
                            ? 'text-blue-600 dark:text-blue-400'
                            : item.isCompleted
                            ? 'text-green-600 dark:text-green-400'
                            : item.isPending
                            ? 'text-gray-500 dark:text-gray-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {language === 'bn' ? statusInfo.bn : statusInfo.en}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {formatDate(item.history.createdAt)}
                      </p>
                    </div>

                    {/* Expand button */}
                    {(item.history.reason || item.history.changedBy) && (
                      <button
                        onClick={() => toggleExpand(item.history.id)}
                        className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                        aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                      >
                        {isExpanded
                          ? language === 'bn'
                            ? 'সংকুচিত করুন'
                            : 'Collapse'
                          : language === 'bn'
                          ? 'প্রসারিত করুন'
                          : 'Expand'}
                      </button>
                    )}
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      {item.history.reason && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {language === 'bn' ? 'কারণ:' : 'Reason:'}
                          </span>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {item.history.reason}
                          </p>
                        </div>
                      )}

                      {item.history.changedBy && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {language === 'bn' ? 'পরিবর্তন করেছেন:' : 'Changed by:'}
                          </span>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {getChangedByLabel(item.history.changedBy)}
                          </p>
                        </div>
                      )}

                      {item.history.previousStatus && (
                        <div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {language === 'bn' ? 'আগের স্ট্যাটাস:' : 'Previous status:'}
                          </span>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {language === 'bn'
                              ? statusLabels[item.history.previousStatus].bn
                              : statusLabels[item.history.previousStatus].en}
                          </p>
                        </div>
                      )}

                      {item.history.metadata && Object.keys(item.history.metadata).length > 0 && (
                        <div className="mt-3">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {language === 'bn' ? 'অতিরিক্ত তথ্য:' : 'Additional info:'}
                          </span>
                          <pre className="text-xs text-gray-600 dark:text-gray-400 mt-1 overflow-x-auto">
                            {JSON.stringify(item.history.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OrderStatusTimeline;
