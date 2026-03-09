"use strict";
/**
 * Payment Queue Service
 *
 * This service manages payment processing queue, including enqueuing payments,
 * processing queue items, retrying failed payments, and managing queue status.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentQueueService = exports.PaymentQueueService = void 0;
const crypto_1 = require("crypto");
const logger_1 = require("../../utils/logger");
const database_service_1 = require("../database.service");
const prisma = database_service_1.databaseService.getClient();
/**
 * Payment Queue Service Class
 */
class PaymentQueueService {
    constructor() {
        this.DEFAULT_PRIORITY = 0;
        this.DEFAULT_MAX_ATTEMPTS = 3;
        this.QUEUE_OVERFLOW_LIMIT = 10000;
        this.DEFAULT_RETRY_DELAY_BASE = 2000; // 2 seconds
    }
    /**
     * Enqueue a payment for processing
     * @param transactionId - The transaction ID
     * @param paymentData - Payment data
     * @param priority - Priority level (higher = more important)
     * @returns Created queue item
     */
    async enqueuePayment(transactionId, paymentData, priority = this.DEFAULT_PRIORITY) {
        try {
            // Check for queue overflow
            const queueCount = await prisma.payment_queue.count({
                where: { status: 'pending' }
            });
            if (queueCount >= this.QUEUE_OVERFLOW_LIMIT) {
                throw new Error('Payment queue is at capacity. Please try again later.');
            }
            // Create queue item
            const queueItem = await prisma.payment_queue.create({
                data: {
                    id: (0, crypto_1.randomUUID)(),
                    transaction_id: transactionId,
                    priority: priority,
                    status: 'pending',
                    attempts: 0,
                    max_attempts: this.DEFAULT_MAX_ATTEMPTS,
                    next_attempt_at: new Date(),
                    queue_data: paymentData,
                    error_messages: [],
                    updated_at: new Date()
                }
            });
            logger_1.logger.info('Payment enqueued successfully', {
                queueItemId: queueItem.id,
                transactionId,
                priority,
                queueCount: queueCount + 1
            });
            return queueItem;
        }
        catch (error) {
            logger_1.logger.error('Error enqueuing payment', {
                error: error instanceof Error ? error.message : 'Unknown error',
                transactionId,
                priority
            });
            throw error;
        }
    }
    /**
     * Dequeue next payment from queue
     * @returns Next queue item or null if queue is empty
     */
    async dequeuePayment() {
        try {
            // Get next pending payment with highest priority
            const queueItem = await prisma.payment_queue.findFirst({
                where: {
                    status: 'pending',
                    next_attempt_at: { lte: new Date() }
                },
                orderBy: [
                    { priority: 'desc' },
                    { next_attempt_at: 'asc' },
                    { created_at: 'asc' }
                ]
            });
            if (!queueItem) {
                return null;
            }
            // Update status to processing
            const updatedItem = await prisma.payment_queue.update({
                where: { id: queueItem.id },
                data: {
                    status: 'processing',
                    last_attempt_at: new Date()
                }
            });
            logger_1.logger.info('Payment dequeued successfully', {
                queueItemId: updatedItem.id,
                transactionId: updatedItem.transaction_id,
                priority: updatedItem.priority
            });
            return updatedItem;
        }
        catch (error) {
            logger_1.logger.error('Error dequeuing payment', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Process all pending payments in queue
     * @returns Number of payments processed
     */
    async processQueue() {
        try {
            let processedCount = 0;
            const maxBatchSize = 50; // Process up to 50 items at once
            while (processedCount < maxBatchSize) {
                const queueItem = await this.dequeuePayment();
                if (!queueItem) {
                    break; // Queue is empty
                }
                try {
                    // Process payment
                    await this.processQueueItem(queueItem);
                    processedCount++;
                }
                catch (error) {
                    logger_1.logger.error('Error processing queue item', {
                        error: error instanceof Error ? error.message : 'Unknown error',
                        queueItemId: queueItem.id,
                        transactionId: queueItem.transaction_id
                    });
                    // Mark as failed if max attempts reached
                    if (queueItem.attempts >= queueItem.max_attempts) {
                        await this.markQueueItemFailed(queueItem.id, error instanceof Error ? error.message : 'Unknown error');
                    }
                    else {
                        // Schedule retry with exponential backoff
                        await this.scheduleRetry(queueItem.id, queueItem.attempts + 1);
                    }
                }
            }
            logger_1.logger.info('Queue processing completed', {
                processedCount,
                maxBatchSize
            });
            return processedCount;
        }
        catch (error) {
            logger_1.logger.error('Error processing payment queue', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Process a single queue item
     * @param queueItem - The queue item to process
     */
    async processQueueItem(queueItem) {
        // This method will be implemented to actually process payment
        // For now, we'll mark it as completed
        await prisma.payment_queue.update({
            where: { id: queueItem.id },
            data: {
                status: 'completed',
                updated_at: new Date()
            }
        });
        logger_1.logger.info('Queue item processed successfully', {
            queueItemId: queueItem.id,
            transactionId: queueItem.transaction_id
        });
    }
    /**
     * Get queue status
     * @returns Queue status information
     */
    async getQueueStatus() {
        try {
            const [total, pending, processing, completed, failed] = await Promise.all([
                prisma.payment_queue.count(),
                prisma.payment_queue.count({ where: { status: 'pending' } }),
                prisma.payment_queue.count({ where: { status: 'processing' } }),
                prisma.payment_queue.count({ where: { status: 'completed' } }),
                prisma.payment_queue.count({ where: { status: 'failed' } })
            ]);
            // Calculate average wait time for pending items
            const pendingItems = await prisma.payment_queue.findMany({
                where: { status: 'pending' },
                select: { created_at: true }
            });
            const averageWaitTime = pendingItems.length > 0
                ? pendingItems.reduce((sum, item) => {
                    const waitTime = Date.now() - item.created_at.getTime();
                    return sum + waitTime;
                }, 0) / pendingItems.length
                : 0;
            // Calculate processing rate (completed per hour in last 24 hours)
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const completedInLast24h = await prisma.payment_queue.count({
                where: {
                    status: 'completed',
                    updated_at: { gte: yesterday }
                }
            });
            const processingRate = completedInLast24h / 24; // per hour
            return {
                totalItems: total,
                pendingItems: pending,
                processingItems: processing,
                completedItems: completed,
                failedItems: failed,
                averageWaitTime,
                processingRate
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting queue status', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Get queue items with filters
     * @param filters - Filter options
     * @returns Array of queue items
     */
    async getQueueItems(filters) {
        try {
            const where = {};
            if (filters.status) {
                where.status = filters.status;
            }
            if (filters.priority !== undefined) {
                where.priority = filters.priority;
            }
            if (filters.minPriority !== undefined || filters.maxPriority !== undefined) {
                where.priority = {};
                if (filters.minPriority !== undefined) {
                    where.priority.gte = filters.minPriority;
                }
                if (filters.maxPriority !== undefined) {
                    where.priority.lte = filters.maxPriority;
                }
            }
            if (filters.startDate || filters.endDate) {
                where.created_at = {};
                if (filters.startDate) {
                    where.created_at.gte = filters.startDate;
                }
                if (filters.endDate) {
                    where.created_at.lte = filters.endDate;
                }
            }
            if (filters.transactionId) {
                where.transaction_id = filters.transactionId;
            }
            const queueItems = await prisma.payment_queue.findMany({
                where,
                orderBy: [
                    { priority: 'desc' },
                    { created_at: 'desc' }
                ]
            });
            return queueItems;
        }
        catch (error) {
            logger_1.logger.error('Error getting queue items', {
                error: error instanceof Error ? error.message : 'Unknown error',
                filters
            });
            throw error;
        }
    }
    /**
     * Update a queue item
     * @param id - Queue item ID
     * @param updates - Update data
     * @returns Updated queue item
     */
    async updateQueueItem(id, updates) {
        try {
            const updateData = {
                updated_at: new Date()
            };
            if (updates.priority !== undefined) {
                updateData.priority = updates.priority;
            }
            if (updates.status !== undefined) {
                updateData.status = updates.status;
            }
            if (updates.attempts !== undefined) {
                updateData.attempts = updates.attempts;
            }
            if (updates.maxAttempts !== undefined) {
                updateData.max_attempts = updates.maxAttempts;
            }
            if (updates.nextAttemptAt !== undefined) {
                updateData.next_attempt_at = updates.nextAttemptAt;
            }
            if (updates.errorMessages !== undefined) {
                updateData.error_messages = updates.errorMessages;
            }
            const queueItem = await prisma.payment_queue.update({
                where: { id },
                data: updateData
            });
            logger_1.logger.info('Queue item updated successfully', {
                queueItemId: queueItem.id,
                updates
            });
            return queueItem;
        }
        catch (error) {
            logger_1.logger.error('Error updating queue item', {
                error: error instanceof Error ? error.message : 'Unknown error',
                id,
                updates
            });
            throw error;
        }
    }
    /**
     * Retry a failed payment
     * @param id - Queue item ID
     * @returns Updated queue item
     */
    async retryPayment(id) {
        try {
            const queueItem = await prisma.payment_queue.findUnique({
                where: { id }
            });
            if (!queueItem) {
                throw new Error('Queue item not found');
            }
            if (queueItem.status !== 'failed') {
                throw new Error('Can only retry failed payments');
            }
            // Reset for retry
            const updatedItem = await prisma.payment_queue.update({
                where: { id },
                data: {
                    status: 'pending',
                    attempts: queueItem.attempts + 1,
                    next_attempt_at: new Date(),
                    updated_at: new Date()
                }
            });
            logger_1.logger.info('Payment retry scheduled', {
                queueItemId: updatedItem.id,
                transactionId: updatedItem.transaction_id,
                attemptNumber: updatedItem.attempts
            });
            return updatedItem;
        }
        catch (error) {
            logger_1.logger.error('Error retrying payment', {
                error: error instanceof Error ? error.message : 'Unknown error',
                id
            });
            throw error;
        }
    }
    /**
     * Cancel a queued payment
     * @param id - Queue item ID
     * @returns Updated queue item
     */
    async cancelPayment(id) {
        try {
            const queueItem = await prisma.payment_queue.findUnique({
                where: { id }
            });
            if (!queueItem) {
                throw new Error('Queue item not found');
            }
            if (queueItem.status === 'completed' || queueItem.status === 'processing') {
                throw new Error('Cannot cancel completed or processing payments');
            }
            const updatedItem = await prisma.payment_queue.update({
                where: { id },
                data: {
                    status: 'cancelled',
                    updated_at: new Date()
                }
            });
            logger_1.logger.info('Payment cancelled', {
                queueItemId: updatedItem.id,
                transactionId: updatedItem.transaction_id
            });
            return updatedItem;
        }
        catch (error) {
            logger_1.logger.error('Error cancelling payment', {
                error: error instanceof Error ? error.message : 'Unknown error',
                id
            });
            throw error;
        }
    }
    /**
     * Get queue statistics
     * @returns Queue statistics
     */
    async getQueueStatistics() {
        try {
            const [totalProcessed, completed, failed] = await Promise.all([
                prisma.payment_queue.count({
                    where: {
                        status: { in: ['completed', 'failed'] }
                    }
                }),
                prisma.payment_queue.count({ where: { status: 'completed' } }),
                prisma.payment_queue.count({ where: { status: 'failed' } })
            ]);
            const successRate = totalProcessed > 0 ? (completed / totalProcessed) * 100 : 0;
            // Calculate average processing time
            const completedItems = await prisma.payment_queue.findMany({
                where: { status: 'completed' },
                select: {
                    created_at: true,
                    updated_at: true
                }
            });
            const averageProcessingTime = completedItems.length > 0
                ? completedItems.reduce((sum, item) => {
                    const processingTime = item.updated_at.getTime() - item.created_at.getTime();
                    return sum + processingTime;
                }, 0) / completedItems.length
                : 0;
            // Calculate average retry count
            const allItems = await prisma.payment_queue.findMany({
                select: { attempts: true }
            });
            const averageRetryCount = allItems.length > 0
                ? allItems.reduce((sum, item) => sum + item.attempts, 0) / allItems.length
                : 0;
            // Get items by status
            const itemsByStatus = {};
            const statusCounts = await prisma.payment_queue.groupBy({
                by: ['status'],
                _count: true
            });
            statusCounts.forEach(item => {
                itemsByStatus[item.status] = item._count;
            });
            // Get items by priority
            const itemsByPriority = {};
            const priorityCounts = await prisma.payment_queue.groupBy({
                by: ['priority'],
                _count: true
            });
            priorityCounts.forEach(item => {
                itemsByPriority[item.priority] = item._count;
            });
            return {
                totalProcessed,
                totalCompleted: completed,
                totalFailed: failed,
                successRate,
                averageProcessingTime,
                averageRetryCount,
                itemsByStatus,
                itemsByPriority
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting queue statistics', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Clear expired queue items
     * @returns Number of items cleared
     */
    async clearExpiredItems() {
        try {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const result = await prisma.payment_queue.deleteMany({
                where: {
                    status: { in: ['completed', 'failed', 'cancelled'] },
                    updated_at: { lt: thirtyDaysAgo }
                }
            });
            logger_1.logger.info('Expired queue items cleared', {
                count: result.count
            });
            return result.count;
        }
        catch (error) {
            logger_1.logger.error('Error clearing expired queue items', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Mark a queue item as failed
     * @param id - Queue item ID
     * @param errorMessage - Error message
     */
    async markQueueItemFailed(id, errorMessage) {
        try {
            const queueItem = await prisma.payment_queue.findUnique({
                where: { id }
            });
            if (!queueItem) {
                return;
            }
            const errorMessages = Array.isArray(queueItem.error_messages)
                ? [...queueItem.error_messages, errorMessage]
                : [errorMessage];
            await prisma.payment_queue.update({
                where: { id },
                data: {
                    status: 'failed',
                    error_messages: errorMessages,
                    updated_at: new Date()
                }
            });
            logger_1.logger.info('Queue item marked as failed', {
                queueItemId: id,
                transactionId: queueItem.transaction_id,
                errorMessage
            });
        }
        catch (error) {
            logger_1.logger.error('Error marking queue item as failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                id
            });
        }
    }
    /**
     * Schedule a retry for a queue item
     * @param id - Queue item ID
     * @param attemptNumber - Current attempt number
     */
    async scheduleRetry(id, attemptNumber) {
        try {
            // Calculate exponential backoff delay
            const delay = this.calculateRetryDelay(attemptNumber);
            const nextAttemptAt = new Date(Date.now() + delay);
            await prisma.payment_queue.update({
                where: { id },
                data: {
                    status: 'pending',
                    attempts: attemptNumber,
                    next_attempt_at: nextAttemptAt,
                    updated_at: new Date()
                }
            });
            logger_1.logger.info('Queue item retry scheduled', {
                queueItemId: id,
                attemptNumber,
                delay,
                nextAttemptAt
            });
        }
        catch (error) {
            logger_1.logger.error('Error scheduling retry', {
                error: error instanceof Error ? error.message : 'Unknown error',
                id,
                attemptNumber
            });
        }
    }
    /**
     * Calculate retry delay with exponential backoff
     * @param attemptNumber - Current attempt number
     * @returns Delay in milliseconds
     */
    calculateRetryDelay(attemptNumber) {
        // Exponential backoff: 2^attempt * base_delay
        return Math.pow(2, attemptNumber) * this.DEFAULT_RETRY_DELAY_BASE;
    }
}
exports.PaymentQueueService = PaymentQueueService;
// Export singleton instance
exports.paymentQueueService = new PaymentQueueService();
