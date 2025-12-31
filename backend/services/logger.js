const winston = require('winston');
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');
const { configService } = require('./config');

class LoggerService {
  constructor() {
    this.config = configService.getLoggingConfig();
    this.isProduction = configService.isProduction();
    this.logBuffer = [];
    this.bufferSize = 100; // Buffer up to 100 log entries
    this.bufferTimeout = 5000; // Flush buffer every 5 seconds
    this.samplingRate = 0.1; // 10% sampling rate for high-volume scenarios
    this.logCount = 0;
    this.performanceMetrics = {
      totalLogs: 0,
      totalLogTime: 0,
      averageLogTime: 0
    };
    
    this.logger = this.createLogger();
    this.startBufferFlushInterval();
  }

  createLogger() {
    const logFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    );

    const transports = [];

    // Console transport for development with reduced verbosity in production
    if (!this.isProduction) {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      );
    } else {
      // Production console transport with minimal output
      transports.push(
        new winston.transports.Console({
          level: 'error', // Only errors in production console
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        })
      );
    }

    // File transport with rotation and compression for production
    // Temporarily disabled to fix startup issue
    if (false && this.config.file && this.config.file.enabled) {
      const fileTransport = new winston.transports.File({
        filename: 'logs/app.log',
        format: logFormat,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        tailable: true,
        zippedArchive: this.isProduction // Enable compression in production
      });

      // Add compression for existing files in production
      if (this.isProduction) {
        fileTransport.on('rotate', (oldFilename, newFilename) => {
          this.compressLogFile(oldFilename);
        });
      }

      transports.push(fileTransport);
    }

    // Environment-aware log levels
    const logLevel = this.isProduction ? 'info' : this.config.level;

    return winston.createLogger({
      level: logLevel,
      format: this.isProduction ?
        winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
          winston.format((info) => {
            // Add structured metadata
            info.service = 'smart-ecommerce-api';
            info.version = '1.0.0';
            info.environment = configService.get('NODE_ENV');
            info.instanceId = process.env.INSTANCE_ID || 'default';
            return info;
          })()
        ) : winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json()
        ),
      transports,
      exitOnError: false
    });
  }

  // Compress log file with gzip
  compressLogFile(filePath) {
    if (!this.isProduction) return;
    
    const gzipPath = `${filePath}.gz`;
    const readStream = fs.createReadStream(filePath);
    const writeStream = fs.createWriteStream(gzipPath);
    const gzip = zlib.createGzip();

    readStream
      .pipe(gzip)
      .pipe(writeStream)
      .on('finish', () => {
        fs.unlink(filePath, (err) => {
          if (err) console.error('Error deleting original log file:', err);
        });
      });
  }

  // Log sampling for high-traffic scenarios
  shouldSampleLog(level) {
    if (!this.isProduction) return true;
    
    // Always log errors and warnings
    if (level === 'error' || level === 'warn') return true;
    
    // Sample info and debug logs
    this.logCount++;
    return this.logCount % 10 === 0; // 10% sampling
  }

  // Performance monitoring for logging operations
  measureLogPerformance(logFunction, ...args) {
    const startTime = process.hrtime.bigint();
    const result = logFunction.apply(this, args);
    const endTime = process.hrtime.bigint();
    
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    this.performanceMetrics.totalLogs++;
    this.performanceMetrics.totalLogTime += duration;
    this.performanceMetrics.averageLogTime = this.performanceMetrics.totalLogTime / this.performanceMetrics.totalLogs;
    
    return result;
  }

  // Log buffering mechanism
  addToBuffer(level, message, meta) {
    const logEntry = {
      level,
      message,
      meta,
      timestamp: new Date().toISOString()
    };
    
    this.logBuffer.push(logEntry);
    
    // Flush buffer if it's full or if it's an error
    if (this.logBuffer.length >= this.bufferSize || level === 'error') {
      this.flushBuffer();
    }
  }

  // Flush buffered logs
  flushBuffer() {
    if (this.logBuffer.length === 0) return;
    
    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];
    
    logsToFlush.forEach(log => {
      this.logger.log(log.level, log.message, log.meta);
    });
  }

  // Start buffer flush interval
  startBufferFlushInterval() {
    setInterval(() => {
      this.flushBuffer();
    }, this.bufferTimeout);
  }

  // Request logging middleware with performance monitoring
  requestLogger() {
    return (req, res, next) => {
      const start = Date.now();
      
      // Only log requests in production if sampling allows
      if (!this.shouldSampleLog('info')) {
        return next();
      }
      
      // Log request with performance timing
      this.measureLogPerformance(() => {
        const logData = {
          method: req.method,
          url: req.originalUrl,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          requestId: req.id || this.generateRequestId(),
          timestamp: new Date().toISOString()
        };
        
        if (this.isProduction) {
          this.addToBuffer('info', 'HTTP Request', logData);
        } else {
          this.logger.info('HTTP Request', logData);
        }
      });

      // Capture response
      const originalSend = res.send;
      res.send = (data) => {
        const duration = Date.now() - start;
        
        this.measureLogPerformance(() => {
          const responseData = {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            requestId: req.id || this.generateRequestId(),
            timestamp: new Date().toISOString()
          };
          
          if (this.isProduction) {
            this.addToBuffer('info', 'HTTP Response', responseData);
          } else {
            this.logger.info('HTTP Response', responseData);
          }
        });

        return originalSend.call(res, data);
      };

      next();
    };
  }

  // Error logging middleware with enhanced metadata
  errorLogger() {
    return (err, req, res, next) => {
      const errorId = this.generateErrorId();
      
      this.measureLogPerformance(() => {
        const errorData = {
          errorId,
          message: err.message,
          stack: this.isProduction ? 'Hidden in production' : err.stack,
          method: req.method,
          url: req.originalUrl,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          requestId: req.id || this.generateRequestId(),
          timestamp: new Date().toISOString(),
          body: this.isProduction ? {} : req.body,
          headers: this.isProduction ? {} : req.headers,
          service: 'smart-ecommerce-api',
          version: '1.0.0',
          environment: configService.get('NODE_ENV')
        };
        
        if (this.isProduction) {
          this.addToBuffer('error', 'Application Error', errorData);
        } else {
          this.logger.error('Application Error', errorData);
        }
      });

      // Don't send error details in production
      if (this.isProduction) {
        res.status(500).json({
          error: 'Internal server error',
          errorId
        });
      } else {
        next(err);
      }
    };
  }

  // Authentication logging with sampling
  logAuth(event, userId, details = {}) {
    if (!this.shouldSampleLog('info')) return;
    
    this.measureLogPerformance(() => {
      const authData = {
        event,
        userId,
        ip: details.ip,
        userAgent: details.userAgent,
        timestamp: new Date().toISOString(),
        service: 'smart-ecommerce-api',
        version: '1.0.0',
        environment: configService.get('NODE_ENV'),
        ...details
      };
      
      if (this.isProduction) {
        this.addToBuffer('info', 'Authentication Event', authData);
      } else {
        this.logger.info('Authentication Event', authData);
      }
    });
  }

  // Database logging with performance monitoring
  logDatabase(operation, table, details = {}) {
    if (!this.shouldSampleLog('info')) return;
    
    this.measureLogPerformance(() => {
      const dbData = {
        operation,
        table,
        duration: details.duration,
        affected: details.affected,
        timestamp: new Date().toISOString(),
        service: 'smart-ecommerce-api',
        version: '1.0.0',
        environment: configService.get('NODE_ENV'),
        ...details
      };
      
      if (this.isProduction) {
        this.addToBuffer('info', 'Database Operation', dbData);
      } else {
        this.logger.info('Database Operation', dbData);
      }
    });
  }

  // Payment logging with enhanced metadata
  logPayment(event, details = {}) {
    // Always log payment events (no sampling)
    this.measureLogPerformance(() => {
      const paymentData = {
        event,
        paymentMethod: details.paymentMethod,
        amount: details.amount,
        currency: details.currency,
        status: details.status,
        transactionId: details.transactionId,
        timestamp: new Date().toISOString(),
        service: 'smart-ecommerce-api',
        version: '1.0.0',
        environment: configService.get('NODE_ENV'),
        ...details
      };
      
      if (this.isProduction) {
        this.addToBuffer('info', 'Payment Event', paymentData);
      } else {
        this.logger.info('Payment Event', paymentData);
      }
    });
  }

  // Order logging with sampling
  logOrder(event, orderId, details = {}) {
    if (!this.shouldSampleLog('info')) return;
    
    this.measureLogPerformance(() => {
      const orderData = {
        event,
        orderId,
        userId: details.userId,
        total: details.total,
        status: details.status,
        timestamp: new Date().toISOString(),
        service: 'smart-ecommerce-api',
        version: '1.0.0',
        environment: configService.get('NODE_ENV'),
        ...details
      };
      
      if (this.isProduction) {
        this.addToBuffer('info', 'Order Event', orderData);
      } else {
        this.logger.info('Order Event', orderData);
      }
    });
  }

  // Security logging (always logged)
  logSecurity(event, details = {}) {
    this.measureLogPerformance(() => {
      const securityData = {
        event,
        ip: details.ip,
        userAgent: details.userAgent,
        reason: details.reason,
        timestamp: new Date().toISOString(),
        service: 'smart-ecommerce-api',
        version: '1.0.0',
        environment: configService.get('NODE_ENV'),
        ...details
      };
      
      if (this.isProduction) {
        this.addToBuffer('warn', 'Security Event', securityData);
      } else {
        this.logger.warn('Security Event', securityData);
      }
    });
  }

  // Performance logging with metrics
  logPerformance(operation, duration, details = {}) {
    this.measureLogPerformance(() => {
      const perfData = {
        operation,
        duration: `${duration}ms`,
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString(),
        service: 'smart-ecommerce-api',
        version: '1.0.0',
        environment: configService.get('NODE_ENV'),
        loggerMetrics: this.performanceMetrics,
        ...details
      };
      
      if (this.isProduction) {
        this.addToBuffer('info', 'Performance Metric', perfData);
      } else {
        this.logger.info('Performance Metric', perfData);
      }
    });
  }

  // Business logic logging with sampling
  logBusiness(event, details = {}) {
    if (!this.shouldSampleLog('info')) return;
    
    this.measureLogPerformance(() => {
      const businessData = {
        event,
        timestamp: new Date().toISOString(),
        service: 'smart-ecommerce-api',
        version: '1.0.0',
        environment: configService.get('NODE_ENV'),
        ...details
      };
      
      if (this.isProduction) {
        this.addToBuffer('info', 'Business Event', businessData);
      } else {
        this.logger.info('Business Event', businessData);
      }
    });
  }

  // Generate unique request ID
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate unique error ID
  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get logger instance
  getLogger() {
    return this.logger;
  }

  // Create child logger with context
  child(context) {
    return this.logger.child(context);
  }

  // Stream for Morgan HTTP logger
  stream() {
    return {
      write: (message) => {
        if (this.shouldSampleLog('info')) {
          if (this.isProduction) {
            this.addToBuffer('info', message.trim());
          } else {
            this.logger.info(message.trim());
          }
        }
      }
    };
  }

  // Log levels with performance monitoring and sampling
  debug(message, meta = {}) {
    if (!this.shouldSampleLog('debug')) return;
    
    this.measureLogPerformance(() => {
      if (this.isProduction) {
        this.addToBuffer('debug', message, meta);
      } else {
        this.logger.debug(message, meta);
      }
    });
  }

  info(message, meta = {}) {
    if (!this.shouldSampleLog('info')) return;
    
    this.measureLogPerformance(() => {
      if (this.isProduction) {
        this.addToBuffer('info', message, meta);
      } else {
        this.logger.info(message, meta);
      }
    });
  }

  warn(message, meta = {}) {
    this.measureLogPerformance(() => {
      if (this.isProduction) {
        this.addToBuffer('warn', message, meta);
      } else {
        this.logger.warn(message, meta);
      }
    });
  }

  error(message, meta = {}) {
    this.measureLogPerformance(() => {
      if (this.isProduction) {
        this.addToBuffer('error', message, meta);
      } else {
        this.logger.error(message, meta);
      }
    });
  }

  // Enhanced structured logging with metadata
  logStructured(level, message, data = {}) {
    this.measureLogPerformance(() => {
      const structuredData = {
        service: 'smart-ecommerce-api',
        version: '1.0.0',
        environment: configService.get('NODE_ENV'),
        instanceId: process.env.INSTANCE_ID || 'default',
        timestamp: new Date().toISOString(),
        ...data
      };
      
      if (this.isProduction) {
        this.addToBuffer(level, message, structuredData);
      } else {
        this.logger.log(level, message, structuredData);
      }
    });
  }

  // Query logging with sampling
  logQuery(query, params = [], duration = null) {
    if (!this.shouldSampleLog('debug')) return;
    
    this.measureLogPerformance(() => {
      const queryData = {
        query,
        params,
        duration: duration ? `${duration}ms` : null,
        timestamp: new Date().toISOString(),
        service: 'smart-ecommerce-api',
        version: '1.0.0',
        environment: configService.get('NODE_ENV')
      };
      
      if (this.isProduction) {
        this.addToBuffer('debug', 'Database Query', queryData);
      } else {
        this.logger.debug('Database Query', queryData);
      }
    });
  }

  // Cache logging with sampling
  logCache(operation, key, hit = null, duration = null) {
    if (!this.shouldSampleLog('debug')) return;
    
    this.measureLogPerformance(() => {
      const cacheData = {
        operation,
        key,
        hit,
        duration: duration ? `${duration}ms` : null,
        timestamp: new Date().toISOString(),
        service: 'smart-ecommerce-api',
        version: '1.0.0',
        environment: configService.get('NODE_ENV')
      };
      
      if (this.isProduction) {
        this.addToBuffer('debug', 'Cache Operation', cacheData);
      } else {
        this.logger.debug('Cache Operation', cacheData);
      }
    });
  }

  // External service logging
  logExternal(service, operation, details = {}) {
    this.measureLogPerformance(() => {
      const externalData = {
        service,
        operation,
        duration: details.duration,
        status: details.status,
        timestamp: new Date().toISOString(),
        service: 'smart-ecommerce-api',
        version: '1.0.0',
        environment: configService.get('NODE_ENV'),
        ...details
      };
      
      if (this.isProduction) {
        this.addToBuffer('info', 'External Service Call', externalData);
      } else {
        this.logger.info('External Service Call', externalData);
      }
    });
  }

  // Get performance metrics
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      bufferSize: this.logBuffer.length,
      isProduction: this.isProduction
    };
  }

  // Parse size string to bytes
  parseSize(sizeStr) {
    const units = { b: 1, k: 1024, m: 1024 * 1024, g: 1024 * 1024 * 1024 };
    const match = sizeStr.toLowerCase().match(/^(\d+)([bkmg]?)$/);
    if (!match) return 10 * 1024 * 1024; // Default 10MB
    const [, size, unit] = match;
    return parseInt(size) * (units[unit] || 1);
  }

  // Cleanup with buffer flush
  cleanup() {
    this.flushBuffer();
    this.logger.info('Logger cleanup completed');
  }
}

// Singleton instance
const loggerService = new LoggerService();

module.exports = {
  LoggerService,
  loggerService
};