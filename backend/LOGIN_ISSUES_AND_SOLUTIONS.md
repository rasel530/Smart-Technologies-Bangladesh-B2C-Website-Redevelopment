# Login Issues and Solutions Guide

## Overview
This document provides comprehensive troubleshooting steps and solutions for common login issues in the Smart Tech B2C E-commerce platform.

---

## Table of Contents
1. [Quick Diagnostics](#quick-diagnostics)
2. [Common Login Issues](#common-login-issues)
3. [Solutions](#solutions)
4. [Prevention Strategies](#prevention-strategies)
5. [Testing Checklist](#testing-checklist)

---

## Quick Diagnostics

### Run Diagnostic Commands

```bash
# 1. Check demo users exist
cd backend && node check-demo-users.js

# 2. Test backend health
cd backend && node test-backend-health.js

# 3. Run comprehensive login tests
cd backend && node comprehensive-login-test.js

# 4. Check Docker containers
docker ps -a

# 5. Check backend logs
docker logs smarttech_backend --tail 50

# 6. Check Redis logs
docker logs smarttech_redis --tail 20
```

---

## Common Login Issues

### Issue 1: Login Timeout with Valid Credentials

**Symptoms:**
- Valid login requests timeout after 10 seconds
- Invalid credentials work correctly (return 401)
- Backend logs show "Login security middleware error"
- Sessions are created in Redis but response never reaches client

**Root Causes:**
1. **Login Security Middleware Error**: The security middleware is throwing an error during session creation
2. **Redis Session Storage Issue**: Sessions are being stored but response handling fails
3. **Async Operation Not Awaited**: An async operation in the login flow is not properly awaited

**Evidence from Logs:**
```
error: Login security middleware error {"timestamp":"2026-01-05T10:46:09.398Z"}
info: Session created in Redis {"sessionId":"...","userId":"..."}
```

**Solution:**
```javascript
// Check the login security middleware in backend/middleware/loginSecurity.js
// Ensure all async operations are properly awaited
// Verify error handling doesn't prevent response from being sent

// Example fix:
app.use('/api/v1/auth/login', loginSecurityMiddleware, async (req, res, next) => {
  try {
    // Ensure all async operations are awaited
    await performSecurityCheck(req);
    await createSession(req.user);
    
    // Send response
    res.json({ success: true, user: req.user, token: req.token });
  } catch (error) {
    console.error('Login security middleware error', error);
    // Don't forget to call next() or send response
    next(error);
  }
});
```

---

### Issue 2: Invalid Credentials Return 404 Instead of 401

**Symptoms:**
- Login requests to `/auth/login` return 404
- Requests to `/api/v1/auth/login` work correctly

**Root Cause:**
- API versioning mismatch
- Frontend calling wrong endpoint

**Solution:**
```javascript
// Ensure frontend uses correct endpoint:
// ❌ Wrong: http://localhost:3001/auth/login
// ✅ Correct: http://localhost:3001/api/v1/auth/login

// Update frontend API configuration:
const API_BASE_URL = 'http://localhost:3001/api/v1';
```

---

### Issue 3: Redis Connection Failures

**Symptoms:**
- Intermittent login failures
- Redis connection errors in logs
- Session creation fails

**Root Causes:**
1. Redis container not running
2. Network connectivity issues
3. Redis authentication failures
4. Connection pool exhaustion

**Solution:**
```bash
# Check Redis container status
docker ps | grep redis

# Check Redis logs
docker logs smarttech_redis --tail 50

# Restart Redis if needed
docker restart smarttech_redis

# Verify Redis connection from backend
cd backend && node -e "
const redis = require('redis');
const client = redis.createClient({
  url: 'redis://:your_password@localhost:6379'
});
client.connect().then(() => {
  console.log('✅ Redis connected successfully');
  client.disconnect();
}).catch(err => {
  console.error('❌ Redis connection failed:', err.message);
});
"
```

**Configuration Check:**
```javascript
// backend/.env
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
```

---

### Issue 4: Database Connection Issues

**Symptoms:**
- Login fails with database errors
- User not found errors for existing users
- Slow login response times

**Solution:**
```bash
# Check PostgreSQL container
docker ps | grep postgres

# Test database connection
cd backend && node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.$connect().then(() => {
  console.log('✅ Database connected successfully');
  prisma.$disconnect();
}).catch(err => {
  console.error('❌ Database connection failed:', err.message);
});
"

# Check database logs
docker logs smarttech_postgres --tail 50
```

---

### Issue 5: Password Hashing Mismatch

**Symptoms:**
- Valid credentials return "Invalid credentials"
- User exists in database
- Password comparison fails

**Solution:**
```javascript
// Verify password hashing is consistent
// Check if demo users were created with correct password hash

// Recreate demo users with correct passwords:
cd backend && node test-profile-management.js

// Or manually update password:
cd backend && node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function updatePassword() {
  const user = await prisma.user.findUnique({
    where: { email: 'demo.user1@smarttech.bd' }
  });
  
  if (user) {
    const hashedPassword = await bcrypt.hash('Demo123456', 10);
    await prisma.user.update({
      where: { email: 'demo.user1@smarttech.bd' },
      data: { password: hashedPassword }
    });
    console.log('✅ Password updated successfully');
  }
  await prisma.$disconnect();
}

updatePassword();
"
```

---

### Issue 6: CORS Errors

**Symptoms:**
- Browser console shows CORS errors
- Login requests blocked by browser
- Network tab shows failed requests

**Solution:**
```javascript
// backend/index.js
const cors = require('cors');

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Or allow all origins for development:
app.use(cors());
```

---

### Issue 7: Session/Token Not Persisted

**Symptoms:**
- Login succeeds but subsequent requests fail
- Token not stored in browser
- Session expires immediately

**Solution:**
```javascript
// Frontend: Ensure token is stored after successful login
const login = async (credentials) => {
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
    credentials: 'include' // Important for cookies
  });
  
  const data = await response.json();
  
  if (data.token) {
    // Store token in localStorage
    localStorage.setItem('token', data.token);
    // Or in cookie
    document.cookie = `token=${data.token}; path=/; secure; httpOnly`;
  }
  
  return data;
};

// Include token in subsequent requests
const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
};
```

---

## Solutions

### Solution 1: Fix Login Security Middleware

**File: [`backend/middleware/loginSecurity.js`](backend/middleware/loginSecurity.js)**

```javascript
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');

// Create rate limiter with Redis store
const loginLimiter = rateLimit({
  store: new RedisStore({
    redisURL: process.env.REDIS_URL || 'redis://redis:6379',
    client: redisClient
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: 'Too many login attempts',
    message: 'Please try again later',
    messageBn: 'অনেক লগইন চেষ্টা, পরে আবার চেষ্টা করুন'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many login attempts',
      message: 'Please try again later',
      messageBn: 'অনেক লগইন চেষ্টা, পরে আবার চেষ্টা করুন'
    });
  }
});

// Apply to login route
app.use('/api/v1/auth/login', loginLimiter);
```

### Solution 2: Add Comprehensive Error Handling

**File: [`backend/routes/auth.js`](backend/routes/auth.js)**

```javascript
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    
    // Validate input
    if (!identifier || !password) {
      return res.status(400).json({
        error: 'Validation failed',
        details: [
          !identifier ? { type: 'field', value: identifier, msg: 'Invalid value', path: 'identifier', location: 'body' } : null,
          !password ? { type: 'field', value: password, msg: 'Invalid value', path: 'password', location: 'body' } : null
        ].filter(Boolean)
      });
    }
    
    // Find user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier }
        ]
      }
    });
    
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Invalid email or password',
        messageBn: 'অবৈধ ইমেল বা পাসওয়ার্ড'
      });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Invalid email or password',
        messageBn: 'অবৈধ ইমেল বা পাসওয়ার্ড'
      });
    }
    
    // Check user status
    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        error: 'Account inactive',
        message: 'Your account is not active',
        messageBn: 'আপনার অ্যাকাউন্ট সক্রিয় নয়'
      });
    }
    
    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Create session
    const sessionId = await createSession(user.id, req.ip, req.headers['user-agent']);
    
    // Send response
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      token,
      sessionId
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred during login',
      messageBn: 'লগইনের সময় একটি ত্রুটি ঘটেছে'
    });
  }
});
```

### Solution 3: Add Request Timeout Handling

**File: [`backend/index.js`](backend/index.js)**

```javascript
// Increase timeout for login endpoint
app.use('/api/v1/auth/login', (req, res, next) => {
  req.setTimeout(30000); // 30 seconds
  res.setTimeout(30000);
  next();
});

// Or configure globally
const server = app.listen(3001, () => {
  console.log('Server running on port 3001');
});

server.setTimeout(30000); // 30 seconds
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
```

---

## Prevention Strategies

### 1. Implement Health Checks

```javascript
// backend/routes/health.js
router.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      uptime: process.uptime()
    }
  };
  
  const isHealthy = Object.values(health.checks).every(check => check.status === 'ok');
  
  res.status(isHealthy ? 200 : 503).json(health);
});

async function checkDatabase() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'ok' };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}

async function checkRedis() {
  try {
    await redisClient.ping();
    return { status: 'ok' };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}
```

### 2. Add Monitoring and Logging

```javascript
// backend/middleware/logging.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Log all login attempts
app.use('/api/v1/auth/login', (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
  });
  
  next();
});
```

### 3. Implement Circuit Breaker Pattern

```javascript
// backend/utils/circuitBreaker.js
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.failureCount = 0;
    this.threshold = threshold;
    this.timeout = timeout;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = Date.now();
  }
  
  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
  
  onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
    }
  }
}

module.exports = CircuitBreaker;
```

---

## Testing Checklist

### Pre-Deployment Checklist

- [ ] Demo users exist in database
- [ ] Backend server is running and accessible
- [ ] All Docker containers are healthy
- [ ] Redis connection is stable
- [ ] Database connection is stable
- [ ] Login with valid credentials works
- [ ] Login with invalid credentials returns appropriate error
- [ ] Rate limiting is working
- [ ] Session creation is working
- [ ] Token generation is working
- [ ] CORS is configured correctly
- [ ] Error handling is comprehensive
- [ ] Logging is enabled
- [ ] Health check endpoint is accessible

### Automated Tests

```bash
# Run all login tests
cd backend && node comprehensive-login-test.js

# Check demo users
cd backend && node check-demo-users.js

# Test backend health
cd backend && node test-backend-health.js

# Test database connectivity
cd backend && node test-database-connectivity.js

# Test Redis connectivity
cd backend && node redis-connection-test.js
```

### Manual Testing Steps

1. **Test Valid Login**
   - Open browser to http://localhost:3000
   - Navigate to login page
   - Enter demo.user1@smarttech.bd / Demo123456
   - Verify login succeeds
   - Verify redirect to dashboard
   - Verify token is stored

2. **Test Invalid Login**
   - Enter invalid email
   - Verify 401 error
   - Verify error message is displayed

3. **Test Rate Limiting**
   - Attempt login 6 times with wrong password
   - Verify 429 error after 5th attempt
   - Wait 15 minutes
   - Verify login works again

4. **Test Session Persistence**
   - Login successfully
   - Refresh page
   - Verify user remains logged in
   - Logout
   - Verify session is cleared

---

## Additional Resources

- [Backend API Documentation](backend/API_ENDPOINTS_FOR_POSTMAN.md)
- [Login Troubleshooting Guide](LOGIN_TROUBLESHOOTING_GUIDE.md)
- [Postman Collection](backend/postman-collection-complete.json)
- [Docker Configuration](docker-compose.yml)

---

## Support

If issues persist after following this guide:

1. Check backend logs: `docker logs smarttech_backend --tail 100`
2. Check Redis logs: `docker logs smarttech_redis --tail 50`
3. Check database logs: `docker logs smarttech_postgres --tail 50`
4. Run comprehensive diagnostics: `cd backend && node comprehensive-login-test.js`
5. Review error messages in browser console
6. Check network tab in browser DevTools for failed requests

---

**Last Updated:** 2026-01-05
**Version:** 1.0.0
