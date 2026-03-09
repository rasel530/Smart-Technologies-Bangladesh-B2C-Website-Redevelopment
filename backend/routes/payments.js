/**
 * Payment Routes
 * 
 * This module defines all payment-related API endpoints for both
 * public (customer) and admin operations.
 */

const express = require('express');
const router = express.Router();

// Import middleware
const { authMiddleware } = require('../middleware/auth');
const { paymentMiddleware } = require('../middleware/payment.middleware');

// Import validators
const {
  validatePaymentInitiation,
  validateRefund,
  validateAdminRefund,
  validateGatewaySettings,
  validatePaymentQuery,
  validatePaymentLogsQuery,
  validateBkashCreate,
  validateBkashExecute,
  validateNagadInitialize,
  validateNagadVerify,
  validateSSLCommerzCallback,
  validateAnalyticsQuery,
  validateOrderIdParam
} = require('../validators/payment.validator');

// Import controllers
const {
  initiatePayment,
  getPaymentStatus,
  handleSSLCommerzSuccess,
  handleSSLCommerzFail,
  handleSSLCommerzCancel,
  handleSSLCommerzIPN,
  createBkashPayment,
  executeBkashPayment,
  handleBkashCallback,
  initializeNagadPayment,
  verifyNagadPayment,
  handleNagadCallback,
  requestRefund,
  getAllPayments,
  getPaymentById,
  adminRefund,
  getPaymentAnalytics,
  getDailyAnalytics,
  getMonthlyAnalytics,
  getGatewayAnalytics,
  getMethodAnalytics,
  getConversionRate,
  getFailureAnalysis,
  getRevenueTracking,
  getPerformanceMetrics,
  getMetrics,
  getGatewaySettings,
  updateGatewaySettings,
  getPaymentLogs
} = require('../controllers/payment.controller');

// ============================================================================
// PUBLIC PAYMENT ENDPOINTS (for customers)
// ============================================================================

/**
 * @route   POST /api/v1/payments/initiate
 * @desc    Initialize payment for an order
 * @access   Private (optional - guest checkout supported)
 * @body    { orderId: string, paymentMethod: PaymentMethod }
 * @returns  { success: boolean, transactionId: string, paymentUrl?: string }
 */
router.post(
  '/initiate',
  paymentMiddleware.extractClientInfo,
  paymentMiddleware.rateLimitPaymentInitiation(),
  validatePaymentInitiation,
  initiatePayment
);

/**
 * @route   GET /api/v1/payments/:orderId/status
 * @desc    Get payment status by order ID
 * @access   Private (optional - guest checkout supported)
 * @returns  { success: boolean, status: PaymentStatus, transaction: PaymentTransaction }
 */
router.get(
  '/:orderId/status',
  validateOrderIdParam,
  getPaymentStatus
);

// ----------------------------------------------------------------------------
// SSLCommerz Callback Endpoints
// ----------------------------------------------------------------------------

/**
 * @route   POST /api/v1/payments/sslcommerz/success
 * @desc    Handle SSLCommerz success callback
 * @access   Public (webhook)
 */
router.post(
  '/sslcommerz/success',
  paymentMiddleware.extractClientInfo,
  handleSSLCommerzSuccess
);

/**
 * @route   POST /api/v1/payments/sslcommerz/fail
 * @desc    Handle SSLCommerz fail callback
 * @access   Public (webhook)
 */
router.post(
  '/sslcommerz/fail',
  paymentMiddleware.extractClientInfo,
  handleSSLCommerzFail
);

/**
 * @route   POST /api/v1/payments/sslcommerz/cancel
 * @desc    Handle SSLCommerz cancel callback
 * @access   Public (webhook)
 */
router.post(
  '/sslcommerz/cancel',
  paymentMiddleware.extractClientInfo,
  handleSSLCommerzCancel
);

/**
 * @route   POST /api/v1/payments/sslcommerz/ipn
 * @desc    Handle SSLCommerz IPN (Instant Payment Notification)
 * @access   Public (webhook)
 */
router.post(
  '/sslcommerz/ipn',
  paymentMiddleware.extractClientInfo,
  paymentMiddleware.validateWebhookSignature('sslcommerz'),
  handleSSLCommerzIPN
);

// ----------------------------------------------------------------------------
// bKash Endpoints
// ----------------------------------------------------------------------------

/**
 * @route   POST /api/v1/payments/bkash/create
 * @desc    Create bKash payment
 * @access   Private
 * @body    { orderId: string, amount?: number, merchantInvoiceNumber?: string }
 */
router.post(
  '/bkash/create',
  authMiddleware.authenticate(),
  paymentMiddleware.extractClientInfo,
  paymentMiddleware.rateLimitPaymentInitiation(),
  validateBkashCreate,
  createBkashPayment
);

/**
 * @route   POST /api/v1/payments/bkash/execute
 * @desc    Execute bKash payment
 * @access   Private
 * @body    { paymentID: string }
 */
router.post(
  '/bkash/execute',
  authMiddleware.authenticate(),
  paymentMiddleware.extractClientInfo,
  validateBkashExecute,
  executeBkashPayment
);

/**
 * @route   POST /api/v1/payments/bkash/callback
 * @desc    Handle bKash webhook callback
 * @access   Public (webhook)
 */
router.post(
  '/bkash/callback',
  paymentMiddleware.extractClientInfo,
  paymentMiddleware.validateWebhookSignature('bkash'),
  handleBkashCallback
);

// ----------------------------------------------------------------------------
// Nagad Endpoints
// ----------------------------------------------------------------------------

/**
 * @route   POST /api/v1/payments/nagad/initialize
 * @desc    Initialize Nagad payment
 * @access   Private
 * @body    { orderId: string, amount?: number, merchantId?: string }
 */
router.post(
  '/nagad/initialize',
  authMiddleware.authenticate(),
  paymentMiddleware.extractClientInfo,
  paymentMiddleware.rateLimitPaymentInitiation(),
  validateNagadInitialize,
  initializeNagadPayment
);

/**
 * @route   POST /api/v1/payments/nagad/verify
 * @desc    Verify Nagad payment
 * @access   Private
 * @body    { paymentRefId: string }
 */
router.post(
  '/nagad/verify',
  authMiddleware.authenticate(),
  paymentMiddleware.extractClientInfo,
  validateNagadVerify,
  verifyNagadPayment
);

/**
 * @route   POST /api/v1/payments/nagad/callback
 * @desc    Handle Nagad webhook callback
 * @access   Public (webhook)
 */
router.post(
  '/nagad/callback',
  paymentMiddleware.extractClientInfo,
  paymentMiddleware.validateWebhookSignature('nagad'),
  handleNagadCallback
);

// ----------------------------------------------------------------------------
// Refund Endpoints
// ----------------------------------------------------------------------------

/**
 * @route   POST /api/v1/payments/:id/refund
 * @desc    Request refund (customer-initiated)
 * @access   Private
 * @param    id - Transaction ID
 * @body     { amount?: number, reason?: string }
 */
router.post(
  '/:id/refund',
  authMiddleware.authenticate(),
  paymentMiddleware.extractClientInfo,
  validateRefund,
  paymentMiddleware.checkRefundEligibility,
  requestRefund
);

// ============================================================================
// ADMIN PAYMENT ENDPOINTS
// ============================================================================

/**
 * @route   GET /api/v1/admin/payments
 * @desc    Get all payments with filtering and pagination
 * @access   Admin
 * @query    page, limit, status, paymentMethod, startDate, endDate
 * @returns  { success: boolean, data: PaymentTransaction[], pagination: {...} }
 */
router.get(
  '/admin/payments',
  authMiddleware.authenticate(),
  authMiddleware.adminOnly(),
  validatePaymentQuery,
  getAllPayments
);

/**
 * @route   GET /api/v1/admin/payments/:id
 * @desc    Get payment transaction details
 * @access   Admin
 * @param    id - Payment transaction ID
 * @returns  { success: boolean, data: PaymentTransaction }
 */
router.get(
  '/admin/payments/:id',
  authMiddleware.authenticate(),
  authMiddleware.adminOnly(),
  getPaymentById
);

/**
 * @route   PUT /api/v1/admin/payments/:id/refund
 * @desc    Admin-initiated refund
 * @access   Admin
 * @param    id - Transaction ID
 * @body     { amount: number, reason: string }
 * @returns  { success: boolean, data: RefundResult }
 */
router.put(
  '/admin/payments/:id/refund',
  authMiddleware.authenticate(),
  authMiddleware.adminOnly(),
  paymentMiddleware.extractClientInfo,
  validateAdminRefund,
  adminRefund
);

/**
 * @route   GET /api/v1/admin/payments/analytics
 * @desc    Get payment analytics and statistics
 * @access   Admin
 * @query    startDate, endDate, gateway, groupBy
 * @returns  { success: boolean, data: { totalRevenue, successRate, gatewayStats, ... } }
 */
router.get(
  '/admin/payments/analytics',
  authMiddleware.authenticate(),
  authMiddleware.adminOnly(),
  validateAnalyticsQuery,
  getPaymentAnalytics
);

/**
 * @route   GET /api/v1/admin/payments/analytics/daily
 * @desc    Get daily payment analytics
 * @access   Admin
 * @query    startDate, endDate
 * @returns  { success: boolean, data: Analytics[] }
 */
router.get(
  '/admin/payments/analytics/daily',
  authMiddleware.authenticate(),
  authMiddleware.adminOnly(),
  getDailyAnalytics
);

/**
 * @route   GET /api/v1/admin/payments/analytics/monthly
 * @desc    Get monthly payment analytics
 * @access   Admin
 * @query    year, month
 * @returns  { success: boolean, data: Analytics[] }
 */
router.get(
  '/admin/payments/analytics/monthly',
  authMiddleware.authenticate(),
  authMiddleware.adminOnly(),
  getMonthlyAnalytics
);

/**
 * @route   GET /api/v1/admin/payments/analytics/gateway
 * @desc    Get gateway-specific analytics
 * @access   Admin
 * @query    gateway, startDate, endDate
 * @returns  { success: boolean, data: GatewayAnalytics }
 */
router.get(
  '/admin/payments/analytics/gateway',
  authMiddleware.authenticate(),
  authMiddleware.adminOnly(),
  getGatewayAnalytics
);

/**
 * @route   GET /api/v1/admin/payments/analytics/method
 * @desc    Get payment method analytics
 * @access   Admin
 * @query    method, startDate, endDate
 * @returns  { success: boolean, data: MethodAnalytics }
 */
router.get(
  '/admin/payments/analytics/method',
  authMiddleware.authenticate(),
  authMiddleware.adminOnly(),
  getMethodAnalytics
);

/**
 * @route   GET /api/v1/admin/payments/analytics/conversion
 * @desc    Get payment conversion rate
 * @access   Admin
 * @query    startDate, endDate
 * @returns  { success: boolean, data: ConversionRateAnalytics }
 */
router.get(
  '/admin/payments/analytics/conversion',
  authMiddleware.authenticate(),
  authMiddleware.adminOnly(),
  getConversionRate
);

/**
 * @route   GET /api/v1/admin/payments/analytics/failures
 * @desc    Get payment failure analysis
 * @access   Admin
 * @query    startDate, endDate
 * @returns  { success: boolean, data: FailureAnalysis }
 */
router.get(
  '/admin/payments/analytics/failures',
  authMiddleware.authenticate(),
  authMiddleware.adminOnly(),
  getFailureAnalysis
);

/**
 * @route   GET /api/v1/admin/payments/analytics/revenue
 * @desc    Get revenue tracking and forecasting
 * @access   Admin
 * @query    startDate, endDate
 * @returns  { success: boolean, data: RevenueTracking }
 */
router.get(
  '/admin/payments/analytics/revenue',
  authMiddleware.authenticate(),
  authMiddleware.adminOnly(),
  getRevenueTracking
);

/**
 * @route   GET /api/v1/admin/payments/analytics/performance
 * @desc    Get payment performance metrics
 * @access   Admin
 * @query    startDate, endDate
 * @returns  { success: boolean, data: PerformanceMetrics }
 */
router.get(
  '/admin/payments/analytics/performance',
  authMiddleware.authenticate(),
  authMiddleware.adminOnly(),
  getPerformanceMetrics
);

/**
 * @route   GET /api/v1/admin/payments/metrics
 * @desc    Get KPI metrics
 * @access   Admin
 * @query    metricName, period, startDate, endDate, gateway, paymentMethod
 * @returns  { success: boolean, data: Metrics[] }
 */
router.get(
  '/admin/payments/metrics',
  authMiddleware.authenticate(),
  authMiddleware.adminOnly(),
  getMetrics
);

// ============================================================================
// ADMIN GATEWAY SETTINGS ENDPOINTS
// ============================================================================

/**
 * @route   GET /api/v1/admin/gateways
 * @desc    Get all gateway settings
 * @access   Admin
 * @returns  { success: boolean, data: PaymentGatewaySettings[] }
 */
router.get(
  '/admin/gateways',
  authMiddleware.authenticate(),
  authMiddleware.adminOnly(),
  getGatewaySettings
);

/**
 * @route   PUT /api/v1/admin/gateways/:gateway
 * @desc    Update gateway settings
 * @access   Admin
 * @param    gateway - Gateway name (sslcommerz, bkash, nagad)
 * @body     { isActive?: boolean, isTestMode?: boolean, config?: any }
 * @returns  { success: boolean, data: PaymentGatewaySettings }
 */
router.put(
  '/admin/gateways/:gateway',
  authMiddleware.authenticate(),
  authMiddleware.adminOnly(),
  validateGatewaySettings,
  updateGatewaySettings
);

// ============================================================================
// ADMIN PAYMENT LOGS ENDPOINTS
// ============================================================================

/**
 * @route   GET /api/v1/admin/payments/logs
 * @desc    Get payment audit logs
 * @access   Admin
 * @query    transactionId, orderId, eventType, startDate, endDate, page, limit
 * @returns  { success: boolean, data: PaymentLog[] }
 */
router.get(
  '/admin/payments/logs',
  authMiddleware.authenticate(),
  authMiddleware.adminOnly(),
  validatePaymentLogsQuery,
  getPaymentLogs
);

// ============================================================================
// EXPORT ROUTERS
// ============================================================================

/**
 * Export public payment routes
 * These routes are mounted at /api/v1/payments
 */
const publicRoutes = router;

/**
 * Export admin payment routes
 * These routes require admin authentication
 */
const adminRoutes = router;

/**
 * Export gateway routes
 * These routes require admin authentication
 */
const gatewayRoutes = router;

module.exports = {
  router,
  publicRoutes,
  adminRoutes,
  gatewayRoutes
};
