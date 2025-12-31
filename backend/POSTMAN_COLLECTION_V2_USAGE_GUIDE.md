# Postman Collection v2 Usage Guide

## Overview

This guide provides comprehensive instructions for using the **Smart Technologies Bangladesh B2C API - Complete v2** Postman collection. This collection contains all 65+ API endpoints for testing the complete e-commerce platform functionality, including authentication, session management, products, categories, orders, and more.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Importing the Collection](#importing-the-collection)
3. [Environment Setup](#environment-setup)
4. [Authentication Flow](#authentication-flow)
5. [Testing Workflows](#testing-workflows)
6. [Endpoint Categories](#endpoint-categories)
7. [Common Variables](#common-variables)
8. [Test Scripts](#test-scripts)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

## Prerequisites

Before using this collection, ensure you have:

1. **Postman Desktop App** (v8.0.0 or later) installed
2. **Backend Server** running on `http://localhost:3001`
3. **Redis Server** running for session management
4. **PostgreSQL Database** properly configured
5. **Node.js** and npm installed for backend development

### Server Setup

Make sure your backend server is running:

```bash
cd backend
npm install
npm start
```

The server should be accessible at `http://localhost:3001`

## Importing the Collection

### Step 1: Download the Collection

1. Locate the file `postman-collection-complete-v2.json` in the backend directory
2. Save it to your local machine if needed

### Step 2: Import into Postman

1. Open Postman Desktop App
2. Click **Import** in the top left corner
3. Select **File** tab
4. Choose the `postman-collection-complete-v2.json` file
5. Click **Import**

The collection will appear in your Collections sidebar as "Smart Technologies Bangladesh B2C API - Complete v2"

## Environment Setup

### Step 1: Create Environment

1. In Postman, click the **Environment** dropdown (top right)
2. Click **Add** to create a new environment
3. Name it "Smart Tech B2C API v2"
4. Add the following initial variables:

| Variable | Initial Value | Description |
|----------|---------------|-------------|
| `baseUrl` | `http://localhost:3001` | API base URL |
| `authToken` | *(leave empty)* | Will be populated during login |
| `sessionId` | *(leave empty)* | Will be populated during session creation |
| `userId` | *(leave empty)* | Will be populated after login |
| `userRole` | *(leave empty)* | Will be populated after login |

### Step 2: Activate Environment

1. Select the "Smart Tech B2C API v2" environment from the dropdown
2. Ensure the environment is active (highlighted in orange)

## Authentication Flow

### Standard User Authentication

1. **Register User** (if needed)
   - Go to `🔐 Authentication` → `User Registration`
   - Fill in user details and send request
   - User ID will be automatically saved to environment

2. **Login User**
   - Go to `🔐 Authentication` → `User Login`
   - Use the registered credentials
   - Auth token and session ID will be saved automatically

3. **Verify Authentication**
   - Check that `authToken`, `sessionId`, and `userId` are populated in your environment
   - These will be used in subsequent authenticated requests

### Admin Authentication

For admin operations, you'll need an admin user account:

1. Create an admin user in the database with role `ADMIN`
2. Use the same login flow as above
3. The `userRole` environment variable will be set to `ADMIN`

### Token Management

The collection includes automatic token refresh logic:

- Tokens are checked before each request
- If a token is expiring within 5 minutes, it will be refreshed
- Failed refresh attempts will be logged to the console

## Testing Workflows

### Basic Product Testing Workflow

1. **Get Products**: Test retrieving product listings
2. **Create Product**: (Admin only) Create a new product
3. **Get Product by ID**: Retrieve the created product
4. **Update Product**: (Admin only) Update product details
5. **Delete Product**: (Admin only) Remove the product

### Order Management Workflow

1. **Login** as a customer user
2. **Get Products** to find items to order
3. **Add to Cart**: Add items to shopping cart
4. **Create Order**: Convert cart to order
5. **Get Orders**: View order history
6. **Update Order Status**: (Admin/Manager only) Update order status

### Session Testing Workflow

1. **Create Session**: Create a new session
2. **Validate Session**: Verify session is valid
3. **Refresh Session**: Extend session lifetime
4. **Destroy Session**: Logout and invalidate session

## Endpoint Categories

### 🔐 Authentication (17 endpoints)

Complete user authentication system including:

- **Registration**: User signup with email/phone verification
- **Login**: Multiple authentication methods (email, phone, remember me)
- **Password Management**: Change, forgot, and reset password
- **OTP System**: Bangladesh phone number verification
- **Token Management**: JWT refresh and validation

### 🔐 Session Management (8 endpoints)

Redis-based session management:

- **Session CRUD**: Create, read, update, delete sessions
- **Validation**: Check session validity
- **Statistics**: Session analytics (admin only)
- **Cleanup**: Automated expired session removal

### 🛍️ Product Management (7 endpoints)

Product catalog management:

- **Product CRUD**: Full product lifecycle management
- **Filtering**: Advanced product search and filtering
- **Featured Products**: Special product listings
- **Slug Lookup**: SEO-friendly product URLs

### 📂 Category Management (6 endpoints)

Hierarchical category system:

- **Category CRUD**: Category management
- **Tree Structure**: Parent-child relationships
- **Sorting**: Custom category ordering

### 🏷️ Brand Management (5 endpoints)

Brand information management:

- **Brand CRUD**: Complete brand management
- **Search**: Brand search functionality

### 👥 User Management (5 endpoints)

User profile and address management:

- **User CRUD**: User information management
- **Address Management**: Bangladesh address support
- **Role-based Access**: Admin/Customer permissions

### 📦 Order Management (4 endpoints)

Order processing and tracking:

- **Order CRUD**: Order lifecycle management
- **Status Updates**: Order status tracking
- **Order History**: Customer order viewing

### 🛒 Shopping Cart (5 endpoints)

Cart functionality:

- **Cart CRUD**: Cart management operations
- **Item Management**: Add/update/remove cart items
- **Price Calculation**: Automatic totals and discounts

### 💝 Wishlist Management (6 endpoints)

Customer wishlist features:

- **Wishlist CRUD**: Create and manage wishlists
- **Item Management**: Add/remove wishlist items
- **Privacy Controls**: Public/private wishlists

### ⭐ Review Management (6 endpoints)

Product review system:

- **Review CRUD**: Review management
- **Approval System**: Admin review moderation
- **Rating System**: Product rating aggregation

### 🎫 Coupon Management (6 endpoints)

Discount and promotion system:

- **Coupon CRUD**: Coupon management
- **Code Validation**: Coupon verification
- **Usage Tracking**: Coupon usage analytics

### 🏠 System & Utility (5 endpoints)

System health and information:

- **Health Checks**: System status monitoring
- **Database Status**: Connection monitoring
- **API Documentation**: Swagger integration
- **Rate Limiting**: Usage monitoring

## Common Variables

The collection uses the following environment variables:

### Authentication Variables
- `authToken`: JWT token for authenticated requests
- `sessionId`: Session ID for session-based authentication
- `userId`: Current authenticated user ID
- `userRole`: User role (CUSTOMER, ADMIN, MANAGER)
- `refreshToken`: Token for refreshing authentication

### Resource Variables
- `productId`: Product ID for testing
- `productSlug`: Product slug for SEO testing
- `categoryId`: Category ID for testing
- `brandId`: Brand ID for testing
- `orderId`: Order ID for testing
- `cartId`: Cart ID for testing
- `cartItemId`: Cart item ID for testing
- `wishlistId`: Wishlist ID for testing
- `wishlistItemId`: Wishlist item ID for testing
- `reviewId`: Review ID for testing
- `couponId`: Coupon ID for testing
- `couponCode`: Coupon code for testing
- `addressId`: Address ID for testing

### System Variables
- `baseUrl`: API base URL (default: http://localhost:3001)
- `requestTimestamp`: Timestamp of current request
- `tokenExpiresAt`: Token expiration timestamp

## Test Scripts

### Global Test Scripts

The collection includes global test scripts that run for every request:

1. **Response Time Validation**: Ensures responses are under 3 seconds
2. **Content-Type Validation**: Verifies JSON response format
3. **Request Logging**: Logs request details for debugging

### Endpoint-Specific Tests

Each endpoint includes custom test scripts:

1. **Status Code Validation**: Checks for expected HTTP status codes
2. **Response Schema Validation**: Verifies response structure
3. **Environment Variable Updates**: Auto-saves response data
4. **Error Handling**: Validates error response format

### Example Test Script

```javascript
// Status code validation
pm.test("Status code is 200 or 401", function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 401]);
});

// Response validation
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.test("Data validation", function () {
        pm.expect(response.data).to.exist;
    });
    
    // Auto-save environment variables
    if (response.data && response.data.id) {
        pm.environment.set("resourceId", response.data.id);
    }
}
```

## Troubleshooting

### Common Issues

#### 1. Authentication Failures

**Problem**: 401 Unauthorized errors
**Solution**: 
- Check that `authToken` is set in environment
- Verify token hasn't expired
- Try logging in again

#### 2. Redis Connection Issues

**Problem**: Session management failures
**Solution**:
- Ensure Redis server is running
- Check Redis connection configuration
- Verify Redis is accessible from backend

#### 3. Database Connection Issues

**Problem**: 500 Internal Server Error
**Solution**:
- Check PostgreSQL server status
- Verify database connection string
- Check database schema is up to date

#### 4. Environment Variables Not Working

**Problem**: Variables not being populated
**Solution**:
- Ensure correct environment is selected
- Check variable names match exactly
- Verify test scripts are running

#### 5. CORS Issues

**Problem**: Cross-origin request blocked
**Solution**:
- Ensure backend CORS is configured
- Check request headers
- Verify API base URL is correct

### Debugging Tips

1. **Use Postman Console**: View `View > Show Postman Console`
2. **Check Network Tab**: Monitor actual HTTP requests
3. **Environment Variables**: Verify all required variables are set
4. **Response Headers**: Check for authentication tokens
5. **Server Logs**: Monitor backend server logs

## Best Practices

### 1. Request Organization

- Run requests in logical order (login before authenticated requests)
- Use folders to organize related endpoints
- Create test workflows for common scenarios

### 2. Environment Management

- Use separate environments for different stages (dev, staging, prod)
- Regularly clear sensitive data from environments
- Use initial values for non-sensitive variables

### 3. Testing Strategy

- Test both success and error scenarios
- Validate response schemas
- Test with different user roles
- Check rate limiting behavior

### 4. Security Considerations

- Never commit sensitive credentials to version control
- Use environment variables for all sensitive data
- Regularly rotate test credentials
- Test authentication and authorization thoroughly

### 5. Performance Testing

- Monitor response times
- Test with large datasets
- Check pagination functionality
- Verify rate limiting works correctly

## Advanced Usage

### Custom Workflows

Create custom test workflows by:

1. **Duplicating Requests**: Right-click > Duplicate
2. **Modifying Parameters**: Adjust for specific test cases
3. **Creating Test Suites**: Group related tests
4. **Using Pre-request Scripts**: Set up complex test scenarios

### Automated Testing

For automated testing:

1. **Export Collection**: Use Postman CLI or Newman
2. **CI/CD Integration**: Run tests in pipelines
3. **Report Generation**: Create test reports
4. **Scheduled Tests**: Run tests automatically

### API Documentation

Access live API documentation:

1. **Swagger UI**: Visit `{{baseUrl}}/api-docs`
2. **Postman Documentation**: Use built-in documentation
3. **Code Generation**: Generate client SDKs

## Support

For issues related to:

- **Postman Collection**: Check this guide and collection comments
- **Backend API**: Refer to API documentation
- **Database Issues**: Check database configuration
- **Redis Issues**: Verify Redis setup

## Version History

- **v2.0.0**: Complete collection with all 65+ endpoints
- **v1.0.0**: Initial basic collection

---

**Note**: This collection is designed for testing and development purposes. For production use, ensure proper security measures and rate limiting are in place.