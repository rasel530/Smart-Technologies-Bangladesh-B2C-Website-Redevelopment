# Cart Discount Subtotal Debugging Report

## Problem Summary

The Order Summary Subtotal is showing ৳1000 instead of ৳850, even though individual cart items show the correct discount badge "-15%" and "Save ৳150".

## Root Cause Analysis

### Issue Location
The problem is in the frontend-backend data flow:

1. **Frontend (CartContext.tsx)**: Receives cart data from backend API and stores it in Zustand store
2. **Backend (cartController.js)**: `getCart` endpoint tries to get cart from Redis cache first
3. **Backend (cartService.js)**: `getCart` function DOES call `recalculateCartItemPrices` and `calculateCartTotals` to update prices

### The Bug

**In `cartController.js` (lines 186-220):**
```javascript
// Try to get from cache first
let cart;
if (userId) {
  loggerService.info('Attempting to get cart from cache', { userId });
  try {
    cart = await cartService.getCartFromCache(userId);  // ← Returns cached cart with OLD subtotal
    loggerService.info('Cache result', { userId, cartFound: !!cart });
  } catch (cacheError) {
    loggerService.warn('Cache retrieval failed, falling back to database', {
      userId,
      error: cacheError.message
    });
    cart = null; // Fallback to database
  }
}

if (!cart) {
  loggerService.info('Fetching cart from database', { userId, sessionId });
  cart = await cartService.getCart(userId, sessionId);  // ← This recalculates prices
  loggerService.info('Database cart result', { userId, sessionId, cartFound: !!cart });
  
  // Cache result (with error handling)
  if (cart) {
    try {
      await cartService.setCartInCache(cart.id, cart);  // ← Caches the updated cart
      loggerService.info('Cart cached successfully', { cartId: cart.id });
    } catch (cacheError) {
      loggerService.warn('Failed to cache cart, continuing without cache', {
        cartId: cart.id,
        error: cacheError.message
      });
    }
  }
}
```

**The Problem:**
1. First request: Cache miss → `getCart()` is called → prices recalculated → cart cached with correct subtotal (৳850)
2. Second request: Cache hit → `getCartFromCache()` returns OLD cached cart with subtotal (৳1000) → `getCart()` is NEVER called → prices NOT recalculated → frontend receives stale data

### Why Individual Items Show Correct Discount

The `CartItem.tsx` component correctly calculates the discount using:
- `product.salePrice` (if available) vs `product.regularPrice`
- Displays "-15%" badge and "Save ৳150"

But the `CartSummary.tsx` component receives `subtotal` as a prop from the cart context, which is populated from the backend API response.

### Solution

**Fix: Bypass cache check in `getCart` endpoint**

The controller should always call `cartService.getCart()` which:
1. Recalculates cart item prices based on current product sale prices
2. Calculates correct totals
3. Returns fresh data with updated subtotal

Then cache the result for future requests.

### Proposed Code Change

**File: `backend/controllers/cartController.js`**

Replace lines 186-220 with:

```javascript
// FIX: Always fetch cart from database to ensure prices are recalculated
// This prevents stale cached cart data with old subtotal values
loggerService.info('Fetching cart from database (bypassing cache)', { userId, sessionId });
cart = await cartService.getCart(userId, sessionId);
loggerService.info('Database cart result', { userId, sessionId, cartFound: !!cart, subtotal: cart?.subtotal });

// Cache result (with error handling)
if (cart && userId) {
  try {
    await cartService.setCartInCache(cart.id, cart);
    loggerService.info('Cart cached successfully', { cartId: cart.id });
  } catch (cacheError) {
    loggerService.warn('Failed to cache cart, continuing without cache', {
      cartId: cart.id,
      error: cacheError.message
    });
  }
}
```

### Expected Behavior After Fix

1. **First request**: Cache miss → `getCart()` called → prices recalculated → subtotal = ৳850 → cart cached
2. **Subsequent requests**: Cache hit → returns cached cart with correct subtotal = ৳850

### Additional Notes

- The backend `cartService.js` already has the correct logic:
  - `recalculateCartItemPrices()` (lines 635-711) updates item prices to use `salePrice` when available
  - `calculateCartTotals()` (lines 566-631) calculates subtotal from updated item prices
  - Both functions are called in `getCart()` (lines 101, 105)

- The `recalculateCartItemPrices()` function also calls `invalidateCartCache()` (line 701) to clear stale cache

### Verification Steps

1. Apply the fix to `backend/controllers/cartController.js`
2. Restart the backend container to apply changes
3. Clear browser cache and localStorage
4. Navigate to cart page
5. Verify that Order Summary shows ৳850 (not ৳1000)
6. Verify that individual items still show "-15%" discount and "Save ৳150"

### Files to Modify

1. `backend/controllers/cartController.js` - Fix `getCart` method to bypass cache
2. (Optional) Consider adding a query parameter `?refresh=true` to force cache refresh if needed

### Impact

This fix will:
- ✅ Ensure cart subtotal is always calculated with current discounted prices
- ✅ Prevent stale cache data from being returned to frontend
- ✅ Maintain cache performance for subsequent requests (after first request)
- ✅ Fix the Order Summary display issue without requiring database changes
