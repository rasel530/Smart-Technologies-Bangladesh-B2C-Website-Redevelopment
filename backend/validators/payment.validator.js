/**
 * Payment Validators
 * 
 * This module provides validation middleware for payment-related API endpoints
 * using express-validator for input validation.
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Handle validation errors
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Invalid input data',
      messageBn: 'অবৈধ ইনপুট ডেটা',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  
  next();
};

/**
 * Validate payment initiation request
 */
const validatePaymentInitiation = [
  body('orderId')
    .notEmpty()
    .withMessage('Order ID is required')
    .isUUID()
    .withMessage('Invalid order ID format'),
  
  body('paymentMethod')
    .notEmpty()
    .withMessage('Payment method is required')
    .isIn(['CREDIT_CARD', 'BKASH', 'NAGAD'])
    .withMessage('Payment method must be one of: CREDIT_CARD, BKASH, NAGAD'),
  
  handleValidationErrors
];

/**
 * Validate refund request
 */
const validateRefund = [
  param('id')
    .notEmpty()
    .withMessage('Transaction ID is required')
    .isUUID()
    .withMessage('Invalid transaction ID format'),
  
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number greater than 0'),
  
  body('reason')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason must not exceed 500 characters'),
  
  handleValidationErrors
];

/**
 * Validate admin refund request
 */
const validateAdminRefund = [
  param('id')
    .notEmpty()
    .withMessage('Transaction ID is required')
    .isUUID()
    .withMessage('Invalid transaction ID format'),
  
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number greater than 0'),
  
  body('reason')
    .notEmpty()
    .withMessage('Reason is required')
    .isString()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Reason must be between 10 and 500 characters'),
  
  handleValidationErrors
];

/**
 * Validate gateway settings update
 */
const validateGatewaySettings = [
  param('gateway')
    .notEmpty()
    .withMessage('Gateway name is required')
    .isIn(['sslcommerz', 'bkash', 'nagad'])
    .withMessage('Invalid gateway. Must be one of: sslcommerz, bkash, nagad'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  
  body('isTestMode')
    .optional()
    .isBoolean()
    .withMessage('isTestMode must be a boolean'),
  
  body('config')
    .optional()
    .isObject()
    .withMessage('config must be an object'),
  
  body('webhookUrl')
    .optional()
    .isURL()
    .withMessage('webhookUrl must be a valid URL'),
  
  handleValidationErrors
];

/**
 * Validate payment query parameters
 */
const validatePaymentQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('status')
    .optional()
    .isIn(['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'])
    .withMessage('Invalid status. Must be one of: pending, processing, completed, failed, cancelled, refunded'),
  
  query('paymentMethod')
    .optional()
    .isIn(['CREDIT_CARD', 'BKASH', 'NAGAD', 'ROCKET', 'CASH_ON_DELIVERY', 'BANK_TRANSFER'])
    .withMessage('Invalid payment method'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  
  handleValidationErrors
];

/**
 * Validate payment logs query parameters
 */
const validatePaymentLogsQuery = [
  query('transactionId')
    .optional()
    .isUUID()
    .withMessage('Invalid transaction ID format'),
  
  query('orderId')
    .optional()
    .isUUID()
    .withMessage('Invalid order ID format'),
  
  query('eventType')
    .optional()
    .isIn([
      'PAYMENT_INITIATION',
      'PAYMENT_VERIFICATION',
      'PAYMENT_CALLBACK',
      'PAYMENT_REFUND',
      'PAYMENT_SUCCESS',
      'PAYMENT_FAILURE',
      'PAYMENT_CANCEL'
    ])
    .withMessage('Invalid event type'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];

/**
 * Validate bKash payment creation
 */
const validateBkashCreate = [
  body('orderId')
    .notEmpty()
    .withMessage('Order ID is required')
    .isUUID()
    .withMessage('Invalid order ID format'),
  
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 1 })
    .withMessage('Amount must be at least 1'),
  
  body('merchantInvoiceNumber')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Merchant invoice number must not exceed 50 characters'),
  
  handleValidationErrors
];

/**
 * Validate bKash payment execution
 */
const validateBkashExecute = [
  body('paymentID')
    .notEmpty()
    .withMessage('Payment ID is required')
    .isString()
    .trim(),
  
  handleValidationErrors
];

/**
 * Validate Nagad payment initialization
 */
const validateNagadInitialize = [
  body('orderId')
    .notEmpty()
    .withMessage('Order ID is required')
    .isUUID()
    .withMessage('Invalid order ID format'),
  
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 1 })
    .withMessage('Amount must be at least 1'),
  
  body('merchantId')
    .optional()
    .isString()
    .trim(),
  
  handleValidationErrors
];

/**
 * Validate Nagad payment verification
 */
const validateNagadVerify = [
  body('paymentRefId')
    .notEmpty()
    .withMessage('Payment reference ID is required')
    .isString()
    .trim(),
  
  handleValidationErrors
];

/**
 * Validate SSLCommerz callback
 */
const validateSSLCommerzCallback = [
  body('tran_id')
    .notEmpty()
    .withMessage('Transaction ID is required')
    .isString()
    .trim(),
  
  body('val_id')
    .optional()
    .isString()
    .trim(),
  
  body('amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  
  handleValidationErrors
];

/**
 * Validate payment analytics query parameters
 */
const validateAnalyticsQuery = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  
  query('gateway')
    .optional()
    .isIn(['sslcommerz', 'bkash', 'nagad'])
    .withMessage('Invalid gateway'),
  
  query('groupBy')
    .optional()
    .isIn(['day', 'week', 'month'])
    .withMessage('Invalid group by option. Must be one of: day, week, month'),
  
  handleValidationErrors
];

/**
 * Validate order ID parameter
 */
const validateOrderIdParam = [
  param('orderId')
    .notEmpty()
    .withMessage('Order ID is required')
    .isUUID()
    .withMessage('Invalid order ID format'),
  
  handleValidationErrors
];

/**
 * Validate transaction ID parameter
 */
const validateTransactionIdParam = [
  param('transactionId')
    .notEmpty()
    .withMessage('Transaction ID is required')
    .isUUID()
    .withMessage('Invalid transaction ID format'),
  
  handleValidationErrors
];

/**
 * Sanitize payment data to remove sensitive information
 * @param {Object} data - Data to sanitize
 * @returns {Object} Sanitized data
 */
const sanitizePaymentData = (data) => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveKeys = [
    'cardNumber',
    'cvv',
    'pin',
    'password',
    'card_no',
    'pan',
    'apiSecret',
    'privateKey',
    'secretKey'
  ];

  const sanitized = { ...data };

  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some(sensitiveKey => 
      key.toLowerCase().includes(sensitiveKey.toLowerCase())
    )) {
      sanitized[key] = '[REDACTED]';
    }
  }

  return sanitized;
};

/**
 * Validate date range
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {boolean} True if valid
 */
const validateDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) {
    return true;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return false;
  }

  return start <= end;
};

module.exports = {
  handleValidationErrors,
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
  validateOrderIdParam,
  validateTransactionIdParam,
  sanitizePaymentData,
  validateDateRange
};
