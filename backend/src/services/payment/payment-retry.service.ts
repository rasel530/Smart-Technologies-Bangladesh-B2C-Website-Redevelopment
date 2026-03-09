/**
 * Payment Retry Service
 * 
 * This service manages payment retry logic with exponential backoff,
 * retry rules configuration, and retry statistics tracking.
 */

import { PrismaClient, PaymentStatus } from '@prisma/client';
import { logger } from '../../utils/logger';

const prisma = new PrismaClient();

/**
 * Payment Result Interface
 */
export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  gatewayResponse?: any;
  error?: string;
  retryCount?: number;
}

/**
 * Retry Options Interface
 */
export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  customBackoff?: (attempt: number) => number;
  skipRetryReasons?: string[];
}

/**
 * Retry History Interface
 */
export interface RetryHistory {
  id: string;
  transactionId: string;
  attemptNumber: number;
  failureReason: string;
  retryDelay: number;
  executedAt: Date;
  success: boolean;
}

/**
 * Retry Statistics Interface
 */
export interface RetryStatistics {
  totalRetries: number;
  successfulRetries: number;
  failedRetries: number;
  averageRetriesPerPayment: number;
  retrySuccessRate: number;
  mostCommonFailureReasons: Array<{ reason: string; count: number }>;
  averageRetryDelay: number;
}

/**
 * Retry Rule Interface
 */
export interface RetryRule {
  id: string;
  name: string;
  failureType: string;
  shouldRetry: boolean;
  maxAttempts: number;
  backoffStrategy: 'exponential' | 'linear' | 'fixed' | 'custom';
  baseDelay: number;
  maxDelay: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Failure Types
 */
export enum FailureType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  GATEWAY_ERROR = 'GATEWAY_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  FRAUD_DETECTED = 'FRAUD_DETECTED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Default Retry Rules
 */
const DEFAULT_RETRY_RULES: Omit<RetryRule, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Network Error Retry',
    failureType: FailureType.NETWORK_ERROR,
    shouldRetry: true,
    maxAttempts: 3,
    backoffStrategy: 'exponential',
    baseDelay: 2000,
    maxDelay: 60000,
    isActive: true
  },
  {
    name: 'Timeout Error Retry',
    failureType: FailureType.TIMEOUT_ERROR,
    shouldRetry: true,
    maxAttempts: 3,
    backoffStrategy: 'exponential',
    baseDelay: 2000,
    maxDelay: 60000,
    isActive: true
  },
  {
    name: 'Gateway Error Retry',
    failureType: FailureType.GATEWAY_ERROR,
    shouldRetry: true,
    maxAttempts: 3,
    backoffStrategy: 'exponential',
    baseDelay: 2000,
    maxDelay: 60000,
    isActive: true
  },
  {
    name: 'Validation Error No Retry',
    failureType: FailureType.VALIDATION_ERROR,
    shouldRetry: false,
    maxAttempts: 0,
    backoffStrategy: 'fixed',
    baseDelay: 0,
    maxDelay: 0,
    isActive: true
  },
  {
    name: 'Insufficient Funds No Retry',
    failureType: FailureType.INSUFFICIENT_FUNDS,
    shouldRetry: false,
    maxAttempts: 0,
    backoffStrategy: 'fixed',
    baseDelay: 0,
    maxDelay: 0,
    isActive: true
  },
  {
    name: 'Fraud Detected No Retry',
    failureType: FailureType.FRAUD_DETECTED,
    shouldRetry: false,
    maxAttempts: 0,
    backoffStrategy: 'fixed',
    baseDelay: 0,
    maxDelay: 0,
    isActive: true
  }
];

/**
 * Payment Retry Service Class
 */
export class PaymentRetryService {
  private readonly DEFAULT_MAX_ATTEMPTS = 3;
  private readonly DEFAULT_BASE_DELAY = 2000; // 2 seconds
  private readonly DEFAULT_MAX_DELAY = 60000; // 60 seconds
  private retryRules: Map<string, RetryRule> = new Map();

  constructor() {
    // Initialize default retry rules
    this.initializeDefaultRetryRules();
  }

  /**
   * Initialize default retry rules
   */
  private initializeDefaultRetryRules(): void {
    DEFAULT_RETRY_RULES.forEach(rule => {
      const ruleWithId: RetryRule = {
        ...rule,
        id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.retryRules.set(ruleWithId.failureType, ruleWithId);
    });

    logger.info('Default retry rules initialized', {
      rulesCount: this.retryRules.size
    });
  }

  /**
   * Retry a failed payment
   * @param transactionId - The transaction ID
   * @param options - Retry options
   * @returns Payment result
   */
  async retryPayment(transactionId: string, options?: RetryOptions): Promise<PaymentResult> {
    try {
      // Get transaction
      const transaction = await prisma.payment_transaction.findUnique({
        where: { transactionId }
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Check if transaction can be retried
      if (transaction.status !== 'failed') {
        throw new Error('Can only retry failed payments');
      }

      // Get retry history
      const retryHistory = await this.getRetryHistory(transactionId);
      const currentAttempt = retryHistory.length + 1;

      // Check max attempts
      const maxAttempts = options?.maxAttempts || this.DEFAULT_MAX_ATTEMPTS;
      if (currentAttempt > maxAttempts) {
        return {
          success: false,
          error: `Maximum retry attempts (${maxAttempts}) exceeded`,
          retryCount: currentAttempt - 1
        };
      }

      // Calculate retry delay
      const delay = await this.calculateRetryDelay(currentAttempt);
      
      // Wait for delay
      await this.sleep(delay);

      // Execute payment retry
      const result = await this.executePaymentRetry(transaction, currentAttempt);

      // Log retry attempt
      await this.logRetryAttempt(transactionId, currentAttempt, delay, result.success, result.error);

      logger.info('Payment retry completed', {
        transactionId,
        attemptNumber: currentAttempt,
        success: result.success
      });

      return result;
    } catch (error) {
      logger.error('Error retrying payment', {
        error: error instanceof Error ? error.message : 'Unknown error',
        transactionId
      });
      throw error;
    }
  }

  /**
   * Calculate retry delay with exponential backoff
   * @param attempt - Current attempt number
   * @param failureType - Type of failure
   * @returns Delay in milliseconds
   */
  async calculateRetryDelay(attempt: number, failureType?: string): Promise<number> {
    try {
      // Get retry rule for failure type
      const rule = failureType ? this.retryRules.get(failureType) : null;

      if (rule && !rule.shouldRetry) {
        return 0; // No retry for this failure type
      }

      // Use custom backoff if provided
      if (rule?.backoffStrategy === 'custom' && rule.baseDelay === 0) {
        return 0;
      }

      // Calculate delay based on strategy
      let delay: number;

      if (rule?.backoffStrategy === 'exponential') {
        delay = Math.min(
          Math.pow(2, attempt - 1) * rule.baseDelay,
          rule.maxDelay
        );
      } else if (rule?.backoffStrategy === 'linear') {
        delay = Math.min(attempt * rule.baseDelay, rule.maxDelay);
      } else if (rule?.backoffStrategy === 'fixed') {
        delay = rule.baseDelay;
      } else {
        // Default exponential backoff
        delay = Math.min(
          Math.pow(2, attempt - 1) * this.DEFAULT_BASE_DELAY,
          this.DEFAULT_MAX_DELAY
        );
      }

      return delay;
    } catch (error) {
      logger.error('Error calculating retry delay', {
        error: error instanceof Error ? error.message : 'Unknown error',
        attempt,
        failureType
      });
      return this.DEFAULT_BASE_DELAY;
    }
  }

  /**
   * Determine if payment should be retried
   * @param failureReason - Reason for failure
   * @param attempt - Current attempt number
   * @returns Whether payment should be retried
   */
  async shouldRetryPayment(failureReason: string, attempt: number): Promise<boolean> {
    try {
      // Determine failure type from reason
      const failureType = this.determineFailureType(failureReason);

      // Get retry rule
      const rule = this.retryRules.get(failureType);

      if (!rule) {
        // Default: retry for unknown errors
        return attempt <= this.DEFAULT_MAX_ATTEMPTS;
      }

      // Check if retry is enabled for this failure type
      if (!rule.shouldRetry) {
        return false;
      }

      // Check max attempts
      return attempt < rule.maxAttempts;
    } catch (error) {
      logger.error('Error determining if payment should be retried', {
        error: error instanceof Error ? error.message : 'Unknown error',
        failureReason,
        attempt
      });
      return false;
    }
  }

  /**
   * Get retry history for a transaction
   * @param transactionId - The transaction ID
   * @returns Array of retry history entries
   */
  async getRetryHistory(transactionId: string): Promise<RetryHistory[]> {
    try {
      // Get payment logs for this transaction
      const logs = await prisma.payment_log.findMany({
        where: {
          transactionId,
          eventType: 'RETRY_ATTEMPT'
        },
        orderBy: { createdAt: 'asc' }
      });

      // Map logs to retry history
      const retryHistory: RetryHistory[] = logs.map((log, index) => ({
        id: log.id,
        transactionId: transactionId,
        attemptNumber: index + 1,
        failureReason: (log.eventData as any)?.failureReason || 'Unknown',
        retryDelay: (log.eventData as any)?.retryDelay || 0,
        executedAt: log.createdAt,
        success: (log.eventData as any)?.success || false
      }));

      return retryHistory;
    } catch (error) {
      logger.error('Error getting retry history', {
        error: error instanceof Error ? error.message : 'Unknown error',
        transactionId
      });
      throw error;
    }
  }

  /**
   * Get retry statistics
   * @returns Retry statistics
   */
  async getRetryStatistics(): Promise<RetryStatistics> {
    try {
      // Get all retry logs
      const retryLogs = await prisma.payment_log.findMany({
        where: {
          eventType: 'RETRY_ATTEMPT'
        }
      });

      const totalRetries = retryLogs.length;
      const successfulRetries = retryLogs.filter(log => (log.eventData as any)?.success).length;
      const failedRetries = totalRetries - successfulRetries;

      // Calculate average retries per payment
      const retriesByTransaction = new Map<string, number>();
      retryLogs.forEach(log => {
        const txId = log.transactionId;
        retriesByTransaction.set(txId, (retriesByTransaction.get(txId) || 0) + 1);
      });

      const averageRetriesPerPayment = retriesByTransaction.size > 0
        ? totalRetries / retriesByTransaction.size
        : 0;

      // Calculate retry success rate
      const retrySuccessRate = totalRetries > 0 ? (successfulRetries / totalRetries) * 100 : 0;

      // Get most common failure reasons
      const failureReasons = new Map<string, number>();
      retryLogs.forEach(log => {
        const reason = (log.eventData as any)?.failureReason || 'Unknown';
        failureReasons.set(reason, (failureReasons.get(reason) || 0) + 1);
      });

      const mostCommonFailureReasons = Array.from(failureReasons.entries())
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Calculate average retry delay
      const totalDelay = retryLogs.reduce((sum, log) => sum + ((log.eventData as any)?.retryDelay || 0), 0);
      const averageRetryDelay = totalRetries > 0 ? totalDelay / totalRetries : 0;

      return {
        totalRetries,
        successfulRetries,
        failedRetries,
        averageRetriesPerPayment,
        retrySuccessRate,
        mostCommonFailureReasons,
        averageRetryDelay
      };
    } catch (error) {
      logger.error('Error getting retry statistics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Configure retry rules
   * @param rules - Array of retry rules
   */
  async configureRetryRules(rules: Omit<RetryRule, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<void> {
    try {
      // Clear existing rules
      this.retryRules.clear();

      // Add new rules
      rules.forEach(rule => {
        const ruleWithId: RetryRule = {
          ...rule,
          id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.retryRules.set(ruleWithId.failureType, ruleWithId);
      });

      logger.info('Retry rules configured', {
        rulesCount: this.retryRules.size
      });
    } catch (error) {
      logger.error('Error configuring retry rules', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get retry rules
   * @returns Array of retry rules
   */
  getRetryRules(): RetryRule[] {
    return Array.from(this.retryRules.values());
  }

  /**
   * Cancel retry for a transaction
   * @param transactionId - The transaction ID
   */
  async cancelRetry(transactionId: string): Promise<void> {
    try {
      // Check if transaction exists
      const transaction = await prisma.payment_transaction.findUnique({
        where: { transactionId }
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Update transaction status to cancelled
      await prisma.payment_transaction.update({
        where: { transactionId },
        data: {
          status: 'cancelled',
          failureReason: 'Retry cancelled by admin'
        }
      });

      // Log cancellation
      await prisma.payment_log.create({
        data: {
          id: crypto.randomUUID(),
          transactionId,
          eventType: 'RETRY_CANCELLED',
          eventData: {
            cancelledAt: new Date().toISOString(),
            reason: 'Admin cancelled retry'
          }
        }
      });

      logger.info('Payment retry cancelled', {
        transactionId
      });
    } catch (error) {
      logger.error('Error cancelling retry', {
        error: error instanceof Error ? error.message : 'Unknown error',
        transactionId
      });
      throw error;
    }
  }

  /**
   * Execute payment retry
   * @param transaction - The transaction to retry
   * @param attemptNumber - Current attempt number
   * @returns Payment result
   */
  private async executePaymentRetry(
    transaction: any,
    attemptNumber: number
  ): Promise<PaymentResult> {
    try {
      // Import payment gateway factory dynamically
      const { paymentGatewayFactory } = await import('./payment-gateway.factory');

      // Get gateway for payment method
      const gateway = paymentGatewayFactory.getGateway(transaction.paymentMethod);

      if (!gateway) {
        throw new Error('Payment gateway not found');
      }

      // Execute payment with gateway
      const result = await gateway.initiatePayment(transaction);

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Payment failed',
          retryCount: attemptNumber
        };
      }

      // Update transaction status
      await prisma.payment_transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'completed',
          gatewayResponse: result.gatewayResponse
        }
      });

      return {
        success: true,
        transactionId: transaction.transactionId,
        gatewayResponse: result.gatewayResponse,
        retryCount: attemptNumber
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        retryCount: attemptNumber
      };
    }
  }

  /**
   * Log retry attempt
   * @param transactionId - The transaction ID
   * @param attemptNumber - Current attempt number
   * @param delay - Retry delay in milliseconds
   * @param success - Whether the retry was successful
   * @param error - Error message if failed
   */
  private async logRetryAttempt(
    transactionId: string,
    attemptNumber: number,
    delay: number,
    success: boolean,
    error?: string
  ): Promise<void> {
    try {
      await prisma.payment_log.create({
        data: {
          id: crypto.randomUUID(),
          transactionId,
          eventType: 'RETRY_ATTEMPT',
          eventData: {
            attemptNumber,
            retryDelay: delay,
            success,
            failureReason: error,
            timestamp: new Date().toISOString()
          }
        }
      });
    } catch (logError) {
      logger.error('Error logging retry attempt', {
        error: logError instanceof Error ? logError.message : 'Unknown error',
        transactionId,
        attemptNumber
      });
    }
  }

  /**
   * Determine failure type from failure reason
   * @param failureReason - The failure reason
   * @returns Failure type
   */
  private determineFailureType(failureReason: string): string {
    const reason = failureReason.toLowerCase();

    if (reason.includes('network') || reason.includes('connection')) {
      return FailureType.NETWORK_ERROR;
    }

    if (reason.includes('timeout') || reason.includes('timed out')) {
      return FailureType.TIMEOUT_ERROR;
    }

    if (reason.includes('gateway') || reason.includes('payment gateway')) {
      return FailureType.GATEWAY_ERROR;
    }

    if (reason.includes('validation') || reason.includes('invalid') || reason.includes('invalid input')) {
      return FailureType.VALIDATION_ERROR;
    }

    if (reason.includes('insufficient') || reason.includes('funds') || reason.includes('balance')) {
      return FailureType.INSUFFICIENT_FUNDS;
    }

    if (reason.includes('fraud') || reason.includes('suspicious')) {
      return FailureType.FRAUD_DETECTED;
    }

    return FailureType.UNKNOWN_ERROR;
  }

  /**
   * Sleep for specified duration
   * @param ms - Duration in milliseconds
   * @returns Promise that resolves after delay
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const paymentRetryService = new PaymentRetryService();
