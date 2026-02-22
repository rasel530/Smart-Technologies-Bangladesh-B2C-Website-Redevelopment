/**
 * Cart Scheduler Service
 * 
 * Manages scheduled cleanup jobs for cart maintenance using node-cron.
 * Provides automated cart cleanup at configured intervals.
 * 
 * Scheduled Jobs:
 * - Daily cart cleanup (expired carts) - 2 AM
 * - Reservation cleanup - every 5 minutes
 * - Recovery reminders - every 6 hours
 * - Weekly abandoned cart cleanup - Sunday 3 AM
 */

const cron = require('node-cron');
const { loggerService } = require('./logger');
const { cartCleanupService } = require('./cartCleanupService');
const { inventoryReservationService } = require('./inventoryReservationService');
const { cartReminderService } = require('./cartReminderService');
const { cartRecoveryService } = require('./cartRecoveryService');

class CartSchedulerService {
  constructor() {
    this.logger = loggerService;
    this.jobs = new Map();
    this.schedulerStatus = {
      isRunning: false,
      nextRuns: {},
      startedAt: null
    };
  }

  /**
   * Initialize all scheduled cleanup jobs
   */
  initializeScheduler() {
    this.logger.info('Initializing cart cleanup scheduler');

    // Job 1: Daily expired cart cleanup - runs at 2 AM every day
    this.jobs.set('dailyCleanup', {
      cronExpression: '0 2 * * *',
      task: async () => {
        const startTime = Date.now();
        try {
          this.logger.info('Running scheduled daily cart cleanup');
          const result = await cartCleanupService.cleanupExpiredCarts();
          this.logger.info('Daily cart cleanup completed', {
            cleaned: result.cleaned,
            errors: result.errors?.length || 0,
            duration: Date.now() - startTime
          });
        } catch (error) {
          this.logger.error('Daily cart cleanup failed', {
            error: error.message,
            stack: error.stack
          });
        }
      },
      description: 'Daily cleanup of expired carts (2 AM)'
    });

    // Job 2: Expired reservation cleanup - runs every 5 minutes
    this.jobs.set('reservationCleanup', {
      cronExpression: '*/5 * * * *',
      task: async () => {
        const startTime = Date.now();
        try {
          this.logger.info('Running scheduled reservation cleanup');
          const result = await cartCleanupService.cleanupExpiredReservations();
          this.logger.info('Reservation cleanup completed', {
            released: result.released,
            duration: Date.now() - startTime
          });
        } catch (error) {
          this.logger.error('Reservation cleanup failed', {
            error: error.message,
            stack: error.stack
          });
        }
      },
      description: 'Cleanup of expired reservations (every 5 min)'
    });

    // Job 3: Recovery reminder emails - runs every hour
    this.jobs.set('recoveryReminders', {
      cronExpression: '0 * * * *',
      task: async () => {
        const startTime = Date.now();
        try {
          this.logger.info('Running scheduled recovery reminder emails');
          const result = await cartReminderService.processDueReminders();
          this.logger.info('Recovery reminders completed', {
            processed: result.processed,
            sent: result.sent,
            errors: result.errors?.length || 0,
            duration: Date.now() - startTime
          });
        } catch (error) {
          this.logger.error('Recovery reminders failed', {
            error: error.message,
            stack: error.stack
          });
        }
      },
      description: 'Send cart recovery reminders (every hour)'
    });

    // Job 3b: Process abandoned carts - runs every 2 hours
    this.jobs.set('processAbandonedCarts', {
      cronExpression: '0 */2 * * *',
      task: async () => {
        const startTime = Date.now();
        try {
          this.logger.info('Running scheduled abandoned cart processing');
          const result = await cartRecoveryService.processAbandonedCarts({
            minInactiveMinutes: 60,
            excludeRecentEmails: true
          });
          this.logger.info('Abandoned cart processing completed', {
            processed: result.processed,
            emailsSent: result.emailsSent,
            failed: result.failed,
            duration: Date.now() - startTime
          });
        } catch (error) {
          this.logger.error('Abandoned cart processing failed', {
            error: error.message,
            stack: error.stack
          });
        }
      },
      description: 'Process abandoned carts (every 2 hours)'
    });

    // Job 4: Weekly abandoned cart cleanup - runs Sunday at 3 AM
    this.jobs.set('weeklyAbandonedCleanup', {
      cronExpression: '0 3 * * 0',
      task: async () => {
        const startTime = Date.now();
        try {
          this.logger.info('Running scheduled weekly abandoned cart cleanup');
          const result = await cartCleanupService.cleanupAbandonedCarts({
            thresholdDays: 7,
            sendReminders: false
          });
          this.logger.info('Weekly abandoned cart cleanup completed', {
            cleaned: result.cleaned,
            errors: result.errors?.length || 0,
            duration: Date.now() - startTime
          });
        } catch (error) {
          this.logger.error('Weekly abandoned cart cleanup failed', {
            error: error.message,
            stack: error.stack
          });
        }
      },
      description: 'Weekly cleanup of abandoned carts (Sunday 3 AM)'
    });

    // Job 5: Full cleanup - runs daily at 4 AM (more comprehensive)
    this.jobs.set('fullCleanup', {
      cronExpression: '0 4 * * *',
      task: async () => {
        const startTime = Date.now();
        try {
          this.logger.info('Running scheduled full cart cleanup');
          const result = await cartCleanupService.runFullCleanup({
            includeReservations: true,
            includeAbandoned: true,
            sendReminders: true
          });
          this.logger.info('Full cart cleanup completed', {
            cartsExpired: result.cartsExpired,
            reservationsReleased: result.reservationsReleased,
            abandonedCleaned: result.abandonedCleaned,
            remindersSent: result.remindersSent,
            errors: result.errors?.length || 0,
            duration: Date.now() - startTime
          });
        } catch (error) {
          this.logger.error('Full cart cleanup failed', {
            error: error.message,
            stack: error.stack
          });
        }
      },
      description: 'Full cart cleanup - all operations (4 AM)'
    });

    this.logger.info('Cart cleanup scheduler initialized', {
      jobCount: this.jobs.size,
      jobs: Array.from(this.jobs.keys())
    });
  }

  /**
   * Start all scheduled jobs
   * @returns {Object} Start result with next run times
   */
  startScheduler() {
    if (this.schedulerStatus.isRunning) {
      this.logger.warn('Scheduler is already running');
      return {
        success: false,
        message: 'Scheduler is already running',
        status: this.schedulerStatus
      };
    }

    try {
      this.initializeScheduler();

      // Start all cron jobs
      const nextRuns = {};
      for (const [jobName, jobConfig] of this.jobs) {
        const cronJob = cron.schedule(jobConfig.cronExpression, jobConfig.task, {
          scheduled: true,
          timezone: process.env.TIMEZONE || 'Asia/Dhaka'
        });

        this.jobs.set(jobName, {
          ...jobConfig,
          cronJob,
          nextRun: this.getNextRunTime(jobConfig.cronExpression)
        });

        nextRuns[jobName] = {
          cronExpression: jobConfig.cronExpression,
          description: jobConfig.description,
          nextRun: this.getNextRunTime(jobConfig.cronExpression)
        };

        this.logger.info(`Scheduled job started: ${jobName}`, {
          expression: jobConfig.cronExpression,
          description: jobConfig.description
        });
      }

      this.schedulerStatus = {
        isRunning: true,
        nextRuns,
        startedAt: new Date()
      };

      this.logger.info('Cart cleanup scheduler started successfully');

      return {
        success: true,
        message: 'Scheduler started successfully',
        status: this.schedulerStatus
      };
    } catch (error) {
      this.logger.error('Failed to start scheduler', {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        message: `Failed to start scheduler: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Stop all scheduled jobs
   * @returns {Object} Stop result
   */
  stopScheduler() {
    if (!this.schedulerStatus.isRunning) {
      this.logger.warn('Scheduler is not running');
      return {
        success: false,
        message: 'Scheduler is not running'
      };
    }

    try {
      // Stop all cron jobs
      for (const [jobName, jobConfig] of this.jobs) {
        if (jobConfig.cronJob) {
          jobConfig.cronJob.stop();
          this.logger.info(`Scheduled job stopped: ${jobName}`);
        }
      }

      this.schedulerStatus = {
        isRunning: false,
        nextRuns: {},
        stoppedAt: new Date(),
        startedAt: this.schedulerStatus.startedAt
      };

      this.logger.info('Cart cleanup scheduler stopped successfully');

      return {
        success: true,
        message: 'Scheduler stopped successfully',
        status: this.schedulerStatus
      };
    } catch (error) {
      this.logger.error('Failed to stop scheduler', {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        message: `Failed to stop scheduler: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Start a specific job manually
   * @param {string} jobName - Name of the job to run
   * @returns {Object} Run result
   */
  async runJobNow(jobName) {
    const jobConfig = this.jobs.get(jobName);
    
    if (!jobConfig) {
      return {
        success: false,
        message: `Job not found: ${jobName}`,
        availableJobs: Array.from(this.jobs.keys())
      };
    }

    try {
      this.logger.info(`Manually running job: ${jobName}`);
      const startTime = Date.now();
      
      await jobConfig.task();
      
      const duration = Date.now() - startTime;
      this.logger.info(`Job completed: ${jobName}`, { duration });

      return {
        success: true,
        message: `Job ${jobName} completed successfully`,
        duration,
        jobName,
        cronExpression: jobConfig.cronExpression
      };
    } catch (error) {
      this.logger.error(`Job failed: ${jobName}`, {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        message: `Job ${jobName} failed: ${error.message}`,
        error: error.message,
        jobName
      };
    }
  }

  /**
   * Get scheduler status
   * @returns {Object} Current scheduler status
   */
  getStatus() {
    const nextRuns = {};
    for (const [jobName, jobConfig] of this.jobs) {
      nextRuns[jobName] = {
        cronExpression: jobConfig.cronExpression,
        description: jobConfig.description,
        nextRun: jobConfig.nextRun || this.getNextRunTime(jobConfig.cronExpression)
      };
    }

    return {
      isRunning: this.schedulerStatus.isRunning,
      startedAt: this.schedulerStatus.startedAt,
      nextRuns
    };
  }

  /**
   * Calculate next run time for a cron expression
   * @param {string} cronExpression - Cron expression
   * @returns {Date} Next run date
   */
  getNextRunTime(cronExpression) {
    try {
      // Parse the cron expression to estimate next run
      // This is a simplified implementation
      const parts = cronExpression.split(' ');
      
      // Very basic parsing - in production, use a proper cron parser library
      const now = new Date();
      
      // For common patterns
      if (parts[0] === '0' && parts[1] === '*' && parts[2] === '*' && parts[3] === '*') {
        // Every hour at minute 0
        now.setHours(now.getHours() + 1);
        now.setMinutes(0);
        now.setSeconds(0);
        now.setMilliseconds(0);
      } else if (parts[0] === '0' && parts[1] !== '*' && parts[2] === '*' && parts[3] === '*' && parts[4] === '*') {
        // Daily at specific hour
        const hour = parseInt(parts[1]);
        now.setHours(hour);
        now.setMinutes(0);
        now.setSeconds(0);
        now.setMilliseconds(0);
        if (now <= new Date()) {
          now.setDate(now.getDate() + 1);
        }
      } else if (parts[0] === '0' && parts[1] !== '*' && parts[2] === '*' && parts[3] === '*' && parts[4] === '0') {
        // Weekly on specific day at specific hour
        const hour = parseInt(parts[1]);
        now.setHours(hour);
        now.setMinutes(0);
        now.setSeconds(0);
        now.setMilliseconds(0);
        // Calculate days until next Sunday
        const currentDay = now.getDay();
        const targetDay = 0; // Sunday
        const daysUntil = (targetDay + 7 - currentDay) % 7 || 7;
        now.setDate(now.getDate() + daysUntil);
      } else if (parts[1] === '*' && parts[0].startsWith('*/')) {
        // Every N minutes
        const interval = parseInt(parts[0].substring(2));
        now.setMinutes(now.getMinutes() + interval);
        now.setSeconds(0);
        now.setMilliseconds(0);
      } else {
        // Default: return a generic next time (1 hour from now)
        now.setHours(now.getHours() + 1);
      }

      return now;
    } catch (error) {
      this.logger.warn('Error calculating next run time', {
        cronExpression,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Add a custom scheduled job
   * @param {string} jobName - Unique name for the job
   * @param {string} cronExpression - Cron expression
   * @param {Function} task - Async function to run
   * @param {string} description - Job description
   * @returns {Object} Result
   */
  addJob(jobName, cronExpression, task, description = '') {
    if (this.jobs.has(jobName)) {
      return {
        success: false,
        message: `Job already exists: ${jobName}`
      };
    }

    if (!cron.validate(cronExpression)) {
      return {
        success: false,
        message: `Invalid cron expression: ${cronExpression}`
      };
    }

    const cronJob = cron.schedule(cronExpression, task, {
      scheduled: true,
      timezone: process.env.TIMEZONE || 'Asia/Dhaka'
    });

    this.jobs.set(jobName, {
      cronExpression,
      task,
      description,
      cronJob,
      nextRun: this.getNextRunTime(cronExpression)
    });

    this.logger.info(`Custom job added: ${jobName}`, {
      cronExpression,
      description
    });

    return {
      success: true,
      message: `Job ${jobName} added successfully`,
      job: {
        name: jobName,
        cronExpression,
        description,
        nextRun: this.getNextRunTime(cronExpression)
      }
    };
  }

  /**
   * Remove a scheduled job
   * @param {string} jobName - Name of the job to remove
   * @returns {Object} Result
   */
  removeJob(jobName) {
    const jobConfig = this.jobs.get(jobName);
    
    if (!jobConfig) {
      return {
        success: false,
        message: `Job not found: ${jobName}`
      };
    }

    // Stop the cron job
    if (jobConfig.cronJob) {
      jobConfig.cronJob.stop();
    }

    this.jobs.delete(jobName);

    this.logger.info(`Job removed: ${jobName}`);

    return {
      success: true,
      message: `Job ${jobName} removed successfully`
    };
  }

  /**
   * Get list of all scheduled jobs
   * @returns {Object} List of jobs with their configurations
   */
  getJobs() {
    const jobs = [];
    for (const [name, config] of this.jobs) {
      jobs.push({
        name,
        cronExpression: config.cronExpression,
        description: config.description,
        nextRun: config.nextRun || this.getNextRunTime(config.cronExpression),
        isRunning: this.schedulerStatus.isRunning
      });
    }
    return jobs;
  }

  /**
   * Get cleanup service statistics
   * @returns {Object} Cleanup stats
   */
  getCleanupStats() {
    return cartCleanupService.getCleanupStats();
  }
}

// Singleton instance
const cartSchedulerService = new CartSchedulerService();

module.exports = {
  CartSchedulerService,
  cartSchedulerService
};
