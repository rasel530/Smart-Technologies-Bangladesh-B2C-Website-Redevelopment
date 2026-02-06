/**
 * Validation and Sanitization Middleware
 *
 * BUG-MED-001 & BUG-MED-007: Duplicate validation/error handling code
 * BUG-HIGH-003: No input sanitization
 * 
 * This file contains common validation and sanitization middleware
 * to avoid code duplication across routes.
 */

const { body, param, query, validationResult } = require('express-validator');
const createDOMPurify = require('isomorphic-dompurify');

// Create DOMPurify instance for XSS prevention
const DOMPurify = createDOMPurify();

/**
 * Handle validation errors
 * BUG-MED-001 & BUG-MED-007: Extract common validation error handling
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * Sanitize string input to prevent XSS attacks
 * BUG-HIGH-003: No input sanitization
 */
const sanitizeString = (value) => {
  if (typeof value !== 'string') return value;
  return DOMPurify.sanitize(value.trim());
};

/**
 * Sanitize array of strings
 */
const sanitizeStringArray = (arr) => {
  if (!Array.isArray(arr)) return arr;
  return arr.map(item => sanitizeString(item));
};

/**
 * Sanitize object properties recursively
 */
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;

  const sanitized = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = sanitizeStringArray(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
  }
  return sanitized;
};

/**
 * Middleware to sanitize request body
 * BUG-HIGH-003: No input sanitization
 */
const sanitizeBody = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  next();
};

/**
 * Middleware to sanitize request query parameters
 */
const sanitizeQuery = (req, res, next) => {
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  next();
};

/**
 * Middleware to sanitize request parameters
 */
const sanitizeParams = (req, res, next) => {
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  next();
};

/**
 * Combined sanitization middleware
 */
const sanitizeInput = [
  sanitizeBody,
  sanitizeQuery,
  sanitizeParams
];

module.exports = {
  handleValidationErrors,
  sanitizeString,
  sanitizeStringArray,
  sanitizeObject,
  sanitizeBody,
  sanitizeQuery,
  sanitizeParams,
  sanitizeInput
};
