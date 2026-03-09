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
const { authMiddleware } = require('../../middleware/auth');
const { rbacAuthMiddleware } = require('../../middleware/rbacAuth');

/**
 * @route   GET /api/v1/admin/checkout/sessions
 * @desc    Get all checkout sessions with filtering and pagination
 * @access  Admin (requires checkout:read permission)
 */
router.get(
  '/sessions',
  authMiddleware.authenticate(),
  rbacAuthMiddleware.requirePermission('checkout:read'),
  adminCheckoutController.getCheckoutSessions
);

/**
 * @route   GET /api/v1/admin/checkout/sessions/:sessionId
 * @desc    Get detailed checkout session information
 * @access  Admin (requires checkout:read permission)
 */
router.get(
  '/sessions/:sessionId',
  authMiddleware.authenticate(),
  rbacAuthMiddleware.requirePermission('checkout:read'),
  adminCheckoutController.getCheckoutSessionDetails
);

/**
 * @route   DELETE /api/v1/admin/checkout/sessions/:sessionId
 * @desc    Cancel/abandon a checkout session
 * @access  Admin (requires checkout:write permission)
 */
router.delete(
  '/sessions/:sessionId',
  authMiddleware.authenticate(),
  rbacAuthMiddleware.requirePermission('checkout:write'),
  adminCheckoutController.cancelCheckoutSession
);

/**
 * @route   GET /api/v1/admin/checkout/abandonment
 * @desc    Get abandoned checkout sessions with filtering
 * @access  Admin (requires checkout:read permission)
 */
router.get(
  '/abandonment',
  authMiddleware.authenticate(),
  rbacAuthMiddleware.requirePermission('checkout:read'),
  adminCheckoutController.getAbandonedCheckouts
);

/**
 * @route   POST /api/v1/admin/checkout/abandonment/:id/recover
 * @desc    Send recovery email for abandoned checkout
 * @access  Admin (requires checkout:write permission)
 */
router.post(
  '/abandonment/:id/recover',
  authMiddleware.authenticate(),
  rbacAuthMiddleware.requirePermission('checkout:write'),
  adminCheckoutController.sendRecoveryEmail
);

/**
 * @route   GET /api/v1/admin/checkout/guest/sessions
 * @desc    Get guest checkout sessions with filtering
 * @access  Admin (requires checkout:read permission)
 */
router.get(
  '/guest/sessions',
  authMiddleware.authenticate(),
  rbacAuthMiddleware.requirePermission('checkout:read'),
  adminCheckoutController.getGuestCheckoutSessions
);

/**
 * @route   GET /api/v1/admin/checkout/analytics
 * @desc    Get comprehensive checkout analytics
 * @access  Admin (requires checkout:read permission)
 */
router.get(
  '/analytics',
  authMiddleware.authenticate(),
  rbacAuthMiddleware.requirePermission('checkout:read'),
  adminCheckoutController.getCheckoutAnalytics
);

/**
 * @route   GET /api/v1/admin/checkout/settings
 * @desc    Get checkout settings
 * @access  Admin (requires checkout:read permission)
 */
router.get(
  '/settings',
  authMiddleware.authenticate(),
  rbacAuthMiddleware.requirePermission('checkout:read'),
  adminCheckoutController.getCheckoutSettings
);

/**
 * @route   PUT /api/v1/admin/checkout/settings
 * @desc    Update checkout settings
 * @access  Admin (requires checkout:write permission)
 */
router.put(
  '/settings',
  authMiddleware.authenticate(),
  rbacAuthMiddleware.requirePermission('checkout:write'),
  adminCheckoutController.updateCheckoutSettings
);

module.exports = router;
