/**
 * Payment Optimization Integration Service
 * 
 * This service integrates payment optimization features (queue, retry, cache, performance)
 * with the existing payment flow. It provides methods for:
 * - Enqueuing payments for processing
 * - Processing payments from queue
 * - Handling payment callbacks with optimization
 * - Managing retry logic
 * - Caching responses
 * - Measuring performance
 */

import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { paymentQueueService } from './payment-queue.service';
import { paymentRetryService } from './payment-retry.service';
import { paymentCacheService } from './payment-cache.service';
import { paymentPerformanceService } from './payment-performance.service';
import { PaymentGatewayError, PaymentErrorType } from './payment-gateway.interface';
import { randomUUID } from 'crypto';
import { logger } from '../../utils/logger';
import { databaseService } from '../database.service';

const prisma = databaseService.getClient();

/**
 * Payment Data Interface
 */
export interface PaymentData {
  orderId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  currency: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  priority?: number;
}

/**
 * Payment Processing Options
 */
export interface PaymentProcessingOptions {
  skipQueue?: boolean;
  skipCache?: boolean;
  skipRetry?: boolean;
  priority?: number;
}

/**
 * Payment Processing Result
 */
export interface PaymentProcessingResult {
  success: boolean;
  transactionId: string;
  processingTime: number;
  fromCache: boolean;
  queued: boolean;
  retried: boolean;
  error?: string;
}

/**
 * Payment Optimization Integration Service Class
 */
export class PaymentOptimizationIntegrationService {
  private processingStartTimes: Map<string, number> = new Map();

  /**
   * Initiate payment with optimization
   * @param paymentData - Payment data
   * @param options - Processing options
   * @returns Payment processing result
   */
  async initiatePayment(
    paymentData: PaymentData,
    options: PaymentProcessingOptions = {}
  ): Promise<PaymentProcessingResult> {
    const startTime = Date.now();
    const transactionId = randomUUID();

    try {
      logger.info('Initiating payment with optimization', {
        transactionId,
        orderId: paymentData.orderId,
        paymentMethod: paymentData.paymentMethod,
        amount: paymentData.amount,
        currency: paymentData.currency
      });

      // Step 1: Check cache for gateway configuration (if not skipped)
      let gatewayConfig = null;
      if (!options.skipCache) {
        try {
          const cacheKey = `gateway_config:${paymentData.paymentMethod}`;
          gatewayConfig = await paymentCacheService.getCachedResponse(cacheKey);
          
          if (gatewayConfig) {
            logger.info('Gateway configuration retrieved from cache', {
              transactionId,
              cacheKey
            });
          } else {
            // Fetch gateway configuration and cache it
            gatewayConfig = await this.fetchGatewayConfig(paymentData.paymentMethod);
            if (gatewayConfig) {
              await paymentCacheService.cachePaymentResponse(
                cacheKey,
                gatewayConfig,
                60 * 60 * 1000 // 1 hour TTL
              );
            }
          }
        } catch (error) {
          logger.error('Error caching gateway configuration', {
            transactionId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Step 2: Create payment transaction
      const transaction = await prisma.payment_transaction.create({
        data: {
          id: transactionId,
          orderId: paymentData.orderId,
          paymentMethod: paymentData.paymentMethod,
          amount: paymentData.amount,
          currency: paymentData.currency,
          status: 'pending',
          gatewayResponse: gatewayConfig
        }
      });

      // Step 3: Enqueue payment for processing (if not skipped)
      let queued = false;
      if (!options.skipQueue) {
        try {
          await paymentQueueService.enqueuePayment(
            transactionId,
            paymentData,
            options.priority || 3 // Default medium priority
          );
          queued = true;
          
          logger.info('Payment enqueued for processing', {
            transactionId,
            priority: options.priority || 3
          });
        } catch (error) {
          logger.error('Error enqueuing payment', {
            transactionId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Step 4: Measure processing time start
      this.processingStartTimes.set(transactionId, Date.now());

      const processingTime = Date.now() - startTime;

      logger.info('Payment initiated successfully', {
        transactionId,
        processingTime,
        queued,
        fromCache: false
      });

      return {
        success: true,
        transactionId,
        processingTime,
        fromCache: false,
        queued,
        retried: false
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;

      logger.error('Error initiating payment', {
        transactionId,
        processingTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        transactionId,
        processingTime,
        fromCache: false,
        queued: false,
        retried: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process payment from queue
   * @param queueItem - Queue item to process
   * @returns Payment processing result
   */
  async processPaymentFromQueue(queueItem: any): Promise<PaymentProcessingResult> {
    const startTime = Date.now();
    const transactionId = queueItem.transaction_id;

    try {
      logger.info('Processing payment from queue', {
        transactionId,
        priority: queueItem.priority,
        attempts: queueItem.attempts
      });

      // Get transaction
      const transaction = await prisma.payment_transaction.findUnique({
        where: { id: transactionId }
      });

      if (!transaction) {
        throw new PaymentGatewayError(
          'Payment transaction not found',
          PaymentErrorType.TRANSACTION_NOT_FOUND,
          404
        );
      }

      // Update transaction status to processing
      await prisma.payment_transaction.update({
        where: { id: transactionId },
        data: { status: 'processing' }
      });

      // Process payment with gateway
      const result = await this.processPaymentWithGateway(transaction);

      // Update queue item status
      if (result.success) {
        await paymentQueueService.updateQueueItem(queueItem.id, {
          status: 'completed'
        });
      } else {
        await paymentQueueService.updateQueueItem(queueItem.id, {
          status: 'failed',
          errorMessages: [...(queueItem.error_messages || []), result.error || 'Unknown error']
        });

        // Check if retry is needed
        if (!queueItem.skipRetry) {
          const shouldRetry = await paymentRetryService.shouldRetryPayment(
            result.error || 'Unknown error',
            queueItem.attempts
          );

          if (shouldRetry && queueItem.attempts < queueItem.max_attempts) {
            const retryDelay = await paymentRetryService.calculateRetryDelay(
              queueItem.attempts + 1,
              result.error
            );

            await paymentQueueService.updateQueueItem(queueItem.id, {
              status: 'pending',
              nextAttemptAt: new Date(Date.now() + retryDelay)
            });

            logger.info('Payment queued for retry', {
              transactionId,
              attempt: queueItem.attempts + 1,
              retryDelay
            });
          }
        }
      }

      // Cache payment response
      if (result.success && !queueItem.skipCache) {
        try {
          const cacheKey = `payment_response:${transactionId}`;
          await paymentCacheService.cachePaymentResponse(
            cacheKey,
            result.response,
            60 * 1000 // 1 minute TTL for payment responses
          );

          logger.info('Payment response cached', {
            transactionId,
            cacheKey
          });
        } catch (error) {
          logger.error('Error caching payment response', {
            transactionId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Measure and record performance
      const processingTime = Date.now() - startTime;
      await paymentPerformanceService.measurePaymentProcessingTime(
        transactionId,
        startTime
      );

      logger.info('Payment processed from queue', {
        transactionId,
        processingTime,
        success: result.success
      });

      return {
        success: result.success,
        transactionId,
        processingTime,
        fromCache: false,
        queued: false,
        retried: false,
        error: result.error
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;

      logger.error('Error processing payment from queue', {
        transactionId,
        processingTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Update queue item status to failed
      await paymentQueueService.updateQueueItem(queueItem.id, {
        status: 'failed',
        errorMessages: [...(queueItem.error_messages || []), error instanceof Error ? error.message : 'Unknown error']
      });

      return {
        success: false,
        transactionId,
        processingTime,
        fromCache: false,
        queued: false,
        retried: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Handle payment callback with optimization
   * @param transactionId - Transaction ID
   * @param callbackData - Callback data from gateway
   * @returns Payment processing result
   */
  async handlePaymentCallback(
    transactionId: string,
    callbackData: any
  ): Promise<PaymentProcessingResult> {
    const startTime = Date.now();

    try {
      logger.info('Handling payment callback with optimization', {
        transactionId
      });

      // Get transaction
      const transaction = await prisma.payment_transaction.findUnique({
        where: { id: transactionId }
      });

      if (!transaction) {
        throw new PaymentGatewayError(
          'Payment transaction not found',
          PaymentErrorType.TRANSACTION_NOT_FOUND,
          404
        );
      }

      // Determine payment status from callback
      const status = this.determinePaymentStatus(callbackData);

      // Update transaction status
      await prisma.payment_transaction.update({
        where: { id: transactionId },
        data: {
          status,
          gatewayResponse: callbackData,
          callbackResponse: callbackData,
          failureReason: status === 'failed' ? callbackData.error || 'Payment failed' : null
        }
      });

      // Cache payment response
      try {
        const cacheKey = `payment_response:${transactionId}`;
        await paymentCacheService.cachePaymentResponse(
          cacheKey,
          callbackData,
          60 * 1000 // 1 minute TTL for payment responses
        );

        logger.info('Payment callback response cached', {
          transactionId,
          cacheKey
        });
      } catch (error) {
        logger.error('Error caching payment callback response', {
          transactionId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Update queue status if payment was queued
      const queueItem = await prisma.payment_queue.findFirst({
        where: { transaction_id: transactionId }
      });

      if (queueItem) {
        await paymentQueueService.updateQueueItem(queueItem.id, {
          status: status === 'completed' ? 'completed' : 'failed'
        });

        logger.info('Queue item status updated from callback', {
          transactionId,
          queueItemId: queueItem.id,
          status
        });
      }

      // Measure and record performance
      const processingStart = this.processingStartTimes.get(transactionId);
      if (processingStart) {
        await paymentPerformanceService.measurePaymentProcessingTime(
          transactionId,
          processingStart
        );
        this.processingStartTimes.delete(transactionId);
      }

      const processingTime = Date.now() - startTime;

      logger.info('Payment callback handled successfully', {
        transactionId,
        status,
        processingTime
      });

      return {
        success: status === 'completed',
        transactionId,
        processingTime,
        fromCache: false,
        queued: false,
        retried: false
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;

      logger.error('Error handling payment callback', {
        transactionId,
        processingTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        transactionId,
        processingTime,
        fromCache: false,
        queued: false,
        retried: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Retry failed payment
   * @param transactionId - Transaction ID
   * @param options - Retry options
   * @returns Payment processing result
   */
  async retryFailedPayment(
    transactionId: string,
    options: any = {}
  ): Promise<PaymentProcessingResult> {
    const startTime = Date.now();

    try {
      logger.info('Retrying failed payment', {
        transactionId,
        options
      });

      // Use retry service to retry payment
      const result = await paymentRetryService.retryPayment(transactionId, options);

      // Get queue item
      const queueItem = await prisma.payment_queue.findFirst({
        where: { transaction_id: transactionId }
      });

      if (queueItem) {
        // Process payment from queue
        return await this.processPaymentFromQueue(queueItem);
      }

      const processingTime = Date.now() - startTime;

      logger.info('Payment retry completed', {
        transactionId,
        processingTime,
        success: result.success
      });

      return {
        success: result.success,
        transactionId,
        processingTime,
        fromCache: false,
        queued: false,
        retried: true,
        error: result.error
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;

      logger.error('Error retrying payment', {
        transactionId,
        processingTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        transactionId,
        processingTime,
        fromCache: false,
        queued: false,
        retried: true,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process payment with gateway
   * @param transaction - Payment transaction
   * @returns Payment processing result
   */
  private async processPaymentWithGateway(transaction: any): Promise<any> {
    try {
      // This is a placeholder - actual implementation would call the appropriate gateway service
      // based on payment method (bkash, nagad, sslcommerz, cod)
      
      logger.info('Processing payment with gateway', {
        transactionId: transaction.id,
        paymentMethod: transaction.paymentMethod
      });

      // Simulate gateway processing
      // In production, this would call the actual gateway service
      const success = Math.random() > 0.1; // 90% success rate

      if (success) {
        return {
          success: true,
          response: {
            transactionId: transaction.id,
            status: 'completed',
            gatewayTransactionId: `GW_${randomUUID()}`,
            timestamp: new Date().toISOString()
          }
        };
      } else {
        return {
          success: false,
          error: 'Gateway processing failed',
          response: {
            transactionId: transaction.id,
            status: 'failed',
            error: 'Gateway processing failed',
            timestamp: new Date().toISOString()
          }
        };
      }
    } catch (error) {
      logger.error('Error processing payment with gateway', {
        transactionId: transaction.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        response: null
      };
    }
  }

  /**
   * Fetch gateway configuration
   * @param paymentMethod - Payment method
   * @returns Gateway configuration
   */
  private async fetchGatewayConfig(paymentMethod: PaymentMethod): Promise<any> {
    try {
      // This is a placeholder - actual implementation would fetch from database or config
      logger.info('Fetching gateway configuration', {
        paymentMethod
      });

      const config = {
        gateway: paymentMethod,
        enabled: true,
        priority: 3,
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 2000
      };

      return config;
    } catch (error) {
      logger.error('Error fetching gateway configuration', {
        paymentMethod,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return null;
    }
  }

  /**
   * Determine payment status from callback data
   * @param callbackData - Callback data from gateway
   * @returns Payment status
   */
  private determinePaymentStatus(callbackData: any): PaymentStatus {
    if (!callbackData) {
      return 'failed';
    }

    const status = callbackData.status?.toLowerCase() || callbackData.payment_status?.toLowerCase();

    switch (status) {
      case 'success':
      case 'completed':
      case 'paid':
      case 'successful':
        return 'completed';
      case 'failed':
      case 'cancelled':
      case 'rejected':
      case 'unsuccessful':
        return 'failed';
      case 'pending':
      case 'processing':
      case 'in_progress':
        return 'processing';
      default:
        return 'failed';
    }
  }

  /**
   * Get cached payment response
   * @param transactionId - Transaction ID
   * @returns Cached payment response or null
   */
  async getCachedPaymentResponse(transactionId: string): Promise<any | null> {
    try {
      const cacheKey = `payment_response:${transactionId}`;
      const cachedResponse = await paymentCacheService.getCachedResponse(cacheKey);

      if (cachedResponse) {
        logger.info('Payment response retrieved from cache', {
          transactionId,
          cacheKey
        });

        return cachedResponse;
      }

      return null;
    } catch (error) {
      logger.error('Error retrieving cached payment response', {
        transactionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return null;
    }
  }

  /**
   * Invalidate payment cache
   * @param transactionId - Transaction ID
   */
  async invalidatePaymentCache(transactionId: string): Promise<void> {
    try {
      const cacheKey = `payment_response:${transactionId}`;
      await paymentCacheService.invalidateCache(cacheKey);

      logger.info('Payment cache invalidated', {
        transactionId,
        cacheKey
      });
    } catch (error) {
      logger.error('Error invalidating payment cache', {
        transactionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

// Export singleton instance
export const paymentOptimizationIntegrationService = new PaymentOptimizationIntegrationService();
