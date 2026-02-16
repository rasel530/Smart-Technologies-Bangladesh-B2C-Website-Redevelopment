/**
 * Admin Cart Cleanup Controller
 * 
 * Provides admin API endpoints for cart cleanup operations including:
 * - Manual cleanup of expired carts
 * - Reservation cleanup
 * - Abandoned cart management
 * - Recovery reminder sending
 * - Scheduler management
 * - Cleanup statistics and history
 */

const { body, query, validationResult } = require('express-validator');
const { cartCleanupService } = require('../services/cartCleanupService');
const { cartSchedulerService } = require('../services/cartSchedulerService');
const { loggerService } = require('../services/logger');

class AdminCleanupController {
  constructor() {
    this.logger = loggerService;
  }

  /**
   * Handle validation errors
   */
  handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Validation failed',
        messageBn: 'যাচাইকরণ ব্যর্থ হয়েছে',
        details: errors.array()
      });
    }
    next();
  }

  /**
   * POST /api/v1/admin/carts/cleanup/expired
   * Clean up expired carts
   * 
   * Body:
   * - dryRun: boolean (optional) - If true, only count without making changes
   * - batchSize: number (optional) - Number of carts to process per batch
   * 
   * Returns:
   * - cleaned: number - Number of carts cleaned
   * - errors: array - Any errors encountered
   */
  async cleanupExpiredCarts(req, res) {
    try {
      const { dryRun, batchSize } = req.body;

      this.logger.info('Manual expired cart cleanup requested', {
        adminId: req.user?.id,
        dryRun,
        batchSize
      });

      const result = await cartCleanupService.cleanupExpiredCarts({
        dryRun: dryRun || false,
        batchSize: batchSize || 1000
      });

      res.json({
        success: result.success,
        cleaned: result.cleaned,
        errors: result.errors || [],
        message: result.message,
        duration: result.duration
      });
    } catch (error) {
      this.logger.error('Error in cleanupExpiredCarts', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Cleanup failed',
        message: 'Failed to clean up expired carts',
        messageBn: 'মেয়াদ উত্তীর্ণ কার্ট পরিষ্কার করতে ব্যর্থ'
      });
    }
  }

  /**
   * POST /api/v1/admin/carts/cleanup/reservations
   * Clean up expired reservations
   * 
   * Returns:
   * - released: number - Number of reservations released
   * - errors: array - Any errors encountered
   */
  async cleanupExpiredReservations(req, res) {
    try {
      this.logger.info('Manual reservation cleanup requested', {
        adminId: req.user?.id
      });

      const result = await cartCleanupService.cleanupExpiredReservations();

      res.json({
        success: result.success,
        released: result.released,
        errors: result.errors || [],
        message: result.message,
        duration: result.duration
      });
    } catch (error) {
      this.logger.error('Error in cleanupExpiredReservations', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Reservation cleanup failed',
        message: 'Failed to clean up expired reservations',
        messageBn: 'মেয়াদ উত্তীর্ণ রিজার্ভেশন পরিষ্কার করতে ব্যর্থ'
      });
    }
  }

  /**
   * POST /api/v1/admin/carts/cleanup/abandoned
   * Clean up abandoned carts
   * 
   * Body:
   * - thresholdDays: number (optional) - Days of inactivity before considered abandoned
   * - sendReminders: boolean (optional) - Whether to send recovery reminder emails first
   * - dryRun: boolean (optional) - If true, only count without making changes
   * 
   * Returns:
   * - cleaned: number - Number of carts marked abandoned
   * - remindersSent: number - Number of reminders sent
   * - errors: array - Any errors encountered
   */
  async cleanupAbandonedCarts(req, res) {
    try {
      const { thresholdDays, sendReminders, dryRun } = req.body;

      this.logger.info('Manual abandoned cart cleanup requested', {
        adminId: req.user?.id,
        thresholdDays,
        sendReminders,
        dryRun
      });

      const result = await cartCleanupService.cleanupAbandonedCarts({
        thresholdDays: thresholdDays || 7,
        sendReminders: sendReminders || false,
        dryRun: dryRun || false
      });

      res.json({
        success: result.success,
        cleaned: result.cleaned,
        remindersSent: result.remindersSent,
        errors: result.errors || [],
        message: result.message,
        duration: result.duration
      });
    } catch (error) {
      this.logger.error('Error in cleanupAbandonedCarts', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Abandoned cart cleanup failed',
        message: 'Failed to clean up abandoned carts',
        messageBn: 'পরিত্যক্ত কার্ট পরিষ্কার করতে ব্যর্থ'
      });
    }
  }

  /**
   * POST /api/v1/admin/carts/cleanup/full
   * Run full cleanup (all operations)
   * 
   * Body:
   * - includeReservations: boolean (optional) - Include reservation cleanup
   * - includeAbandoned: boolean (optional) - Include abandoned cart cleanup
   * - sendReminders: boolean (optional) - Send recovery reminders
   * 
   * Returns:
   * - cartsExpired: number
   * - reservationsReleased: number
   * - abandonedCleaned: number
   * - remindersSent: number
   * - errors: array
   */
  async runFullCleanup(req, res) {
    try {
      const { includeReservations, includeAbandoned, sendReminders } = req.body;

      this.logger.info('Full cleanup requested', {
        adminId: req.user?.id,
        includeReservations,
        includeAbandoned,
        sendReminders
      });

      const result = await cartCleanupService.runFullCleanup({
        includeReservations: includeReservations !== false,
        includeAbandoned: includeAbandoned !== false,
        sendReminders: sendReminders || false
      });

      res.json({
        success: result.success,
        cartsExpired: result.cartsExpired,
        reservationsReleased: result.reservationsReleased,
        abandonedCleaned: result.abandonedCleaned,
        remindersSent: result.remindersSent,
        errors: result.errors || [],
        duration: result.duration
      });
    } catch (error) {
      this.logger.error('Error in runFullCleanup', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Full cleanup failed',
        message: 'Failed to run full cleanup',
        messageBn: 'সম্পূর্ণ পরিষ্কার চালাতে ব্যর্থ'
      });
    }
  }

  /**
   * POST /api/v1/admin/carts/cleanup/reminders
   * Send recovery reminder emails
   * 
   * Body:
   * - thresholdDays: number (optional) - Days before abandonment to send reminder
   * - batchSize: number (optional) - Number of emails to send
   * 
   * Returns:
   * - sent: number - Number of emails sent
   * - errors: array - Any errors encountered
   */
  async sendRecoveryReminders(req, res) {
    try {
      const { thresholdDays, batchSize } = req.body;

      this.logger.info('Recovery reminders requested', {
        adminId: req.user?.id,
        thresholdDays,
        batchSize
      });

      const result = await cartCleanupService.sendRecoveryReminders({
        thresholdDays: thresholdDays || 3,
        batchSize: batchSize || 100
      });

      res.json({
        success: result.success,
        sent: result.sent,
        errors: result.errors || [],
        message: result.message,
        duration: result.duration
      });
    } catch (error) {
      this.logger.error('Error in sendRecoveryReminders', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Recovery reminders failed',
        message: 'Failed to send recovery reminders',
        messageBn: 'পুনরুদ্ধার রিমাইন্ডার পাঠাতে ব্যর্থ'
      });
    }
  }

  /**
   * GET /api/v1/admin/carts/cleanup/stats
   * Get cleanup statistics
   * 
   * Query:
   * - startDate: string (optional) - Start date for stats
   * - endDate: string (optional) - End date for stats
   * 
   * Returns:
   * - stats: object - Cleanup statistics
   * - currentCartCounts: object - Current cart counts by status
   */
  async getCleanupStats(req, res) {
    try {
      const { startDate, endDate } = req.query;

      this.logger.info('Cleanup stats requested', {
        adminId: req.user?.id,
        startDate,
        endDate
      });

      const result = await cartCleanupService.getCleanupStats({ startDate, endDate });

      if (result.success) {
        res.json({
          success: true,
          data: result.data
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      this.logger.error('Error in getCleanupStats', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get cleanup stats'
      });
    }
  }

  /**
   * GET /api/v1/admin/carts/cleanup/history
   * Get cleanup history
   * 
   * Query:
   * - page: number (optional) - Page number
   * - limit: number (optional) - Items per page
   * - type: string (optional) - Filter by cleanup type
   * 
   * Returns:
   * - history: array - Cleanup history entries
   * - pagination: object - Pagination info
   */
  async getCleanupHistory(req, res) {
    try {
      const { page, limit, type } = req.query;

      this.logger.info('Cleanup history requested', {
        adminId: req.user?.id,
        page,
        limit,
        type
      });

      const result = await cartCleanupService.getCleanupHistory({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 50,
        type
      });

      if (result.success) {
        res.json({
          success: true,
          data: result.data
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      this.logger.error('Error in getCleanupHistory', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get cleanup history'
      });
    }
  }

  /**
   * POST /api/v1/admin/carts/cleanup/schedule/start
   * Start the cleanup scheduler
   * 
   * Returns:
   * - success: boolean
   * - status: object - Scheduler status
   */
  async startScheduler(req, res) {
    try {
      this.logger.info('Scheduler start requested', {
        adminId: req.user?.id
      });

      const result = cartSchedulerService.startScheduler();

      res.json({
        success: result.success,
        message: result.message,
        status: result.status
      });
    } catch (error) {
      this.logger.error('Error in startScheduler', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Failed to start scheduler'
      });
    }
  }

  /**
   * POST /api/v1/admin/carts/cleanup/schedule/stop
   * Stop the cleanup scheduler
   * 
   * Returns:
   * - success: boolean
   * - status: object - Scheduler status
   */
  async stopScheduler(req, res) {
    try {
      this.logger.info('Scheduler stop requested', {
        adminId: req.user?.id
      });

      const result = cartSchedulerService.stopScheduler();

      res.json({
        success: result.success,
        message: result.message,
        status: result.status
      });
    } catch (error) {
      this.logger.error('Error in stopScheduler', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Failed to stop scheduler'
      });
    }
  }

  /**
   * GET /api/v1/admin/carts/cleanup/schedule/status
   * Get scheduler status
   * 
   * Returns:
   * - isRunning: boolean
   * - nextRuns: object - Next run times for each job
   * - jobs: array - List of scheduled jobs
   */
  async getSchedulerStatus(req, res) {
    try {
      const status = cartSchedulerService.getStatus();
      const jobs = cartSchedulerService.getJobs();
      const cleanupStats = cartSchedulerService.getCleanupStats();

      res.json({
        success: true,
        data: {
          scheduler: status,
          jobs,
          cleanupStats
        }
      });
    } catch (error) {
      this.logger.error('Error in getSchedulerStatus', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get scheduler status'
      });
    }
  }

  /**
   * POST /api/v1/admin/carts/cleanup/schedule/run/:jobName
   * Manually run a specific cleanup job
   * 
   * Params:
   * - jobName: string - Name of the job to run
   * 
   * Returns:
   * - success: boolean
   * - message: string
   * - duration: number
   */
  async runScheduledJob(req, res) {
    try {
      const { jobName } = req.params;

      this.logger.info('Manual job run requested', {
        adminId: req.user?.id,
        jobName
      });

      const result = await cartSchedulerService.runJobNow(jobName);

      res.json({
        success: result.success,
        message: result.message,
        duration: result.duration,
        error: result.error
      });
    } catch (error) {
      this.logger.error('Error in runScheduledJob', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Failed to run job'
      });
    }
  }
}

// Singleton instance
const adminCleanupController = new AdminCleanupController();

module.exports = {
  AdminCleanupController,
  adminCleanupController
};
