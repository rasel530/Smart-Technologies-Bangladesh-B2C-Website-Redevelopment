/**
 * Payment Analytics Service
 * 
 * This service provides comprehensive payment analytics including:
 * - Daily/monthly aggregation
 * - Gateway and payment method analytics
 * - Conversion rate tracking
 * - Failure analysis
 * - Revenue tracking and forecasting
 * - Performance monitoring
 */

import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { databaseService } from '../database.service';

const prisma = databaseService.getClient();

/**
 * Analytics aggregation period type
 */
export type AggregationPeriod = 'daily' | 'monthly';

/**
 * Gateway analytics result
 */
export interface GatewayAnalytics {
  gateway: string;
  totalRevenue: number;
  transactionCount: number;
  successRate: number;
  averageTransactionValue: number;
  failedTransactions: number;
}

/**
 * Payment method analytics result
 */
export interface PaymentMethodAnalytics {
  paymentMethod: PaymentMethod;
  totalRevenue: number;
  transactionCount: number;
  successRate: number;
  averageTransactionValue: number;
  failedTransactions: number;
}

/**
 * Conversion rate analytics
 */
export interface ConversionRateAnalytics {
  initiationCount: number;
  completionCount: number;
  conversionRate: number;
  abandonmentRate: number;
  averageTimeToComplete: number;
}

/**
 * Failure analysis result
 */
export interface FailureAnalysis {
  totalFailures: number;
  failureRate: number;
  failuresByReason: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;
  failuresByPaymentMethod: Array<{
    paymentMethod: PaymentMethod;
    failureCount: number;
    failureRate: number;
  }>;
  failuresByGateway: Array<{
    gateway: string;
    failureCount: number;
    failureRate: number;
  }>;
}

/**
 * Revenue tracking result
 */
export interface RevenueTracking {
  totalRevenue: number;
  netRevenue: number;
  refundedAmount: number;
  revenueByPaymentMethod: Array<{
    paymentMethod: PaymentMethod;
    revenue: number;
    percentage: number;
  }>;
  revenueByGateway: Array<{
    gateway: string;
    revenue: number;
    percentage: number;
  }>;
  dailyRevenue: Array<{
    date: string;
    revenue: number;
    transactions: number;
  }>;
  forecast: {
    next7Days: number;
    next30Days: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  };
}

/**
 * Performance metrics result
 */
export interface PerformanceMetrics {
  averageResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  gatewayPerformance: Array<{
    gateway: string;
    averageResponseTime: number;
    successRate: number;
    uptime: number;
  }>;
  paymentMethodPerformance: Array<{
    paymentMethod: PaymentMethod;
    averageResponseTime: number;
    successRate: number;
    popularity: number;
  }>;
}

/**
 * Payment Analytics Service Class
 */
export class PaymentAnalyticsService {
  /**
   * Aggregate daily payment analytics
   * @param date - Date to aggregate analytics for
   * @returns Created analytics record
   */
  async aggregateDailyAnalytics(date: Date) {
    try {
      // Set date boundaries for the day
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      // Get all transactions for the day
      const transactions = await prisma.payment_transaction.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      // Calculate analytics
      const totalRevenue = transactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const totalTransactions = transactions.length;
      const completedTransactions = transactions.filter(t => t.status === 'completed').length;
      const failedTransactions = transactions.filter(t => t.status === 'failed').length;
      const refundedAmount = transactions
        .filter(t => t.status === 'refunded')
        .reduce((sum, t) => sum + (t.refundAmount ? Number(t.refundAmount) : 0), 0);

      const successRate = totalTransactions > 0 
        ? (completedTransactions / totalTransactions) * 100 
        : 0;

      // Gateway breakdown
      const gatewayBreakdown = this.calculateGatewayBreakdown(transactions);

      // Payment method breakdown
      const methodBreakdown = this.calculateMethodBreakdown(transactions);
      
      // Check if analytics already exists for this date
      const existingAnalytics = await prisma.payment_analytics.findFirst({
        where: {
          date: startDate,
          period: 'daily'
        }
      });

      if (existingAnalytics) {
        // Update existing analytics
        return await prisma.payment_analytics.update({
          where: { id: existingAnalytics.id },
          data: {
            total_revenue: totalRevenue,
            total_transactions: totalTransactions,
            success_rate: successRate,
            failed_transactions: failedTransactions,
            refunded_amount: refundedAmount,
            gateway_breakdown: gatewayBreakdown,
            method_breakdown: methodBreakdown,
            updated_at: new Date()
          }
        });
      } else {
        // Create new analytics
        return await prisma.payment_analytics.create({
          data: {
            id: crypto.randomUUID(),
            date: startDate,
            period: 'daily',
            total_revenue: totalRevenue,
            total_transactions: totalTransactions,
            success_rate: successRate,
            failed_transactions: failedTransactions,
            refunded_amount: refundedAmount,
            gateway_breakdown: gatewayBreakdown,
            method_breakdown: methodBreakdown,
            created_at: new Date(),
            updated_at: new Date()
          }
        });
      }
    } catch (error) {
      console.error('Error aggregating daily analytics:', error);
      throw new Error('Failed to aggregate daily analytics');
    }
  }

  /**
   * Aggregate monthly payment analytics
   * @param year - Year to aggregate
   * @param month - Month to aggregate (1-12)
   * @returns Created analytics record
   */
  async aggregateMonthlyAnalytics(year: number, month: number) {
    try {
      // Set date boundaries for the month
      const startDate = new Date(year, month - 1, 1);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(year, month, 0);
      endDate.setHours(23, 59, 59, 999);

      // Get all transactions for the month
      const transactions = await prisma.payment_transaction.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      // Calculate analytics
      const totalRevenue = transactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const totalTransactions = transactions.length;
      const completedTransactions = transactions.filter(t => t.status === 'completed').length;
      const failedTransactions = transactions.filter(t => t.status === 'failed').length;
      const refundedAmount = transactions
        .filter(t => t.status === 'refunded')
        .reduce((sum, t) => sum + (t.refundAmount ? Number(t.refundAmount) : 0), 0);

      const successRate = totalTransactions > 0 
        ? (completedTransactions / totalTransactions) * 100 
        : 0;

      // Gateway breakdown
      const gatewayBreakdown = this.calculateGatewayBreakdown(transactions);

      // Payment method breakdown
      const methodBreakdown = this.calculateMethodBreakdown(transactions);
      
      // Check if analytics already exists for this month
      const existingAnalytics = await prisma.payment_analytics.findFirst({
        where: {
          date: startDate,
          period: 'monthly'
        }
      });

      if (existingAnalytics) {
        // Update existing analytics
        return await prisma.payment_analytics.update({
          where: { id: existingAnalytics.id },
          data: {
            total_revenue: totalRevenue,
            total_transactions: totalTransactions,
            success_rate: successRate,
            failed_transactions: failedTransactions,
            refunded_amount: refundedAmount,
            gateway_breakdown: gatewayBreakdown,
            method_breakdown: methodBreakdown,
            updated_at: new Date()
          }
        });
      } else {
        // Create new analytics
        return await prisma.payment_analytics.create({
          data: {
            id: crypto.randomUUID(),
            date: startDate,
            period: 'monthly',
            total_revenue: totalRevenue,
            total_transactions: totalTransactions,
            success_rate: successRate,
            failed_transactions: failedTransactions,
            refunded_amount: refundedAmount,
            gateway_breakdown: gatewayBreakdown,
            method_breakdown: methodBreakdown,
            created_at: new Date(),
            updated_at: new Date()
          }
        });
      }
    } catch (error) {
      console.error('Error aggregating monthly analytics:', error);
      throw new Error('Failed to aggregate monthly analytics');
    }
  }

  /**
   * Get analytics by date range
   * @param startDate - Start date
   * @param endDate - End date
   * @param period - Aggregation period ('daily' or 'monthly')
   * @returns Array of analytics records
   */
  async getAnalyticsByDateRange(
    startDate: Date,
    endDate: Date,
    period: AggregationPeriod
  ) {
    try {
      const analytics = await prisma.payment_analytics.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate
          },
          period
        },
        orderBy: {
          date: 'asc'
        }
      });

      return analytics;
    } catch (error) {
      console.error('Error fetching analytics by date range:', error);
      throw new Error('Failed to fetch analytics by date range');
    }
  }

  /**
   * Get gateway-specific analytics
   * @param gateway - Gateway name
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Gateway analytics
   */
  async getGatewayAnalytics(
    gateway: string,
    startDate: Date,
    endDate: Date
  ): Promise<GatewayAnalytics> {
    try {
      const transactions = await prisma.payment_transaction.findMany({
        where: {
          paymentMethod: this.getPaymentMethodForGateway(gateway),
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const totalRevenue = transactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const transactionCount = transactions.length;
      const completedCount = transactions.filter(t => t.status === 'completed').length;
      const failedCount = transactions.filter(t => t.status === 'failed').length;

      const successRate = transactionCount > 0 
        ? (completedCount / transactionCount) * 100 
        : 0;

      const averageTransactionValue = completedCount > 0 
        ? totalRevenue / completedCount 
        : 0;

      return {
        gateway,
        totalRevenue,
        transactionCount,
        successRate: parseFloat(successRate.toFixed(2)),
        averageTransactionValue: parseFloat(averageTransactionValue.toFixed(2)),
        failedTransactions: failedCount
      };
    } catch (error) {
      console.error('Error fetching gateway analytics:', error);
      throw new Error('Failed to fetch gateway analytics');
    }
  }

  /**
   * Get payment method analytics
   * @param method - Payment method
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Payment method analytics
   */
  async getMethodAnalytics(
    method: PaymentMethod,
    startDate: Date,
    endDate: Date
  ): Promise<PaymentMethodAnalytics> {
    try {
      const transactions = await prisma.payment_transaction.findMany({
        where: {
          paymentMethod: method,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const totalRevenue = transactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const transactionCount = transactions.length;
      const completedCount = transactions.filter(t => t.status === 'completed').length;
      const failedCount = transactions.filter(t => t.status === 'failed').length;

      const successRate = transactionCount > 0 
        ? (completedCount / transactionCount) * 100 
        : 0;

      const averageTransactionValue = completedCount > 0 
        ? totalRevenue / completedCount 
        : 0;

      return {
        paymentMethod: method,
        totalRevenue,
        transactionCount,
        successRate: parseFloat(successRate.toFixed(2)),
        averageTransactionValue: parseFloat(averageTransactionValue.toFixed(2)),
        failedTransactions: failedCount
      };
    } catch (error) {
      console.error('Error fetching payment method analytics:', error);
      throw new Error('Failed to fetch payment method analytics');
    }
  }

  /**
   * Get payment conversion rate
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Conversion rate analytics
   */
  async getConversionRate(
    startDate: Date,
    endDate: Date
  ): Promise<ConversionRateAnalytics> {
    try {
      const transactions = await prisma.payment_transaction.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      const initiationCount = transactions.length;
      const completionCount = transactions.filter(t => t.status === 'completed').length;

      const conversionRate = initiationCount > 0 
        ? (completionCount / initiationCount) * 100 
        : 0;

      const abandonmentRate = initiationCount > 0 
        ? ((initiationCount - completionCount) / initiationCount) * 100 
        : 0;

      // Calculate average time to complete
      const completedTransactions = transactions.filter(t => t.status === 'completed');
      let totalTimeToComplete = 0;
      let completionCountWithTime = 0;

      for (const transaction of completedTransactions) {
        if (transaction.updatedAt && transaction.createdAt) {
          const timeDiff = transaction.updatedAt.getTime() - transaction.createdAt.getTime();
          totalTimeToComplete += timeDiff;
          completionCountWithTime++;
        }
      }

      const averageTimeToComplete = completionCountWithTime > 0 
        ? totalTimeToComplete / completionCountWithTime 
        : 0;

      return {
        initiationCount,
        completionCount,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        abandonmentRate: parseFloat(abandonmentRate.toFixed(2)),
        averageTimeToComplete: Math.round(averageTimeToComplete / 1000) // Convert to seconds
      };
    } catch (error) {
      console.error('Error calculating conversion rate:', error);
      throw new Error('Failed to calculate conversion rate');
    }
  }

  /**
   * Get payment failure analysis
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Failure analysis
   */
  async getFailureAnalysis(
    startDate: Date,
    endDate: Date
  ): Promise<FailureAnalysis> {
    try {
      const transactions = await prisma.payment_transaction.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const totalFailures = transactions.filter(t => t.status === 'failed').length;
      const totalTransactions = transactions.length;
      const failureRate = totalTransactions > 0 
        ? (totalFailures / totalTransactions) * 100 
        : 0;

      // Group failures by reason
      const failuresByReasonMap = new Map<string, number>();
      const failedTransactions = transactions.filter(t => t.status === 'failed');

      for (const transaction of failedTransactions) {
        const reason = transaction.failureReason || 'Unknown';
        failuresByReasonMap.set(reason, (failuresByReasonMap.get(reason) || 0) + 1);
      }

      const failuresByReason = Array.from(failuresByReasonMap.entries())
        .map(([reason, count]) => ({
          reason,
          count,
          percentage: totalFailures > 0 ? (count / totalFailures) * 100 : 0
        }))
        .sort((a, b) => b.count - a.count);

      // Group failures by payment method
      const failuresByPaymentMethodMap = new Map<PaymentMethod, { count: number; total: number }>();

      for (const transaction of transactions) {
        const method = transaction.paymentMethod;
        const current = failuresByPaymentMethodMap.get(method) || { count: 0, total: 0 };
        current.total++;
        if (transaction.status === 'failed') {
          current.count++;
        }
        failuresByPaymentMethodMap.set(method, current);
      }

      const failuresByPaymentMethod = Array.from(failuresByPaymentMethodMap.entries())
        .map(([paymentMethod, data]) => ({
          paymentMethod,
          failureCount: data.count,
          failureRate: data.total > 0 ? (data.count / data.total) * 100 : 0
        }))
        .sort((a, b) => b.failureCount - a.failureCount);

      // Group failures by gateway
      const failuresByGatewayMap = new Map<string, { count: number; total: number }>();

      for (const transaction of transactions) {
        const gateway = this.getGatewayForPaymentMethod(transaction.paymentMethod);
        const current = failuresByGatewayMap.get(gateway) || { count: 0, total: 0 };
        current.total++;
        if (transaction.status === 'failed') {
          current.count++;
        }
        failuresByGatewayMap.set(gateway, current);
      }

      const failuresByGateway = Array.from(failuresByGatewayMap.entries())
        .map(([gateway, data]) => ({
          gateway,
          failureCount: data.count,
          failureRate: data.total > 0 ? (data.count / data.total) * 100 : 0
        }))
        .sort((a, b) => b.failureCount - a.failureCount);

      return {
        totalFailures,
        failureRate: parseFloat(failureRate.toFixed(2)),
        failuresByReason,
        failuresByPaymentMethod: failuresByPaymentMethod.map(f => ({
          ...f,
          failureRate: parseFloat(f.failureRate.toFixed(2))
        })),
        failuresByGateway: failuresByGateway.map(f => ({
          ...f,
          failureRate: parseFloat(f.failureRate.toFixed(2))
        }))
      };
    } catch (error) {
      console.error('Error analyzing payment failures:', error);
      throw new Error('Failed to analyze payment failures');
    }
  }

  /**
   * Get revenue tracking and forecasting
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Revenue tracking
   */
  async getRevenueTracking(
    startDate: Date,
    endDate: Date
  ): Promise<RevenueTracking> {
    try {
      const transactions = await prisma.payment_transaction.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      const totalRevenue = transactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const refundedAmount = transactions
        .filter(t => t.status === 'refunded')
        .reduce((sum, t) => sum + (t.refundAmount ? Number(t.refundAmount) : 0), 0);

      const netRevenue = totalRevenue - refundedAmount;

      // Revenue by payment method
      const revenueByPaymentMethodMap = new Map<PaymentMethod, number>();

      for (const transaction of transactions) {
        if (transaction.status === 'completed') {
          const method = transaction.paymentMethod;
          const current = revenueByPaymentMethodMap.get(method) || 0;
          revenueByPaymentMethodMap.set(method, current + Number(transaction.amount));
        }
      }

      const revenueByPaymentMethod = Array.from(revenueByPaymentMethodMap.entries())
        .map(([paymentMethod, revenue]) => ({
          paymentMethod,
          revenue,
          percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0
        }))
        .sort((a, b) => b.revenue - a.revenue);

      // Revenue by gateway
      const revenueByGatewayMap = new Map<string, number>();

      for (const transaction of transactions) {
        if (transaction.status === 'completed') {
          const gateway = this.getGatewayForPaymentMethod(transaction.paymentMethod);
          const current = revenueByGatewayMap.get(gateway) || 0;
          revenueByGatewayMap.set(gateway, current + Number(transaction.amount));
        }
      }

      const revenueByGateway = Array.from(revenueByGatewayMap.entries())
        .map(([gateway, revenue]) => ({
          gateway,
          revenue,
          percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0
        }))
        .sort((a, b) => b.revenue - a.revenue);

      // Daily revenue
      const dailyRevenueMap = new Map<string, { revenue: number; transactions: number }>();

      for (const transaction of transactions) {
        if (transaction.status === 'completed') {
          const dateKey = transaction.createdAt.toISOString().split('T')[0];
          const current = dailyRevenueMap.get(dateKey) || { revenue: 0, transactions: 0 };
          current.revenue += Number(transaction.amount);
          current.transactions++;
          dailyRevenueMap.set(dateKey, current);
        }
      }

      const dailyRevenue = Array.from(dailyRevenueMap.entries())
        .map(([date, data]) => ({
          date,
          revenue: data.revenue,
          transactions: data.transactions
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Calculate forecast
      const forecast = this.calculateRevenueForecast(dailyRevenue);

      return {
        totalRevenue,
        netRevenue,
        refundedAmount,
        revenueByPaymentMethod: revenueByPaymentMethod.map(r => ({
          ...r,
          percentage: parseFloat(r.percentage.toFixed(2))
        })),
        revenueByGateway: revenueByGateway.map(r => ({
          ...r,
          percentage: parseFloat(r.percentage.toFixed(2))
        })),
        dailyRevenue,
        forecast
      };
    } catch (error) {
      console.error('Error tracking revenue:', error);
      throw new Error('Failed to track revenue');
    }
  }

  /**
   * Get payment performance metrics
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Performance metrics
   */
  async getPerformanceMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<PerformanceMetrics> {
    try {
      const transactions = await prisma.payment_transaction.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      // Calculate response times
      const responseTimes: number[] = [];

      for (const transaction of transactions) {
        if (transaction.updatedAt && transaction.createdAt) {
          const timeDiff = transaction.updatedAt.getTime() - transaction.createdAt.getTime();
          responseTimes.push(timeDiff);
        }
      }

      responseTimes.sort((a, b) => a - b);

      const averageResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
        : 0;

      const p50ResponseTime = responseTimes.length > 0
        ? responseTimes[Math.floor(responseTimes.length * 0.5)]
        : 0;

      const p95ResponseTime = responseTimes.length > 0
        ? responseTimes[Math.floor(responseTimes.length * 0.95)]
        : 0;

      const p99ResponseTime = responseTimes.length > 0
        ? responseTimes[Math.floor(responseTimes.length * 0.99)]
        : 0;

      // Gateway performance
      const gatewayPerformanceMap = new Map<string, { 
        responseTimes: number[]; 
        successCount: number; 
        totalCount: number;
      }>();

      for (const transaction of transactions) {
        const gateway = this.getGatewayForPaymentMethod(transaction.paymentMethod);
        const current = gatewayPerformanceMap.get(gateway) || {
          responseTimes: [],
          successCount: 0,
          totalCount: 0
        };

        current.totalCount++;
        if (transaction.status === 'completed') {
          current.successCount++;
        }

        if (transaction.updatedAt && transaction.createdAt) {
          const timeDiff = transaction.updatedAt.getTime() - transaction.createdAt.getTime();
          current.responseTimes.push(timeDiff);
        }

        gatewayPerformanceMap.set(gateway, current);
      }

      const gatewayPerformance = Array.from(gatewayPerformanceMap.entries())
        .map(([gateway, data]) => {
          const avgResponseTime = data.responseTimes.length > 0
            ? data.responseTimes.reduce((sum, t) => sum + t, 0) / data.responseTimes.length
            : 0;

          const successRate = data.totalCount > 0
            ? (data.successCount / data.totalCount) * 100
            : 0;

          return {
            gateway,
            averageResponseTime: Math.round(avgResponseTime / 1000), // Convert to seconds
            successRate: parseFloat(successRate.toFixed(2)),
            uptime: parseFloat(successRate.toFixed(2)) // Using success rate as uptime proxy
          };
        })
        .sort((a, b) => a.gateway.localeCompare(b.gateway));

      // Payment method performance
      const paymentMethodPerformanceMap = new Map<PaymentMethod, {
        responseTimes: number[];
        successCount: number;
        totalCount: number;
      }>();

      for (const transaction of transactions) {
        const method = transaction.paymentMethod;
        const current = paymentMethodPerformanceMap.get(method) || {
          responseTimes: [],
          successCount: 0,
          totalCount: 0
        };

        current.totalCount++;
        if (transaction.status === 'completed') {
          current.successCount++;
        }

        if (transaction.updatedAt && transaction.createdAt) {
          const timeDiff = transaction.updatedAt.getTime() - transaction.createdAt.getTime();
          current.responseTimes.push(timeDiff);
        }

        paymentMethodPerformanceMap.set(method, current);
      }

      const paymentMethodPerformance = Array.from(paymentMethodPerformanceMap.entries())
        .map(([paymentMethod, data]) => {
          const avgResponseTime = data.responseTimes.length > 0
            ? data.responseTimes.reduce((sum, t) => sum + t, 0) / data.responseTimes.length
            : 0;

          const successRate = data.totalCount > 0
            ? (data.successCount / data.totalCount) * 100
            : 0;

          return {
            paymentMethod,
            averageResponseTime: Math.round(avgResponseTime / 1000), // Convert to seconds
            successRate: parseFloat(successRate.toFixed(2)),
            popularity: parseFloat(((data.totalCount / transactions.length) * 100).toFixed(2))
          };
        })
        .sort((a, b) => b.popularity - a.popularity);

      return {
        averageResponseTime: Math.round(averageResponseTime / 1000),
        p50ResponseTime: Math.round(p50ResponseTime / 1000),
        p95ResponseTime: Math.round(p95ResponseTime / 1000),
        p99ResponseTime: Math.round(p99ResponseTime / 1000),
        gatewayPerformance,
        paymentMethodPerformance
      };
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      throw new Error('Failed to fetch performance metrics');
    }
  }

  /**
   * Calculate gateway breakdown from transactions
   * @param transactions - Array of transactions
   * @returns Gateway breakdown JSON
   */
  private calculateGatewayBreakdown(transactions: any[]): any {
    const breakdown = new Map<string, {
      revenue: number;
      transactions: number;
      successCount: number;
    }>();

    for (const transaction of transactions) {
      const gateway = this.getGatewayForPaymentMethod(transaction.paymentMethod);
      const current = breakdown.get(gateway) || {
        revenue: 0,
        transactions: 0,
        successCount: 0
      };

      current.transactions++;
      if (transaction.status === 'completed') {
        current.revenue += Number(transaction.amount);
        current.successCount++;
      }

      breakdown.set(gateway, current);
    }

    const result: any = {};
    for (const [gateway, data] of breakdown.entries()) {
      result[gateway] = {
        revenue: data.revenue,
        transactions: data.transactions,
        successRate: data.transactions > 0
          ? parseFloat(((data.successCount / data.transactions) * 100).toFixed(2))
          : 0
      };
    }

    return result;
  }

  /**
   * Calculate payment method breakdown from transactions
   * @param transactions - Array of transactions
   * @returns Payment method breakdown JSON
   */
  private calculateMethodBreakdown(transactions: any[]): any {
    const breakdown = new Map<PaymentMethod, {
      revenue: number;
      transactions: number;
      successCount: number;
    }>();

    for (const transaction of transactions) {
      const method = transaction.paymentMethod;
      const current = breakdown.get(method) || {
        revenue: 0,
        transactions: 0,
        successCount: 0
      };

      current.transactions++;
      if (transaction.status === 'completed') {
        current.revenue += Number(transaction.amount);
        current.successCount++;
      }

      breakdown.set(method, current);
    }

    const result: any = {};
    for (const [method, data] of breakdown.entries()) {
      result[method] = {
        revenue: data.revenue,
        transactions: data.transactions,
        successRate: data.transactions > 0
          ? parseFloat(((data.successCount / data.transactions) * 100).toFixed(2))
          : 0
      };
    }

    return result;
  }

  /**
   * Get payment method for gateway
   * @param gateway - Gateway name
   * @returns Payment method
   */
  private getPaymentMethodForGateway(gateway: string): PaymentMethod {
    const gatewayMap: Record<string, PaymentMethod> = {
      'sslcommerz': 'credit_card',
      'bkash': 'bkash',
      'nagad': 'nagad',
      'rocket': 'rocket',
      'cash_on_delivery': 'cash_on_delivery',
      'bank_transfer': 'bank_transfer',
      'emi': 'emi',
      'mcash': 'mcash'
    };

    return gatewayMap[gateway.toLowerCase()] || 'credit_card';
  }

  /**
   * Get gateway for payment method
   * @param paymentMethod - Payment method
   * @returns Gateway name
   */
  private getGatewayForPaymentMethod(paymentMethod: PaymentMethod): string {
    const methodMap: Record<PaymentMethod, string> = {
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
   * Calculate revenue forecast
   * @param dailyRevenue - Array of daily revenue data
   * @returns Revenue forecast
   */
  private calculateRevenueForecast(dailyRevenue: Array<{ date: string; revenue: number; transactions: number }>) {
    if (dailyRevenue.length < 2) {
      return {
        next7Days: 0,
        next30Days: 0,
        trend: 'stable' as const
      };
    }

    // Calculate average daily revenue
    const totalRevenue = dailyRevenue.reduce((sum, d) => sum + d.revenue, 0);
    const averageDailyRevenue = totalRevenue / dailyRevenue.length;

    // Calculate trend
    const recentRevenue = dailyRevenue.slice(-7).reduce((sum, d) => sum + d.revenue, 0);
    const olderRevenue = dailyRevenue.slice(0, -7).reduce((sum, d) => sum + d.revenue, 0);
    const olderAverage = olderRevenue / (dailyRevenue.length - 7);
    const recentAverage = recentRevenue / 7;

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    const threshold = averageDailyRevenue * 0.1; // 10% threshold

    if (recentAverage > olderAverage + threshold) {
      trend = 'increasing';
    } else if (recentAverage < olderAverage - threshold) {
      trend = 'decreasing';
    }

    // Apply trend factor to forecast
    let trendFactor = 1;
    if (trend === 'increasing') {
      trendFactor = 1.05; // 5% growth
    } else if (trend === 'decreasing') {
      trendFactor = 0.95; // 5% decline
    }

    return {
      next7Days: Math.round(averageDailyRevenue * 7 * trendFactor),
      next30Days: Math.round(averageDailyRevenue * 30 * trendFactor),
      trend
    };
  }
}

// Export singleton instance
export const paymentAnalyticsService = new PaymentAnalyticsService();
