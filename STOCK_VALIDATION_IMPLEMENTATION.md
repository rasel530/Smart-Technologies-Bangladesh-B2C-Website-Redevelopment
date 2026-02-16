# Stock Validation Implementation Documentation

## Overview

This document describes the comprehensive stock validation system implemented for the Smart Tech e-commerce B2C website. The system prevents overselling by checking real-time inventory levels, handling concurrent requests, and managing backorder scenarios.

## Architecture

### Components

1. **Stock Validation Service** (`backend/services/stockValidationService.js`)
   - Core stock checking logic
   - Reservation management
   - Backorder handling
   - ETag support for concurrency

2. **Cart Service Integration** (`backend/services/cartService.js`)
   - Updated with stock validation methods
   - ETag generation and validation
   - Backorder configuration access

3. **Cart Routes** (`backend/routes/cart.js`)
   - New endpoints for stock validation
   - Backorder configuration endpoints
   - ETag validation endpoints

4. **Frontend API** (`frontend/src/lib/api/cart.ts`)
   - New functions for stock validation
   - Product stock status display
   - Cart stock validation

## Features

### 1. Stock Availability Checking

The system checks stock availability considering:
- Current stock quantity
- Reserved stock (from active reservations)
- Backorder allowances

**API Endpoint:** `POST /api/v1/cart/stock/check`

**Request Body:**
```json
{
  "productId": "uuid",
  "variantId": "uuid (optional)",
  "quantity": 5,
  "cartId": "uuid (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "available": true,
    "currentStock": 100,
    "reserved": 25,
    "availableForSale": 75,
    "requestedQuantity": 5,
    "backorderAllowed": true,
    "backorderQuantity": 0,
    "canBackorder": false
  }
}
```

### 2. Stock Reservation System

Stock can be reserved for cart items with automatic expiration.

**API Endpoint:** `POST /api/v1/cart/stock/reserve`

**Features:**
- Creates reservations with configurable expiry (default: 30 minutes)
- Automatic cleanup of expired reservations
- Release on cart item removal

**Reservation Status:**
- `active` - Currently reserved
- `expired` - Reservation timed out
- `committed` - Converted to order
- `released` - Manually released

### 3. Backorder Handling

Configurable backorder support with the following settings:

**Environment Variables:**
```
BACKORDER_ENABLED=true/false (default: false)
BACKORDER_MAX_QUANTITY=10 (default)
STOCK_RESERVATION_EXPIRY=30 (minutes)
```

**Behavior:**
1. If stock is insufficient but backorder is enabled:
   - Regular stock is allocated first
   - Remaining quantity is backordered
   - Maximum backorder quantity is enforced

2. If backorder is disabled:
   - Order fails if stock is insufficient

### 4. Concurrent Request Handling

**ETag Support:**
- Carts include ETag headers for conditional requests
- Clients can validate if cart was modified
- Prevents lost updates in concurrent scenarios

**API Endpoints:**

Get cart with ETag:
```
GET /api/v1/cart/etag
```

Validate ETag:
```
GET /api/v1/cart/etag/validate
Headers: If-None-Match: "etag-string"
```

**Usage:**
```javascript
// Get cart with ETag
const response = await fetch('/api/v1/cart/etag');
const { etag, ...cart } = response.data;
localStorage.setItem('cart_etag', etag);

// Later update, check if cart was modified
const cachedETag = localStorage.getItem('cart_etag');
const validateResponse = await fetch('/api/v1/cart/etag/validate', {
  headers: { 'If-None-Match': cachedETag }
});
if (validateResponse.data.modified) {
  // Fetch fresh cart data
}
```

### 5. Reservation Management

**Extend Reservations:**
```
POST /api/v1/cart/stock/extend
```

Automatically called when user interacts with cart to prevent expiration during checkout.

**Release Reservations:**
```
POST /api/v1/cart/stock/release/:reservationId
```

## Frontend Integration

### 1. Product Page Stock Display

```typescript
import { getProductStockStatus } from '@/lib/api/cart';

function ProductStock({ productId, variantId }) {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    getProductStockStatus(productId, variantId)
      .then(setStatus)
      .catch(console.error);
  }, [productId, variantId]);

  if (!status) return null;

  return (
    <div className={`stock-badge ${status.statusColor}`}>
      {status.statusText}
    </div>
  );
}
```

### 2. Quantity Selector Limits

```typescript
function QuantitySelector({ productId, variantId, onChange }) {
  const [maxQuantity, setMaxQuantity] = useState(10);

  useEffect(() => {
    checkStockAvailability(productId, 1, variantId)
      .then(availability => {
        setMaxQuantity(availability.maxQuantity);
      });
  }, [productId, variantId]);

  return (
    <input
      type="number"
      min="1"
      max={maxQuantity}
      onChange={e => onChange(parseInt(e.target.value))}
    />
  );
}
```

### 3. Cart Page Stock Validation

```typescript
import { validateCartStock } from '@/lib/api/cart';

function CartPage() {
  const [stockIssues, setStockIssues] = useState([]);

  useEffect(() => {
    validateCartStock()
      .then(result => {
        if (!result.isValid) {
          setStockIssues(result.validationResults.filter(r => !r.isAvailable));
        }
      });
  }, []);

  return (
    <div>
      {stockIssues.map(issue => (
        <div key={issue.cartItemId} className="stock-warning">
          {issue.productName}: {issue.error}
        </div>
      ))}
    </div>
  );
}
```

### 4. Toast Notifications

The frontend already has toast notifications for stock issues via CartContext:

```typescript
// In addItem/updateQuantity operations
if (!stockValid) {
  toast.error('Sorry, this item is out of stock');
  throw new Error('Insufficient stock');
}
```

## Environment Configuration

Create or update `.env` file with:

```env
# Stock Validation Settings
BACKORDER_ENABLED=false
BACKORDER_MAX_QUANTITY=10
STOCK_RESERVATION_EXPIRY=30
RESERVATION_CLEANUP_INTERVAL=300
```

## Database Schema

The stock reservation table is required:

```prisma
model StockReservation {
  id        String   @id @default(uuid())
  productId String
  variantId String?
  cartId    String
  quantity  Int
  status    String   @default("active")
  expiresAt DateTime
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([productId, variantId])
  @@index([cartId])
  @@index([status, expiresAt])
}
```

Run migration:
```bash
npx prisma migrate dev --name add_stock_reservation
```

## Testing

Run stock validation tests:
```bash
cd backend
npm test -- stock-validation.test.js
```

## API Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/cart/stock/check` | POST | Check stock availability |
| `/cart/stock/reserve` | POST | Reserve stock |
| `/cart/stock/release/:id` | POST | Release reservation |
| `/cart/stock/validate` | POST | Validate entire cart stock |
| `/cart/stock/status/:productId` | GET | Get product stock status |
| `/cart/stock/extend` | POST | Extend cart reservations |
| `/cart/backorder/config` | GET | Get backorder configuration |
| `/cart/backorder/eligibility/:productId` | GET | Check backorder eligibility |
| `/cart/etag` | GET | Get cart with ETag |
| `/cart/etag/validate` | GET | Validate ETag |

## Error Handling

All stock validation errors follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "message": "User-friendly message",
  "messageBn": "Bengali translation"
}
```

**Common Error Codes:**
- `INSUFFICIENT_STOCK` - Not enough inventory
- `PRODUCT_UNAVAILABLE` - Product discontinued/inactive
- `RESERVATION_EXPIRED` - Stock reservation timed out
- `BACKORDER_LIMIT_EXCEEDED` - Max backorder quantity reached

## Monitoring and Logging

All stock validation operations are logged:

```javascript
// Reservation created
logger.info('Stock reserved', { reservationId, productId, quantity });

// Stock check failed
logger.warn('Insufficient stock', { productId, requested, available });

// Reservations cleaned up
logger.info('Expired reservations cleaned up', { count });
```

## Performance Considerations

1. **Reservation Cleanup:**
   - Runs every 5 minutes (configurable)
   - Non-blocking - continues even if Redis fails

2. **Stock Checks:**
   - Uses database transactions with locking
   - Optimized queries with proper indexes

3. **Frontend Optimization:**
   - Debounce stock checks on quantity changes
   - Cache stock status for short periods

## Security

1. **Cart Ownership Verification:**
   - All stock operations verify cart ownership
   - Session-based access control

2. **Reservation Protection:**
   - Reservations are tied to specific carts
   - Cannot release other users' reservations

## Migration Guide

### From Legacy System

1. Add `StockReservation` model to Prisma schema
2. Run migration: `npx prisma migrate dev`
3. Update environment variables
4. Deploy new backend
5. Test stock validation endpoints
6. Deploy frontend updates

### Rollback Plan

1. Keep legacy stock validation in cartService
2. Feature flag new stock validation
3. Can disable via `BACKORDER_ENABLED=false`

## Support

For issues related to:
- Stock discrepancies: Check reservation cleanup logs
- Performance: Review database query times
- Frontend integration: Verify API responses with network tab
