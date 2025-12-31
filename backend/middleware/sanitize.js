const DOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const { loggerService } = require('../services/logger');

/**
 * Output Sanitization Middleware
 *
 * This middleware sanitizes API response data to prevent XSS attacks
 * by removing potentially malicious HTML/JavaScript content from user-generated data.
 *
 * @module middleware/sanitize
 */

// Initialize DOMPurify with JSDOM window for Node.js environment
const window = new JSDOM('').window;
const DOMPurifyInstance = DOMPurify(window);

/**
 * Sanitize a string value to prevent XSS attacks
 * @param {string} value - The string to sanitize
 * @param {Object} options - DOMPurify options
 * @returns {string} Sanitized string
 */
function sanitizeString(value, options = {}) {
  if (typeof value !== 'string') {
    return value;
  }

  const defaultOptions = {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM_IMPORT: false,
    SANITIZE_DOM: true,
    FORCE_BODY: false,
    WHOLE_DOCUMENT: false,
    RETURN_TRUSTED_TYPE: false,
    ...options
  };

  try {
    return DOMPurifyInstance.sanitize(value, defaultOptions);
  } catch (error) {
    loggerService.error('Failed to sanitize string', error.message, {
      valueLength: value.length,
      timestamp: new Date().toISOString()
    });
    // Return original string if sanitization fails
    return value;
  }
}

/**
 * Sanitize an object recursively
 * @param {Object} obj - The object to sanitize
 * @param {Array<string>} skipFields - Fields to skip during sanitization
 * @returns {Object} Sanitized object
 */
function sanitizeObject(obj, skipFields = []) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  // Handle Date objects
  if (obj instanceof Date) {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, skipFields));
  }

  const sanitized = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      // Skip specified fields (e.g., passwords, tokens)
      if (skipFields.includes(key)) {
        sanitized[key] = obj[key];
        continue;
      }

      const value = obj[key];

      if (typeof value === 'string') {
        // Sanitize string values
        sanitized[key] = sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize nested objects
        sanitized[key] = sanitizeObject(value, skipFields);
      } else {
        // Keep non-string, non-object values as-is
        sanitized[key] = value;
      }
    }
  }

  return sanitized;
}

/**
 * Sanitize response data based on content type
 * @param {*} data - Response data to sanitize
 * @param {Object} options - Sanitization options
 * @returns {*} Sanitized data
 */
function sanitizeResponse(data, options = {}) {
  const {
    skipFields = ['password', 'token', 'authToken', 'refreshToken', 'accessToken'],
    strict = false
  } = options;

  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    return sanitizeString(data, strict ? {} : { ALLOWED_TAGS: ['b', 'i', 'em', 'strong'] });
  }

  if (typeof data === 'object') {
    return sanitizeObject(data, skipFields);
  }

  return data;
}

/**
 * Express middleware to sanitize response data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function sanitizeOutputMiddleware(req, res, next) {
  // Store original json method
  const originalJson = res.json.bind(res);

  // Override json method to sanitize output
  res.json = function(data) {
    try {
      const sanitized = sanitizeResponse(data);
      return originalJson(sanitized);
    } catch (error) {
      loggerService.error('Failed to sanitize response', error.message, {
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });
      // Return original data if sanitization fails
      return originalJson(data);
    }
  };

  // Store original send method
  const originalSend = res.send.bind(res);

  // Override send method to sanitize output
  res.send = function(data) {
    try {
      // Only sanitize if data is an object or string
      if (typeof data === 'object' || typeof data === 'string') {
        const sanitized = sanitizeResponse(data);
        return originalSend(sanitized);
      }
      return originalSend(data);
    } catch (error) {
      loggerService.error('Failed to sanitize response', error.message, {
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });
      // Return original data if sanitization fails
      return originalSend(data);
    }
  };

  next();
}

/**
 * Middleware to sanitize specific fields in request body
 * @param {Array<string>} fields - Fields to sanitize in request body
 * @returns {Function} Express middleware
 */
function sanitizeRequestBody(fields = []) {
  return (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
      for (const field of fields) {
        if (req.body[field] && typeof req.body[field] === 'string') {
          req.body[field] = sanitizeString(req.body[field]);
        }
      }
    }
    next();
  };
}

/**
 * Middleware to sanitize query parameters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function sanitizeQueryParams(req, res, next) {
  if (req.query && typeof req.query === 'object') {
    for (const key in req.query) {
      if (req.query.hasOwnProperty(key) && typeof req.query[key] === 'string') {
        req.query[key] = sanitizeString(req.query[key]);
      }
    }
  }
  next();
}

/**
 * Middleware to sanitize route parameters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function sanitizeRouteParams(req, res, next) {
  if (req.params && typeof req.params === 'object') {
    for (const key in req.params) {
      if (req.params.hasOwnProperty(key) && typeof req.params[key] === 'string') {
        req.params[key] = sanitizeString(req.params[key]);
      }
    }
  }
  next();
}

/**
 * Test sanitization functionality
 * @param {string} input - Input to test
 * @returns {Object} Test result
 */
function testSanitization(input) {
  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    '<svg onload=alert("XSS")>',
    'javascript:alert("XSS")',
    '<iframe src="javascript:alert(\'XSS\')"></iframe>',
    '<body onload=alert("XSS")>',
    '<div onmouseover="alert(\'XSS\')">Hover me</div>',
    '<a href="javascript:alert(\'XSS\')">Click me</a>',
    '<input autofocus onfocus=alert("XSS")>',
    '<details open ontoggle=alert("XSS")>'
  ];

  const results = {
    input: input,
    sanitized: sanitizeString(input),
    xssTests: []
  };

  for (const payload of xssPayloads) {
    const sanitized = sanitizeString(payload);
    const isClean = !sanitized.includes('<script>') && 
                     !sanitized.includes('onerror=') && 
                     !sanitized.includes('onload=') &&
                     !sanitized.includes('javascript:') &&
                     !sanitized.includes('onmouseover=') &&
                     !sanitized.includes('onfocus=') &&
                     !sanitized.includes('ontoggle=');
    
    results.xssTests.push({
      payload,
      sanitized,
      clean: isClean
    });
  }

  return results;
}

module.exports = {
  sanitizeString,
  sanitizeObject,
  sanitizeResponse,
  sanitizeOutputMiddleware,
  sanitizeRequestBody,
  sanitizeQueryParams,
  sanitizeRouteParams,
  testSanitization
};
