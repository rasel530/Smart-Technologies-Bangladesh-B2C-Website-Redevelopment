/**
 * ImageProcessingQueue Component (Admin)
 * 
 * Background job monitoring, failed upload retry mechanism, bulk operation status tracking,
 * CDN sync status display, real-time progress updates, job history log,
 * cancel pending jobs, retry failed jobs, and clear completed jobs.
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useImageProcessingQueue } from '@/hooks/useAdminProductImages';

interface ImageProcessingQueueProps {
  productId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

/**
 * ImageProcessingQueue Component
 * 
 * @param productId - Product ID
 * @param autoRefresh - Enable auto-refresh (default: true)
 * @param refreshInterval - Refresh interval in ms (default: 5000)
 */
export const ImageProcessingQueue: React.FC<ImageProcessingQueueProps> = ({
  productId,
  autoRefresh = true,
  refreshInterval = 5000
}) => {
  const {
    queue,
    activeJobs,
    addJob,
    updateJob,
    removeJob,
    cancelPendingJobs,
    retryFailedJobs,
    clearCompletedJobs
  } = useImageProcessingQueue();

  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(autoRefresh);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  // Simulate queue updates (in real implementation, this would come from WebSocket or polling)
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const interval = setInterval(() => {
      setLastUpdateTime(new Date());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, refreshInterval]);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string): React.ReactNode => {
    switch (status) {
      case 'pending':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'processing':
        return (
          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case 'completed':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'failed':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return null;
    }
  };

  const handleRetryJob = useCallback((imageId: string) => {
    updateJob(imageId, { status: 'pending', progress: 0, error: undefined });
  }, [updateJob]);

  const handleCancelJob = useCallback((imageId: string) => {
    removeJob(imageId);
  }, [removeJob]);

  const queueStats = {
    total: queue.length,
    pending: queue.filter(job => job.status === 'pending').length,
    processing: queue.filter(job => job.status === 'processing').length,
    completed: queue.filter(job => job.status === 'completed').length,
    failed: queue.filter(job => job.status === 'failed').length
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Processing Queue
        </h3>
        <div className="flex items-center space-x-2">
          <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={autoRefreshEnabled}
              onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Auto-refresh</span>
          </label>
          {lastUpdateTime && (
            <span className="text-xs text-gray-500 dark:text-gray-500">
              Updated: {lastUpdateTime.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Queue Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {queueStats.total}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {queueStats.pending}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400">Processing</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {queueStats.processing}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400">Completed</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {queueStats.completed}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400">Failed</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {queueStats.failed}
          </p>
        </div>
      </div>

      {/* Queue Actions */}
      <div className="flex flex-wrap gap-2">
        {queueStats.pending > 0 && (
          <button
            onClick={cancelPendingJobs}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Cancel Pending ({queueStats.pending})
          </button>
        )}
        {queueStats.failed > 0 && (
          <button
            onClick={retryFailedJobs}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Retry Failed ({queueStats.failed})
          </button>
        )}
        {queueStats.completed > 0 && (
          <button
            onClick={clearCompletedJobs}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Clear Completed ({queueStats.completed})
          </button>
        )}
      </div>

      {/* Queue List */}
      {queue.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-gray-600 dark:text-gray-400">No jobs in queue</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            {queue.map((job) => (
              <div
                key={job.imageId}
                className="p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(job.status)}`}>
                        {getStatusIcon(job.status)}
                        <span className="capitalize">{job.status}</span>
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        {new Date(job.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                      {job.fileName}
                    </p>
                    {job.error && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        {job.error}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {/* Progress Bar for Processing Jobs */}
                    {job.status === 'processing' && (
                      <div className="w-24">
                        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                          <span>Progress</span>
                          <span>{job.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {/* Retry Button for Failed Jobs */}
                    {job.status === 'failed' && (
                      <button
                        onClick={() => handleRetryJob(job.imageId)}
                        className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        title="Retry"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    )}
                    {/* Cancel Button for Pending Jobs */}
                    {job.status === 'pending' && (
                      <button
                        onClick={() => handleCancelJob(job.imageId)}
                        className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                        title="Cancel"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                    {/* Remove Button for Completed Jobs */}
                    {job.status === 'completed' && (
                      <button
                        onClick={() => removeJob(job.imageId)}
                        className="p-2 text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                        title="Remove"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CDN Sync Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            CDN Sync Status
          </h4>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            queueStats.completed === queueStats.total && queueStats.total > 0
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
          }`}>
            {queueStats.completed === queueStats.total && queueStats.total > 0 ? 'Synced' : 'Syncing...'}
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Synced Images</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {queueStats.completed} / {queueStats.total}
            </span>
          </div>
          {activeJobs > 0 && (
            <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{activeJobs} active job{activeJobs !== 1 ? 's' : ''} processing</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageProcessingQueue;
