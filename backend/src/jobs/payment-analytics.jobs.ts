import cron from 'node-cron';
import { paymentAnalyticsService } from '../services/payment/payment-analytics.service';
import { paymentMetricsService } from '../services/payment/payment-metrics.service';
import { logger } from '../utils/logger';

/**
 * Payment Analytics Scheduled Jobs
 * 
 * This module contains scheduled jobs for aggregating payment analytics data.
 * Jobs are scheduled using node-cron and run at specified intervals.
 * 
 * Cron Schedule Format:
 * - * * * * *
 * - | | | | |
 * - | | | | +---- Day of week (0-7) (Sunday=0 or 7)
 * - | | | +------ Month (1-12)
 * - | | +-------- Day of month (1-31)
 * - | +---------- Hour (0-23)
 * - +------------ Minute (0-59)
 */

/**
 * Daily Analytics Aggregation Job
 * 
 * Runs daily at 1:00 AM to aggregate the previous day's payment analytics.
 * - Aggregates daily payment analytics from payment_transaction table
 * - Stores results in payment_analytics table
 * - Records KPIs in payment_metrics table
 * - Includes error handling and retry logic
 * 
 * Cron Schedule: 0 1 * * * (1:00 AM daily)
 */
const dailyAnalyticsJob = cron.schedule('0 1 * * *', async () => {
  const jobName = 'Daily Analytics Aggregation';
  const startTime = Date.now();
  
  // Calculate previous day's date (defined outside try block for retry access)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  
  try {
    logger.info(`[${jobName}] Starting daily analytics aggregation...`);
    
    logger.info(`[${jobName}] Aggregating analytics for date: ${yesterday.toISOString()}`);
    
    // Aggregate daily analytics
    const analytics = await paymentAnalyticsService.aggregateDailyAnalytics(yesterday);
    
    logger.info(`[${jobName}] Daily analytics aggregated successfully:`, {
      date: analytics.date,
      totalRevenue: analytics.total_revenue,
      totalTransactions: analytics.total_transactions,
      successRate: analytics.success_rate
    });
    
    // Record KPIs for previous day
    await recordDailyKPIs(yesterday, analytics);
    
    const duration = Date.now() - startTime;
    logger.info(`[${jobName}] Completed successfully in ${duration}ms`);
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error(`[${jobName}] Failed after ${duration}ms:`, error);
    
    // Retry logic: attempt up to 3 times with exponential backoff
    await retryDailyAnalyticsJob(yesterday, 1);
  }
}, {
  scheduled: false, // Don't start automatically, will be started manually
  timezone: process.env.TZ || 'Asia/Dhaka'
});

/**
 * Monthly Analytics Aggregation Job
 * 
 * Runs on the 1st day of each month at 2:00 AM to aggregate the previous month's payment analytics.
 * - Aggregates monthly payment analytics from payment_transaction table
 * - Stores results in payment_analytics table
 * - Records KPIs in payment_metrics table
 * - Includes error handling and retry logic
 * 
 * Cron Schedule: 0 2 1 * * (2:00 AM on the 1st of each month)
 */
const monthlyAnalyticsJob = cron.schedule('0 2 1 * *', async () => {
  const jobName = 'Monthly Analytics Aggregation';
  const startTime = Date.now();
  
  try {
    logger.info(`[${jobName}] Starting monthly analytics aggregation...`);
    
    // Calculate previous month's year and month
    const now = new Date();
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const year = previousMonth.getFullYear();
    const month = previousMonth.getMonth() + 1; // JavaScript months are 0-indexed
    
    logger.info(`[${jobName}] Aggregating analytics for: ${year}-${month.toString().padStart(2, '0')}`);
    
    // Aggregate monthly analytics
    const analytics = await paymentAnalyticsService.aggregateMonthlyAnalytics(year, month);
    
    logger.info(`[${jobName}] Monthly analytics aggregated successfully:`, {
      period: analytics.period,
      totalRevenue: analytics.total_revenue,
      totalTransactions: analytics.total_transactions,
      successRate: analytics.success_rate
    });
    
    // Record KPIs for the previous month
    await recordMonthlyKPIs(year, month, analytics);
    
    const duration = Date.now() - startTime;
    logger.info(`[${jobName}] Completed successfully in ${duration}ms`);
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error(`[${jobName}] Failed after ${duration}ms:`, error);
    
    // Retry logic: attempt up to 3 times with exponential backoff
    const now = new Date();
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    await retryMonthlyAnalyticsJob(previousMonth.getFullYear(), previousMonth.getMonth() + 1, 1);
  }
}, {
  scheduled: false, // Don't start automatically, will be started manually
  timezone: process.env.TZ || 'Asia/Dhaka'
});

/**
 * Record Daily KPIs
 * 
 * Records key performance indicators for daily analytics
 * 
 * @param date - The date to record KPIs for
 * @param analytics - The aggregated analytics data
 */
async function recordDailyKPIs(date: Date, analytics: any): Promise<void> {
  try {
    logger.info('[Daily KPIs] Recording daily KPIs...');
    
    // Record revenue metric
    await paymentMetricsService.recordMetric(
      'revenue',
      analytics.total_revenue,
      'revenue',
      'daily'
    );
    
    // Record transaction count metric
    await paymentMetricsService.recordMetric(
      'transaction_count',
      analytics.total_transactions,
      'count',
      'daily'
    );
    
    // Record success rate metric
    await paymentMetricsService.recordMetric(
      'success_rate',
      analytics.success_rate,
      'percentage',
      'daily'
    );
    
    // Record average transaction value metric
    await paymentMetricsService.recordMetric(
      'average_transaction_value',
      analytics.average_transaction_value,
      'currency',
      'daily'
    );
    
    // Record gateway-specific metrics
    if (analytics.gateway_breakdown) {
      for (const [gateway, data] of Object.entries(analytics.gateway_breakdown)) {
        const gatewayData = data as any;
        await paymentMetricsService.recordMetric(
          'gateway_success_rate',
          gatewayData.success_rate,
          'percentage',
          'daily',
          gateway
        );
        
        await paymentMetricsService.recordMetric(
          'gateway_revenue',
          gatewayData.total_amount,
          'revenue',
          'daily',
          gateway
        );
      }
    }
    
    // Record payment method-specific metrics
    if (analytics.method_breakdown) {
      for (const [method, data] of Object.entries(analytics.method_breakdown)) {
        const methodData = data as any;
        await paymentMetricsService.recordMetric(
          'method_transaction_count',
          methodData.count,
          'count',
          'daily',
          undefined,
          method as any
        );
        
        await paymentMetricsService.recordMetric(
          'method_revenue',
          methodData.total_amount,
          'revenue',
          'daily',
          undefined,
          method as any
        );
      }
    }
    
    logger.info('[Daily KPIs] Daily KPIs recorded successfully');
    
  } catch (error: any) {
    logger.error('[Daily KPIs] Failed to record daily KPIs:', error);
    throw error;
  }
}

/**
 * Record Monthly KPIs
 * 
 * Records key performance indicators for monthly analytics
 * 
 * @param year - The year to record KPIs for
 * @param month - The month to record KPIs for
 * @param analytics - The aggregated analytics data
 */
async function recordMonthlyKPIs(year: number, month: number, analytics: any): Promise<void> {
  try {
    logger.info('[Monthly KPIs] Recording monthly KPIs...');
    
    // Record revenue metric
    await paymentMetricsService.recordMetric(
      'revenue',
      analytics.total_revenue,
      'revenue',
      'monthly'
    );
    
    // Record transaction count metric
    await paymentMetricsService.recordMetric(
      'transaction_count',
      analytics.total_transactions,
      'count',
      'monthly'
    );
    
    // Record success rate metric
    await paymentMetricsService.recordMetric(
      'success_rate',
      analytics.success_rate,
      'percentage',
      'monthly'
    );
    
    // Record average transaction value metric
    await paymentMetricsService.recordMetric(
      'average_transaction_value',
      analytics.average_transaction_value,
      'currency',
      'monthly'
    );
    
    // Record gateway-specific metrics
    if (analytics.gateway_breakdown) {
      for (const [gateway, data] of Object.entries(analytics.gateway_breakdown)) {
        const gatewayData = data as any;
        await paymentMetricsService.recordMetric(
          'gateway_success_rate',
          gatewayData.success_rate,
          'percentage',
          'monthly',
          gateway
        );
        
        await paymentMetricsService.recordMetric(
          'gateway_revenue',
          gatewayData.total_amount,
          'revenue',
          'monthly',
          gateway
        );
      }
    }
    
    // Record payment method-specific metrics
    if (analytics.method_breakdown) {
      for (const [method, data] of Object.entries(analytics.method_breakdown)) {
        const methodData = data as any;
        await paymentMetricsService.recordMetric(
          'method_transaction_count',
          methodData.count,
          'count',
          'monthly',
          undefined,
          method as any
        );
        
        await paymentMetricsService.recordMetric(
          'method_revenue',
          methodData.total_amount,
          'revenue',
          'monthly',
          undefined,
          method as any
        );
      }
    }
    
    logger.info('[Monthly KPIs] Monthly KPIs recorded successfully');
    
  } catch (error: any) {
    logger.error('[Monthly KPIs] Failed to record monthly KPIs:', error);
    throw error;
  }
}

/**
 * Retry Daily Analytics Job
 * 
 * Implements retry logic with exponential backoff for daily analytics job
 * 
 * @param date - The date to aggregate analytics for
 * @param attempt - The current attempt number
 */
async function retryDailyAnalyticsJob(date: Date, attempt: number): Promise<void> {
  const maxRetries = 3;
  
  if (attempt > maxRetries) {
    logger.error('[Daily Analytics Retry] Max retries reached. Giving up.');
    return;
  }
  
  const backoffDelay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
  
  logger.info(`[Daily Analytics Retry] Attempt ${attempt}/${maxRetries}. Retrying in ${backoffDelay}ms...`);
  
  await new Promise(resolve => setTimeout(resolve, backoffDelay));
  
  try {
    logger.info(`[Daily Analytics Retry] Retrying daily analytics aggregation (attempt ${attempt})...`);
    
    const analytics = await paymentAnalyticsService.aggregateDailyAnalytics(date);
    
    logger.info(`[Daily Analytics Retry] Retry successful on attempt ${attempt}`);
    
    // Record KPIs on successful retry
    await recordDailyKPIs(date, analytics);
    
  } catch (error: any) {
    logger.error(`[Daily Analytics Retry] Retry ${attempt} failed:`, error);
    await retryDailyAnalyticsJob(date, attempt + 1);
  }
}

/**
 * Retry Monthly Analytics Job
 * 
 * Implements retry logic with exponential backoff for monthly analytics job
 * 
 * @param year - The year to aggregate analytics for
 * @param month - The month to aggregate analytics for
 * @param attempt - The current attempt number
 */
async function retryMonthlyAnalyticsJob(year: number, month: number, attempt: number): Promise<void> {
  const maxRetries = 3;
  
  if (attempt > maxRetries) {
    logger.error('[Monthly Analytics Retry] Max retries reached. Giving up.');
    return;
  }
  
  const backoffDelay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
  
  logger.info(`[Monthly Analytics Retry] Attempt ${attempt}/${maxRetries}. Retrying in ${backoffDelay}ms...`);
  
  await new Promise(resolve => setTimeout(resolve, backoffDelay));
  
  try {
    logger.info(`[Monthly Analytics Retry] Retrying monthly analytics aggregation (attempt ${attempt})...`);
    
    const analytics = await paymentAnalyticsService.aggregateMonthlyAnalytics(year, month);
    
    logger.info(`[Monthly Analytics Retry] Retry successful on attempt ${attempt}`);
    
    // Record KPIs on successful retry
    await recordMonthlyKPIs(year, month, analytics);
    
  } catch (error: any) {
    logger.error(`[Monthly Analytics Retry] Retry ${attempt} failed:`, error);
    await retryMonthlyAnalyticsJob(year, month, attempt + 1);
  }
}

/**
 * Start All Payment Analytics Jobs
 * 
 * Starts all scheduled payment analytics jobs
 * Should be called when the application starts
 */
export function startPaymentAnalyticsJobs(): void {
  try {
    logger.info('[Payment Analytics Jobs] Starting payment analytics jobs...');
    
    // Start daily analytics job
    if (!dailyAnalyticsJob.getStatus()) {
      dailyAnalyticsJob.start();
      logger.info('[Payment Analytics Jobs] Daily analytics job started');
    }
    
    // Start monthly analytics job
    if (!monthlyAnalyticsJob.getStatus()) {
      monthlyAnalyticsJob.start();
      logger.info('[Payment Analytics Jobs] Monthly analytics job started');
    }
    
    logger.info('[Payment Analytics Jobs] All payment analytics jobs started successfully');
    
  } catch (error: any) {
    logger.error('[Payment Analytics Jobs] Failed to start payment analytics jobs:', error);
  }
}

/**
 * Stop All Payment Analytics Jobs
 * 
 * Stops all scheduled payment analytics jobs
 * Should be called when the application shuts down
 */
export function stopPaymentAnalyticsJobs(): void {
  try {
    logger.info('[Payment Analytics Jobs] Stopping payment analytics jobs...');
    
    // Stop daily analytics job
    if (dailyAnalyticsJob.getStatus()) {
      dailyAnalyticsJob.stop();
      logger.info('[Payment Analytics Jobs] Daily analytics job stopped');
    }
    
    // Stop monthly analytics job
    if (monthlyAnalyticsJob.getStatus()) {
      monthlyAnalyticsJob.stop();
      logger.info('[Payment Analytics Jobs] Monthly analytics job stopped');
    }
    
    logger.info('[Payment Analytics Jobs] All payment analytics jobs stopped successfully');
    
  } catch (error: any) {
    logger.error('[Payment Analytics Jobs] Failed to stop payment analytics jobs:', error);
  }
}

/**
 * Manually Trigger Daily Analytics Aggregation
 * 
 * Manually triggers the daily analytics aggregation job
 * Useful for testing or backfilling data
 * 
 * @param date - The date to aggregate analytics for (defaults to yesterday)
 */
export async function triggerDailyAnalytics(date?: Date): Promise<void> {
  const jobName = 'Manual Daily Analytics Aggregation';
  const targetDate = date || (() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    return yesterday;
  })();
  
  try {
    logger.info(`[${jobName}] Starting manual daily analytics aggregation for: ${targetDate.toISOString()}`);
    
    const analytics = await paymentAnalyticsService.aggregateDailyAnalytics(targetDate);
    
    await recordDailyKPIs(targetDate, analytics);
    
    logger.info(`[${jobName}] Manual daily analytics aggregation completed successfully`);
    
  } catch (error: any) {
    logger.error(`[${jobName}] Failed:`, error);
    throw error;
  }
}

/**
 * Manually Trigger Monthly Analytics Aggregation
 * 
 * Manually triggers the monthly analytics aggregation job
 * Useful for testing or backfilling data
 * 
 * @param year - The year to aggregate analytics for
 * @param month - The month to aggregate analytics for
 */
export async function triggerMonthlyAnalytics(year: number, month: number): Promise<void> {
  const jobName = 'Manual Monthly Analytics Aggregation';
  
  try {
    logger.info(`[${jobName}] Starting manual monthly analytics aggregation for: ${year}-${month.toString().padStart(2, '0')}`);
    
    const analytics = await paymentAnalyticsService.aggregateMonthlyAnalytics(year, month);
    
    await recordMonthlyKPIs(year, month, analytics);
    
    logger.info(`[${jobName}] Manual monthly analytics aggregation completed successfully`);
    
  } catch (error: any) {
    logger.error(`[${jobName}] Failed:`, error);
    throw error;
  }
}

// Export job instances for external use
export { dailyAnalyticsJob, monthlyAnalyticsJob };
