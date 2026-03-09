/**
 * TrackingTimeline Component
 * 
 * Visual timeline of tracking events with icons, timestamps, and details.
 * Supports filtering by date range, expanding event details, and exporting.
 */

'use client';

import React, { useState } from 'react';
import { TimelineEvent } from '@/lib/api/orderTracking';

interface TrackingTimelineProps {
  timeline: TimelineEvent[];
  currentStatus: string;
  language?: 'en' | 'bn';
  className?: string;
  onExport?: () => void;
}

interface DateRangeFilter {
  startDate?: Date;
  endDate?: Date;
}

const TrackingTimeline: React.FC<TrackingTimelineProps> = ({
  timeline,
  currentStatus,
  language = 'en',
  className = '',
  onExport,
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [dateFilter, setDateFilter] = useState<DateRangeFilter>({});

  const toggleExpand = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  // Get icon for status
  const getStatusIcon = (status: string): string => {
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('pending') || statusLower.includes('placed')) {
      return '⏳';
    } else if (statusLower.includes('confirmed')) {
      return '✅';
    } else if (statusLower.includes('processing') || statusLower.includes('picked')) {
      return '⚙️';
    } else if (statusLower.includes('shipped') || statusLower.includes('transit')) {
      return '🚚';
    } else if (statusLower.includes('delivered')) {
      return '📦';
    } else if (statusLower.includes('out for delivery')) {
      return '🚛';
    }
    
    return '📋';
  };

  // Get event status type
  const getEventStatus = (timestamp: Date, currentIndex: number): 'completed' | 'in_progress' | 'pending' => {
    // If this is the current status, it's in progress
    if (currentIndex === timeline.length - 1) {
      return 'in_progress';
    }
    // If this event has already occurred, it's completed
    return 'completed';
  };

  // Filter timeline by date range
  const filteredTimeline = timeline.filter((event) => {
    const eventDate = new Date(event.timestamp);
    
    if (dateFilter.startDate && eventDate < dateFilter.startDate) {
      return false;
    }
    
    if (dateFilter.endDate && eventDate > dateFilter.endDate) {
      return false;
    }
    
    return true;
  });

  // Format date
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

  // Format relative time
  const formatRelativeTime = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return language === 'bn' ? 'এখনই' : 'Just now';
    } else if (diffMins < 60) {
      return language === 'bn' ? `${diffMins} মিনিট আগে` : `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return language === 'bn' ? `${diffHours} ঘন্টা আগে` : `${diffHours} hours ago`;
    } else if (diffDays < 7) {
      return language === 'bn' ? `${diffDays} দিন আগে` : `${diffDays} days ago`;
    } else {
      return formatDate(date);
    }
  };

  // Handle date filter change
  const handleDateFilterChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateFilter((prev) => ({
      ...prev,
      [field]: value ? new Date(value) : undefined,
    }));
  };

  // Clear date filter
  const clearDateFilter = () => {
    setDateFilter({});
  };

  // Handle export
  const handleExport = () => {
    if (onExport) {
      onExport();
    } else {
      // Default export to CSV
      const csvContent = [
        ['Timestamp', 'Status', 'Description', 'Location'].join(','),
        ...filteredTimeline.map((event) =>
          [
            formatDate(event.timestamp),
            event.status,
            event.description,
            event.location || '',
          ].join(',')
        ),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tracking-timeline-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className={`tracking-timeline ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          {language === 'bn' ? 'ট্র্যাকিং টাইমলাইন' : 'Tracking Timeline'}
        </h3>
        
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
          aria-label={language === 'bn' ? 'রপ্তানি টাইমলাইন' : 'Export timeline'}
        >
          {language === 'bn' ? 'রপ্তানি' : 'Export'}
        </button>
      </div>

      {/* Date Filter */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {language === 'bn' ? 'তারিখ ফিল্টার' : 'Filter by Date Range'}
        </h4>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label
              htmlFor="startDate"
              className="block text-sm text-gray-600 dark:text-gray-400 mb-1"
            >
              {language === 'bn' ? 'শুরুর তারিখ:' : 'Start Date:'}
            </label>
            <input
              type="date"
              id="startDate"
              value={dateFilter.startDate ? dateFilter.startDate.toISOString().split('T')[0] : ''}
              onChange={(e) => handleDateFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label
              htmlFor="endDate"
              className="block text-sm text-gray-600 dark:text-gray-400 mb-1"
            >
              {language === 'bn' ? 'শেষ তারিখ:' : 'End Date:'}
            </label>
            <input
              type="date"
              id="endDate"
              value={dateFilter.endDate ? dateFilter.endDate.toISOString().split('T')[0] : ''}
              onChange={(e) => handleDateFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={clearDateFilter}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              {language === 'bn' ? 'সাফ করুন' : 'Clear'}
            </button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
        
        {/* Timeline items */}
        <div className="space-y-6">
          {filteredTimeline.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {language === 'bn'
                ? 'এই ফিল্টারের জন্য কোনো ট্র্যাকিং ইভেন্ট নেই'
                : 'No tracking events for this filter'}
            </div>
          ) : (
            filteredTimeline.map((event, index) => {
              const eventStatus = getEventStatus(new Date(event.timestamp), index);
              const isExpanded = expandedItems.has(index);
              const isCurrent = index === filteredTimeline.length - 1;

              return (
                <div key={index} className="relative flex items-start">
                  {/* Status icon */}
                  <div
                    className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-4 ${
                      isCurrent
                        ? 'bg-blue-500 border-blue-200 dark:border-blue-800 animate-pulse'
                        : eventStatus === 'completed'
                        ? 'bg-green-500 border-green-200 dark:border-green-800'
                        : 'bg-gray-200 border-gray-300 dark:bg-gray-700 dark:border-gray-600'
                    }`}
                  >
                    <span className="text-xl">{getStatusIcon(event.status)}</span>
                  </div>

                  {/* Timeline content */}
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4
                          className={`font-semibold ${
                            isCurrent
                              ? 'text-blue-600 dark:text-blue-400'
                              : eventStatus === 'completed'
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {event.status}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {formatDate(event.timestamp)}
                          <span className="mx-2">•</span>
                          {formatRelativeTime(event.timestamp)}
                        </p>
                      </div>

                      {/* Expand button */}
                      {event.description && (
                        <button
                          onClick={() => toggleExpand(index)}
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

                    {/* Description */}
                    {event.description && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                        {event.description}
                      </p>
                    )}

                    {/* Location */}
                    {event.location && (
                      <div className="flex items-center mt-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="mr-2">📍</span>
                        {event.location}
                      </div>
                    )}

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {language === 'bn' ? 'সময়কাল:' : 'Timestamp:'}
                          </span>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {formatDate(event.timestamp)}
                          </p>
                        </div>

                        {event.location && (
                          <div className="mb-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {language === 'bn' ? 'অবস্থান:' : 'Location:'}
                            </span>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {event.location}
                            </p>
                          </div>
                        )}

                        <div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {language === 'bn' ? 'স্ট্যাটাস:' : 'Status:'}
                          </span>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {event.status}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackingTimeline;
