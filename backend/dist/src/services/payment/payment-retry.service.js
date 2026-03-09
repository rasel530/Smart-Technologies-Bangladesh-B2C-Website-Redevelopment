"use strict";
/**
 * Payment Retry Service
 *
 * This service manages payment retry logic with exponential backoff,
 * retry rules configuration, and retry statistics tracking.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRetryService = exports.PaymentRetryService = exports.FailureType = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../../utils/logger");
const prisma = new client_1.PrismaClient();
/**
 * Failure Types
 */
var FailureType;
(function (FailureType) {
    FailureType["NETWORK_ERROR"] = "NETWORK_ERROR";
    FailureType["TIMEOUT_ERROR"] = "TIMEOUT_ERROR";
    FailureType["GATEWAY_ERROR"] = "GATEWAY_ERROR";
    FailureType["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    FailureType["INSUFFICIENT_FUNDS"] = "INSUFFICIENT_FUNDS";
    FailureType["FRAUD_DETECTED"] = "FRAUD_DETECTED";
    FailureType["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
})(FailureType || (exports.FailureType = FailureType = {}));
/**
 * Default Retry Rules
 */
const DEFAULT_RETRY_RULES = [
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
class PaymentRetryService {
    constructor() {
        this.DEFAULT_MAX_ATTEMPTS = 3;
        this.DEFAULT_BASE_DELAY = 2000; // 2 seconds
        this.DEFAULT_MAX_DELAY = 60000; // 60 seconds
        this.retryRules = new Map();
        // Initialize default retry rules
        this.initializeDefaultRetryRules();
    }
    /**
     * Initialize default retry rules
     */
    initializeDefaultRetryRules() {
        DEFAULT_RETRY_RULES.forEach(rule => {
            const ruleWithId = {
                ...rule,
                id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            this.retryRules.set(ruleWithId.failureType, ruleWithId);
        });
        logger_1.logger.info('Default retry rules initialized', {
            rulesCount: this.retryRules.size
        });
    }
    /**
     * Retry a failed payment
     * @param transactionId - The transaction ID
     * @param options - Retry options
     * @returns Payment result
     */
    async retryPayment(transactionId, options) {
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
            logger_1.logger.info('Payment retry completed', {
                transactionId,
                attemptNumber: currentAttempt,
                success: result.success
            });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Error retrying payment', {
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
    async calculateRetryDelay(attempt, failureType) {
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
            let delay;
            if (rule?.backoffStrategy === 'exponential') {
                delay = Math.min(Math.pow(2, attempt - 1) * rule.baseDelay, rule.maxDelay);
            }
            else if (rule?.backoffStrategy === 'linear') {
                delay = Math.min(attempt * rule.baseDelay, rule.maxDelay);
            }
            else if (rule?.backoffStrategy === 'fixed') {
                delay = rule.baseDelay;
            }
            else {
                // Default exponential backoff
                delay = Math.min(Math.pow(2, attempt - 1) * this.DEFAULT_BASE_DELAY, this.DEFAULT_MAX_DELAY);
            }
            return delay;
        }
        catch (error) {
            logger_1.logger.error('Error calculating retry delay', {
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
    async shouldRetryPayment(failureReason, attempt) {
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
        }
        catch (error) {
            logger_1.logger.error('Error determining if payment should be retried', {
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
    async getRetryHistory(transactionId) {
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
            const retryHistory = logs.map((log, index) => ({
                id: log.id,
                transactionId: transactionId,
                attemptNumber: index + 1,
                failureReason: log.eventData?.failureReason || 'Unknown',
                retryDelay: log.eventData?.retryDelay || 0,
                executedAt: log.createdAt,
                success: log.eventData?.success || false
            }));
            return retryHistory;
        }
        catch (error) {
            logger_1.logger.error('Error getting retry history', {
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
    async getRetryStatistics() {
        try {
            // Get all retry logs
            const retryLogs = await prisma.payment_log.findMany({
                where: {
                    eventType: 'RETRY_ATTEMPT'
                }
            });
            const totalRetries = retryLogs.length;
            const successfulRetries = retryLogs.filter(log => log.eventData?.success).length;
            const failedRetries = totalRetries - successfulRetries;
            // Calculate average retries per payment
            const retriesByTransaction = new Map();
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
            const failureReasons = new Map();
            retryLogs.forEach(log => {
                const reason = log.eventData?.failureReason || 'Unknown';
                failureReasons.set(reason, (failureReasons.get(reason) || 0) + 1);
            });
            const mostCommonFailureReasons = Array.from(failureReasons.entries())
                .map(([reason, count]) => ({ reason, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10);
            // Calculate average retry delay
            const totalDelay = retryLogs.reduce((sum, log) => sum + (log.eventData?.retryDelay || 0), 0);
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
        }
        catch (error) {
            logger_1.logger.error('Error getting retry statistics', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Configure retry rules
     * @param rules - Array of retry rules
     */
    async configureRetryRules(rules) {
        try {
            // Clear existing rules
            this.retryRules.clear();
            // Add new rules
            rules.forEach(rule => {
                const ruleWithId = {
                    ...rule,
                    id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                this.retryRules.set(ruleWithId.failureType, ruleWithId);
            });
            logger_1.logger.info('Retry rules configured', {
                rulesCount: this.retryRules.size
            });
        }
        catch (error) {
            logger_1.logger.error('Error configuring retry rules', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Get retry rules
     * @returns Array of retry rules
     */
    getRetryRules() {
        return Array.from(this.retryRules.values());
    }
    /**
     * Cancel retry for a transaction
     * @param transactionId - The transaction ID
     */
    async cancelRetry(transactionId) {
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
            logger_1.logger.info('Payment retry cancelled', {
                transactionId
            });
        }
        catch (error) {
            logger_1.logger.error('Error cancelling retry', {
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
    async executePaymentRetry(transaction, attemptNumber) {
        try {
            // Import payment gateway factory dynamically
            const { paymentGatewayFactory } = await Promise.resolve().then(() => __importStar(require('./payment-gateway.factory')));
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
        }
        catch (error) {
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
    async logRetryAttempt(transactionId, attemptNumber, delay, success, error) {
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
        }
        catch (logError) {
            logger_1.logger.error('Error logging retry attempt', {
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
    determineFailureType(failureReason) {
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
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.PaymentRetryService = PaymentRetryService;
// Export singleton instance
exports.paymentRetryService = new PaymentRetryService();
