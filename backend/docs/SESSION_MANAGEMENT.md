# Session Management System Documentation

**Version:** 1.0  
**Date:** December 18, 2024  
**Status:** Implemented and Tested  

## Overview

The Session Management System provides secure, scalable session handling for the Smart Technologies Bangladesh B2C e-commerce platform. It replaces traditional JWT-only authentication with a hybrid approach that combines session management with short-lived JWT tokens for API compatibility.

## Architecture

### Components

1. **Session Service** (`services/sessionService.js`)
   - Redis-based session storage with database fallback
   - Device fingerprinting for enhanced security
   - IP address validation (with subnet flexibility)
   - Automatic session cleanup and expiration
   - Session statistics and monitoring

2. **Session Middleware** (`middleware/session.js`)
   - Session validation and authentication
   - Multiple authentication levels (required, optional, fresh)
   - Security level enforcement
   - Cookie management with security flags
   - Rate limiting per session

3. **Session Routes** (`routes/sessions.js`)
   - RESTful session management endpoints
   - Session creation, validation, refresh, and destruction
   - User session listing and statistics
   - Admin-only cleanup and monitoring endpoints

4. **Enhanced Auth Routes** (`routes/auth.js`)
   - Integrated with session management
   - Backward compatibility with JWT tokens
   - Secure logout with multi-device support
   - Session-based login and refresh

## Security Features

### 1. Device Fingerprinting
```javascript
const fingerprint = crypto
  .createHash('sha256')
  .update(`${userAgent}|${acceptLanguage}|${acceptEncoding}`)
  .digest('hex');
```

### 2. IP Address Validation
- Strict IP validation by default
- Subnet flexibility for mobile networks
- Configurable IP change tolerance

### 3. Session Expiration
- Default: 24 hours
- Extended: 7 days with "Remember Me"
- Automatic cleanup of expired sessions
- Remember Me tokens: 30 days with device fingerprinting
- Enhanced security for persistent sessions

### 4. Rate Limiting
- Per-session rate limiting
- Configurable windows and limits
- Redis-based distributed rate limiting

## API Endpoints

### Session Management (`/api/v1/sessions`)

#### POST `/create`
Create a new session for a user.

**Request:**
```json
{
  "userId": "user-uuid",
  "loginType": "password|social|otp",
  "rememberMe": false,
  "maxAge": 86400000
}
```

**Response:**
```json
{
  "message": "Session created successfully",
  "sessionId": "session-uuid",
  "expiresAt": "2024-12-18T10:39:48.618Z",
  "maxAge": 86400000,
  "userId": "user-uuid"
}
```

#### GET `/validate`
Validate an existing session.

**Headers:**
- `Authorization: Bearer <session-id>` or `X-Session-ID: <session-id>`

**Response:**
```json
{
  "message": "Session is valid",
  "valid": true,
  "session": {
    "sessionId": "session-uuid",
    "userId": "user-uuid",
    "createdAt": "2024-12-18T10:39:48.618Z",
    "lastActivity": "2024-12-18T10:39:48.618Z",
    "expiresAt": "2024-12-19T10:39:48.618Z",
    "loginType": "password",
    "securityLevel": "standard"
  }
}
```

#### POST `/refresh`
Extend an existing session's lifetime.

**Request:**
```json
{
  "sessionId": "session-uuid",
  "maxAge": 172800000
}
```

#### POST `/destroy`
Destroy a session (single or all devices).

**Request:**
```json
{
  "sessionId": "session-uuid",
  "allDevices": false
}
```

#### GET `/user`
List all active sessions for the authenticated user.

**Response:**
```json
{
  "message": "User sessions retrieved successfully",
  "sessions": [
    {
      "sessionId": "session-uuid",
      "createdAt": "2024-12-18T10:39:48.618Z",
      "lastActivity": "2024-12-18T10:39:48.618Z",
      "expiresAt": "2024-12-19T10:39:48.618Z",
      "ip": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "loginType": "password",
      "isActive": true,
      "isCurrent": true
    }
  ],
  "totalSessions": 2,
  "activeSessions": 2
}
```

#### GET `/stats` (Admin Only)
Get session statistics.

**Response:**
```json
{
  "message": "Session statistics retrieved successfully",
  "stats": {
    "totalSessions": 150,
    "activeSessions": 142,
    "expiredSessions": 8,
    "redisAvailable": true
  }
}
```

### Enhanced Authentication (`/api/v1/auth`)

#### POST `/login`
Enhanced login with session management and remember me functionality.

**Request:**
```json
{
  "identifier": "user@example.com",
  "password": "password123",
  "rememberMe": false
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "CUSTOMER",
    "status": "ACTIVE"
  },
  "token": "jwt-token-for-api-compatibility",
  "sessionId": "session-uuid",
  "expiresAt": "2024-12-19T10:39:48.618Z",
  "maxAge": 86400000,
  "loginType": "email",
  "rememberMe": false
}
```

**Remember Me Features:**
- `rememberMe: true` extends session to 7 days
- Sets persistent cookies for auto-login
- Device fingerprinting for security
- Separate remember me tokens for cross-device sync

#### POST `/logout`
Enhanced logout with session cleanup.

**Request:**
```json
{
  "allDevices": false
}
```

**Response:**
```json
{
  "message": "Logout successful",
  "allDevices": false,
  "destroyedCount": 1
}
```

## Configuration

### Environment Variables
```bash
REDIS_URL=redis://localhost:6379
SESSION_MAX_AGE=86400000
SESSION_REMEMBER_ME_AGE=604800000
SESSION_SECURITY_LEVEL=standard
```

### Session Configuration
```javascript
const sessionConfig = {
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  rememberMeMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  rememberMeTokenMaxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  securityLevel: 'standard', // 'low', 'standard', 'high'
  ipValidation: true,
  deviceFingerprinting: true,
  persistentSessions: true,
  rateLimiting: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100
  }
};
```

## Security Considerations

### 1. Session Storage
- **Redis:** Primary storage for performance and scalability
- **Database:** Fallback for reliability
- **Encryption:** Session data is encrypted in Redis

### 2. Session ID Generation
- Cryptographically secure random IDs (32 bytes)
- SHA-256 hashing for blacklist storage
- UUID format for consistency

### 3. Cookie Security
```javascript
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000,
  path: '/'
};
```

### 4. Session Validation
- Multi-factor validation (session ID + IP + device fingerprint)
- Automatic session refresh on activity
- Configurable security levels
- Graceful degradation when Redis unavailable

## Performance Optimization

### 1. Redis Integration
- Connection pooling for Redis
- Automatic reconnection with backoff
- Pipeline operations for atomic updates
- TTL-based expiration for automatic cleanup

### 2. Database Optimization
- Indexed session table for fast lookups
- Batch operations for cleanup
- Connection pooling with Prisma

### 3. Caching Strategy
- Session data cached in Redis for fast access
- User session index for quick enumeration
- Statistics aggregation with Redis counters

## Monitoring and Logging

### 1. Security Events
- Session creation, validation, refresh, destruction
- Failed authentication attempts
- IP reputation tracking
- Device fingerprint mismatches

### 2. Performance Metrics
- Session creation rate
- Validation latency
- Redis connection health
- Database query performance

### 3. Audit Trail
- Complete session lifecycle logging
- User activity tracking
- Security incident logging

## Bangladesh-Specific Features

### 1. Mobile Network Support
- IP subnet validation for mobile networks
- Flexible session validation for changing IPs
- Bangladesh operator detection integration

### 2. Local Compliance
- Data localization in responses
- Bangladesh time zone handling
- Local security standards

## Testing

### 1. Unit Tests
- Comprehensive test suite in `tests/session-management.test.js`
- Service layer testing
- Middleware testing
- API endpoint testing
- Security feature testing

### 2. Integration Tests
- Full authentication flow testing
- Session lifecycle testing
- Security validation testing
- Performance and load testing

## Migration Guide

### From JWT-Only to Session Management

1. **Phase 1: Session Service Setup**
   - Deploy session service
   - Configure Redis
   - Test basic session operations

2. **Phase 2: Middleware Integration**
   - Add session middleware to routes
   - Update authentication flows
   - Test session validation

3. **Phase 3: API Enhancement**
   - Add session management endpoints
   - Update existing auth endpoints
   - Maintain backward compatibility

4. **Phase 4: Security Hardening**
   - Enable device fingerprinting
   - Implement IP validation
   - Add rate limiting
   - Security testing

## Troubleshooting

### Common Issues

1. **Redis Connection Issues**
```bash
# Check Redis status
redis-cli ping

# Check configuration
echo $REDIS_URL

# Test connection
node -e "const redis = require('redis'); const client = redis.createClient({ url: process.env.REDIS_URL }); client.connect().then(() => console.log('Connected')).catch(err => console.error('Error:', err))"
```

2. **Session Validation Failures**
- Check device fingerprint consistency
- Verify IP address format
- Validate session ID format
- Check Redis key existence

3. **Performance Issues**
- Monitor Redis memory usage
- Check database query performance
- Analyze session cleanup efficiency

## Best Practices

### 1. Session Management
- Use short-lived sessions with automatic refresh
- Implement proper logout on all devices
- Monitor session lifecycle events
- Regular cleanup of expired sessions

### 2. Security
- Always validate session on sensitive operations
- Implement rate limiting per session
- Log security events for audit trail
- Use HTTPS for all session-related requests

### 3. Performance
- Leverage Redis for fast session access
- Implement connection pooling
- Use batch operations where possible
- Monitor and optimize slow queries

## Remember Me Implementation Details

### 1. Enhanced Session Management
- **Persistent Sessions**: 7-day expiration when remember me is enabled
- **Standard Sessions**: 24-hour expiration for regular logins
- **Device Fingerprinting**: Enhanced security for persistent sessions
- **Cross-Device Support**: Remember me tokens work across devices with same fingerprint

### 2. Remember Me Token System
- **Token Generation**: Cryptographically secure 32-byte tokens
- **Token Storage**: Redis-based with 30-day expiration
- **Device Binding**: Tokens bound to device fingerprint for security
- **Automatic Refresh**: Sessions can be refreshed from remember me tokens
- **Token Cleanup**: Automatic cleanup of expired tokens

### 3. Cookie Management
- **Session Cookie**: Standard HTTP-only cookie with configurable expiration
- **Remember Me Cookie**: Separate persistent cookie for auto-login
- **Security Flags**: HttpOnly, Secure, SameSite=Strict
- **Client Integration**: JavaScript-accessible flag for UI updates

### 4. Security Features
- **Device Validation**: Fingerprint matching prevents token theft
- **IP Validation**: Subnet flexibility for mobile networks
- **Token Expiration**: Automatic invalidation of expired tokens
- **Session Isolation**: Compromised sessions don't affect others

### 5. API Endpoints
- `POST /api/v1/auth/login` - Enhanced login with remember me
- `POST /api/v1/auth/validate-remember-me` - Token validation
- `POST /api/v1/auth/refresh-from-remember-me` - Session refresh
- `POST /api/v1/auth/disable-remember-me` - Disable functionality

## Future Enhancements

### 1. Advanced Security
- Behavioral analysis for anomaly detection
- Machine learning for fraud detection
- Advanced device fingerprinting
- Geolocation-based validation

### 2. Scalability
- Session clustering across multiple servers
- Redis cluster support
- Database sharding for large scale
- CDN integration for global distribution

### 3. User Experience
- Progressive authentication
- Adaptive security based on risk level
- Single sign-on (SSO) integration
- Cross-device session synchronization with remember me optimization
- Intelligent session management based on user behavior patterns

---

**Document Status:** Complete  
**Last Updated:** December 18, 2024  
**Next Review:** January 18, 2025