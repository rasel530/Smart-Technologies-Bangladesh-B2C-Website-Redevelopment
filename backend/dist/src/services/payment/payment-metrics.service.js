"use strict";
/**
 * Payment Metrics Service
 *
 * This service manages payment metrics and KPI tracking including:
 * - Recording metrics
 * - Retrieving metrics by various filters
 * - Calculating key performance indicators
 * - Tracking revenue, transaction counts, success rates, etc.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentMetricsService = exports.PaymentMetricsService = void 0;
const database_service_1 = require("../database.service");
const prisma = database_service_1.databaseService.getClient();
/**
 * Payment Metrics Service Class
 */
class PaymentMetricsService {
    /**
     * Record a metric
     * @param metricName - Name of the metric
     * @param metricValue - Value of the metric
     * @param metricType - Type of metric
     * @param period - Period of the metric
     * @param gateway - Optional gateway name
     * @param paymentMethod - Optional payment method
     * @returns Created metric record
     */
    async recordMetric(metricName, metricValue, metricType, period, gateway, paymentMethod) {
        try {
            const metric = await prisma.payment_metrics.create({
                data: {
                    id: crypto.randomUUID(),
                    metric_name: metricName,
                    metric_value: metricValue,
                    metric_type: metricType,
                    period,
                    gateway,
                    payment_method: paymentMethod,
                    timestamp: new Date()
                }
            });
            return {
                id: metric.id,
                metricName: metric.metric_name,
                metricValue: Number(metric.metric_value),
                metricType: metric.metric_type,
                period: metric.period,
                gateway: metric.gateway || undefined,
                paymentMethod: metric.payment_method || undefined,
                timestamp: metric.timestamp
            };
        }
        catch (error) {
            console.error('Error recording metric:', error);
            throw new Error('Failed to record metric');
        }
    }
    /**
     * Get metrics by name and period
     * @param metricName - Name of the metric
     * @param period - Period of the metric
     * @param startDate - Start date
     * @param endDate - End date
     * @param gateway - Optional gateway filter
     * @param paymentMethod - Optional payment method filter
     * @returns Array of metric records
     */
    async getMetrics(metricName, period, startDate, endDate, gateway, paymentMethod) {
        try {
            const where = {
                metric_name: metricName,
                period,
                timestamp: {
                    gte: startDate,
                    lte: endDate
                }
            };
            if (gateway) {
                where.gateway = gateway;
            }
            if (paymentMethod) {
                where.payment_method = paymentMethod;
            }
            const metrics = await prisma.payment_metrics.findMany({
                where,
                orderBy: {
                    timestamp: 'desc'
                }
            });
            return metrics.map(metric => ({
                id: metric.id,
                metricName: metric.metric_name,
                metricValue: Number(metric.metric_value),
                metricType: metric.metric_type,
                period: metric.period,
                gateway: metric.gateway || undefined,
                paymentMethod: metric.payment_method || undefined,
                timestamp: metric.timestamp
            }));
        }
        catch (error) {
            console.error('Error fetching metrics:', error);
            throw new Error('Failed to fetch metrics');
        }
    }
    /**
     * Get latest metrics by name
     * @param metricName - Name of the metric
     * @param limit - Maximum number of records to return
     * @returns Array of metric records
     */
    async getLatestMetrics(metricName, limit = 10) {
        try {
            const metrics = await prisma.payment_metrics.findMany({
                where: {
                    metric_name: metricName
                },
                orderBy: {
                    timestamp: 'desc'
                },
                take: limit
            });
            return metrics.map(metric => ({
                id: metric.id,
                metricName: metric.metric_name,
                metricValue: Number(metric.metric_value),
                metricType: metric.metric_type,
                period: metric.period,
                gateway: metric.gateway || undefined,
                paymentMethod: metric.payment_method || undefined,
                timestamp: metric.timestamp
            }));
        }
        catch (error) {
            console.error('Error fetching latest metrics:', error);
            throw new Error('Failed to fetch latest metrics');
        }
    }
    /**
     * Calculate key performance indicators
     * @param startDate - Start date
     * @param endDate - End date
     * @returns KPIs object
     */
    async calculateKPIs(startDate, endDate) {
        try {
            // Get all transactions for the date range
            const transactions = await prisma.payment_transaction.findMany({
                where: {
                    createdAt: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            });
            // Calculate revenue for different periods
            const revenue = await this.calculateRevenueMetrics(transactions, startDate, endDate);
            // Calculate transaction counts for different periods
            const transactionCount = await this.calculateTransactionCountMetrics(transactions, startDate, endDate);
            // Calculate success rates for different periods
            const successRate = await this.calculateSuccessRateMetrics(transactions, startDate, endDate);
            // Calculate average transaction values for different periods
            const averageTransactionValue = await this.calculateAverageTransactionValueMetrics(transactions, startDate, endDate);
            // Calculate gateway response times
            const gatewayResponseTimes = await this.calculateGatewayResponseTimes(transactions);
            // Calculate payment method popularity
            const paymentMethodPopularity = await this.calculatePaymentMethodPopularity(transactions);
            return {
                revenue,
                transactionCount,
                successRate,
                averageTransactionValue,
                gatewayResponseTimes,
                paymentMethodPopularity
            };
        }
        catch (error) {
            console.error('Error calculating KPIs:', error);
            throw new Error('Failed to calculate KPIs');
        }
    }
    /**
     * Calculate revenue metrics for different periods
     * @param transactions - Array of transactions
     * @param startDate - Start date
     * @param endDate - End date
     * @returns Revenue metrics
     */
    async calculateRevenueMetrics(transactions, startDate, endDate) {
        const completedTransactions = transactions.filter(t => t.status === 'completed');
        // Hourly revenue (last hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const hourlyRevenue = completedTransactions
            .filter(t => t.createdAt >= oneHourAgo)
            .reduce((sum, t) => sum + Number(t.amount), 0);
        // Daily revenue (last 24 hours)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const dailyRevenue = completedTransactions
            .filter(t => t.createdAt >= oneDayAgo)
            .reduce((sum, t) => sum + Number(t.amount), 0);
        // Weekly revenue (last 7 days)
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const weeklyRevenue = completedTransactions
            .filter(t => t.createdAt >= oneWeekAgo)
            .reduce((sum, t) => sum + Number(t.amount), 0);
        // Monthly revenue (last 30 days)
        const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const monthlyRevenue = completedTransactions
            .filter(t => t.createdAt >= oneMonthAgo)
            .reduce((sum, t) => sum + Number(t.amount), 0);
        // Record these metrics
        await this.recordMetric('revenue_hourly', hourlyRevenue, 'revenue', 'hourly');
        await this.recordMetric('revenue_daily', dailyRevenue, 'revenue', 'daily');
        await this.recordMetric('revenue_weekly', weeklyRevenue, 'revenue', 'weekly');
        await this.recordMetric('revenue_monthly', monthlyRevenue, 'revenue', 'monthly');
        return {
            hourly: hourlyRevenue,
            daily: dailyRevenue,
            weekly: weeklyRevenue,
            monthly: monthlyRevenue
        };
    }
    /**
     * Calculate transaction count metrics for different periods
     * @param transactions - Array of transactions
     * @param startDate - Start date
     * @param endDate - End date
     * @returns Transaction count metrics
     */
    async calculateTransactionCountMetrics(transactions, startDate, endDate) {
        // Hourly transaction count (last hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const hourlyCount = transactions.filter(t => t.createdAt >= oneHourAgo).length;
        // Daily transaction count (last 24 hours)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const dailyCount = transactions.filter(t => t.createdAt >= oneDayAgo).length;
        // Weekly transaction count (last 7 days)
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const weeklyCount = transactions.filter(t => t.createdAt >= oneWeekAgo).length;
        // Monthly transaction count (last 30 days)
        const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const monthlyCount = transactions.filter(t => t.createdAt >= oneMonthAgo).length;
        // Record these metrics
        await this.recordMetric('transaction_count_hourly', hourlyCount, 'transaction_count', 'hourly');
        await this.recordMetric('transaction_count_daily', dailyCount, 'transaction_count', 'daily');
        await this.recordMetric('transaction_count_weekly', weeklyCount, 'transaction_count', 'weekly');
        await this.recordMetric('transaction_count_monthly', monthlyCount, 'transaction_count', 'monthly');
        return {
            hourly: hourlyCount,
            daily: dailyCount,
            weekly: weeklyCount,
            monthly: monthlyCount
        };
    }
    /**
     * Calculate success rate metrics for different periods
     * @param transactions - Array of transactions
     * @param startDate - Start date
     * @param endDate - End date
     * @returns Success rate metrics
     */
    async calculateSuccessRateMetrics(transactions, startDate, endDate) {
        const calculateSuccessRate = (filteredTransactions) => {
            if (filteredTransactions.length === 0)
                return 0;
            const completedCount = filteredTransactions.filter(t => t.status === 'completed').length;
            return (completedCount / filteredTransactions.length) * 100;
        };
        // Hourly success rate (last hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const hourlySuccessRate = calculateSuccessRate(transactions.filter(t => t.createdAt >= oneHourAgo));
        // Daily success rate (last 24 hours)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const dailySuccessRate = calculateSuccessRate(transactions.filter(t => t.createdAt >= oneDayAgo));
        // Weekly success rate (last 7 days)
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const weeklySuccessRate = calculateSuccessRate(transactions.filter(t => t.createdAt >= oneWeekAgo));
        // Monthly success rate (last 30 days)
        const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const monthlySuccessRate = calculateSuccessRate(transactions.filter(t => t.createdAt >= oneMonthAgo));
        // Record these metrics
        await this.recordMetric('success_rate_hourly', hourlySuccessRate, 'success_rate', 'hourly');
        await this.recordMetric('success_rate_daily', dailySuccessRate, 'success_rate', 'daily');
        await this.recordMetric('success_rate_weekly', weeklySuccessRate, 'success_rate', 'weekly');
        await this.recordMetric('success_rate_monthly', monthlySuccessRate, 'success_rate', 'monthly');
        return {
            hourly: parseFloat(hourlySuccessRate.toFixed(2)),
            daily: parseFloat(dailySuccessRate.toFixed(2)),
            weekly: parseFloat(weeklySuccessRate.toFixed(2)),
            monthly: parseFloat(monthlySuccessRate.toFixed(2))
        };
    }
    /**
     * Calculate average transaction value metrics for different periods
     * @param transactions - Array of transactions
     * @param startDate - Start date
     * @param endDate - End date
     * @returns Average transaction value metrics
     */
    async calculateAverageTransactionValueMetrics(transactions, startDate, endDate) {
        const calculateAverageTransactionValue = (filteredTransactions) => {
            const completedTransactions = filteredTransactions.filter(t => t.status === 'completed');
            if (completedTransactions.length === 0)
                return 0;
            const totalRevenue = completedTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
            return totalRevenue / completedTransactions.length;
        };
        // Hourly average transaction value (last hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const hourlyAverage = calculateAverageTransactionValue(transactions.filter(t => t.createdAt >= oneHourAgo));
        // Daily average transaction value (last 24 hours)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const dailyAverage = calculateAverageTransactionValue(transactions.filter(t => t.createdAt >= oneDayAgo));
        // Weekly average transaction value (last 7 days)
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const weeklyAverage = calculateAverageTransactionValue(transactions.filter(t => t.createdAt >= oneWeekAgo));
        // Monthly average transaction value (last 30 days)
        const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const monthlyAverage = calculateAverageTransactionValue(transactions.filter(t => t.createdAt >= oneMonthAgo));
        // Record these metrics
        await this.recordMetric('avg_transaction_value_hourly', hourlyAverage, 'avg_transaction_value', 'hourly');
        await this.recordMetric('avg_transaction_value_daily', dailyAverage, 'avg_transaction_value', 'daily');
        await this.recordMetric('avg_transaction_value_weekly', weeklyAverage, 'avg_transaction_value', 'weekly');
        await this.recordMetric('avg_transaction_value_monthly', monthlyAverage, 'avg_transaction_value', 'monthly');
        return {
            hourly: parseFloat(hourlyAverage.toFixed(2)),
            daily: parseFloat(dailyAverage.toFixed(2)),
            weekly: parseFloat(weeklyAverage.toFixed(2)),
            monthly: parseFloat(monthlyAverage.toFixed(2))
        };
    }
    /**
     * Calculate gateway response times
     * @param transactions - Array of transactions
     * @returns Gateway response times
     */
    async calculateGatewayResponseTimes(transactions) {
        const gatewayMap = new Map();
        for (const transaction of transactions) {
            if (transaction.status === 'completed' && transaction.updatedAt && transaction.createdAt) {
                const gateway = this.getGatewayForPaymentMethod(transaction.paymentMethod);
                const responseTime = transaction.updatedAt.getTime() - transaction.createdAt.getTime();
                if (!gatewayMap.has(gateway)) {
                    gatewayMap.set(gateway, []);
                }
                gatewayMap.get(gateway).push(responseTime);
            }
        }
        const gatewayResponseTimes = [];
        for (const [gateway, responseTimes] of gatewayMap.entries()) {
            const averageResponseTime = responseTimes.length > 0
                ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
                : 0;
            gatewayResponseTimes.push({
                gateway,
                averageResponseTime: Math.round(averageResponseTime / 1000) // Convert to seconds
            });
            // Record metric
            await this.recordMetric(`gateway_response_time_${gateway}`, averageResponseTime / 1000, 'response_time', 'hourly', gateway);
        }
        return gatewayResponseTimes.sort((a, b) => a.gateway.localeCompare(b.gateway));
    }
    /**
     * Calculate payment method popularity
     * @param transactions - Array of transactions
     * @returns Payment method popularity
     */
    async calculatePaymentMethodPopularity(transactions) {
        const methodCountMap = new Map();
        for (const transaction of transactions) {
            const method = transaction.paymentMethod;
            methodCountMap.set(method, (methodCountMap.get(method) || 0) + 1);
        }
        const totalTransactions = transactions.length;
        const paymentMethodPopularity = [];
        for (const [paymentMethod, count] of methodCountMap.entries()) {
            const usagePercentage = totalTransactions > 0 ? (count / totalTransactions) * 100 : 0;
            paymentMethodPopularity.push({
                paymentMethod,
                usagePercentage: parseFloat(usagePercentage.toFixed(2))
            });
            // Record metric
            await this.recordMetric(`payment_method_popularity_${paymentMethod}`, usagePercentage, 'popularity', 'daily', undefined, paymentMethod);
        }
        return paymentMethodPopularity.sort((a, b) => b.usagePercentage - a.usagePercentage);
    }
    /**
     * Get gateway for payment method
     * @param paymentMethod - Payment method
     * @returns Gateway name
     */
    getGatewayForPaymentMethod(paymentMethod) {
        const methodMap = {
            'credit_card': 'sslcommerz',
            'bank_transfer': 'bank_transfer',
            'cash_on_delivery': 'cash_on_delivery',
            'bkash': 'bkash',
            'nagad': 'nagad',
            'rocket': 'rocket',
            'emi': 'emi',
            'mcash': 'mcash'
        };
        return methodMap[paymentMethod] || paymentMethod;
    }
    /**
     * Delete old metrics to prevent database bloat
     * @param daysToKeep - Number of days to keep metrics
     * @returns Number of deleted records
     */
    async deleteOldMetrics(daysToKeep = 90) {
        try {
            const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
            const result = await prisma.payment_metrics.deleteMany({
                where: {
                    timestamp: {
                        lt: cutoffDate
                    }
                }
            });
            console.log(`Deleted ${result.count} old metrics records`);
            return result.count;
        }
        catch (error) {
            console.error('Error deleting old metrics:', error);
            throw new Error('Failed to delete old metrics');
        }
    }
    /**
     * Get metrics summary for dashboard
     * @returns Summary of key metrics
     */
    async getMetricsSummary() {
        try {
            const now = new Date();
            const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const transactions = await prisma.payment_transaction.findMany({
                where: {
                    createdAt: {
                        gte: oneDayAgo
                    }
                }
            });
            const completedTransactions = transactions.filter(t => t.status === 'completed');
            const totalRevenue = completedTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
            const totalTransactions = transactions.length;
            const overallSuccessRate = totalTransactions > 0
                ? (completedTransactions.length / totalTransactions) * 100
                : 0;
            const averageTransactionValue = completedTransactions.length > 0
                ? totalRevenue / completedTransactions.length
                : 0;
            // Find top payment method
            const methodCountMap = new Map();
            for (const transaction of transactions) {
                const method = transaction.paymentMethod;
                methodCountMap.set(method, (methodCountMap.get(method) || 0) + 1);
            }
            let topPaymentMethod = 'credit_card';
            let maxMethodCount = 0;
            for (const [method, count] of methodCountMap.entries()) {
                if (count > maxMethodCount) {
                    maxMethodCount = count;
                    topPaymentMethod = method;
                }
            }
            // Find top gateway
            const gatewayCountMap = new Map();
            for (const transaction of transactions) {
                const gateway = this.getGatewayForPaymentMethod(transaction.paymentMethod);
                gatewayCountMap.set(gateway, (gatewayCountMap.get(gateway) || 0) + 1);
            }
            let topGateway = 'sslcommerz';
            let maxGatewayCount = 0;
            for (const [gateway, count] of gatewayCountMap.entries()) {
                if (count > maxGatewayCount) {
                    maxGatewayCount = count;
                    topGateway = gateway;
                }
            }
            return {
                totalRevenue,
                totalTransactions,
                overallSuccessRate: parseFloat(overallSuccessRate.toFixed(2)),
                averageTransactionValue: parseFloat(averageTransactionValue.toFixed(2)),
                topPaymentMethod,
                topGateway
            };
        }
        catch (error) {
            console.error('Error fetching metrics summary:', error);
            throw new Error('Failed to fetch metrics summary');
        }
    }
}
exports.PaymentMetricsService = PaymentMetricsService;
// Export singleton instance
exports.paymentMetricsService = new PaymentMetricsService();
