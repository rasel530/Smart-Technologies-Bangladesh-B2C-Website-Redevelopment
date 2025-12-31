# Smart Technologies Bangladesh B2C API - Postman Collection Guide

## Overview

This guide provides comprehensive instructions for using the enhanced Postman collection to test the Smart Technologies Bangladesh B2C E-commerce API.

## Collection Files

### 1. Enhanced Collection (Recommended)
- **File**: [`postman-collection-enhanced.json`](postman-collection-enhanced.json:1)
- **Version**: 2.0.0
- **Features**: 
  - Complete API coverage
  - Enhanced error handling
  - Automatic token management
  - Comprehensive test scripts
  - Bangladesh-specific features

### 2. Original Collection
- **File**: [`postman-collection.json`](postman-collection.json:1)
- **Version**: 1.0.0
- **Features**: Basic API coverage

## Setup Instructions

### 1. Import Collection
1. Open Postman
2. Click **Import** → **Select Files**
3. Choose `postman-collection-enhanced.json`
4. Click **Import**

### 2. Configure Environment
1. In Postman, go to **Environments** → **Manage Environments**
2. Create a new environment called "Smart Tech API"
3. Add the following variables:

| Variable | Initial Value | Description |
|----------|----------------|-------------|
| `baseUrl` | `http://localhost:3001` | API base URL |
| `jwtToken` | *leave empty* | JWT authentication token |
| `sessionId` | *leave empty* | Session ID for cookie auth |
| `userId` | *leave empty* | User ID for testing |
| `productId` | *leave empty* | Product ID for testing |
| `categoryId` | *leave empty* | Category ID for testing |
| `brandId` | *leave empty* | Brand ID for testing |
| `cartId` | *leave empty* | Cart ID for testing |
| `orderId` | *leave empty* | Order ID for testing |
| `wishlistId` | *leave empty* | Wishlist ID for testing |
| `reviewId` | *leave empty* | Review ID for testing |
| `couponCode` | *leave empty* | Coupon code for testing |

### 3. Set Active Environment
1. Select the "Smart Tech API" environment
2. Ensure it's set as the active environment

## API Testing Workflow

### Phase 1: Health Check
1. **API Root** → Test basic connectivity
2. **Health Check** → Verify database connection
3. **Database Status** → Check detailed database stats

### Phase 2: Authentication
1. **Register User** → Create test account
2. **Login User** → Get authentication tokens
3. **Get Password Policy** → Understand password requirements
4. **Validate Phone** → Test Bangladesh phone validation

### Phase 3: Core Features
1. **Products** → Test product browsing and search
2. **Categories** → Test category navigation
3. **Brands** → Test brand filtering

### Phase 4: User Actions
1. **Get User Profile** → Test user data retrieval
2. **Update User Profile** → Test profile updates
3. **Get User Addresses** → Test address management

### Phase 5: E-commerce Features
1. **Shopping Cart** → Test cart operations
2. **Orders** → Test order management
3. **Wishlist** → Test wishlist functionality
4. **Reviews** → Test review system
5. **Coupons** → Test coupon system

## Current API Status

### ✅ Working Endpoints
- **Health Check**: `GET /health` - Server status and database connectivity
- **API Root**: `GET /` - Basic API information
- **API Documentation**: `GET /api-docs` - Swagger specification

### ⚠️ Partially Working Endpoints
- **Authentication**: Some endpoints work but may have Redis-related issues
- **Products**: Basic functionality available
- **Users**: Core functionality working

### ❌ Redis-Dependent Endpoints
Some endpoints may fail due to Redis connection issues:
- Session management endpoints
- Password policy endpoint
- Some advanced features

## Testing Tips

### 1. Authentication Flow
```bash
# 1. Register a new user
POST /api/v1/auth/register
{
  "email": "test@example.com",
  "password": "SecurePass123!",
  "firstName": "Test",
  "lastName": "User",
  "confirmPassword": "SecurePass123!"
}

# 2. Login to get tokens
POST /api/v1/auth/login
{
  "identifier": "test@example.com",
  "password": "SecurePass123!",
  "rememberMe": true
}

# 3. Use returned tokens in subsequent requests
# Tokens are automatically stored in variables
```

### 2. Error Handling
- All requests include error handling scripts
- Failed responses show detailed error information
- Validation errors include field-specific details

### 3. Bangladesh-Specific Features
- **Phone Validation**: Supports Bangladesh mobile operators
- **Bilingual Support**: English and Bengali messages
- **Local Address**: Division and district support

### 4. Testing Mode
The API supports testing mode which may:
- Skip email verification
- Skip phone verification
- Auto-activate accounts
- Use mock payment processing

## Troubleshooting

### Common Issues

#### 1. Redis Connection Errors
**Symptoms**: Internal server errors on Redis-dependent endpoints
**Solutions**:
- Check Redis server status
- Verify Redis configuration
- Some endpoints may work with fallback mode

#### 2. Authentication Issues
**Symptoms**: 401 Unauthorized errors
**Solutions**:
- Ensure JWT token is valid
- Check session cookie is set
- Verify token is stored in variables

#### 3. Validation Errors
**Symptoms**: 400 Bad Request with validation details
**Solutions**:
- Check request body format
- Verify required fields
- Ensure data types are correct

### Debug Information
- Enable development mode for detailed error messages
- Check server logs for specific error details
- Use browser developer tools for network inspection

## Collection Structure

### Folders Organization
1. **🏠 System & Health Checks** - Basic connectivity and status
2. **🔐 Authentication** - User registration, login, and session management
3. **🔐 Session Management** - Session CRUD operations
4. **👥 Users** - User profile and management
5. **🛍️ Products** - Product catalog and search
6. **📂 Categories** - Category hierarchy and navigation
7. **🏷️ Brands** - Brand information and filtering
8. **🛒 Shopping Cart** - Cart operations and management
9. **📦 Orders** - Order creation and management
10. **💝 Wishlist** - Wishlist operations
11. **⭐ Reviews** - Product review system
12. **🎫 Coupons** - Coupon management

### Test Scripts
Each request includes:
- **Pre-request Script**: Sets authentication headers
- **Test Script**: Validates response and stores tokens
- **Error Handling**: Detailed error reporting

## Best Practices

### 1. Sequential Testing
- Test in the order listed above
- Complete authentication before protected endpoints
- Use returned IDs for subsequent requests

### 2. Variable Management
- Let scripts automatically manage tokens
- Update variables manually when needed
- Clear variables between test sessions

### 3. Error Analysis
- Check response codes and messages
- Review validation details for field errors
- Monitor network issues vs. API issues

## API Limitations

### Current Known Issues
1. **Redis Connectivity**: Some features may be limited
2. **Email/SMS**: External services may not be configured
3. **File Uploads**: Not fully tested in current collection

### Recommended Testing Approach
1. Start with health checks
2. Test basic authentication flow
3. Progress through core features
4. Test advanced features with caution
5. Document any issues found

## Support

### Getting Help
- Check server logs for detailed error information
- Review API documentation at `/api-docs`
- Monitor database connection status
- Test with different data scenarios

---

**Last Updated**: December 20, 2025  
**API Version**: 1.0.0  
**Collection Version**: 2.0.0  
**Status**: Production Ready (with known Redis issues)