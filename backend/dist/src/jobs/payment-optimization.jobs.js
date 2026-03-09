"use strict";
/**
 * Payment Optimization Jobs
 *
 * This module contains scheduled jobs for payment optimization,
 * including queue processing, cache cleanup, and performance monitoring.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentOptimizationJobs = exports.paymentOptimizationJobSchedules = void 0;
exports.processPaymentQueueJob = processPaymentQueueJob;
exports.cleanupExpiredCacheJob = cleanupExpiredCacheJob;
exports.monitorPaymentPerformanceJob = monitorPaymentPerformanceJob;
const payment_queue_service_1 = require("../services/payment/payment-queue.service");
const payment_cache_service_1 = require("../services/payment/payment-cache.service");
const payment_performance_service_1 = require("../services/payment/payment-performance.service");
const logger_1 = require("../utils/logger");
/**
 * Queue Processing Job
 * Runs every 30 seconds to process pending payments in the queue
 */
async function processPaymentQueueJob() {
    try {
        logger_1.logger.info('Starting payment queue processing job');
        const processedCount = await payment_queue_service_1.paymentQueueService.processQueue();
        logger_1.logger.info('Payment queue processing job completed', {
            processedCount
        });
    }
    catch (error) {
        logger_1.logger.error('Error in payment queue processing job', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
    }
}
/**
 * Cache Cleanup Job
 * Runs every hour to clear expired cache entries
 */
async function cleanupExpiredCacheJob() {
    try {
        logger_1.logger.info('Starting cache cleanup job');
        const clearedCount = await payment_cache_service_1.paymentCacheService.clearExpiredCache();
        logger_1.logger.info('Cache cleanup job completed', {
            clearedCount
        });
    }
    catch (error) {
        logger_1.logger.error('Error in cache cleanup job', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
    }
}
/**
 * Performance Monitoring Job
 * Runs every 5 minutes to calculate performance metrics and generate alerts
 */
async function monitorPaymentPerformanceJob() {
    try {
        logger_1.logger.info('Starting payment performance monitoring job');
        // Calculate performance metrics for the last hour
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const metrics = await payment_performance_service_1.paymentPerformanceService.getPaymentPerformanceMetrics(oneHourAgo, now);
        logger_1.logger.info('Payment performance metrics calculated', {
            totalTransactions: metrics.totalTransactions,
            averageProcessingTime: metrics.averageProcessingTime,
            successRate: metrics.successRate
        });
        // Get performance alerts
        const alerts = await payment_performance_service_1.paymentPerformanceService.getPerformanceAlerts();
        if (alerts.length > 0) {
            logger_1.logger.warn('Performance alerts generated', {
                alertCount: alerts.length,
                alerts: alerts.map(alert => ({
                    type: alert.alertType,
                    severity: alert.severity,
                    message: alert.message
                }))
            });
        }
        logger_1.logger.info('Payment performance monitoring job completed');
    }
    catch (error) {
        logger_1.logger.error('Error in payment performance monitoring job', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
    }
}
/**
 * Job schedules
 */
exports.paymentOptimizationJobSchedules = [
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
exports.paymentOptimizationJobs = {
    processPaymentQueueJob,
    cleanupExpiredCacheJob,
    monitorPaymentPerformanceJob
};
