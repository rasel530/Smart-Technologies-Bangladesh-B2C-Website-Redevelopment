/**
 * Request Logger Middleware
 * 
 * Simple middleware to log request details
 */

const { loggerService } = require('../services/logger');

/**
 * Log request details
 */
const logRequest = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  loggerService.info('Request received', {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip
  });
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    loggerService.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  });
  
  next();
};

module.exports = {
  logRequest
};
