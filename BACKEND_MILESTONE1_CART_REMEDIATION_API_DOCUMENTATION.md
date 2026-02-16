# Backend API Documentation - Milestone 1: Shopping Cart Foundation Remediation

**Date:** 2026-02-07
**Phase:** Phase 6, Milestone 1
**Status:** ✅ Complete

## Overview

This document describes the backend API changes made to remediate critical and high-priority issues identified in the Milestone 1 audit.

## Issues Fixed

### ✅ BE-CRIT-001: Missing POST /api/v1/cart/calculate endpoint

**Severity:** Critical
**Status:** Resolved

### ✅ BE-CRIT-002: Missing POST /api/v1/cart/share endpoint

**Severity:** Critical
**Status:** Resolved

### ✅ BE-HIGH-001: Wrong HTTP method for /api/v1/cart/validate

**Severity:** High
**Status:** Resolved

### ✅ BE-HIGH-002: Missing analytics endpoints

**Severity:** High
**Status:** Resolved

---

## Cart API Endpoints

### Public Cart Endpoints

#### POST /api/v1/cart/calculate

**Issue Fixed:** BE-CRIT-001

Explicitly calculates and returns cart totals. This endpoint is useful for triggering a recalculation of cart totals without modifying the cart.

**Request:**

```json
// No body required - uses authentication or session ID
```

**Headers:**

- `Authorization: Bearer <token>` (optional, for authenticated users)
- `x-session-id: <session-id>` (optional, for guest carts)

**Response:**

```json
{
  "success": true,
  "message": "Cart totals calculated successfully",
  "messageBn": "কার্ট মোট সফলভাবে গণনা করা হয়েছে",
  "data": {
    "cartId": "uuid",
    "subtotal": 1000.0,
    "tax": 150.0,
    "shippingCost": 100.0,
    "total": 1250.0,
    "itemCount": 2,
    "totalItems": 3
  }
}
```

**Error Responses:**

- `400 Bad Request` - Missing authentication or session ID
- `404 Not Found` - Cart not found
- `500 Internal Server Error` - Server error

---

#### POST /api/v1/cart/validate

**Issue Fixed:** BE-HIGH-001 (Changed from GET to POST)

Validates that all items in the cart are in stock and available.

**Request:**

```json
// No body required - uses authentication or session ID
```

**Headers:**

- `Authorization: Bearer <token>` (optional, for authenticated users)
- `x-session-id: <session-id>` (optional, for guest carts)

**Response:**

```json
{
  "success": true,
  "message": "All items are in stock",
  "messageBn": "সব আইটেম স্টকে আছে",
  "data": {
    "isValid": true,
    "validationResults": [
      {
        "cartItemId": "uuid",
        "productId": "uuid",
        "variantId": "uuid",
        "productName": "Product Name",
        "requestedQuantity": 2,
        "availableStock": 10,
        "isAvailable": true
      }
    ]
  }
}
```

**Error Responses:**

- `400 Bad Request` - Missing authentication or session ID
- `404 Not Found` - Cart not found
- `500 Internal Server Error` - Server error

---

#### POST /api/v1/cart/:id/share

**Issue Fixed:** BE-CRIT-002

Generates a share token for a cart, allowing it to be shared with others.

**Request:**

```json
{
  "expiresInDays": 7
}
```

**Parameters:**

- `id` (path parameter) - Cart ID (UUID)
- `expiresInDays` (body, optional) - Number of days until token expires (1-30, default: 7)

**Headers:**

- `Authorization: Bearer <token>` (required)

**Response:**

```json
{
  "success": true,
  "message": "Share token generated successfully",
  "messageBn": "শেয়ার টোকেন সফলভাবে তৈরি করা হয়েছে",
  "data": {
    "token": "abc123xyz...",
    "expiresAt": "2026-02-14T15:00:00.000Z",
    "shareUrl": "http://localhost:3000/cart/shared/abc123xyz..."
  }
}
```

**Error Responses:**

- `400 Bad Request` - Invalid expiration days
- `401 Unauthorized` - Authentication required
- `404 Not Found` - Cart not found
- `500 Internal Server Error` - Server error

---

#### GET /api/v1/cart/shared/:token

**Issue Fixed:** BE-CRIT-002

Retrieves a shared cart using a share token.

**Request:**

```json
// No body required
```

**Parameters:**

- `token` (path parameter) - Share token string

**Headers:**

- `Authorization: Bearer <token>` (optional)
- `x-session-id: <session-id>` (optional)

**Response:**

```json
{
  "success": true,
  "message": "Shared cart retrieved successfully",
  "messageBn": "শেয়ার করা কার্ট সফলভাবে পুনরুদ্ধার করা হয়েছে",
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "sessionId": "session-id",
    "status": "active",
    "subtotal": 1000.00,
    "tax": 150.00,
    "shippingCost": 100.00,
    "discount": 0.00,
    "total": 1250.00,
    "createdAt": "2026-02-07T15:00:00.000Z",
    "updatedAt": "2026-02-07T15:00:00.000Z",
    "items": [...],
    "itemCount": 2,
    "totalItems": 3
  }
}
```

**Error Responses:**

- `404 Not Found` - Invalid share token
- `410 Gone` - Share token has expired
- `500 Internal Server Error` - Server error

---

## Admin Cart Analytics Endpoints

All admin analytics endpoints require the `cart:analytics` permission.

### GET /api/v1/admin/cart-analytics

**Issue Fixed:** BE-HIGH-002

Returns comprehensive cart analytics including conversion rates, average cart value, popular products, and time in cart statistics.

**Query Parameters:**

- `startDate` (optional) - ISO 8601 date string to filter from
- `endDate` (optional) - ISO 8601 date string to filter to

**Response:**

```json
{
  "success": true,
  "message": "Cart analytics retrieved successfully",
  "messageBn": "কার্ট বিশ্লেষণ সফলভাবে পুনরুদ্ধার করা হয়েছে",
  "data": {
    "totalCarts": 100,
    "activeCarts": 50,
    "expiredCarts": 10,
    "abandonedCarts": 30,
    "conversionRate": 10.0,
    "averageCartValue": 1250.0,
    "averageItemsPerCart": 2.5,
    "topAbandonedProducts": [
      {
        "productId": "uuid",
        "productName": "Product Name",
        "abandonmentCount": 15
      }
    ],
    "cartSizeDistribution": [
      {
        "itemCount": 1,
        "cartCount": 20
      }
    ],
    "timeInCartDistribution": [
      {
        "timeRange": "1-24 hours",
        "cartCount": 40
      }
    ]
  }
}
```

---

### GET /api/v1/admin/cart-analytics/conversion

**Issue Fixed:** BE-HIGH-002

Returns cart conversion rates and daily conversion trends.

**Query Parameters:**

- `startDate` (optional) - ISO 8601 date string to filter from
- `endDate` (optional) - ISO 8601 date string to filter to

**Response:**

```json
{
  "success": true,
  "message": "Cart conversion rates retrieved successfully",
  "messageBn": "কার্ট রূপান্তর হার সফলভাবে পুনরুদ্ধার করা হয়েছে",
  "data": {
    "totalCarts": 100,
    "convertedCarts": 10,
    "abandonedCarts": 30,
    "conversionRate": 10.0,
    "abandonmentRate": 30.0,
    "dailyTrends": [
      {
        "date": "2026-02-07",
        "cartCount": 15
      }
    ]
  }
}
```

---

### GET /api/v1/admin/cart-analytics/average-value

**Issue Fixed:** BE-HIGH-002

Returns average cart value statistics.

**Query Parameters:**

- `startDate` (optional) - ISO 8601 date string to filter from
- `endDate` (optional) - ISO 8601 date string to filter to

**Response:**

```json
{
  "success": true,
  "message": "Average cart value retrieved successfully",
  "messageBn": "গড় কার্ট মান সফলভাবে পুনরুদ্ধার করা হয়েছে",
  "data": {
    "averageCartValue": 1250.0,
    "averageSubtotal": 1086.96,
    "averageTax": 163.04,
    "averageShippingCost": 100.0,
    "totalCartValue": 125000.0,
    "minCartValue": 100.0,
    "maxCartValue": 5000.0
  }
}
```

---

### GET /api/v1/admin/cart-analytics/abandonment

**Issue Fixed:** BE-HIGH-002

Returns cart abandonment rates and recent abandoned carts.

**Query Parameters:**

- `startDate` (optional) - ISO 8601 date string to filter from
- `endDate` (optional) - ISO 8601 date string to filter to

**Response:**

```json
{
  "success": true,
  "message": "Cart abandonment rates retrieved successfully",
  "messageBn": "কার্ট পরিত্যাগ হার সফলভাবে পুনরুদ্ধার করা হয়েছে",
  "data": {
    "totalCarts": 100,
    "abandonedCarts": 30,
    "expiredCarts": 10,
    "totalAbandoned": 40,
    "abandonmentRate": 40.0,
    "recentAbandonedCarts": [
      {
        "cartId": "uuid",
        "itemCount": 2,
        "totalValue": 1250.0,
        "items": [
          {
            "productId": "uuid",
            "productName": "Product Name",
            "quantity": 2
          }
        ]
      }
    ]
  }
}
```

---

### GET /api/v1/admin/cart-analytics/popular-products

**Issue Fixed:** BE-HIGH-002

Returns popular products based on their presence in carts.

**Query Parameters:**

- `startDate` (optional) - ISO 8601 date string to filter from
- `endDate` (optional) - ISO 8601 date string to filter to
- `limit` (optional) - Maximum number of products to return (1-100, default: 20)

**Response:**

```json
{
  "success": true,
  "message": "Popular products retrieved successfully",
  "messageBn": "জনপ্রিয় পণ্য সফলভাবে পুনরুদ্ধার করা হয়েছে",
  "data": {
    "popularProducts": [
      {
        "productId": "uuid",
        "productName": "Product Name",
        "productSku": "SKU-123",
        "regularPrice": 500.0,
        "salePrice": 450.0,
        "cartCount": 15,
        "totalQuantity": 30
      }
    ]
  }
}
```

---

### GET /api/v1/admin/cart-analytics/time-in-cart

**Issue Fixed:** BE-HIGH-002

Returns statistics about how long carts remain active before conversion or abandonment.

**Query Parameters:**

- `startDate` (optional) - ISO 8601 date string to filter from
- `endDate` (optional) - ISO 8601 date string to filter to

**Response:**

```json
{
  "success": true,
  "message": "Time in cart statistics retrieved successfully",
  "messageBn": "কার্টে সময় পরিসংখ্যান সফলভাবে পুনরুদ্ধার করা হয়েছে",
  "data": {
    "totalCarts": 100,
    "averageTimeInCartHours": 48.5,
    "averageTimeInCartDays": 2.02,
    "timeRangeDistribution": [
      {
        "timeRange": "1-24 hours",
        "cartCount": 40
      },
      {
        "timeRange": "1-7 days",
        "cartCount": 35
      }
    ]
  }
}
```

---

## Database Schema Changes

### New Table: cart_share_tokens

**Migration ID:** 20260207150000_add_cart_share_token_table

| Column     | Type          | Description                        |
| ---------- | ------------- | ---------------------------------- |
| id         | TEXT (UUID)   | Primary key                        |
| cart_id    | TEXT (UUID)   | Foreign key to carts table         |
| token      | TEXT (unique) | Unique share token (32 characters) |
| expires_at | TIMESTAMP     | Token expiration date              |
| created_at | TIMESTAMP     | Token creation timestamp           |

**Indexes:**

- `cart_share_tokens_cart_id_idx` on `cart_id`
- `cart_share_tokens_token_idx` on `token`
- `cart_share_tokens_expires_at_idx` on `expires_at`

---

## Implementation Details

### Cart Sharing Flow

1. **Generate Share Token:**
   - User calls `POST /api/v1/cart/:id/share`
   - System generates unique 32-character token
   - Token expires after configurable days (default: 7)
   - Returns token and share URL

2. **Access Shared Cart:**
   - User accesses `GET /api/v1/cart/shared/:token`
   - System validates token exists and is not expired
   - Returns cart data with calculated totals
   - No authentication required for shared carts

3. **Token Security:**
   - Tokens are cryptographically random
   - Unique constraint prevents duplicates
   - Automatic expiration prevents indefinite access
   - CASCADE delete removes tokens when cart is deleted

### Analytics Implementation

All analytics endpoints use database aggregation for optimal performance:

- **Conversion Rates:** Count carts by status, calculate percentages
- **Average Value:** Use `aggregate()` with `_avg`, `_sum`, `_min`, `_max`
- **Popular Products:** Use `groupBy()` with `_count` and `_sum`
- **Time in Cart:** Calculate time differences and group by ranges

---

## Migration Instructions

### Step 1: Apply Cart Share Token Migration

```bash
cd backend
npx prisma migrate dev --name add_cart_share_token_table
```

Or apply manually:

```bash
psql -U your_user -d your_database -f backend/prisma/migrations/20260207150000_add_cart_share_token_table/migration.sql
```

### Step 2: Regenerate Prisma Client

```bash
cd backend
npx prisma generate
```

### Step 3: Restart Backend Server

```bash
cd backend
npm start
```

---

## Testing Guide

### Test POST /api/v1/cart/calculate

```bash
curl -X POST http://localhost:3001/api/v1/cart/calculate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Test POST /api/v1/cart/validate

```bash
curl -X POST http://localhost:3001/api/v1/cart/validate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Test POST /api/v1/cart/:id/share

```bash
curl -X POST http://localhost:3001/api/v1/cart/CART_ID/share \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"expiresInDays": 7}'
```

### Test GET /api/v1/cart/shared/:token

```bash
curl -X GET http://localhost:3001/api/v1/cart/shared/TOKEN
```

### Test Analytics Endpoints

```bash
# Get cart analytics
curl -X GET "http://localhost:3001/api/v1/admin/cart-analytics?startDate=2026-02-01&endDate=2026-02-07" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Get conversion rates
curl -X GET "http://localhost:3001/api/v1/admin/cart-analytics/conversion?startDate=2026-02-01&endDate=2026-02-07" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Get average cart value
curl -X GET "http://localhost:3001/api/v1/admin/cart-analytics/average-value?startDate=2026-02-01&endDate=2026-02-07" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Get abandonment rates
curl -X GET "http://localhost:3001/api/v1/admin/cart-analytics/abandonment?startDate=2026-02-01&endDate=2026-02-07" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Get popular products
curl -X GET "http://localhost:3001/api/v1/admin/cart-analytics/popular-products?limit=10" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Get time in cart statistics
curl -X GET "http://localhost:3001/api/v1/admin/cart-analytics/time-in-cart?startDate=2026-02-01&endDate=2026-02-07" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## Error Handling

All endpoints follow consistent error handling:

1. **Validation Errors (400):** Invalid input parameters
2. **Authentication Errors (401):** Missing or invalid authentication
3. **Authorization Errors (403):** Insufficient permissions
4. **Not Found Errors (404):** Resource not found
5. **Gone Errors (410):** Expired share tokens
6. **Server Errors (500):** Internal server errors

All error responses include:

- `success: false`
- `error`: Error message
- `message`: English error message
- `messageBn`: Bengali error message

---

## Security Considerations

1. **Authentication:** All cart operations require authentication or session ID
2. **Authorization:** Admin endpoints require `cart:analytics` permission
3. **Share Tokens:**
   - Cryptographically random (32 characters)
   - Unique constraint prevents collisions
   - Automatic expiration (default 7 days)
   - CASCADE delete on cart deletion
4. **Rate Limiting:** Applied to all cart endpoints
5. **Input Validation:** All inputs validated using express-validator

---

## Performance Optimizations

1. **Database Aggregations:** Analytics use `aggregate()` and `groupBy()` for efficient queries
2. **Indexes:** All frequently queried columns have indexes
3. **Pagination:** List endpoints support pagination
4. **Caching:** Cart data cached in Redis
5. **Batch Operations:** Multiple queries executed in parallel using `Promise.all()`

---

## Related Files

### Backend Files Modified

- [`backend/controllers/cartController.js`](backend/controllers/cartController.js) - Added calculateCart, generateShareToken, getSharedCart methods
- [`backend/routes/cart.js`](backend/routes/cart.js) - Added POST /calculate, POST /:id/share, GET /shared/:token routes
- [`backend/services/cartService.js`](backend/services/cartService.js) - Added generateShareToken, getCartByShareToken, validateShareToken, cleanupExpiredShareTokens methods
- [`backend/controllers/adminCartController.js`](backend/controllers/adminCartController.js) - Added getCartConversionRates, getAverageCartValue, getCartAbandonmentRates, getPopularProductsInCarts, getTimeInCartStatistics methods
- [`backend/routes/admin/cart.js`](backend/routes/admin/cart.js) - Added analytics routes
- [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma) - Added CartShareToken model

### Migration Files Created

- [`backend/prisma/migrations/20260207150000_add_cart_share_token_table/migration.sql`](backend/prisma/migrations/20260207150000_add_cart_share_token_table/migration.sql) - SQL migration
- [`backend/prisma/migrations/20260207150000_add_cart_share_token_table/README.md`](backend/prisma/migrations/20260207150000_add_cart_share_token_table/README.md) - Migration documentation

---

## Notes

- All endpoints support bilingual error messages (English and Bengali)
- Share tokens are valid for 7 days by default (configurable)
- Analytics endpoints use optimized database queries for performance
- All changes are backward compatible with existing functionality

---

**Document Version:** 1.0
**Last Updated:** 2026-02-07
**Author:** Backend Remediation Team
