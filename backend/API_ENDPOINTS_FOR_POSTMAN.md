# Smart Technologies Bangladesh B2C API - Complete Endpoints Documentation

## Base URL
- **Development**: `http://localhost:3001`
- **Production**: `https://smarttechnologies-bd.com`

## Authentication Headers
Most endpoints require authentication:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

For session-based authentication:
```
Cookie: sessionId=<SESSION_ID>
```

---

## 📋 API Overview

### 🔐 Authentication Endpoints
**Base Path**: `/api/v1/auth`

| Method | Endpoint | Description | Auth Required |
|---------|----------|-------------|---------------|
| POST | `/register` | User registration | No |
| POST | `/login` | User login | No |
| POST | `/logout` | User logout | Yes |
| POST | `/refresh` | Refresh JWT token | No |
| POST | `/verify-email` | Verify email address | No |
| POST | `/resend-verification` | Resend email verification | No |
| POST | `/send-otp` | Send OTP to phone | No |
| POST | `/verify-otp` | Verify phone OTP | No |
| POST | `/resend-otp` | Resend OTP | No |
| POST | `/change-password` | Change user password | Yes |
| POST | `/forgot-password` | Request password reset | No |
| POST | `/reset-password` | Reset password with token | No |
| GET | `/password-policy` | Get password policy | No |
| POST | `/validate-phone` | Validate phone number | No |
| GET | `/operators` | Get supported operators | No |
| POST | `/validate-remember-me` | Validate remember me token | No |
| POST | `/refresh-from-remember-me` | Refresh session from remember me | No |
| POST | `/disable-remember-me` | Disable remember me | Yes |

### 👥 User Management Endpoints
**Base Path**: `/api/v1/users`

| Method | Endpoint | Description | Auth Required |
|---------|----------|-------------|---------------|
| GET | `/` | Get all users (admin only) | Admin |
| GET | `/:id` | Get user by ID | Self/Admin |
| PUT | `/:id` | Update user profile | Self/Admin |
| DELETE | `/:id` | Delete user (admin only) | Admin |
| GET | `/:id/addresses` | Get user addresses | Self/Admin |

### 🛍️ Product Management Endpoints
**Base Path**: `/api/v1/products`

| Method | Endpoint | Description | Auth Required |
|---------|----------|-------------|---------------|
| GET | `/` | Get all products (with filters) | No |
| GET | `/:id` | Get product by ID | No |
| GET | `/slug/:slug` | Get product by slug | No |
| POST | `/` | Create product (admin only) | Admin |
| PUT | `/:id` | Update product (admin only) | Admin |
| DELETE | `/:id` | Delete product (admin only) | Admin |
| GET | `/featured/list` | Get featured products | No |

### 📂 Category Management Endpoints
**Base Path**: `/api/v1/categories`

| Method | Endpoint | Description | Auth Required |
|---------|----------|-------------|---------------|
| GET | `/` | Get all categories | No |
| GET | `/:id` | Get category by ID | No |
| GET | `/tree/all` | Get category tree structure | No |
| POST | `/` | Create category (admin only) | Admin |
| PUT | `/:id` | Update category (admin only) | Admin |
| DELETE | `/:id` | Delete category (admin only) | Admin |

### 🏷️ Brand Management Endpoints
**Base Path**: `/api/v1/brands`

| Method | Endpoint | Description | Auth Required |
|---------|----------|-------------|---------------|
| GET | `/` | Get all brands | No |
| GET | `/:id` | Get brand by ID | No |
| POST | `/` | Create brand (admin only) | Admin |
| PUT | `/:id` | Update brand (admin only) | Admin |
| DELETE | `/:id` | Delete brand (admin only) | Admin |

### 🛒 Shopping Cart Endpoints
**Base Path**: `/api/v1/cart`

| Method | Endpoint | Description | Auth Required |
|---------|----------|-------------|---------------|
| GET | `/:cartId` | Get cart details | Yes |
| POST | `/:cartId/items` | Add item to cart | Yes |
| PUT | `/:cartId/items/:itemId` | Update cart item quantity | Yes |
| DELETE | `/:cartId/items/:itemId` | Remove item from cart | Yes |
| DELETE | `/:cartId` | Clear entire cart | Yes |

### 📦 Order Management Endpoints
**Base Path**: `/api/v1/orders`

| Method | Endpoint | Description | Auth Required |
|---------|----------|-------------|---------------|
| GET | `/` | Get all orders (user/admin) | Yes |
| GET | `/:id` | Get order by ID | Yes |
| POST | `/` | Create new order | Yes |
| PUT | `/:id/status` | Update order status | Manager/Admin |

### 💝 Wishlist Management Endpoints
**Base Path**: `/api/v1/wishlist`

| Method | Endpoint | Description | Auth Required |
|---------|----------|-------------|---------------|
| GET | `/user/:userId` | Get user's wishlists | Self/Admin |
| GET | `/:id` | Get wishlist by ID | Yes |
| POST | `/` | Create new wishlist | Yes |
| POST | `/:id/items` | Add item to wishlist | Yes |
| DELETE | `/:wishlistId/items/:itemId` | Remove item from wishlist | Yes |
| DELETE | `/:id` | Delete wishlist | Yes |

### ⭐ Review Management Endpoints
**Base Path**: `/api/v1/reviews`

| Method | Endpoint | Description | Auth Required |
|---------|----------|-------------|---------------|
| GET | `/` | Get all reviews (with filters) | No |
| GET | `/:id` | Get review by ID | No |
| POST | `/` | Create new review | Yes |
| PUT | `/:id` | Update review | Self/Admin |
| PUT | `/:id/approve` | Approve review (admin only) | Admin |
| DELETE | `/:id` | Delete review | Self/Admin |

### 🎫 Coupon Management Endpoints
**Base Path**: `/api/v1/coupons`

| Method | Endpoint | Description | Auth Required |
|---------|----------|-------------|---------------|
| GET | `/` | Get all coupons | No |
| GET | `/:id` | Get coupon by ID | No |
| GET | `/code/:code` | Get coupon by code | No |
| POST | `/` | Create coupon (admin only) | Admin |
| PUT | `/:id` | Update coupon (admin only) | Admin |
| DELETE | `/:id` | Delete coupon (admin only) | Admin |

### 🔐 Session Management Endpoints
**Base Path**: `/api/v1/sessions`

| Method | Endpoint | Description | Auth Required |
|---------|----------|-------------|---------------|
| POST | `/create` | Create new session | No |
| GET | `/validate` | Validate session | Yes |
| POST | `/refresh` | Refresh session | No |
| POST | `/destroy` | Destroy session | Yes |
| GET | `/user` | Get user sessions | Yes |
| GET | `/stats` | Get session statistics | Admin |
| POST | `/cleanup` | Cleanup expired sessions | Admin |
| GET | `/status` | Check session status | No |

---

## 🏠 System & Utility Endpoints

| Method | Endpoint | Description | Auth Required |
|---------|----------|-------------|---------------|
| GET | `/` | API root endpoint | No |
| GET | `/health` | Health check with database status | No |
| GET | `/api/db-status` | Database connection status | No |
| GET | `/api-docs` | Swagger API documentation | No |

---

## 📝 Request/Response Examples

### User Registration
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "confirmPassword": "SecurePass123!"
}
```

### User Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "identifier": "user@example.com",
  "password": "SecurePass123!",
  "rememberMe": true
}
```

### Get Products with Filters
```http
GET /api/v1/products?page=1&limit=20&category=uuid&minPrice=100&maxPrice=1000&status=ACTIVE&sortBy=price&sortOrder=asc
```

### Create Order
```http
POST /api/v1/orders
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "addressId": "address-uuid",
  "items": [
    {
      "productId": "product-uuid",
      "quantity": 2
    }
  ],
  "paymentMethod": "CASH_ON_DELIVERY"
}
```

### Add to Cart
```http
POST /api/v1/cart/cart-uuid/items
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "productId": "product-uuid",
  "quantity": 1
}
```

---

## 🔒 Authentication & Authorization

### JWT Token Authentication
Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Session-Based Authentication
Include the session cookie:
```
Cookie: sessionId=<your-session-id>
```

### Role-Based Access Control
- **CUSTOMER**: Can access own resources
- **ADMIN**: Full access to all resources
- **MANAGER**: Can manage orders and moderate content

---

## 📊 Pagination & Filtering

### Standard Query Parameters
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `search`: Search term
- `sortBy`: Sort field
- `sortOrder`: Sort order (asc/desc)

### Response Format
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

---

## 🚨 Error Handling

### Standard Error Response
```json
{
  "error": "Error type",
  "message": "Human readable error message",
  "messageBn": "বাংলা ত্রুটি বার্তা",
  "timestamp": "2023-12-20T12:00:00.000Z"
}
```

### Common HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `500`: Internal Server Error

---

## 🌍 Bangladesh-Specific Features

### Phone Validation
Supports Bangladesh mobile numbers with operator detection:
- Grameenphone: +88017xxxxxxx
- Banglalink: +88019xxxxxxx
- Robi: +88018xxxxxxx
- Teletalk: +88015xxxxxxx
- Airtel: +88016xxxxxxx

### Address Support
Full Bangladesh address structure with divisions and districts.

### Bilingual Support
All endpoints support Bengali (bn) and English messages.

---

## 🧪 Testing Notes

### Environment Setup
1. Set `NODE_ENV=development` for detailed error messages
2. Use `http://localhost:3001` for local testing
3. Database runs on PostgreSQL with Prisma ORM

### Testing Mode
Set `TESTING_MODE=true` to:
- Skip email verification
- Skip phone verification
- Auto-activate accounts
- Use mock payment processing

### Rate Limiting
- Login attempts: 5 per 15 minutes
- General API: 100 requests per minute
- OTP requests: 3 per 5 minutes

---

## 📚 Additional Resources

### API Documentation
- Interactive docs: `/api-docs`
- Database status: `/api/db-status`
- Health check: `/health`

### Postman Collection Setup
1. Import this documentation
2. Set base URL to `http://localhost:3001`
3. Configure authentication:
   - JWT: Bearer Token
   - Session: Cookie with sessionId
4. Use the provided examples for testing

### Support
- Check server logs for detailed error information
- Use development mode for full error stack traces
- Monitor database connection status via health endpoints

---

*Last updated: December 20, 2025*
*API Version: 1.0.0*