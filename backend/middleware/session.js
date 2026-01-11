const { sessionService } = require('../services/sessionService');
const { loggerService } = require('../services/logger');

class SessionMiddleware {
  constructor() {
    this.sessionService = sessionService;
    this.logger = loggerService;
  }

  // Main session authentication middleware
  authenticate(options = {}) {
    return async (req, res, next) => {
      try {
        // Get session ID from header or cookie
        const sessionId = this.getSessionId(req);
        
        if (!sessionId) {
          return this.handleNoSession(req, res, options);
        }

        // Validate session
        const validation = await this.sessionService.validateSession(sessionId, req);
        
        if (!validation.valid) {
          return this.handleInvalidSession(req, res, validation.reason, options);
        }

        // Attach session data to request
        req.session = validation.session;
        req.sessionId = sessionId;
        req.userId = validation.session.userId;

        // Log successful session validation
        this.logger.logAuth('Session Validated', validation.session.userId, {
          sessionId,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.originalUrl
        });

        next();

      } catch (error) {
        this.logger.error('Session middleware error', error.message, {
          ip: req.ip,
          path: req.originalUrl
        });

        return res.status(500).json({
          error: 'Session validation failed',
          message: 'Unable to validate session at this time',
          timestamp: new Date().toISOString()
        });
      }
    };
  }

  // Optional session authentication (guest access allowed)
  optional(options = {}) {
    return async (req, res, next) => {
      try {
        const sessionId = this.getSessionId(req);
        
        if (!sessionId) {
          // No session provided, continue as guest
          req.session = null;
          req.sessionId = null;
          req.userId = null;
          return next();
        }

        // Try to validate session
        const validation = await this.sessionService.validateSession(sessionId, req);
        
        if (validation.valid) {
          req.session = validation.session;
          req.sessionId = sessionId;
          req.userId = validation.session.userId;
        } else {
          // Invalid session, continue as guest
          req.session = null;
          req.sessionId = null;
          req.userId = null;
          
          this.logger.warn('Invalid optional session', validation.reason, {
            sessionId,
            ip: req.ip,
            userAgent: req.get('User-Agent')
          });
        }

        next();

      } catch (error) {
        this.logger.error('Optional session middleware error', error.message);
        
        // Continue as guest on error
        req.session = null;
        req.sessionId = null;
        req.userId = null;
        next();
      }
    };
  }

  // Require valid session (no guest access)
  required(options = {}) {
    return this.authenticate(options);
  }

  // Session must be fresh (no old sessions)
  requireFresh(options = {}) {
    return async (req, res, next) => {
      const sessionId = this.getSessionId(req);
      
      if (!sessionId) {
        return this.handleNoSession(req, res, options);
      }

      const validation = await this.sessionService.validateSession(sessionId, req);
      
      if (!validation.valid) {
        return this.handleInvalidSession(req, res, validation.reason, options);
      }

      // Check if session is fresh (last activity within specified time)
      const maxAge = options.maxAge || 30 * 60 * 1000; // 30 minutes default
      const sessionAge = Date.now() - validation.session.lastActivity.getTime();
      
      if (sessionAge > maxAge) {
        return this.handleStaleSession(req, res, validation.session, options);
      }

      // Attach session data
      req.session = validation.session;
      req.sessionId = sessionId;
      req.userId = validation.session.userId;

      next();
    };
  }

  // Session with specific security level
  requireSecurityLevel(minLevel = 'standard') {
    return async (req, res, next) => {
      const sessionId = this.getSessionId(req);
      
      if (!sessionId) {
        return this.handleNoSession(req, res);
      }

      const validation = await this.sessionService.validateSession(sessionId, req);
      
      if (!validation.valid) {
        return this.handleInvalidSession(req, res, validation.reason);
      }

      // Check security level
      const sessionSecurityLevel = validation.session.securityLevel || 'standard';
      const securityLevels = ['low', 'standard', 'high'];
      const sessionLevelIndex = securityLevels.indexOf(sessionSecurityLevel);
      const requiredLevelIndex = securityLevels.indexOf(minLevel);
      
      if (sessionLevelIndex < requiredLevelIndex) {
        return res.status(403).json({
          error: 'Insufficient security level',
          message: 'This action requires a higher security level session',
          requiredLevel: minLevel,
          currentLevel: sessionSecurityLevel
        });
      }

      // Attach session data
      req.session = validation.session;
      req.sessionId = sessionId;
      req.userId = validation.session.userId;

      next();
    };
  }

  // Get session ID from various sources
  getSessionId(req) {
    // Try Authorization header first (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Try X-Session-ID header
    const sessionHeader = req.headers['x-session-id'];
    if (sessionHeader) {
      return sessionHeader;
    }

    // Try cookies
    if (req.cookies && req.cookies.sessionId) {
      return req.cookies.sessionId;
    }

    // Try remember me cookie validation for auto-login
    if (req.cookies && req.cookies.rememberMe && !req.cookies.sessionId) {
      // This would need to be implemented with remember me token validation
      // For now, return null to force fresh login
      this.logger.info('Remember me cookie detected but no session ID', {
        rememberMeCookie: req.cookies.rememberMe,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    }

    // Try query parameter (only for specific cases like email verification links)
    if (req.query.session_id) {
      return req.query.session_id;
    }

    return null;
  }

  // Handle missing session
  handleNoSession(req, res, options = {}) {
    const isApiRequest = req.xhr || req.headers.accept?.includes('application/json');
    
    if (isApiRequest) {
      return res.status(401).json({
        error: 'Authentication required',
        message: options.message || 'Session is required to access this resource',
        code: 'SESSION_REQUIRED',
        timestamp: new Date().toISOString()
      });
    } else {
      // Redirect to login for web requests
      const loginUrl = options.loginUrl || '/login';
      const returnUrl = encodeURIComponent(req.originalUrl);
      return res.redirect(`${loginUrl}?redirect=${returnUrl}`);
    }
  }

  // Handle invalid session
  handleInvalidSession(req, res, reason, options = {}) {
    const isApiRequest = req.xhr || req.headers.accept?.includes('application/json');
    
    this.logger.logSecurity('Invalid Session Access Attempt', null, {
      sessionId: this.getSessionId(req),
      reason,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.originalUrl
    });

    if (isApiRequest) {
      return res.status(401).json({
        error: 'Invalid session',
        message: options.message || 'Your session is invalid or has expired',
        code: 'SESSION_INVALID',
        reason,
        timestamp: new Date().toISOString()
      });
    } else {
      // Redirect to login for web requests
      const loginUrl = options.loginUrl || '/login';
      const returnUrl = encodeURIComponent(req.originalUrl);
      return res.redirect(`${loginUrl}?redirect=${returnUrl}&error=session_expired`);
    }
  }

  // Handle stale session
  handleStaleSession(req, res, session, options = {}) {
    const isApiRequest = req.xhr || req.headers.accept?.includes('application/json');
    
    this.logger.logSecurity('Stale Session Access Attempt', session.userId, {
      sessionId: session.sessionId,
      sessionAge: Date.now() - session.lastActivity.getTime(),
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.originalUrl
    });

    if (isApiRequest) {
      return res.status(401).json({
        error: 'Session stale',
        message: options.message || 'Your session is too old, please login again',
        code: 'SESSION_STALE',
        timestamp: new Date().toISOString()
      });
    } else {
      // Redirect to login for web requests
      const loginUrl = options.loginUrl || '/login';
      const returnUrl = encodeURIComponent(req.originalUrl);
      return res.redirect(`${loginUrl}?redirect=${returnUrl}&error=session_stale`);
    }
  }

  // Session rate limiting middleware
  rateLimit(options = {}) {
    return async (req, res, next) => {
      try {
        if (!req.sessionId) {
          return next(); // No session, skip rate limiting
        }

        const config = {
          windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
          max: options.max || 100, // 100 requests per window
          message: options.message || 'Too many requests from this session'
        };

        // Use session ID for rate limiting key
        const key = `session_rate_limit:${req.sessionId}`;
        const now = Date.now();
        const windowStart = now - config.windowMs;

        // This would typically use Redis, but for now we'll implement a simple version
        // In production, you'd want to use the authMiddleware's rateLimit with session key
        next();

      } catch (error) {
        this.logger.error('Session rate limiting error', error.message);
        next(); // Fail open
      }
    };
  }

  // Session activity tracking middleware
  trackActivity(options = {}) {
    return async (req, res, next) => {
      // Track session activity after response is sent
      res.on('finish', async () => {
        try {
          if (req.sessionId && req.session) {
            // Update last activity time
            await this.sessionService.refreshSession(req.sessionId, req, {
              maxAge: options.extendSession || false
            });
          }
        } catch (error) {
          this.logger.error('Session activity tracking error', error.message);
        }
      });

      next();
    };
  }

  // Session cleanup middleware (for logout)
  cleanup() {
    return async (req, res, next) => {
      // Store original end function
      const originalEnd = res.end;
      
      // Override end function to cleanup after response
      res.end = async function(data) {
        try {
          // Call session cleanup if session exists
          if (req.sessionId) {
            await sessionService.destroySession(req.sessionId, 'request_complete');
          }
        } catch (error) {
          loggerService.error('Session cleanup error', error.message);
        }
        
        // Call original end function
        originalEnd.call(this, data);
      };

      next();
    };
  }

  // Generate session response headers
  sessionHeaders(session) {
    return {
      'X-Session-ID': session.sessionId,
      'X-Session-Expires-At': session.expiresAt.toISOString(),
      'X-Session-Max-Age': session.maxAge?.toString() || '',
      'X-Session-Security-Level': session.securityLevel || 'standard'
    };
  }

  // Set session cookie
  setSessionCookie(res, sessionId, options = {}) {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: options.maxAge || 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
      ...options
    };

    // Set main session cookie
    res.cookie('sessionId', sessionId, cookieOptions);

    // Set remember me cookie if requested
    if (options.rememberMe) {
      const rememberMeOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: '/'
      };
      
      // Create a remember me identifier (hashed for security)
      const rememberMeId = require('crypto')
        .createHash('sha256')
        .update(`${sessionId}:${Date.now()}`)
        .digest('hex')
        .substring(0, 32);

      res.cookie('rememberMe', rememberMeId, rememberMeOptions);
      
      // Also set a flag for client-side
      res.cookie('rememberMeEnabled', 'true', {
        httpOnly: false, // Allow JavaScript access
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: '/'
      });
    } else {
      // Clear any existing remember me cookies
      res.clearCookie('rememberMe', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });
      res.clearCookie('rememberMeEnabled', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });
    }
  }

  // Clear session cookie
  clearSessionCookie(res) {
    res.clearCookie('sessionId', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });

    // Also clear remember me cookies
    res.clearCookie('rememberMe', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });
    res.clearCookie('rememberMeEnabled', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });
  }
}

// Singleton instance
const sessionMiddleware = new SessionMiddleware();

module.exports = {
  SessionMiddleware,
  sessionMiddleware
};