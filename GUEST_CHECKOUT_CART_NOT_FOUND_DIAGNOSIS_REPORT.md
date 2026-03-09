# Guest Checkout "Cart Not Found" Error - Diagnosis Report

**Date:** 2026-02-25  
**Error:** `Cart not found` (404 status)  
**Endpoint:** `POST http://localhost:3001/api/v1/checkout/initialize`  
**User State:** Unauthenticated guest user  
**Guest Session ID:** `a7133429-8e0a-4160-a241-08a315e894c3`

---

## Executive Summary

The "Cart not found" error during guest checkout initialization is caused by **incorrect API endpoint usage**. The frontend is calling the **general checkout initialization endpoint** (`/checkout/initialize`) instead of the **guest-specific checkout endpoint** (`/guest/checkout/initiate`), resulting in a mismatch between how carts are created and how they are expected to be associated with session IDs.

---

## Root Cause Analysis

### 1. Frontend Issue: Wrong Endpoint Being Called

**Location:** [`frontend/src/hooks/useGuestCheckout.ts:222`](frontend/src/hooks/useGuestCheckout.ts:222)

The `initializeSession` function calls:
```typescript
const response = await apiClient.post<GuestSession>('/checkout/initialize', request);
```

This endpoint is the **general checkout initialization** endpoint, which expects:
- A cart to already exist
- The cart to have a `sessionId` field matching the guest session ID

### 2. Backend Service Issue: Strict Session ID Validation

**Location:** [`backend/services/checkoutService.js:70-72`](backend/services/checkoutService.js:70)

The `createCheckoutSession` method validates:
```javascript
if (!userId && cart.sessionId !== sessionId) {
  throw new Error('Cart does not belong to session');
}
```

This validation **requires** that for guest users, the cart's `sessionId` field must match the provided guest session ID.

### 3. Cart Creation Flow: Session ID Not Set During Creation

**Location:** [`backend/services/cartService.js:788-838`](backend/services/cartService.js:788)

The `createCart` method creates carts with:
- `userId` for authenticated users
- `sessionId` for guest users

However, when items are added to guest carts via the general cart endpoints (e.g., `POST /api/v1/cart/items`), the cart is created/updated **without** a `sessionId` field being set.

### 4. Missing Guest Cart Creation Step

**Location:** [`backend/routes/cart.js:566-645`](backend/routes/cart.js:566)

There IS a dedicated guest cart creation endpoint:
```javascript
// POST /api/v1/cart/guest/create
router.post('/guest/create', [...], async (req, res) => {
  const sessionId = crypto.randomUUID();
  const cart = await prisma.cart.create({
    data: {
      sessionId,  // ← Session ID is set here
      status: 'active',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  });
});
```

**However, the frontend is NOT calling this endpoint before checkout initialization.**

### 5. Guest Checkout Controller: Separate Flow Exists

**Location:** [`backend/controllers/guestCheckoutController.js:52-139`](backend/controllers/guestCheckoutController.js:52)

There is a dedicated guest checkout controller with:
```javascript
// POST /api/v1/guest/checkout/initiate
async initiateGuestCheckout(req, res) {
  const { cartId } = req.body;
  // Validates cart exists
  // Generates NEW guest session ID
  const sessionId = crypto.randomUUID();
  // Creates guest session linked to cart
  const guestSession = await guestCheckoutService.createGuestSession(sessionId, cartId);
}
```

This endpoint properly handles guest checkout by:
1. Accepting a `cartId`
2. Validating the cart exists
3. Generating a NEW guest checkout session ID
4. Linking the cart to the guest session

---

## Possible Sources of the Problem

Based on the code analysis, here are 5-7 possible sources:

1. **Frontend calling wrong endpoint** (MOST LIKELY)
   - Frontend calls `/checkout/initialize` (general endpoint)
   - Should call `/guest/checkout/initiate` (guest-specific endpoint)

2. **Cart created without sessionId** (POSSIBLE)
   - Cart may have been created via general cart endpoints
   - Without `sessionId` field being set

3. **Session ID mismatch** (POSSIBLE)
   - Guest session ID in request doesn't match cart's sessionId
   - Due to cart being created without proper session association

4. **Race condition in cart creation** (UNLIKELY)
   - Cart might not be fully created when checkout is initialized
   - Unlikely given the synchronous nature of the operations

5. **Cart ID not being passed from CartContext** (POSSIBLE)
   - Frontend expects `cartId` from CartContext
   - CartContext might not be providing the cart ID correctly

6. **Guest session ID format mismatch** (UNLIKELY)
   - Session ID format validation could be failing
   - Unlikely given the UUID format is standard

7. **Database query issue** (UNLIKELY)
   - Database might not be finding the cart
   - Unlikely given other cart operations work

---

## Most Likely Root Causes (Distilled to 1-2)

Based on the evidence, the **two most likely root causes** are:

### 1. **Frontend Using Wrong Checkout Endpoint** (Primary Cause)

**Evidence:**
- Frontend calls `/checkout/initialize` (general checkout endpoint)
- This endpoint expects cart to have `sessionId` field matching the request
- Guest carts created via general endpoints don't have `sessionId` set
- A separate guest checkout endpoint exists that properly handles this flow

**Impact:** HIGH - This is the primary cause of the error.

### 2. **Cart Not Created With Session ID** (Secondary Cause)

**Evidence:**
- Cart creation via general endpoints doesn't set `sessionId`
- Guest checkout requires cart to have matching `sessionId`
- A dedicated guest cart creation endpoint exists that properly sets `sessionId`

**Impact:** MEDIUM - This contributes to the issue but is secondary to the endpoint problem.

---

## Code Locations

### Frontend
- **File:** [`frontend/src/hooks/useGuestCheckout.ts`](frontend/src/hooks/useGuestCheckout.ts)
- **Line:** 222 - API call to `/checkout/initialize`
- **Line:** 217 - `cartId` being sent in request body

### Backend Routes
- **File:** [`backend/routes/checkout.js`](backend/routes/checkout.js)
- **Line:** 70-72 - Route definition for `/checkout/initialize`

- **File:** [`backend/routes/cart.js`](backend/routes/cart.js)
- **Line:** 566-645 - Guest cart creation endpoint `/guest/create`

### Backend Controllers
- **File:** [`backend/controllers/checkoutController.js`](backend/controllers/checkoutController.js)
- **Line:** 136-234 - `initiateCheckout` method
- **Line:** 180 - Call to `checkoutService.createCheckoutSession`

- **File:** [`backend/controllers/guestCheckoutController.js`](backend/controllers/guestCheckoutController.js)
- **Line:** 52-139 - `initiateGuestCheckout` method

### Backend Services
- **File:** [`backend/services/checkoutService.js`](backend/services/checkoutService.js)
- **Line:** 45-130 - `createCheckoutSession` method
- **Line:** 50-59 - Cart lookup and validation
- **Line:** 70-72 - Session ID validation for guest users

- **File:** [`backend/services/cartService.js`](backend/services/cartService.js)
- **Line:** 788-838 - `createCart` method
- **Line:** 801-805 - Session ID assignment for guest carts

---

## Recommended Fix Approach

### Option 1: Update Frontend to Use Correct Endpoint (Recommended)

1. Change frontend to call `/guest/checkout/initiate` instead of `/checkout/initialize`
2. This endpoint properly handles guest checkout flow
3. It generates a new guest session ID and links it to the cart

**Implementation:**
```typescript
// In frontend/src/hooks/useGuestCheckout.ts
// Change line 222 from:
const response = await apiClient.post<GuestSession>('/checkout/initialize', request);

// To:
const response = await apiClient.post<GuestSession>('/guest/checkout/initiate', {
  cartId: request.cartId
});
```

### Option 2: Ensure Cart Created With Session ID (Alternative)

1. Before checkout initialization, ensure cart is created via `/guest/create` endpoint
2. This ensures cart has `sessionId` field properly set
3. Then use that cart ID with `/checkout/initialize`

**Implementation:**
```typescript
// Add this step before initializeSession call
const createGuestCart = async (items: any[]) => {
  const response = await apiClient.post('/cart/guest/create', { items });
  return response.cartId;
};

// Then in initializeSession:
const cartId = await createGuestCart(items);
const response = await apiClient.post<GuestSession>('/checkout/initialize', {
  ...request,
  cartId
});
```

### Option 3: Modify Checkout Service to Handle Missing Session ID (Not Recommended)

1. Update `checkoutService.createCheckoutSession` to auto-assign session ID to cart
2. This is less clean as it changes service behavior
3. Better to use proper guest checkout flow

---

## Additional Context Needed for Implementation

### 1. CartContext Implementation
- Need to verify how CartContext provides `cartId`
- Confirm if guest carts are properly managed in CartContext
- Check if CartContext uses guest cart creation endpoint

### 2. Guest Checkout Flow Documentation
- Need to document the correct guest checkout flow
- Ensure frontend developers know which endpoint to use
- Provide examples of proper usage

### 3. Testing Strategy
- Test guest checkout with items added to cart
- Verify guest session ID is properly generated and stored
- Test checkout initialization with various cart states

### 4. Error Handling
- Improve error messages to guide users to correct flow
- Add fallback logic if cart doesn't have session ID
- Provide clear guidance on how to proceed

---

## Summary

The "Cart not found" error during guest checkout initialization is caused by the frontend calling the **general checkout endpoint** (`/checkout/initialize`) instead of the **guest-specific endpoint** (`/guest/checkout/initiate`). The general endpoint expects carts to have a `sessionId` field matching the guest session ID, but guest carts created via general endpoints don't have this field set.

**Recommended Fix:** Update the frontend to call `/guest/checkout/initiate` endpoint, which properly handles the guest checkout flow by validating the cart, generating a new guest session ID, and linking them together.

---

**Report Generated:** 2026-02-25T04:39:26Z  
**Status:** Diagnosis Complete - Implementation Pending
