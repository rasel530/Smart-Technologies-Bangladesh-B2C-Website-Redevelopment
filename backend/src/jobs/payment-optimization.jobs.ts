/**
 * Payment Optimization Jobs
 * 
 * This module contains scheduled jobs for payment optimization,
 * including queue processing, cache cleanup, and performance monitoring.
 */

import { paymentQueueService } from '../services/payment/payment-queue.service';
import { paymentCacheService } from '../services/payment/payment-cache.service';
import { paymentPerformanceService } from '../services/payment/payment-performance.service';
import { logger } from '../utils/logger';

/**
 * Queue Processing Job
 * Runs every 30 seconds to process pending payments in the queue
 */
export async function processPaymentQueueJob(): Promise<void> {
  try {
    logger.info('Starting payment queue processing job');

    const processedCount = await paymentQueueService.processQueue();

    logger.info('Payment queue processing job completed', {
      processedCount
    });
  } catch (error) {
    logger.error('Error in payment queue processing job', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Cache Cleanup Job
 * Runs every hour to clear expired cache entries
 */
export async function cleanupExpiredCacheJob(): Promise<void> {
  try {
    logger.info('Starting cache cleanup job');

    const clearedCount = await paymentCacheService.clearExpiredCache();

    logger.info('Cache cleanup job completed', {
      clearedCount
    });
  } catch (error) {
    logger.error('Error in cache cleanup job', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Performance Monitoring Job
 * Runs every 5 minutes to calculate performance metrics and generate alerts
 */
export async function monitorPaymentPerformanceJob(): Promise<void> {
  try {
    logger.info('Starting payment performance monitoring job');

    // Calculate performance metrics for the last hour
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const metrics = await paymentPerformanceService.getPaymentPerformanceMetrics(oneHourAgo, now);

    logger.info('Payment performance metrics calculated', {
      totalTransactions: metrics.totalTransactions,
      averageProcessingTime: metrics.averageProcessingTime,
      successRate: metrics.successRate
    });

    // Get performance alerts
    const alerts = await paymentPerformanceService.getPerformanceAlerts();

    if (alerts.length > 0) {
      logger.warn('Performance alerts generated', {
        alertCount: alerts.length,
        alerts: alerts.map(alert => ({
          type: alert.alertType,
          severity: alert.severity,
          message: alert.message
        }))
      });
    }

    logger.info('Payment performance monitoring job completed');
  } catch (error) {
    logger.error('Error in payment performance monitoring job', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Job schedules
 */
export const paymentOptimizationJobSchedules = [
  {
    name: 'processPaymentQueue',
    schedule: '*/30 * * * * *', // Every 30 seconds
    handler: processPaymentQueueJob,
    description: 'Process pending payments in the queue'
  },
  {
    name: 'cleanupExpiredCache',
    schedule: '0 * * * *', // Every hour
    handler: cleanupExpiredCacheJob,
    description: 'Clear expired cache entries'
  },
  {
    name: 'monitorPaymentPerformance',
    schedule: '*/5 * * * *', // Every 5 minutes
    handler: monitorPaymentPerformanceJob,
    description: 'Monitor payment performance and generate alerts'
  }
];

/**
 * Export all job functions
 */
export const paymentOptimizationJobs = {
  processPaymentQueueJob,
  cleanupExpiredCacheJob,
  monitorPaymentPerformanceJob
};
