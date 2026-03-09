"use strict";
/**
 * Payment Performance Service
 *
 * This service tracks payment processing performance metrics,
 * analyzes performance data, and provides optimization recommendations.
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
exports.paymentPerformanceService = exports.PaymentPerformanceService = void 0;
const logger_1 = require("../../utils/logger");
const database_service_1 = require("../database.service");
const prisma = database_service_1.databaseService.getClient();
/**
 * Payment Performance Service Class
 */
class PaymentPerformanceService {
    constructor() {
        this.SLOW_PAYMENT_THRESHOLD = 2000; // 2 seconds
        this.HIGH_FAILURE_RATE_THRESHOLD = 10; // 10%
        this.GATEWAY_DEGRADATION_THRESHOLD = 30; // 30% increase in processing time
        this.SYSTEM_OVERLOAD_THRESHOLD = 80; // 80% of max capacity
        this.performanceMetrics = new Map();
    }
    /**
     * Measure payment processing time
     * @param transactionId - The transaction ID
     * @param startTime - Start time in milliseconds
     * @returns Processing time in milliseconds
     */
    async measurePaymentProcessingTime(transactionId, startTime) {
        try {
            const endTime = Date.now();
            const processingTime = endTime - startTime;
            // Store processing time
            this.performanceMetrics.set(transactionId, processingTime);
            logger_1.logger.info('Payment processing time measured', {
                transactionId,
                processingTime
            });
            return processingTime;
        }
        catch (error) {
            logger_1.logger.error('Error measuring payment processing time', {
                error: error instanceof Error ? error.message : 'Unknown error',
                transactionId
            });
            throw error;
        }
    }
    /**
     * Get payment performance metrics
     * @param startDate - Start date
     * @param endDate - End date
     * @returns Performance metrics
     */
    async getPaymentPerformanceMetrics(startDate, endDate) {
        try {
            // Get transactions in date range
            const transactions = await prisma.payment_transaction.findMany({
                where: {
                    createdAt: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                select: {
                    id: true,
                    paymentMethod: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true
                }
            });
            // Calculate processing times
            const processingTimes = transactions.map(tx => {
                const createdTime = tx.createdAt.getTime();
                const updatedTime = tx.updatedAt.getTime();
                return updatedTime - createdTime;
            });
            // Sort processing times
            processingTimes.sort((a, b) => a - b);
            // Calculate percentiles
            const total = processingTimes.length;
            const p50 = this.calculatePercentile(processingTimes, 50);
            const p90 = this.calculatePercentile(processingTimes, 90);
            const p95 = this.calculatePercentile(processingTimes, 95);
            const p99 = this.calculatePercentile(processingTimes, 99);
            // Calculate average processing time
            const averageProcessingTime = processingTimes.length > 0
                ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
                : 0;
            // Calculate success rate
            const successfulTransactions = transactions.filter(tx => tx.status === 'completed').length;
            const failedTransactions = transactions.filter(tx => tx.status === 'failed').length;
            const successRate = total > 0 ? (successfulTransactions / total) * 100 : 0;
            // Get gateway breakdown
            const gatewayBreakdown = await this.getGatewayPerformanceBreakdown(transactions);
            // Get method breakdown
            const methodBreakdown = await this.getMethodPerformanceBreakdown(transactions);
            return {
                totalTransactions: total,
                successfulTransactions,
                failedTransactions,
                averageProcessingTime,
                p50ProcessingTime: p50,
                p90ProcessingTime: p90,
                p95ProcessingTime: p95,
                p99ProcessingTime: p99,
                successRate,
                gatewayBreakdown,
                methodBreakdown,
                period: {
                    startDate,
                    endDate
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting payment performance metrics', {
                error: error instanceof Error ? error.message : 'Unknown error',
                startDate,
                endDate
            });
            throw error;
        }
    }
    /**
     * Get gateway performance
     * @param gateway - Gateway name
     * @param startDate - Start date
     * @param endDate - End date
     * @returns Gateway performance
     */
    async getGatewayPerformance(gateway, startDate, endDate) {
        try {
            // Get transactions for gateway
            const transactions = await prisma.payment_transaction.findMany({
                where: {
                    paymentMethod: gateway,
                    createdAt: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                select: {
                    id: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true
                }
            });
            // Calculate processing times
            const processingTimes = transactions.map(tx => {
                const createdTime = tx.createdAt.getTime();
                const updatedTime = tx.updatedAt.getTime();
                return updatedTime - createdTime;
            });
            // Sort processing times
            processingTimes.sort((a, b) => a - b);
            // Calculate percentiles
            const total = processingTimes.length;
            const p50 = this.calculatePercentile(processingTimes, 50);
            const p90 = this.calculatePercentile(processingTimes, 90);
            const p95 = this.calculatePercentile(processingTimes, 95);
            const p99 = this.calculatePercentile(processingTimes, 99);
            // Calculate average processing time
            const averageProcessingTime = processingTimes.length > 0
                ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
                : 0;
            // Calculate success rate
            const successfulTransactions = transactions.filter(tx => tx.status === 'completed').length;
            const failedTransactions = transactions.filter(tx => tx.status === 'failed').length;
            const successRate = total > 0 ? (successfulTransactions / total) * 100 : 0;
            // Calculate average response time (same as processing time for now)
            const averageResponseTime = averageProcessingTime;
            return {
                gateway,
                totalTransactions: total,
                successfulTransactions,
                failedTransactions,
                averageProcessingTime,
                p50ProcessingTime: p50,
                p90ProcessingTime: p90,
                p95ProcessingTime: p95,
                p99ProcessingTime: p99,
                successRate,
                averageResponseTime
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting gateway performance', {
                error: error instanceof Error ? error.message : 'Unknown error',
                gateway,
                startDate,
                endDate
            });
            throw error;
        }
    }
    /**
     * Get slow payments
     * @param threshold - Processing time threshold in milliseconds
     * @param startDate - Start date
     * @param endDate - End date
     * @returns Array of slow payment transactions
     */
    async getSlowPayments(threshold, startDate, endDate) {
        try {
            // Get transactions in date range
            const transactions = await prisma.payment_transaction.findMany({
                where: {
                    createdAt: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                select: {
                    id: true,
                    paymentMethod: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true
                }
            });
            // Calculate processing times and filter slow payments
            const slowPayments = transactions.filter(tx => {
                const createdTime = tx.createdAt.getTime();
                const updatedTime = tx.updatedAt.getTime();
                const processingTime = updatedTime - createdTime;
                return processingTime > threshold;
            });
            // Sort by processing time (slowest first)
            slowPayments.sort((a, b) => {
                const timeA = a.updatedAt.getTime() - a.createdAt.getTime();
                const timeB = b.updatedAt.getTime() - b.createdAt.getTime();
                return timeB - timeA;
            });
            return slowPayments;
        }
        catch (error) {
            logger_1.logger.error('Error getting slow payments', {
                error: error instanceof Error ? error.message : 'Unknown error',
                threshold,
                startDate,
                endDate
            });
            throw error;
        }
    }
    /**
     * Get average processing time
     * @param gateway - Optional gateway filter
     * @returns Average processing time in milliseconds
     */
    async getAverageProcessingTime(gateway) {
        try {
            const where = {};
            if (gateway) {
                where.paymentMethod = gateway;
            }
            const transactions = await prisma.payment_transaction.findMany({
                where,
                select: {
                    createdAt: true,
                    updatedAt: true
                }
            });
            if (transactions.length === 0) {
                return 0;
            }
            // Calculate average processing time
            const totalProcessingTime = transactions.reduce((sum, tx) => {
                const processingTime = tx.updatedAt.getTime() - tx.createdAt.getTime();
                return sum + processingTime;
            }, 0);
            return totalProcessingTime / transactions.length;
        }
        catch (error) {
            logger_1.logger.error('Error getting average processing time', {
                error: error instanceof Error ? error.message : 'Unknown error',
                gateway
            });
            throw error;
        }
    }
    /**
     * Get performance percentile
     * @param percentile - Percentile value (50, 90, 95, 99)
     * @param gateway - Optional gateway filter
     * @returns Processing time at percentile
     */
    async getPerformancePercentile(percentile, gateway) {
        try {
            const where = {};
            if (gateway) {
                where.paymentMethod = gateway;
            }
            const transactions = await prisma.payment_transaction.findMany({
                where,
                select: {
                    createdAt: true,
                    updatedAt: true
                }
            });
            if (transactions.length === 0) {
                return 0;
            }
            // Calculate processing times
            const processingTimes = transactions.map(tx => {
                return tx.updatedAt.getTime() - tx.createdAt.getTime();
            });
            // Sort processing times
            processingTimes.sort((a, b) => a - b);
            // Calculate percentile
            return this.calculatePercentile(processingTimes, percentile);
        }
        catch (error) {
            logger_1.logger.error('Error getting performance percentile', {
                error: error instanceof Error ? error.message : 'Unknown error',
                percentile,
                gateway
            });
            throw error;
        }
    }
    /**
     * Optimize payment processing
     * @param transactionId - The transaction ID
     * @returns Optimization result
     */
    async optimizePaymentProcessing(transactionId) {
        try {
            const optimizations = [];
            const appliedOptimizations = [];
            // Get transaction
            const transaction = await prisma.payment_transaction.findUnique({
                where: { transactionId }
            });
            if (!transaction) {
                throw new Error('Transaction not found');
            }
            // Analyze transaction for optimization opportunities
            const processingTime = transaction.updatedAt.getTime() - transaction.createdAt.getTime();
            // Check if payment is slow
            if (processingTime > this.SLOW_PAYMENT_THRESHOLD) {
                optimizations.push('Payment processing time exceeds threshold');
                // Suggest optimizations
                if (processingTime > 5000) {
                    optimizations.push('Consider implementing parallel API calls');
                }
                if (processingTime > 10000) {
                    optimizations.push('Review database query optimization');
                }
            }
            // Check if we can use caching
            const gateway = transaction.paymentMethod;
            const cachedConfig = await this.getCachedGatewayConfig(gateway);
            if (!cachedConfig) {
                optimizations.push('Gateway configuration not cached');
                appliedOptimizations.push('Cache gateway configuration');
            }
            // Estimate improvement (conservative 20% improvement)
            const estimatedImprovement = optimizations.length > 0 ? 0.2 : 0;
            logger_1.logger.info('Payment processing optimization analysis completed', {
                transactionId,
                optimizations,
                estimatedImprovement
            });
            return {
                transactionId,
                optimizations,
                estimatedImprovement,
                appliedOptimizations
            };
        }
        catch (error) {
            logger_1.logger.error('Error optimizing payment processing', {
                error: error instanceof Error ? error.message : 'Unknown error',
                transactionId
            });
            throw error;
        }
    }
    /**
     * Get performance alerts
     * @returns Array of performance alerts
     */
    async getPerformanceAlerts() {
        try {
            const alerts = [];
            // Get recent performance metrics
            const now = new Date();
            const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
            const metrics = await this.getPaymentPerformanceMetrics(oneHourAgo, now);
            // Check for slow payments
            if (metrics.p95ProcessingTime > this.SLOW_PAYMENT_THRESHOLD) {
                alerts.push({
                    id: `alert-${Date.now()}-slow`,
                    alertType: 'SLOW_PAYMENT',
                    severity: metrics.p95ProcessingTime > 5000 ? 'HIGH' : 'MEDIUM',
                    message: `P95 processing time (${metrics.p95ProcessingTime}ms) exceeds threshold (${this.SLOW_PAYMENT_THRESHOLD}ms)`,
                    threshold: this.SLOW_PAYMENT_THRESHOLD,
                    currentValue: metrics.p95ProcessingTime,
                    createdAt: now
                });
            }
            // Check for high failure rate
            if (metrics.successRate < (100 - this.HIGH_FAILURE_RATE_THRESHOLD)) {
                alerts.push({
                    id: `alert-${Date.now()}-failure`,
                    alertType: 'HIGH_FAILURE_RATE',
                    severity: metrics.successRate < 80 ? 'CRITICAL' : 'HIGH',
                    message: `Success rate (${metrics.successRate.toFixed(2)}%) is below threshold (${100 - this.HIGH_FAILURE_RATE_THRESHOLD}%)`,
                    threshold: 100 - this.HIGH_FAILURE_RATE_THRESHOLD,
                    currentValue: metrics.successRate,
                    createdAt: now
                });
            }
            // Check for gateway degradation
            for (const gateway of metrics.gatewayBreakdown) {
                if (gateway.averageProcessingTime > this.SLOW_PAYMENT_THRESHOLD * 1.5) {
                    alerts.push({
                        id: `alert-${Date.now()}-gateway-${gateway.gateway}`,
                        alertType: 'GATEWAY_DEGRADATION',
                        severity: 'MEDIUM',
                        message: `Gateway ${gateway.gateway} processing time degraded`,
                        gateway: gateway.gateway,
                        threshold: this.SLOW_PAYMENT_THRESHOLD,
                        currentValue: gateway.averageProcessingTime,
                        createdAt: now
                    });
                }
            }
            return alerts;
        }
        catch (error) {
            logger_1.logger.error('Error getting performance alerts', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Get gateway performance breakdown
     * @param transactions - Array of transactions
     * @returns Array of gateway performance
     */
    async getGatewayPerformanceBreakdown(transactions) {
        try {
            // Group transactions by gateway
            const gatewayGroups = new Map();
            transactions.forEach(tx => {
                const gateway = tx.paymentMethod;
                if (!gatewayGroups.has(gateway)) {
                    gatewayGroups.set(gateway, []);
                }
                gatewayGroups.get(gateway).push(tx);
            });
            // Calculate performance for each gateway
            const breakdown = [];
            for (const [gateway, txs] of gatewayGroups.entries()) {
                const processingTimes = txs.map(tx => {
                    return tx.updatedAt.getTime() - tx.createdAt.getTime();
                });
                processingTimes.sort((a, b) => a - b);
                const total = processingTimes.length;
                const p50 = this.calculatePercentile(processingTimes, 50);
                const p90 = this.calculatePercentile(processingTimes, 90);
                const p95 = this.calculatePercentile(processingTimes, 95);
                const p99 = this.calculatePercentile(processingTimes, 99);
                const averageProcessingTime = processingTimes.length > 0
                    ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
                    : 0;
                const successfulTransactions = txs.filter(tx => tx.status === 'completed').length;
                const failedTransactions = txs.filter(tx => tx.status === 'failed').length;
                const successRate = total > 0 ? (successfulTransactions / total) * 100 : 0;
                breakdown.push({
                    gateway,
                    totalTransactions: total,
                    successfulTransactions,
                    failedTransactions,
                    averageProcessingTime,
                    p50ProcessingTime: p50,
                    p90ProcessingTime: p90,
                    p95ProcessingTime: p95,
                    p99ProcessingTime: p99,
                    successRate,
                    averageResponseTime: averageProcessingTime
                });
            }
            return breakdown;
        }
        catch (error) {
            logger_1.logger.error('Error getting gateway performance breakdown', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Get method performance breakdown
     * @param transactions - Array of transactions
     * @returns Array of method performance
     */
    async getMethodPerformanceBreakdown(transactions) {
        try {
            // Group transactions by method
            const methodGroups = new Map();
            transactions.forEach(tx => {
                const method = tx.paymentMethod;
                if (!methodGroups.has(method)) {
                    methodGroups.set(method, []);
                }
                methodGroups.get(method).push(tx);
            });
            // Calculate performance for each method
            const breakdown = [];
            for (const [method, txs] of methodGroups.entries()) {
                const processingTimes = txs.map(tx => {
                    return tx.updatedAt.getTime() - tx.createdAt.getTime();
                });
                processingTimes.sort((a, b) => a - b);
                const total = processingTimes.length;
                const p50 = this.calculatePercentile(processingTimes, 50);
                const p90 = this.calculatePercentile(processingTimes, 90);
                const p95 = this.calculatePercentile(processingTimes, 95);
                const p99 = this.calculatePercentile(processingTimes, 99);
                const averageProcessingTime = processingTimes.length > 0
                    ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
                    : 0;
                const successfulTransactions = txs.filter(tx => tx.status === 'completed').length;
                const failedTransactions = txs.filter(tx => tx.status === 'failed').length;
                const successRate = total > 0 ? (successfulTransactions / total) * 100 : 0;
                breakdown.push({
                    method: method,
                    totalTransactions: total,
                    successfulTransactions,
                    failedTransactions,
                    averageProcessingTime,
                    p50ProcessingTime: p50,
                    p90ProcessingTime: p90,
                    p95ProcessingTime: p95,
                    p99ProcessingTime: p99,
                    successRate
                });
            }
            return breakdown;
        }
        catch (error) {
            logger_1.logger.error('Error getting method performance breakdown', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Calculate percentile
     * @param values - Array of values
     * @param percentile - Percentile to calculate
     * @returns Value at percentile
     */
    calculatePercentile(values, percentile) {
        if (values.length === 0) {
            return 0;
        }
        const sorted = [...values].sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[Math.max(0, index)];
    }
    /**
     * Get cached gateway configuration
     * @param gateway - Gateway name
     * @returns Gateway configuration or null
     */
    async getCachedGatewayConfig(gateway) {
        try {
            const { paymentCacheService } = await Promise.resolve().then(() => __importStar(require('./payment-cache.service')));
            return await paymentCacheService.getCachedGatewayConfig(gateway);
        }
        catch (error) {
            logger_1.logger.error('Error getting cached gateway config', {
                error: error instanceof Error ? error.message : 'Unknown error',
                gateway
            });
            return null;
        }
    }
}
exports.PaymentPerformanceService = PaymentPerformanceService;
// Export singleton instance
exports.paymentPerformanceService = new PaymentPerformanceService();
