/**
 * Admin Checkout Routes
 * 
 * Routes for admin checkout management including:
 * - Managing checkout sessions
 * - Tracking checkout abandonment
 * - Managing guest checkout sessions
 * - Providing checkout analytics
 * - Configuring checkout settings
 */

const express = require('express');
const router = express.Router();
const adminCheckoutController = require('../../controllers/adminCheckoutController');
const { authenticateAdmin } = require('../../middleware/auth');
const { validateAdminAccess } = require('../../middleware/adminAuth');

/**
 * @route   GET /api/v1/admin/checkout/sessions
 * @desc    Get all checkout sessions with filtering and pagination
 * @access  Admin
 */
router.get(
  '/sessions',
  authenticateAdmin,
  validateAdminAccess,
  adminCheckoutController.getCheckoutSessions
);

/**
 * @route   GET /api/v1/admin/checkout/sessions/:sessionId
 * @desc    Get detailed checkout session information
 * @access  Admin
 */
router.get(
  '/sessions/:sessionId',
  authenticateAdmin,
  validateAdminAccess,
  adminCheckoutController.getCheckoutSessionDetails
);

/**
 * @route   DELETE /api/v1/admin/checkout/sessions/:sessionId
 * @desc    Cancel/abandon a checkout session
 * @access  Admin
 */
router.delete(
  '/sessions/:sessionId',
  authenticateAdmin,
  validateAdminAccess,
  adminCheckoutController.cancelCheckoutSession
);

/**
 * @route   GET /api/v1/admin/checkout/abandonment
 * @desc    Get abandoned checkout sessions with filtering
 * @access  Admin
 */
router.get(
  '/abandonment',
  authenticateAdmin,
  validateAdminAccess,
  adminCheckoutController.getAbandonedCheckouts
);

/**
 * @route   POST /api/v1/admin/checkout/abandonment/:id/recover
 * @desc    Send recovery email for abandoned checkout
 * @access  Admin
 */
router.post(
  '/abandonment/:id/recover',
  authenticateAdmin,
  validateAdminAccess,
  adminCheckoutController.sendRecoveryEmail
);

/**
 * @route   GET /api/v1/admin/checkout/guest/sessions
 * @desc    Get guest checkout sessions with filtering
 * @access  Admin
 */
router.get(
  '/guest/sessions',
  authenticateAdmin,
  validateAdminAccess,
  adminCheckoutController.getGuestCheckoutSessions
);

/**
 * @route   GET /api/v1/admin/checkout/analytics
 * @desc    Get comprehensive checkout analytics
 * @access  Admin
 */
router.get(
  '/analytics',
  authenticateAdmin,
  validateAdminAccess,
  adminCheckoutController.getCheckoutAnalytics
);

/**
 * @route   GET /api/v1/admin/checkout/settings
 * @desc    Get checkout settings
 * @access  Admin
 */
router.get(
  '/settings',
  authenticateAdmin,
  validateAdminAccess,
  adminCheckoutController.getCheckoutSettings
);

/**
 * @route   PUT /api/v1/admin/checkout/settings
 * @desc    Update checkout settings
 * @access  Admin
 */
router.put(
  '/settings',
  authenticateAdmin,
  validateAdminAccess,
  adminCheckoutController.updateCheckoutSettings
);

module.exports = router;
