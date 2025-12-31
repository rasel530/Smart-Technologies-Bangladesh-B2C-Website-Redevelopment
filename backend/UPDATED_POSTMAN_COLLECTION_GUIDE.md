# Smart Technologies Bangladesh B2C API - Updated Postman Collection Guide

## 📋 Overview

This guide provides comprehensive instructions for using the updated Postman collection (v3.0.0) for testing the Smart Technologies Bangladesh B2C E-commerce Platform APIs. All endpoints are fully functional and tested.

## 🚀 Quick Start

### 1. Import the Collection
1. Open Postman
2. Click **Import** → **Select File**
3. Choose `postman-collection-updated.json`
4. The collection will be imported with all endpoints organized by category

### 2. Configure Environment Variables
The collection includes the following environment variables:
- `baseUrl`: API base URL (default: `http://localhost:3001`)
- `jwtToken`: JWT authentication token (auto-populated)
- `sessionId`: Session ID for cookie-based auth (auto-populated)
- `userId`: User ID for testing (auto-populated)
- `productId`: Product ID for testing (auto-populated)
- `categoryId`: Category ID for testing (auto-populated)
- `brandId`: Brand ID for testing (auto-populated)
- `cartId`: Cart ID for testing
- `orderId`: Order ID for testing (auto-populated)
- `wishlistId`: Wishlist ID for testing (auto-populated)
- `reviewId`: Review ID for testing (auto-populated)
- `couponCode`: Coupon code for testing
- `itemId`: Item ID for cart/wishlist items (auto-populated)
- `addressId`: Address ID for testing (auto-populated)

### 3. Set Base URL
For local development: `http://localhost:3001`
For production: `https://smarttechnologies-bd.com`

## 🔐 Authentication Flow

### Basic Authentication Testing
1. **Register User**: Use the "Register User" endpoint to create a test account
2. **Login User**: Use the "Login User" endpoint to authenticate
3. **Token Storage**: JWT token and session ID are automatically stored in variables
4. **Authenticated Requests**: All subsequent requests will include authentication

### Advanced Authentication Features
- **Email Verification**: Test email verification workflow
- **Phone OTP**: Test Bangladesh phone number validation and OTP
- **Password Management**: Test forgot/reset/change password flows
- **Remember Me**: Test persistent login functionality
- **Session Management**: Advanced session control endpoints

## 📚 API Endpoint Categories

### 🏠 System & Health Checks
- **API Root**: Basic API information
- **Health Check**: System health with database status
- **Database Status**: Detailed database statistics
- **Rate Limit Status**: Redis and rate limiting status
- **API Documentation**: OpenAPI/Swagger specification
- **API Info**: Available endpoints overview

### 🔐 Authentication
Complete authentication system with:
- User registration and login
- Email and phone verification
- Password management
- Remember me functionality
- JWT and session-based auth
- Bangladesh-specific phone validation

### 🔐 Session Management
Advanced session control:
- Create and validate sessions
- Refresh and extend sessions
- User session listing
- Session statistics and cleanup
- Multi-device session management

### 👥 User Management
- Get user profiles and details
- Update user information
- Address management
- Admin user management

### 🛍️ Products
Full product catalog:
- List products with filtering and pagination
- Product search by name, category, brand, price
- Featured products listing
- Product CRUD operations (admin)
- Slug-based product access

### 📂 Categories
Category hierarchy management:
- Flat and tree structure views
- Category CRUD operations (admin)
- Parent-child relationships
- Bilingual category names

### 🏷️ Brands
Brand management:
- Complete brand listing
- Brand CRUD operations (admin)
- Brand-product relationships

### 🛒 Shopping Cart
Complete cart functionality:
- Cart creation and management
- Add/update/remove items
- Quantity management
- Cart clearing

### 📦 Orders
Order processing:
- Order creation from cart
- Order status tracking
- Order history
- Admin order management
- Multiple payment methods

### 💝 Wishlist
Wishlist features:
- Multiple wishlists per user
- Public/private wishlists
- Add/remove items
- Wishlist sharing

### ⭐ Reviews
Review system:
- Product reviews with ratings
- Pros/cons structure
- Review moderation (admin)
- Review CRUD operations

### 🎫 Coupons
Coupon management:
- Create and validate coupons
- Percentage and fixed amount types
- Usage limits and restrictions
- Admin coupon management

## 🧪 Testing Features

### Automated Test Scripts
The collection includes intelligent test scripts that:
- ✅ Validate response codes
- ✅ Store authentication tokens automatically
- ✅ Extract and store IDs for chained requests
- ✅ Validate response times (< 3 seconds)
- ✅ Handle errors with detailed reporting
- ✅ Support bilingual error messages

### Pre-request Scripts
Automated setup includes:
- 🔄 Add session cookies when available
- 🔄 Set common headers automatically
- 🔄 Add request timestamps for debugging
- 🔄 Handle content-type automatically

### Error Handling
Comprehensive error validation:
- 🚨 Structured error response testing
- 🚨 Bangla message validation
- 🚨 Validation details reporting
- 🚨 Development vs production error details

## 🌍 Bangladesh-Specific Features

### Phone Number Validation
- Supports all Bangladesh operators
- Operator detection
- Format validation: +88017xxxxxxx
- Operators: Grameenphone, Banglalink, Robi, Teletalk, Airtel

### Bilingual Support
- All endpoints support English (en) and Bangla (bn)
- Error messages in both languages
- Product/category names in both languages
- Address structure for Bangladesh divisions/districts

### Payment Methods
- Cash on Delivery (COD)
- Mobile banking support
- Bangladesh-specific payment gateways

## 📊 Advanced Testing Scenarios

### Complete User Journey
1. Register → Verify Email → Login
2. Browse Products → Add to Cart
3. Create Order → Track Status
4. Write Review → Add to Wishlist
5. Manage Profile → Update Addresses

### Admin Workflow
1. Login as Admin → Manage Products
2. Create Categories → Update Brands
3. Process Orders → Moderate Reviews
4. Create Coupons → View Statistics

### Performance Testing
- Use response time validations
- Test with large datasets
- Verify rate limiting functionality
- Test Redis fallback behavior

## 🔧 Configuration Options

### Environment Variables
```json
{
  "baseUrl": "http://localhost:3001",
  "jwtToken": "{{auto-generated}}",
  "sessionId": "{{auto-generated}}",
  "testingMode": true
}
```

### Request Headers
Automatically added:
- `Authorization: Bearer {{jwtToken}}`
- `Cookie: sessionId={{sessionId}}`
- `Content-Type: application/json`
- `X-Request-Timestamp: {{timestamp}}`

## 🚨 Troubleshooting

### Common Issues
1. **Authentication Failures**: Check JWT token expiration
2. **Rate Limiting**: Verify Redis connection status
3. **Database Errors**: Check database connection endpoint
4. **CORS Issues**: Verify allowed origins in config

### Debug Features
- Request timestamps for correlation
- Detailed error messages in development
- Response time monitoring
- Variable storage tracking

### Health Monitoring
Use these endpoints to verify system status:
- `/health` - Basic health check
- `/api/db-status` - Database connectivity
- `/api/rate-limit-status` - Redis and rate limiting

## 📈 Performance Metrics

### Response Time Expectations
- Health checks: < 500ms
- Authentication: < 1000ms
- Product listing: < 2000ms
- Order processing: < 3000ms

### Rate Limiting
- Login attempts: 5 per 15 minutes
- General API: 100 requests per minute
- OTP requests: 3 per 5 minutes

## 🔄 Collection Updates

### Version History
- **v1.0.0**: Initial basic endpoints
- **v2.0.0**: Enhanced with error handling
- **v2.1.0**: Added Redis fallback support
- **v3.0.0**: Complete API coverage with advanced features

### What's New in v3.0.0
- ✅ All authentication endpoints
- ✅ Complete session management
- ✅ Advanced error handling
- ✅ Bangladesh-specific features
- ✅ Comprehensive test scripts
- ✅ Performance monitoring
- ✅ Bilingual support

## 📞 Support

### Getting Help
1. Check the API documentation: `/api-docs`
2. Review error messages in responses
3. Monitor terminal logs for detailed errors
4. Use development mode for full stack traces

### Best Practices
- Use environment variables for different environments
- Test error scenarios intentionally
- Monitor response times for performance
- Use the collection's built-in test scripts
- Keep authentication tokens updated

---

*Last updated: December 20, 2025*
*Collection version: 3.0.0*
*API version: 1.0.0*