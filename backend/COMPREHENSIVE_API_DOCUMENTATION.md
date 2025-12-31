# Smart Technologies Bangladesh B2C API - Comprehensive Documentation

## Base URL
- **Development**: `http://localhost:3001`
- **Production**: `https://smarttechnologies-bd.com`

## API Version
- **Current Version**: `v1`
- **Base Path**: `/api/v1/`

## Authentication
Most endpoints require authentication using one of the following methods:

### JWT Token Authentication
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Session-Based Authentication
```
Cookie: sessionId=<SESSION_ID>
```

### Role-Based Access Control
- **CUSTOMER**: Can access own resources
- **ADMIN**: Full access to all resources
- **MANAGER**: Can manage orders and moderate content

---

## 🔐 Authentication Endpoints
**Base Path**: `/api/v1/auth`

| Method | Endpoint | Description | Auth Required | Status |
|---------|----------|-------------|---------------|---------|
| POST | `/register` | User registration with email/phone verification | No | ✅ Working |
| POST | `/login` | User login with session management | No | ✅ Working |
| POST | `/logout` | User logout (single or all devices) | Yes | ✅ Working |
| POST | `/refresh` | Refresh JWT token | No | ✅ Working |
| POST | `/verify-email` | Verify email address with token | No | ✅ Working |
| POST | `/resend-verification` | Resend email verification | No | ✅ Working |
| POST | `/send-otp` | Send OTP to phone for verification | No | ✅ Working |
| POST | `/verify-otp` | Verify phone OTP | No | ✅ Working |
| POST | `/resend-otp` | Resend OTP to phone | No | ✅ Working |
| POST | `/change-password` | Change user password | Yes | ✅ Working |
| POST | `/forgot-password` | Request password reset | No | ✅ Working |
| POST | `/reset-password` | Reset password with token | No | ✅ Working |
| GET | `/password-policy` | Get password policy requirements | No | ✅ Working |
| POST | `/validate-phone` | Validate phone number format | No | ✅ Working |
| GET | `/operators` | Get supported mobile operators | No | ✅ Working |
| POST | `/validate-remember-me` | Validate remember me token | No | ✅ Working |
| POST | `/refresh-from-remember-me` | Refresh session from remember me token | No | ✅ Working |
| POST | `/disable-remember-me` | Disable remember me functionality | Yes | ✅ Working |

### Authentication Request/Response Examples

#### User Registration
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

#### User Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "identifier": "user@example.com",
  "password": "SecurePass123!",
  "rememberMe": true
}
```

---

## 👥 User Management Endpoints
**Base Path**: `/api/v1/users`

| Method | Endpoint | Description | Auth Required | Status |
|---------|----------|-------------|---------------|---------|
| GET | `/` | Get all users (admin only) | Admin | ✅ Working |
| GET | `/:id` | Get user by ID | Self/Admin | ✅ Working |
| PUT | `/:id` | Update user profile | Self/Admin | ✅ Working |
| DELETE | `/:id` | Delete user (admin only) | Admin | ✅ Working |
| GET | `/:id/addresses` | Get user addresses | Self/Admin | ✅ Working |

### User Management Request/Response Examples

#### Get User Profile
```http
GET /api/v1/users/:id
Authorization: Bearer <JWT_TOKEN>
```

#### Update User Profile
```http
PUT /api/v1/users/:id
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+8801712345678"
}
```

---

## 🛍️ Product Management Endpoints
**Base Path**: `/api/v1/products`

| Method | Endpoint | Description | Auth Required | Status |
|---------|----------|-------------|---------------|---------|
| GET | `/` | Get all products (with filters) | No | ⚠️ Partially Working |
| GET | `/:id` | Get product by ID | No | ⚠️ Partially Working |
| GET | `/slug/:slug` | Get product by slug | No | ⚠️ Partially Working |
| POST | `/` | Create product (admin only) | Admin | ⚠️ Partially Working |
| PUT | `/:id` | Update product (admin only) | Admin | ⚠️ Partially Working |
| DELETE | `/:id` | Delete product (admin only) | Admin | ⚠️ Partially Working |
| GET | `/featured/list` | Get featured products | No | ⚠️ Partially Working |

### Product Management Request/Response Examples

#### Get Products with Filters
```http
GET /api/v1/products?page=1&limit=20&category=uuid&minPrice=100&maxPrice=1000&status=ACTIVE&sortBy=price&sortOrder=asc
```

#### Create Product
```http
POST /api/v1/products
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "name": "Product Name",
  "nameEn": "Product Name",
  "slug": "product-slug",
  "sku": "SKU123",
  "categoryId": "category-uuid",
  "brandId": "brand-uuid",
  "regularPrice": 100.00,
  "salePrice": 80.00,
  "costPrice": 50.00,
  "stockQuantity": 100,
  "description": "Product description"
}
```

---

## 📂 Category Management Endpoints
**Base Path**: `/api/v1/categories`

| Method | Endpoint | Description | Auth Required | Status |
|---------|----------|-------------|---------------|---------|
| GET | `/` | Get all categories | No | ⚠️ Partially Working |
| GET | `/:id` | Get category by ID | No | ⚠️ Partially Working |
| GET | `/tree/all` | Get category tree structure | No | ⚠️ Partially Working |
| POST | `/` | Create category (admin only) | Admin | ⚠️ Partially Working |
| PUT | `/:id` | Update category (admin only) | Admin | ⚠️ Partially Working |
| DELETE | `/:id` | Delete category (admin only) | Admin | ⚠️ Partially Working |

### Category Management Request/Response Examples

#### Get Category Tree
```http
GET /api/v1/categories/tree/all
```

#### Create Category
```http
POST /api/v1/categories
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "name": "Category Name",
  "slug": "category-slug",
  "description": "Category description",
  "parentId": null,
  "sortOrder": 1
}
```

---

## 🏷️ Brand Management Endpoints
**Base Path**: `/api/v1/brands`

| Method | Endpoint | Description | Auth Required | Status |
|---------|----------|-------------|---------------|---------|
| GET | `/` | Get all brands | No | ⚠️ Partially Working |
| GET | `/:id` | Get brand by ID | No | ⚠️ Partially Working |
| POST | `/` | Create brand (admin only) | Admin | ⚠️ Partially Working |
| PUT | `/:id` | Update brand (admin only) | Admin | ⚠️ Partially Working |
| DELETE | `/:id` | Delete brand (admin only) | Admin | ⚠️ Partially Working |

### Brand Management Request/Response Examples

#### Get All Brands
```http
GET /api/v1/brands?includeInactive=false&search=brand
```

#### Create Brand
```http
POST /api/v1/brands
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "name": "Brand Name",
  "slug": "brand-slug",
  "description": "Brand description",
  "website": "https://brand-website.com",
  "isActive": true
}
```

---

## 🛒 Shopping Cart Endpoints
**Base Path**: `/api/v1/cart`

| Method | Endpoint | Description | Auth Required | Status |
|---------|----------|-------------|---------------|---------|
| GET | `/:cartId` | Get cart details | Yes | ⚠️ Partially Working |
| POST | `/:cartId/items` | Add item to cart | Yes | ⚠️ Partially Working |
| PUT | `/:cartId/items/:itemId` | Update cart item quantity | Yes | ⚠️ Partially Working |
| DELETE | `/:cartId/items/:itemId` | Remove item from cart | Yes | ⚠️ Partially Working |
| DELETE | `/:cartId` | Clear entire cart | Yes | ⚠️ Partially Working |

### Cart Management Request/Response Examples

#### Get Cart
```http
GET /api/v1/cart/:cartId
Authorization: Bearer <JWT_TOKEN>
```

#### Add to Cart
```http
POST /api/v1/cart/:cartId/items
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "productId": "product-uuid",
  "variantId": "variant-uuid",
  "quantity": 2
}
```

---

## 📦 Order Management Endpoints
**Base Path**: `/api/v1/orders`

| Method | Endpoint | Description | Auth Required | Status |
|---------|----------|-------------|---------------|---------|
| GET | `/` | Get all orders (user/admin) | Yes | ⚠️ Partially Working |
| GET | `/:id` | Get order by ID | Yes | ⚠️ Partially Working |
| POST | `/` | Create new order | Yes | ⚠️ Partially Working |
| PUT | `/:id/status` | Update order status | Manager/Admin | ⚠️ Partially Working |

### Order Management Request/Response Examples

#### Create Order
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
  "paymentMethod": "CASH_ON_DELIVERY",
  "notes": "Order notes"
}
```

#### Update Order Status
```http
PUT /api/v1/orders/:id/status
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "status": "CONFIRMED",
  "notes": "Order confirmed"
}
```

---

## 💝 Wishlist Management Endpoints
**Base Path**: `/api/v1/wishlist`

| Method | Endpoint | Description | Auth Required | Status |
|---------|----------|-------------|---------------|---------|
| GET | `/user/:userId` | Get user's wishlists | Self/Admin | ⚠️ Partially Working |
| GET | `/:id` | Get wishlist by ID | Yes | ⚠️ Partially Working |
| POST | `/` | Create new wishlist | Yes | ⚠️ Partially Working |
| POST | `/:id/items` | Add item to wishlist | Yes | ⚠️ Partially Working |
| DELETE | `/:wishlistId/items/:itemId` | Remove item from wishlist | Yes | ⚠️ Partially Working |
| DELETE | `/:id` | Delete wishlist | Yes | ⚠️ Partially Working |

### Wishlist Management Request/Response Examples

#### Create Wishlist
```http
POST /api/v1/wishlist
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "name": "My Wishlist",
  "isPrivate": false
}
```

#### Add Item to Wishlist
```http
POST /api/v1/wishlist/:id/items
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "productId": "product-uuid"
}
```

---

## ⭐ Review Management Endpoints
**Base Path**: `/api/v1/reviews`

| Method | Endpoint | Description | Auth Required | Status |
|---------|----------|-------------|---------------|---------|
| GET | `/` | Get all reviews (with filters) | No | ⚠️ Partially Working |
| GET | `/:id` | Get review by ID | No | ⚠️ Partially Working |
| POST | `/` | Create new review | Yes | ⚠️ Partially Working |
| PUT | `/:id` | Update review | Self/Admin | ⚠️ Partially Working |
| PUT | `/:id/approve` | Approve review (admin only) | Admin | ⚠️ Partially Working |
| DELETE | `/:id` | Delete review | Self/Admin | ⚠️ Partially Working |

### Review Management Request/Response Examples

#### Create Review
```http
POST /api/v1/reviews
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "productId": "product-uuid",
  "rating": 5,
  "title": "Great product",
  "comment": "Really happy with this purchase"
}
```

#### Approve Review
```http
PUT /api/v1/reviews/:id/approve
Authorization: Bearer <JWT_TOKEN>
```

---

## 🎫 Coupon Management Endpoints
**Base Path**: `/api/v1/coupons`

| Method | Endpoint | Description | Auth Required | Status |
|---------|----------|-------------|---------------|---------|
| GET | `/` | Get all coupons | No | ⚠️ Partially Working |
| GET | `/:id` | Get coupon by ID | No | ⚠️ Partially Working |
| GET | `/code/:code` | Get coupon by code | No | ⚠️ Partially Working |
| POST | `/` | Create coupon (admin only) | Admin | ⚠️ Partially Working |
| PUT | `/:id` | Update coupon (admin only) | Admin | ⚠️ Partially Working |
| DELETE | `/:id` | Delete coupon (admin only) | Admin | ⚠️ Partially Working |

### Coupon Management Request/Response Examples

#### Get Coupon by Code
```http
GET /api/v1/coupons/code/SAVE10
```

#### Create Coupon
```http
POST /api/v1/coupons
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "code": "SAVE10",
  "name": "10% Off",
  "type": "PERCENTAGE",
  "value": 10.0,
  "minAmount": 50.0,
  "maxDiscount": 20.0,
  "usageLimit": 100,
  "isActive": true,
  "expiresAt": "2024-12-31T23:59:59.000Z"
}
```

---

## 🔐 Session Management Endpoints
**Base Path**: `/api/v1/sessions`

| Method | Endpoint | Description | Auth Required | Status |
|---------|----------|-------------|---------------|---------|
| POST | `/create` | Create new session | No | ⚠️ Partially Working |
| GET | `/validate` | Validate session | Yes | ⚠️ Partially Working |
| POST | `/refresh` | Refresh session | No | ⚠️ Partially Working |
| POST | `/destroy` | Destroy session | Yes | ⚠️ Partially Working |
| GET | `/user` | Get user sessions | Yes | ⚠️ Partially Working |
| GET | `/stats` | Get session statistics | Admin | ⚠️ Partially Working |
| POST | `/cleanup` | Cleanup expired sessions | Admin | ⚠️ Partially Working |
| GET | `/status` | Check session status | No | ⚠️ Partially Working |

### Session Management Request/Response Examples

#### Validate Session
```http
GET /api/v1/sessions/validate
Cookie: sessionId=<SESSION_ID>
```

#### Refresh Session
```http
POST /api/v1/sessions/refresh
Cookie: sessionId=<SESSION_ID>
Content-Type: application/json

{
  "maxAge": 86400000
}
```

---

## 🏠 System & Utility Endpoints

| Method | Endpoint | Description | Auth Required | Status |
|---------|----------|-------------|---------------|---------|
| GET | `/` | API root endpoint | No | ✅ Working |
| GET | `/health` | Health check with database status | No | ⚠️ Partially Working |
| GET | `/api/db-status` | Database connection status | No | ⚠️ Partially Working |
| GET | `/api/rate-limit-status` | Rate limiting status | No | ⚠️ Partially Working |
| GET | `/api-docs` | Swagger API documentation | No | ✅ Working |

### System Endpoints Examples

#### Health Check
```http
GET /api/v1/health
```

#### API Documentation
```http
GET /api-docs
```

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

## ⚠️ Known Issues & Status Notes

### ✅ Working Endpoints
- **Authentication endpoints**: All auth endpoints are working correctly
- **API routing**: All endpoints are accessible with correct `/api/v1/` prefix
- **System endpoints**: Basic system endpoints are functional

### ⚠️ Partially Working Endpoints
Most business logic endpoints (products, categories, orders, etc.) are experiencing **500 Internal Server Error** due to:
- Redis connection issues
- Database connectivity problems
- Service initialization failures

**Note**: These endpoints are **accessible** (no 404 errors) but have **application-level issues** that need to be resolved.

### 🔧 Infrastructure Issues
1. **Redis Connection**: Redis service is not properly connected
2. **Database Connection**: Some database operations are failing
3. **Service Initialization**: Some services fail to initialize properly

### 📋 Resolution Status
- ✅ **Routing Issues**: Fixed - all endpoints accessible at `/api/v1/`
- ✅ **Double Prefix Issue**: Resolved - no more `/api/api/v1/` problems
- ⚠️ **Infrastructure**: Redis and database issues need resolution

---

## 📚 Additional Resources

### API Documentation
- Interactive docs: `/api-docs`
- Database status: `/api/db-status`
- Health check: `/health`
- Rate limiting status: `/api/rate-limit-status`

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

## 📝 Development Guidelines

### Request/Response Format
- All requests use JSON format
- All responses are in JSON format
- Timestamps use ISO 8601 format
- IDs use UUID format

### Security Considerations
- All sensitive endpoints require authentication
- Rate limiting is enforced on all endpoints
- Input validation is performed on all endpoints
- SQL injection protection via Prisma ORM
- XSS protection with proper output encoding

### Performance Considerations
- Pagination is enforced on list endpoints
- Database queries are optimized with proper indexing
- Redis is used for session management and caching
- Rate limiting prevents abuse

---

*Last updated: December 22, 2025*
*API Version: 1.0.0*
*Documentation Version: 2.0.0*