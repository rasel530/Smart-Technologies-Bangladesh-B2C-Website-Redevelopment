const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { configService } = require('./config');
const { loggerService } = require('./logger');
const { redisConnectionPool } = require('./redisConnectionPool');

class SessionService {
  constructor() {
    this.prisma = new PrismaClient();
    this.redis = null;
    this.config = configService;
    this.logger = loggerService;
    this.initializeRedis();
  }

  async initializeRedis() {
    try {
      // Initialize Redis connection pool
      await redisConnectionPool.initialize();
      
      // Get shared Redis client for session service
      this.redis = redisConnectionPool.getClient('sessionService');
      
      if (!this.redis) {
        this.logger.warn('Redis client not available, session management will use database only');
        return;
      }

      this.logger.info('Session service using shared Redis connection');
    } catch (error) {
      this.logger.error('Failed to initialize Redis for session service', error.message);
      this.redis = null;
    }
  }

  // Generate secure session ID
  generateSessionId() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Generate device fingerprint
  generateDeviceFingerprint(req) {
    const userAgent = req.get('User-Agent') || '';
    const acceptLanguage = req.get('Accept-Language') || '';
    const acceptEncoding = req.get('Accept-Encoding') || '';
    
    const fingerprint = crypto
      .createHash('sha256')
      .update(`${userAgent}|${acceptLanguage}|${acceptEncoding}`)
      .digest('hex');
    
    return fingerprint.substring(0, 32); // Truncate for storage efficiency
  }

  // Create new session
  async createSession(userId, req, options = {}) {
    try {
      const sessionId = this.generateSessionId();
      const deviceFingerprint = this.generateDeviceFingerprint(req);
      const now = new Date();
      
      // Enhanced session configuration for remember me functionality
      const defaultMaxAge = options.rememberMe ?
        7 * 24 * 60 * 60 * 1000 : // 7 days for remember me
        24 * 60 * 60 * 1000;  // 24 hours default
      
      const sessionConfig = {
        userId,
        sessionId,
        deviceFingerprint,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        createdAt: now,
        lastActivity: now,
        expiresAt: new Date(now.getTime() + (options.maxAge || defaultMaxAge)),
        isActive: true,
        loginType: options.loginType || 'password',
        rememberMe: options.rememberMe || false,
        securityLevel: options.securityLevel || 'standard',
        // Enhanced remember me features
        persistent: options.rememberMe || false,
        deviceTrusted: options.rememberMe || false,
        maxAge: options.maxAge || defaultMaxAge
      };

      // Store in Redis if available
      if (this.redis) {
        const sessionKey = `session:${sessionId}`;
        const ttl = Math.floor((sessionConfig.expiresAt.getTime() - now.getTime()) / 1000);
        
        await this.redis.setEx(sessionKey, ttl, JSON.stringify(sessionConfig));
        
        // Also store user session index for easy lookup
        const userSessionsKey = `user_sessions:${userId}`;
        await this.redis.zAdd(userSessionsKey, [{ 
          score: now.getTime(), 
          value: sessionId 
        }]);
        await this.redis.expire(userSessionsKey, 7 * 24 * 60 * 60); // 7 days
        
        this.logger.info('Session created in Redis', { sessionId, userId });
      } else {
        // Fallback to database
        await this.prisma.userSession.create({
          data: {
            userId,
            token: sessionId,
            expiresAt: sessionConfig.expiresAt
          }
        });
        
        this.logger.info('Session created in database', { sessionId, userId });
      }

      // Log session creation with enhanced remember me details
      this.logger.logSecurity('Session Created', userId, {
        sessionId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        loginType: options.loginType,
        rememberMe: options.rememberMe,
        persistent: sessionConfig.persistent,
        maxAge: sessionConfig.maxAge,
        expiresAt: sessionConfig.expiresAt
      });

      return {
        sessionId,
        expiresAt: sessionConfig.expiresAt,
        maxAge: sessionConfig.maxAge,
        rememberMe: sessionConfig.rememberMe,
        persistent: sessionConfig.persistent
      };

    } catch (error) {
      this.logger.error('Failed to create session', error.message);
      throw new Error('Session creation failed');
    }
  }

  // Validate session
  async validateSession(sessionId, req) {
    try {
      if (!sessionId) {
        return { valid: false, reason: 'No session ID provided' };
      }

      let sessionData = null;

      // Try Redis first
      if (this.redis) {
        const sessionKey = `session:${sessionId}`;
        const sessionString = await this.redis.get(sessionKey);
        
        if (sessionString) {
          sessionData = JSON.parse(sessionString);
        }
      } else {
        // Fallback to database
        const session = await this.prisma.userSession.findUnique({
          where: { token: sessionId },
          include: { user: true }
        });

        if (session && session.expiresAt > new Date()) {
          sessionData = {
            userId: session.userId,
            sessionId,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            createdAt: session.createdAt,
            lastActivity: session.createdAt,
            expiresAt: session.expiresAt,
            isActive: true
          };
        }
      }

      if (!sessionData) {
        this.logger.logSecurity('Invalid Session Attempt', null, {
          sessionId,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.originalUrl
        });
        return { valid: false, reason: 'Session not found or expired' };
      }

      // Check expiration
      const now = new Date();
      if (sessionData.expiresAt && now > sessionData.expiresAt) {
        await this.destroySession(sessionId);
        return { valid: false, reason: 'Session expired' };
      }

      // Security checks
      const securityChecks = this.performSecurityChecks(sessionData, req);
      if (!securityChecks.passed) {
        await this.destroySession(sessionId);
        this.logger.logSecurity('Session Security Check Failed', sessionData.userId, {
          sessionId,
          reason: securityChecks.reason,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        return { valid: false, reason: securityChecks.reason };
      }

      // Update last activity
      sessionData.lastActivity = now;
      if (this.redis) {
        const sessionKey = `session:${sessionId}`;
        const ttl = Math.floor((sessionData.expiresAt.getTime() - now.getTime()) / 1000);
        await this.redis.setEx(sessionKey, ttl, JSON.stringify(sessionData));
      }

      return {
        valid: true,
        session: sessionData,
        userId: sessionData.userId
      };

    } catch (error) {
      this.logger.error('Session validation error', error.message);
      return { valid: false, reason: 'Session validation failed' };
    }
  }

  // Perform security checks on session
  performSecurityChecks(sessionData, req) {
    // IP address validation (optional, can be disabled for mobile networks)
    if (sessionData.ip && sessionData.ip !== req.ip) {
      // Allow some flexibility for mobile networks
      const ipChanged = !this.isIPChangeAllowed(sessionData.ip, req.ip);
      if (ipChanged) {
        return { passed: false, reason: 'IP address mismatch' };
      }
    }

    // User Agent validation
    if (sessionData.userAgent && sessionData.userAgent !== req.get('User-Agent')) {
      return { passed: false, reason: 'User agent mismatch' };
    }

    // Device fingerprint validation
    const currentFingerprint = this.generateDeviceFingerprint(req);
    if (sessionData.deviceFingerprint && sessionData.deviceFingerprint !== currentFingerprint) {
      return { passed: false, reason: 'Device fingerprint mismatch' };
    }

    return { passed: true };
  }

  // Check if IP change is allowed (for mobile networks)
  isIPChangeAllowed(oldIP, newIP) {
    // Allow changes within same subnet or geographic region
    // This is a simplified implementation
    const oldParts = oldIP.split('.');
    const newParts = newIP.split('.');
    
    // Allow changes if first two octets are the same (same subnet)
    return oldParts.length === 4 && newParts.length === 4 && 
           oldParts[0] === newParts[0] && oldParts[1] === newParts[1];
  }

  // Refresh/extend session
  async refreshSession(sessionId, req, options = {}) {
    try {
      const validation = await this.validateSession(sessionId, req);
      if (!validation.valid) {
        return { success: false, reason: validation.reason };
      }

      const session = validation.session;
      const now = new Date();
      const newExpiry = new Date(now.getTime() + (options.maxAge || 24 * 60 * 60 * 1000));

      session.lastActivity = now;
      session.expiresAt = newExpiry;

      // Update in Redis
      if (this.redis) {
        const sessionKey = `session:${sessionId}`;
        const ttl = Math.floor((newExpiry.getTime() - now.getTime()) / 1000);
        await this.redis.setEx(sessionKey, ttl, JSON.stringify(session));
      } else {
        // Update in database
        await this.prisma.userSession.update({
          where: { token: sessionId },
          data: { expiresAt: newExpiry }
        });
      }

      this.logger.logSecurity('Session Refreshed', session.userId, {
        sessionId,
        ip: req.ip,
        newExpiry: newExpiry.toISOString()
      });

      return {
        success: true,
        sessionId,
        expiresAt: newExpiry,
        maxAge: options.maxAge || 24 * 60 * 60 * 1000
      };

    } catch (error) {
      this.logger.error('Session refresh error', error.message);
      return { success: false, reason: 'Session refresh failed' };
    }
  }

  // Destroy session
  async destroySession(sessionId, reason = 'logout') {
    try {
      // Remove from Redis
      if (this.redis) {
        const sessionKey = `session:${sessionId}`;
        const sessionString = await this.redis.get(sessionKey);
        
        if (sessionString) {
          const sessionData = JSON.parse(sessionString);
          const userSessionsKey = `user_sessions:${sessionData.userId}`;
          
          // Remove from user sessions index
          await this.redis.zRem(userSessionsKey, sessionId);
          await this.redis.del(sessionKey);
          
          this.logger.logSecurity('Session Destroyed', sessionData.userId, {
            sessionId,
            reason,
            ip: sessionData.ip
          });
        }
      } else {
        // Remove from database
        const session = await this.prisma.userSession.findUnique({
          where: { token: sessionId }
        });

        if (session) {
          await this.prisma.userSession.delete({
            where: { id: session.id }
          });
          
          this.logger.logSecurity('Session Destroyed', session.userId, {
            sessionId,
            reason
          });
        }
      }

      return { success: true };

    } catch (error) {
      this.logger.error('Session destruction error', error.message);
      return { success: false, reason: 'Session destruction failed' };
    }
  }

  // Destroy all user sessions (except current)
  async destroyAllUserSessions(userId, exceptSessionId = null) {
    try {
      let destroyedSessions = [];

      if (this.redis) {
        const userSessionsKey = `user_sessions:${userId}`;
        const sessionIds = await this.redis.zRange(userSessionsKey, 0, -1);
        
        for (const sessionId of sessionIds) {
          if (sessionId !== exceptSessionId) {
            await this.destroySession(sessionId, 'mass_logout');
            destroyedSessions.push(sessionId);
          }
        }
      } else {
        // Database fallback
        const sessions = await this.prisma.userSession.findMany({
          where: { 
            userId,
            ...(exceptSessionId && { token: { not: exceptSessionId } })
          }
        });

        for (const session of sessions) {
          await this.destroySession(session.token, 'mass_logout');
          destroyedSessions.push(session.token);
        }
      }

      this.logger.logSecurity('All User Sessions Destroyed', userId, {
        destroyedCount: destroyedSessions.length,
        exceptSessionId
      });

      return { success: true, destroyedCount: destroyedSessions.length };

    } catch (error) {
      this.logger.error('Mass session destruction error', error.message);
      return { success: false, reason: 'Mass session destruction failed' };
    }
  }

  // Get active sessions for user
  async getUserSessions(userId) {
    try {
      let sessions = [];

      if (this.redis) {
        const userSessionsKey = `user_sessions:${userId}`;
        const sessionIds = await this.redis.zRange(userSessionsKey, 0, -1);
        
        for (const sessionId of sessionIds) {
          const sessionKey = `session:${sessionId}`;
          const sessionString = await this.redis.get(sessionKey);
          
          if (sessionString) {
            const sessionData = JSON.parse(sessionString);
            if (sessionData.expiresAt > new Date()) {
              sessions.push({
                sessionId,
                createdAt: sessionData.createdAt,
                lastActivity: sessionData.lastActivity,
                expiresAt: sessionData.expiresAt,
                ip: sessionData.ip,
                userAgent: sessionData.userAgent,
                loginType: sessionData.loginType,
                isActive: sessionData.isActive
              });
            }
          }
        }
      } else {
        // Database fallback
        const dbSessions = await this.prisma.userSession.findMany({
          where: { 
            userId,
            expiresAt: { gt: new Date() }
          },
          orderBy: { createdAt: 'desc' }
        });

        sessions = dbSessions.map(session => ({
          sessionId: session.token,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
          isActive: true
        }));
      }

      return { success: true, sessions };

    } catch (error) {
      this.logger.error('Get user sessions error', error.message);
      return { success: false, reason: 'Failed to retrieve user sessions' };
    }
  }

  // Cleanup expired sessions
  async cleanupExpiredSessions() {
    try {
      let cleanedCount = 0;

      if (this.redis) {
        // Redis handles expiration automatically, but we can clean up user session indexes
        const pattern = 'user_sessions:*';
        const keys = await this.redis.keys(pattern);
        
        for (const key of keys) {
          const sessionIds = await this.redis.zRange(key, 0, -1);
          const validSessions = [];
          
          for (const sessionId of sessionIds) {
            const sessionKey = `session:${sessionId}`;
            const exists = await this.redis.exists(sessionKey);
            if (exists) {
              validSessions.push(sessionId);
            }
          }
          
          // Update user sessions index with only valid sessions
          await this.redis.del(key);
          if (validSessions.length > 0) {
            await this.redis.zAdd(key, validSessions.map(id => ({ score: Date.now(), value: id })));
          }
          
          cleanedCount += sessionIds.length - validSessions.length;
        }
      } else {
        // Database cleanup
        const result = await this.prisma.userSession.deleteMany({
          where: { expiresAt: { lt: new Date() } }
        });
        cleanedCount = result.count;
      }

      this.logger.info('Session cleanup completed', {
        cleanedCount,
        timestamp: new Date().toISOString()
      });

      return { success: true, cleanedCount };

    } catch (error) {
      this.logger.error('Session cleanup error', error.message);
      return { success: false, reason: 'Session cleanup failed' };
    }
  }

  // Get session statistics
  async getSessionStats() {
    try {
      let stats = {
        totalSessions: 0,
        activeSessions: 0,
        expiredSessions: 0,
        redisAvailable: this.redis !== null
      };

      if (this.redis) {
        const pattern = 'session:*';
        const keys = await this.redis.keys(pattern);
        stats.totalSessions = keys.length;
        
        const now = new Date();
        for (const key of keys) {
          const sessionString = await this.redis.get(key);
          if (sessionString) {
            const sessionData = JSON.parse(sessionString);
            if (sessionData.expiresAt > now) {
              stats.activeSessions++;
            } else {
              stats.expiredSessions++;
            }
          }
        }
      } else {
        // Database stats
        const [total, active] = await Promise.all([
          this.prisma.userSession.count(),
          this.prisma.userSession.count({
            where: { expiresAt: { gt: new Date() } }
          })
        ]);
        
        stats.totalSessions = total;
        stats.activeSessions = active;
        stats.expiredSessions = total - active;
      }

      return { success: true, stats };

    } catch (error) {
      this.logger.error('Session stats error', error.message);
      return { success: false, reason: 'Failed to get session statistics' };
    }
  }

  // Validate remember me token
  async validateRememberMeToken(token) {
    try {
      if (!token) {
        return { valid: false, reason: 'No remember me token provided' };
      }

      // Try Redis first
      if (this.redis) {
        const tokenKey = `remember_me:${token}`;
        const tokenString = await this.redis.get(tokenKey);
        
        if (tokenString) {
          const tokenData = JSON.parse(tokenString);
          
          // Check if token has expired
          if (tokenData.expiresAt && new Date() > tokenData.expiresAt) {
            await this.redis.del(tokenKey);
            return { valid: false, reason: 'Remember me token expired' };
          }
          
          return {
            valid: true,
            userId: tokenData.userId,
            deviceFingerprint: tokenData.deviceFingerprint,
            createdAt: tokenData.createdAt
          };
        }
      } else {
        // Database fallback for remember me tokens
        const rememberMeToken = await this.prisma.rememberMeToken.findUnique({
          where: { token },
          include: { user: true }
        });

        if (!rememberMeToken || rememberMeToken.expiresAt < new Date()) {
          return { valid: false, reason: 'Remember me token not found or expired' };
        }

        return {
          valid: true,
          userId: rememberMeToken.userId,
          deviceFingerprint: rememberMeToken.deviceFingerprint,
          createdAt: rememberMeToken.createdAt
        };
      }

    } catch (error) {
      this.logger.error('Remember me token validation error', error.message);
      return { valid: false, reason: 'Token validation failed' };
    }
  }

  // Create remember me token
  async createRememberMeToken(userId, req) {
    try {
      const token = this.generateSessionId(); // Use same secure generation
      const deviceFingerprint = this.generateDeviceFingerprint(req);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days

      const tokenData = {
        userId,
        token,
        deviceFingerprint,
        createdAt: now,
        expiresAt,
        isActive: true
      };

      // Store in Redis if available
      if (this.redis) {
        const tokenKey = `remember_me:${token}`;
        const ttl = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);
        await this.redis.setEx(tokenKey, ttl, JSON.stringify(tokenData));
        
        // Also store user remember me tokens index
        const userTokensKey = `user_remember_me:${userId}`;
        await this.redis.zAdd(userTokensKey, [{
          score: now.getTime(),
          value: token
        }]);
        await this.redis.expire(userTokensKey, 30 * 24 * 60 * 60); // 30 days
      } else {
        // Database fallback - would need to create rememberMeToken table
        this.logger.warn('Remember me tokens require Redis for full functionality');
      }

      this.logger.logSecurity('Remember Me Token Created', userId, {
        token,
        deviceFingerprint,
        expiresAt: expiresAt.toISOString(),
        ip: req.ip
      });

      return {
        success: true,
        token,
        expiresAt
      };

    } catch (error) {
      this.logger.error('Failed to create remember me token', error.message);
      return { success: false, reason: 'Token creation failed' };
    }
  }

  // Refresh session using remember me token
  async refreshFromRememberMeToken(token, req) {
    try {
      const validation = await this.validateRememberMeToken(token);
      
      if (!validation.valid) {
        return { success: false, reason: validation.reason };
      }

      // Verify device fingerprint matches
      const currentFingerprint = this.generateDeviceFingerprint(req);
      if (validation.deviceFingerprint !== currentFingerprint) {
        this.logger.logSecurity('Remember Me Device Mismatch', validation.userId, {
          token,
          expectedFingerprint: validation.deviceFingerprint,
          actualFingerprint: currentFingerprint,
          ip: req.ip
        });
        return { success: false, reason: 'Device fingerprint mismatch' };
      }

      // Create new session
      const sessionResult = await this.createSession(validation.userId, req, {
        loginType: 'remember_me',
        rememberMe: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days for remembered sessions
        securityLevel: 'standard'
      });

      if (!sessionResult.sessionId) {
        return { success: false, reason: 'Failed to create session from remember me token' };
      }

      // Clean up old remember me token for security
      if (this.redis) {
        const tokenKey = `remember_me:${token}`;
        await this.redis.del(tokenKey);
      }

      this.logger.logSecurity('Session Refreshed from Remember Me', validation.userId, {
        newSessionId: sessionResult.sessionId,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      return {
        success: true,
        sessionId: sessionResult.sessionId,
        expiresAt: sessionResult.expiresAt,
        maxAge: sessionResult.maxAge,
        userId: validation.userId
      };

    } catch (error) {
      this.logger.error('Remember me session refresh error', error.message);
      return { success: false, reason: 'Session refresh failed' };
    }
  }

  // Clean up expired remember me tokens
  async cleanupExpiredRememberMeTokens() {
    try {
      let cleanedCount = 0;

      if (this.redis) {
        const pattern = 'remember_me:*';
        const keys = await this.redis.keys(pattern);
        
        for (const key of keys) {
          const tokenString = await this.redis.get(key);
          if (tokenString) {
            const tokenData = JSON.parse(tokenString);
            if (tokenData.expiresAt && new Date() > tokenData.expiresAt) {
              await this.redis.del(key);
              cleanedCount++;
            }
          }
        }
      }

      this.logger.info('Remember me token cleanup completed', {
        cleanedCount,
        timestamp: new Date().toISOString()
      });

      return { success: true, cleanedCount };

    } catch (error) {
      this.logger.error('Remember me token cleanup error', error.message);
      return { success: false, reason: 'Cleanup failed' };
    }
  }
}

// Singleton instance
const sessionService = new SessionService();

module.exports = {
  SessionService,
  sessionService
};