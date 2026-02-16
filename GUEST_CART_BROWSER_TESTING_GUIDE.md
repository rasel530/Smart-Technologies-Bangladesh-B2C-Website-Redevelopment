# Guest Cart Browser Testing Guide

This comprehensive guide provides detailed instructions for testing the Guest Cart functionality in the Smart Tech B2C e-commerce platform. The Guest Cart system uses a hybrid implementation that combines client-side localStorage with backend synchronization to provide a seamless shopping experience for non-authenticated users.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Browser Testing Setup](#2-browser-testing-setup)
3. [Test Scenarios](#3-test-scenarios)
4. [Expected Behaviors](#4-expected-behaviors)
5. [Verification Steps](#5-verification-steps)
6. [Troubleshooting](#6-troubleshooting)
7. [API Testing](#7-api-testing)
8. [Browser Compatibility](#8-browser-compatibility)
9. [Edge Cases](#9-edge-cases)
10. [Test Checklist](#10-test-checklist)

---

## 1. Prerequisites

Before beginning browser testing for the Guest Cart functionality, ensure the following environment setup is complete.

### 1.1 Development Environment Requirements

The development environment must be properly configured with all necessary services running. Begin by verifying that Docker containers are active, as the backend API and database depend on containerized services for proper operation. The frontend application should be running on its designated development port, typically localhost:3000, and the backend API should be accessible on its configured port, usually localhost:5000 or the port specified in your environment variables.

Ensure Node.js version 18 or higher is installed, as the project dependencies require modern JavaScript features. Verify npm or yarn package manager is available with the appropriate version for your operating system. The MongoDB database should be running and accessible, with the connection string properly configured in your backend environment variables.

### 1.2 Database Preparation

For thorough testing, the database should contain adequate product data with various stock levels. Prepare test products with the following characteristics: products with high stock quantities (100+ units), products with limited stock (1-5 units), products that are completely out of stock, and products with varying price points including sale prices. This variety ensures all stock validation scenarios can be properly tested.

Run the database migration scripts to ensure the cart-related schemas are properly initialized. Verify the cart collection exists in the database and has the appropriate indexes for session-based queries. The session collection should also be properly configured with TTL (Time-To-Live) indexes for automatic expiration handling.

### 1.3 Test Accounts and Data

While testing guest functionality does not require authenticated user accounts, prepare the following for testing cart merge scenarios: a test user account with confirmed email, known login credentials stored securely, and no existing cart items to ensure clean test conditions. Additionally, prepare a second test user account that will be used for testing cart merge conflicts where both guest cart and user cart contain items.

### 1.4 API Documentation Reference

Ensure the API documentation is accessible during testing. The following endpoints are relevant for Guest Cart testing:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/cart/guest/products` | POST | Get product details for cart items |
| `/api/v1/cart/guest/validate` | POST | Validate stock and pricing |
| `/api/v1/cart/guest` | POST | Sync cart to backend |
| `/api/v1/cart/merge` | POST | Merge guest cart on login |
| `/api/v1/cart` | GET | Get cart with x-session-id header |
| `/api/v1/cart/count` | GET | Get item count |
| `/api/v1/cart/stock/check` | POST | Check stock availability |

---

## 2. Browser Testing Setup

Proper browser configuration is essential for accurate Guest Cart testing. This section outlines the setup procedures for different testing scenarios.

### 2.1 Browser Selection and Installation

Test the Guest Cart functionality across the following browsers to ensure cross-browser compatibility:

Chrome (latest stable version) serves as the primary testing browser due to its comprehensive DevTools and wide usage among target users. Firefox provides an alternative perspective with different localStorage implementations. Safari testing is essential for macOS and iOS user coverage. Edge rounds out the Chromium-based browser testing for Windows users.

Install each browser on your testing machine and ensure they are updated to their latest stable versions. Create separate browser profiles for testing to avoid interference from extensions, cached data, and saved credentials.

### 2.2 Clearing Browser Data

Before each testing session, clear all browser data to ensure a fresh guest session. Navigate to the browser settings and clear the following data types:

**For Chrome:**
1. Open Developer Tools (F12 or Cmd+Option+I)
2. Navigate to Application tab
3. Expand Clear storage section
4. Check all options including Local Storage, Session Storage, Cookies, and Cache
5. Click Clear site data button

**For Firefox:**
1. Open Developer Tools (F12)
2. Navigate to Storage tab
3. Right-click on Local Storage and select Clear
4. Repeat for Session Storage and Cookies

**Automated Clearing Script:**

```javascript
// Run this in browser console for complete data clearing
(function clearAllStorage() {
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear all cookies
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [name] = cookie.split('=');
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
    }
    
    // Dispatch storage event to notify listeners
    window.dispatchEvent(new StorageEvent('storage', { key: null }));
    
    console.log('All browser storage cleared successfully');
    console.log('Current localStorage:', localStorage);
    console.log('Current sessionStorage:', sessionStorage);
    console.log('Current cookies:', document.cookie);
})();
```

### 2.3 Developer Tools Configuration

Configure browser DevTools for optimal cart testing by enabling relevant panels and settings. In the Network tab, enable persistent logging to capture all API requests during testing. Configure the Preserve log option to keep requests visible after page navigation. Add a filter for `/api/v1/cart` to focus on cart-related requests.

In the Application tab (Chrome) or Storage tab (Firefox), expand the Local Storage section and locate your application domain. Pin this panel for quick access during testing. Enable the Show frame origin support checkbox if available for debugging cross-origin issues.

### 2.4 Console Logging Configuration

The Guest Cart implementation logs important information to the console. Ensure console logging is configured to capture these messages by opening the Console tab in DevTools and verifying the default level filter is set to "Info" or "All". Create a filter for session-related keywords including `guest_`, `cart`, and `session` to quickly locate relevant logs.

```javascript
// Console filter patterns for Guest Cart testing
// Use these filters in DevTools console:
// Pattern 1: /guest|cart|session/i - Matches all cart-related logs
// Pattern 2: /localStorage/ - Matches localStorage operations
// Pattern 3: /sync|merge/ - Matches synchronization and merge operations
```

### 2.5 Network Request Interception

For advanced testing, configure request interception to modify or inspect API calls. In Chrome DevTools, navigate to the Network tab and locate the Fetch/XHR filter. Right-click on any request and select "Block request domain" to test error handling scenarios. Use the "Edit and Resend" feature to modify request payloads and headers for testing edge cases.

---

## 3. Test Scenarios

This section provides detailed step-by-step instructions for each test scenario. Execute tests in the order presented for systematic coverage.

### 3.1 Adding Items to Guest Cart

**Objective:** Verify that products can be successfully added to the guest cart with proper localStorage and backend synchronization.

**Preconditions:** Browser data cleared, no existing session, application loaded.

**Steps:**

1. Navigate to the product listing page or a specific product page
2. Locate a product with adequate stock (more than 10 units)
3. Click the "Add to Cart" button or select a quantity and add to cart
4. Observe the UI feedback (cart icon update, toast notification)
5. Open browser DevTools and navigate to Application > Local Storage
6. Expand your application domain and locate `smart_tech_guest_cart`
7. Click on the key to inspect the cart data structure

**Screenshot Placeholder:** [Add Product Page with Add to Cart Button]

**Screenshot Placeholder:** [DevTools Local Storage with cart data]

**Data Structure Verification:**

The cart data should follow this JSON structure:

```json
{
  "items": [
    {
      "productId": "507f1f77bcf86cd799439011",
      "variantId": null,
      "quantity": 1,
      "price": 299.99,
      "name": "Product Name",
      "image": "/images/product.jpg",
      "addedAt": "2026-02-13T10:00:00.000Z"
    }
  ],
  "sessionId": "guest_1707824400000_a1b2c3d4",
  "lastUpdated": "2026-02-13T10:00:00.000Z",
  "expiresAt": "2026-02-20T10:00:00.000Z"
}
```

### 3.2 Removing Items from Guest Cart

**Objective:** Verify that items can be removed from the guest cart and both localStorage and backend are updated accordingly.

**Preconditions:** At least one item in guest cart.

**Steps:**

1. Navigate to the cart page or open the cart drawer
2. Locate an item to remove
3. Click the remove button (trash icon or "Remove" link)
4. Verify the item is immediately removed from the UI
5. Check localStorage for updated cart data
6. Verify Network tab for DELETE or PUT request to backend
7. Add the item back to cart for subsequent tests

**Negative Test - Removing Out-of-Stock Item:**

1. Add a product that has limited stock (1-2 units)
2. Simulate the product going out of stock in another tab or via API
3. Attempt to remove the item from cart
4. Verify removal succeeds regardless of stock status

### 3.3 Updating Item Quantities

**Objective:** Verify that quantity updates work correctly and respect stock limits.

**Preconditions:** At least one item in guest cart with stock greater than 1.

**Steps:**

1. Navigate to the cart page
2. Locate an item with quantity greater than 1
3. Increase quantity using the + button
4. Verify the quantity updates in the UI
5. Check for price recalculation if applicable
6. Decrease quantity using the - button
7. Verify minimum quantity of 1 is enforced
8. Test manual quantity input if available
9. Attempt to exceed available stock (if known)
10. Verify appropriate error or limitation behavior

**Stock Limit Testing:**

If you know the product stock level, test the following scenarios:

| Test Case | Current Quantity | Target Quantity | Expected Result |
|-----------|------------------|------------------|-----------------|
| Increase below stock | 1 | 3 | Success, quantity updates |
| Increase to stock limit | 3 | 5 (stock is 5) | Success, quantity updates |
| Exceed stock limit | 5 | 6 (stock is 5) | Error or max quantity enforced |
| Decrease to zero | 1 | 0 | Item removed or error shown |

### 3.4 Viewing Cart Contents

**Objective:** Verify that cart contents display correctly with all relevant information.

**Preconditions:** Multiple items in guest cart (add 3-5 different products).

**Steps:**

1. Open the cart drawer by clicking the cart icon
2. Verify all added items appear in the list
3. Check that product images, names, and prices display correctly
4. Verify quantity controls are present for each item
5. Check that the subtotal, tax, and total calculations are accurate
6. Verify any applicable discounts or promotions display
7. Test the cart drawer can be closed and reopened
8. Navigate to the full cart page and verify consistency

**Visual Verification Checklist:**

- [ ] Product thumbnails load correctly
- [ ] Product names are truncated appropriately for long names
- [ ] Price formatting follows locale conventions
- [ ] Quantity selectors are disabled when at min/max limits
- [ ] Remove buttons are clearly visible
- [ ] Subtotal updates immediately on quantity change

### 3.5 Cart Persistence Across Page Refresh

**Objective:** Verify that cart data persists when the page is refreshed or the browser is closed and reopened.

**Preconditions:** Items in guest cart.

**Steps:**

1. Add items to cart and verify localStorage has data
2. Note the session ID and cart contents
3. Refresh the page (F5 or Cmd+R)
4. Verify cart contents are restored
5. Check localStorage data is unchanged
6. Close the browser tab completely
7. Reopen the browser and navigate to the site
8. Verify cart contents are restored
9. Wait 30 seconds and refresh again
10. Verify continued persistence

**Extended Persistence Test:**

1. Add items to cart
2. Close all browser windows
3. Wait 5 minutes
4. Reopen browser and navigate to site
5. Verify cart is still present
6. Add this test result to the session expiration verification

### 3.6 Cross-Tab Synchronization

**Objective:** Verify that cart changes in one browser tab are reflected in other tabs of the same browser.

**Preconditions:** Multiple browser tabs open with the same site, cart with items in at least one tab.

**Steps:**

1. Open Tab A and add items to cart
2. Open Tab B to the same site
3. Verify cart contents are synced in Tab B
4. Add a new item in Tab B
5. Return to Tab A and verify the new item appears
6. Remove an item in Tab A
7. Verify removal is reflected in Tab B
8. Update quantity in Tab B
9. Verify update is reflected in Tab A

**Technical Verification:**

```javascript
// In Tab A console - Listen for storage events
window.addEventListener('storage', (event) => {
    if (event.key === 'smart_tech_guest_cart') {
        console.log('Cart updated in another tab:', JSON.parse(event.newValue));
    }
});

// In Tab B console - Trigger cart update
const cart = JSON.parse(localStorage.getItem('smart_tech_guest_cart'));
cart.items.push({ productId: 'new-item-id', quantity: 1 });
localStorage.setItem('smart_tech_guest_cart', JSON.stringify(cart));

// Dispatch custom event for same-tab sync
window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cart }));
```

**Screenshot Placeholder:** [Two tabs showing synchronized cart]

### 3.7 Cart Expiration After 7 Days

**Objective:** Verify that guest cart data expires after 7 days of inactivity.

**Preconditions:** Ability to manipulate localStorage timestamps or wait for actual expiration.

**Accelerated Testing Method:**

1. Add items to cart
2. Open DevTools Application tab
3. Locate `smart_tech_guest_cart` in Local Storage
4. Edit the `expiresAt` timestamp to a past date
   - Format: ISO 8601 (e.g., "2026-02-06T10:00:00.000Z" for 7 days ago)
5. Refresh the page
6. Verify the cart is treated as expired

**Expected Behavior After Expiration:**

- Cart should be cleared from localStorage
- New guest session should be created
- User should see an empty cart
- No error messages should disrupt the experience
- Product pages should allow adding to new cart

**Screenshot Placeholder:** [Expired cart replaced with empty cart]

### 3.8 Login Migration of Guest Cart

**Objective:** Verify that guest cart items are properly merged into the user's cart upon login.

**Preconditions:** Guest cart with items, test user account with no existing cart items.

**Steps:**

1. As guest, add 2-3 items to cart
2. Verify localStorage contains guest session and cart
3. Note the session ID and item count
4. Click login button
5. Enter valid user credentials
6. Submit login form
7. Observe cart contents after login
8. Verify guest cart items are present
9. Check backend for merged cart data
10. Verify localStorage guest cart is cleared

**Merge Conflict Testing:**

1. Create guest cart with 2 items (Items A and B)
2. Log in with user who already has 2 items (Items C and D)
3. Verify merge results in 4 total items
4. Test with same product in both carts (should sum quantities)

**Idempotency Testing:**

1. Attempt rapid successive logins
2. Verify cart is not duplicated
3. Check only one merge request is processed

### 3.9 Checkout Redirect for Guests

**Objective:** Verify that guests attempting to access checkout are redirected appropriately.

**Preconditions:** Guest cart with items, checkout page protected for guests.

**Steps:**

1. Add items to cart as guest
2. Click checkout button or navigate to /checkout directly
3. Verify redirect to login page
4. Check for informative message about login requirement
5. Verify cart contents persist after redirect
6. Complete login process
7. Verify redirect back to checkout or success message
8. Verify cart contents maintained through flow

**Screenshot Placeholder:** [Checkout redirect message]

### 3.10 Stock Validation for Out-of-Stock Items

**Objective:** Verify that the system handles out-of-stock scenarios appropriately.

**Preconditions:** Knowledge of product stock levels, ability to simulate out-of-stock.

**Testing Scenarios:**

**Scenario A: Product Becomes Out of Stock After Addition**

1. Add product to cart (verify stock available)
2. Use backend API or admin panel to set product stock to 0
3. Return to cart page
4. Verify appropriate handling:
   - Product marked as out of stock
   - Quantity selector disabled
   - Remove button still functional
   - Message displayed about availability

**Scenario B: Adding Out-of-Stock Product**

1. Navigate to product page for out-of-stock item
2. Verify "Add to Cart" button is disabled or shows "Out of Stock"
3. Attempt direct add via API (if testing backend)
4. Verify error response from backend

**Scenario C: Partial Stock Availability**

1. Add product with stock of 5, quantity 3
2. Reduce product stock to 2
3. Return to cart
4. Verify quantity reduced to available stock
5. Or verify error/warning displayed

### 3.11 Storage Quota Handling

**Objective:** Verify graceful handling when localStorage quota is exceeded.

**Preconditions:** large cart or simulated quota limitation.

**Testing Method:**

1. Open browser DevTools
2. Navigate to Application > Local Storage
3. Right-click and select "Clear" for all sites except your app
4. Fill localStorage with dummy data to near capacity
5. Attempt to add items to cart
6. Verify graceful failure handling:
   - User-friendly error message
   - Cart operations may fail but app remains functional
   - Backend sync attempted as fallback

**Simulated Quota Error:**

```javascript
// Attempt to fill localStorage to trigger quota error
let filled = false;
let data = 'x'.repeat(1000000); // 1MB chunks

try {
    while (!filled) {
        localStorage.setItem('dummy_' + Date.now(), data);
    }
} catch (e) {
    if (e.name === 'QuotaExceededError') {
        console.log('Storage quota exceeded:', e.message);
        // Test cart functionality here
        // Cart should handle this gracefully
    }
}
```

### 3.12 GDPR Consent Handling

**Objective:** Verify that GDPR consent affects cart functionality appropriately.

**Preconditions:** GDPR consent management implemented.

**Testing Scenarios:**

**Scenario A: No Consent Given**

1. Clear all data and consent
2. Attempt to add items to cart
3. Verify cart works (localStorage essential functionality)
4. Verify no non-essential tracking occurs

**Scenario B: Consent Withdrawn**

1. Add items to cart with consent
2. Withdraw consent via cookie/settings management
3. Verify cart contents persist
4. Verify no new tracking occurs
5. Clear consent and refresh
6. Verify cart still functional

**Scenario C: Consent Re-given After Withdrawal**

1. Re-enable consent
2. Verify cart functionality unchanged
3. Verify tracking resumes appropriately

---

## 4. Expected Behaviors

This section documents the expected system behavior for each test scenario.

### 4.1 Session Management Expectations

When a guest user first accesses the site, the system should create a unique session identifier in the format `guest_{timestamp}_{random}`. This session ID must be stored in both localStorage under the key `smart_tech_guest_session` and in a cookie with appropriate CORS settings. The session should persist across browser sessions for 7 days unless explicitly cleared or expired.

The session creation should be atomic and idempotent. If a session already exists when the page loads, the existing session should be reused rather than creating a new one. Session validation should occur on page load, and expired sessions should be automatically cleaned up with a new session created.

### 4.2 Cart Operations Expectations

All cart operations must be optimistic, updating the UI immediately while backend synchronization occurs in the background. The user should never experience UI blocking due to backend latency. If a backend operation fails, the cart should attempt to resynchronize or display an appropriate error message while preserving the last known good state.

Cart updates must trigger storage events for cross-tab synchronization. Each update should include a timestamp and version identifier to resolve conflicts. The cart should maintain a reasonable maximum item count to prevent abuse, typically 50-100 unique items per cart.

### 4.3 Merge Operations Expectations

During login, the guest cart should be merged with any existing user cart using the following priority rules: for overlapping products, quantities should sum (up to available stock); prices should use the current guest cart price or user cart price, whichever is lower; out-of-stock items should be excluded from the merge with user notification.

The merge operation should be idempotent, meaning repeated merge attempts for the same session should not duplicate items. An idempotency key should be used for merge API calls to prevent duplicate processing.

### 4.4 Error Handling Expectations

Network errors should trigger automatic retry with exponential backoff. After 3 failed attempts, the cart should enter a degraded mode where localStorage serves as the source of truth, with user notification about synchronization issues.

Validation errors (such as stock limitations) should display clear, user-friendly messages. Technical error details should be logged to console but not displayed to users. The cart should gracefully handle malformed localStorage data by resetting to an empty cart with a notification.

---

## 5. Verification Steps

This section provides detailed verification procedures using browser DevTools and other testing utilities.

### 5.1 localStorage Inspection

Open DevTools and navigate to the Application tab (Chrome) or Storage tab (Firefox). Expand the Local Storage section in the sidebar and click on your application domain. The following keys are relevant for guest cart testing:

| Key | Description | Expected Content |
|-----|-------------|------------------|
| `smart_tech_guest_session` | Guest session identifier | JSON with sessionId, createdAt, expiresAt |
| `smart_tech_guest_cart` | Guest cart data | JSON with items array, metadata |
| `gdpr_consent` | Consent preferences | JSON with consent flags |

**Quick Inspection Command:**

```javascript
// Run in console to quickly inspect cart state
const cart = JSON.parse(localStorage.getItem('smart_tech_guest_cart') || '{}');
const session = JSON.parse(localStorage.getItem('smart_tech_guest_session') || '{}');

console.log('=== Guest Cart State ===');
console.log('Session ID:', session.sessionId || 'NOT SET');
console.log('Session Expires:', session.expiresAt || 'NOT SET');
console.log('Cart Items:', cart.items?.length || 0);
console.log('Cart Total:', cart.items?.reduce((sum, i) => sum + (i.price * i.quantity), 0) || 0);
console.log('Last Updated:', cart.lastUpdated || 'NOT SET');
console.log('Cart Expires:', cart.expiresAt || 'NOT SET');
```

### 5.2 Cookie Inspection

In DevTools, navigate to the Application tab and expand the Cookies section. Select your application domain and verify the following:

| Cookie Name | Purpose | Expected Value |
|-------------|---------|----------------|
| `x-session-id` | Session identifier | Should match localStorage sessionId |
| `connect.sid` | Session cookie | Backend session identifier |
| `gdpr_consent` | Consent tracking | Consent preferences |

### 5.3 Network Request Verification

Filter Network tab requests by `/api/v1/cart` to focus on cart-related API calls. Key request/response pairs to verify:

**POST /api/v1/cart/guest (Cart Sync):**
- Request should include `x-session-id` header
- Request body should contain cart items array
- Response should include merged/synced cart data
- Status should be 200 for success

**POST /api/v1/cart/merge (Login Merge):**
- Request should include both session cookie and `x-session-id` header
- Request body should contain guest cart items
- Response should include merged cart data
- Status should be 200 for success, 409 for conflict

### 5.4 Console Log Verification

The guest cart implementation logs important events. Filter console by these keywords:

```
[GuestCart] - Session created
[GuestCart] - Item added
[GuestCart] - Item removed
[GuestCart] - Cart synced
[GuestCart] - Merge initiated
[GuestCart] - Merge completed
[GuestCart] - Error:
```

### 5.5 Custom Event Monitoring

The cart system dispatches custom events for cross-component communication:

```javascript
// Listen for all cart events
const eventTypes = ['cartUpdated', 'cartSynced', 'cartMerged', 'cartError'];

eventTypes.forEach(type => {
    window.addEventListener(type, (e) => {
        console.log(`[${type}]`, e.detail);
    });
});

// Trigger cart update manually
window.dispatchEvent(new CustomEvent('cartUpdated', {
    detail: { source: 'test', items: [] }
}));
```

---

## 6. Troubleshooting

This section addresses common issues encountered during testing and their resolutions.

### 6.1 Cart Not Persisting

**Symptom:** Cart contents disappear after page refresh despite items being added.

**Diagnosis Steps:**

1. Verify localStorage is working: `localStorage.setItem('test', 'value')`
2. Check for console errors during cart operations
3. Verify session ID exists in both localStorage and cookies
4. Check Network tab for failed sync requests

**Resolution:**

If localStorage test fails, the browser may be in private/incognito mode or blocking storage. Clear browser data and try again in regular mode. If sync requests fail, verify backend is running and CORS settings are correct. If session ID is missing, check for JavaScript errors during page load.

### 6.2 Cross-Tab Synchronization Not Working

**Symptom:** Changes in one tab are not reflected in other tabs.

**Diagnosis Steps:**

1. Open DevTools in both tabs
2. Add item in Tab A
3. Watch for storage event in Tab B console
4. Verify localStorage is being updated in both tabs

**Resolution:**

The storage event only fires in other tabs, not the tab that initiated the change. Verify you are monitoring from a different tab. Check that both tabs are on the same origin. Some browser configurations may block storage events; try a different browser.

### 6.3 Merge Conflicts

**Symptom:** Cart merge produces unexpected results or duplicates items.

**Diagnosis Steps:**

1. Document exact cart state before login
2. Document user cart state before login
3. Attempt login and document result
4. Compare with expected merge behavior

**Resolution:**

Clear localStorage and retry the test scenario. Verify no cached cart data persists from previous sessions. Check that the merge endpoint is receiving both session ID and authentication cookie. Review server logs for merge operation details.

### 6.4 Session ID Missing in API Requests

**Symptom:** Backend logs show missing x-session-id header.

**Diagnosis Steps:**

1. Open Network tab
2. Find cart API request
3. Inspect Request Headers section
4. Verify x-session-id is present

**Resolution:**

The session ID may not be available on initial page load before any cart operation. The first cart operation should create the session and include it in the request. If still missing, check that localStorage is accessible and the session creation code is executing without errors.

### 6.5 Cart Expiration Not Working

**Symptom:** Old cart data persists beyond 7 days.

**Diagnosis Steps:**

1. Check expiresAt timestamp in cart localStorage
2. Verify system clock is correct
3. Check for any code that resets expiration

**Resolution:**

Manually edit the expiresAt timestamp to a past date and refresh. If the cart persists, the expiration check code may not be executing. Verify the cart initialization code includes expiration validation.

### 6.6 API Errors and Retry Behavior

**Symptom:** Cart operations fail with network errors.

**Diagnosis Steps:**

1. Check browser Network tab for failed requests
2. Verify backend server is running
3. Check backend logs for error details
4. Test API endpoint directly using curl or Postman

**Resolution:**

If backend is down, restart the backend service. If CORS errors, verify backend CORS configuration allows requests from frontend origin. If rate limiting, wait and retry. Check that API endpoints have not changed.

---

## 7. API Testing

This section provides guidance for testing backend API endpoints using browser DevTools.

### 7.1 Testing with Fetch API

Use the browser console to directly test API endpoints:

```javascript
// Test GET cart
async function getCart() {
    const sessionId = localStorage.getItem('smart_tech_guest_session');
    const response = await fetch('/api/v1/cart', {
        method: 'GET',
        headers: {
            'x-session-id': JSON.parse(sessionId || '{}').sessionId || ''
        }
    });
    const data = await response.json();
    console.log('Cart:', data);
    return data;
}

// Test POST sync cart
async function syncCart(items) {
    const sessionId = localStorage.getItem('smart_tech_guest_session');
    const response = await fetch('/api/v1/cart/guest', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-session-id': JSON.parse(sessionId || '{}').sessionId || ''
        },
        body: JSON.stringify({ items })
    });
    const data = await response.json();
    console.log('Sync Result:', data);
    return data;
}

// Test stock check
async function checkStock(productId, quantity) {
    const response = await fetch('/api/v1/cart/stock/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{ productId, quantity }])
    });
    const data = await response.json();
    console.log('Stock Check:', data);
    return data;
}
```

### 7.2 Testing Cart Merge

```javascript
// Test cart merge endpoint
async function mergeCart() {
    const sessionId = localStorage.getItem('smart_tech_guest_session');
    const response = await fetch('/api/v1/cart/merge', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-session-id': JSON.parse(sessionId || '{}').sessionId || ''
        },
        body: JSON.stringify({
            idempotencyKey: 'merge_' + Date.now(),
            mergeStrategy: 'prefer_guest' // or 'prefer_user', 'sum_quantities'
        })
    });
    const data = await response.json();
    console.log('Merge Result:', data);
    return data;
}
```

### 7.3 Request Payload Examples

**POST /api/v1/cart/guest (Sync):**

```json
{
  "items": [
    {
      "productId": "507f1f77bcf86cd799439011",
      "variantId": "507f1f77bcf86cd799439012",
      "quantity": 2,
      "price": 299.99,
      "metadata": {
        "addedFrom": "product_page"
      }
    }
  ],
  "source": "web"
}
```

**POST /api/v1/cart/stock/check:**

```json
{
  "items": [
    {
      "productId": "507f1f77bcf86cd799439011",
      "quantity": 2
    }
  ]
}
```

**Response Examples:**

```json
// Success response
{
  "success": true,
  "data": {
    "items": [...],
    "totalItems": 5,
    "subtotal": 1499.95
  }
}

// Stock check response
{
  "success": true,
  "data": [
    {
      "productId": "507f1f77bcf86cd799439011",
      "available": true,
      "currentStock": 150,
      "requestedQuantity": 2
    }
  ]
}

// Error response
{
  "success": false,
  "error": {
    "code": "OUT_OF_STOCK",
    "message": "Product is out of stock",
    "productId": "507f1f77bcf86cd799439011"
  }
}
```

---

## 8. Browser Compatibility

Test the guest cart functionality across the following browsers and platforms.

### 8.1 Desktop Browsers

| Browser | Version | localStorage | Cookies | Service Worker | Status |
|---------|---------|--------------|---------|----------------|--------|
| Chrome | Latest Stable | ✅ Full Support | ✅ | ✅ | Primary Test |
| Firefox | Latest Stable | ✅ Full Support | ✅ | ✅ | Required |
| Edge | Latest Stable | ✅ Full Support | ✅ | ✅ | Required |
| Safari | Latest Stable | ✅ Limited (10MB) | ✅ | ✅ | Required |

### 8.2 Mobile Browsers

| Browser | Platform | localStorage | Notes |
|---------|----------|--------------|-------|
| Safari | iOS 15+ | ✅ Full Support | Test in Simulator |
| Chrome | Android 10+ | ✅ Full Support | Test on Physical Device |
| Samsung Internet | Android | ✅ Full Support | Common on Samsung devices |

### 8.3 Key Differences to Test

**Safari Private Browsing:**
Safari's private browsing mode limits localStorage. Test that the cart degrades gracefully or prompts user appropriately.

**Firefox Enhanced Tracking Protection:**
Firefox may block some third-party cookies. Verify session cookies work correctly.

**Chrome SameSite Cookie Changes:**
Chrome's SameSite cookie changes may affect cross-origin requests. Test all cart operations thoroughly.

### 8.4 Testing Tools

Use BrowserStack or Sauce Labs for testing on real devices and browsers you don't have access to locally. Configure tests for the following viewport sizes:

- Desktop: 1920x1080, 1366x768
- Tablet: 768x1024, 834x1194
- Mobile: 375x812, 414x896

---

## 9. Edge Cases

This section covers special scenarios that should be tested to ensure robustness.

### 9.1 Concurrent Modifications

**Scenario:** Multiple tabs making simultaneous changes.

**Test Steps:**
1. Open 3 tabs to the cart page
2. In Tab 1, add Item A
3. In Tab 2, quickly add Item B
4. In Tab 3, add Item C
5. Verify all 3 items are present in all tabs
6. Verify no items are lost or duplicated

### 9.2 Very Large Cart

**Scenario:** Cart approaches storage limits.

**Test Steps:**
1. Add 50+ items to cart
2. Verify cart still functions normally
3. Verify cart drawer/page still renders correctly
4. Verify localStorage is not exceeded
5. Verify backend sync handles large payloads

### 9.3 Long Product Names

**Scenario:** Products with very long names.

**Test Steps:**
1. Add product with name > 100 characters
2. Verify cart displays name appropriately
3. Verify no UI overflow or wrapping issues
4. Verify truncation works correctly

### 9.4 Special Characters in Data

**Scenario:** Products with special characters.

**Test Steps:**
1. Add product with quotes, emojis, or Unicode characters in name
2. Verify localStorage preserves encoding
3. Verify API handles special characters
4. Verify UI displays correctly

### 9.5 Price Edge Cases

**Scenario:** Various price formatting scenarios.

**Test Steps:**
1. Add product with $0.01 price
2. Add product with very high price ($1,000,000+)
3. Add product with negative price (should be rejected)
4. Verify cart totals calculate correctly
5. Verify currency formatting

### 9.6 Zero Quantity Addition

**Scenario:** Attempting to add zero quantity.

**Test Steps:**
1. Attempt to add product with quantity 0
2. Verify operation is rejected or handled gracefully
3. Verify no cart entry is created

### 9.7 Duplicate Product Addition

**Scenario:** Adding same product multiple times.

**Test Steps:**
1. Add product to cart (quantity 1)
2. Add same product again (quantity 1)
3. Verify quantity updates to 2 instead of duplicate entry
4. Verify price reflects single line item with quantity 2

### 9.8 Rapid Add/Remove Operations

**Scenario:** Quick succession of add and remove operations.

**Test Steps:**
1. Add item
2. Immediately remove item
3. Repeat 10 times rapidly
4. Verify no race conditions
5. Verify cart state is consistent

---

## 10. Test Checklist

Use this printable checklist for systematic manual testing.

### 10.1 Pre-Test Checklist

- [ ] Development environment running
- [ ] Backend API accessible
- [ ] Database populated with test products
- [ ] Test user account prepared
- [ ] Browser data cleared
- [ ] DevTools opened and configured
- [ ] Console logs monitored
- [ ] Network tab filtered for cart requests

### 10.2 Session Management Tests

- [ ] Guest session created on first visit
- [ ] Session ID stored in localStorage and cookies
- [ ] Session persists across page refresh
- [ ] Session persists across browser restart
- [ ] Session expires after 7 days
- [ ] New session created after expiration

### 10.3 Cart Operations Tests

- [ ] Add single item to cart
- [ ] Add multiple items to cart
- [ ] Add same item twice (quantity update)
- [ ] Remove item from cart
- [ ] Update item quantity up
- [ ] Update item quantity down
- [ ] Quantity reaches minimum (1)
- [ ] Quantity cannot go below minimum
- [ ] Cart displays correct totals
- [ ] Cart drawer opens and closes
- [ ] Full cart page renders correctly

### 10.4 Persistence Tests

- [ ] Cart persists after page refresh
- [ ] Cart persists after browser restart
- [ ] Cart persists after browser crash
- [ ] Cart cleared on explicit logout
- [ ] Cart cleared on data clear

### 10.5 Cross-Tab Tests

- [ ] Cart syncs to new tab
- [ ] Add in Tab A reflects in Tab B
- [ ] Remove in Tab A reflects in Tab B
- [ ] Quantity update in Tab A reflects in Tab B
- [ ] Multiple tabs sync correctly

### 10.6 Backend Integration Tests

- [ ] Cart syncs to backend
- [ ] Backend returns merged cart
- [ ] Network errors trigger retry
- [ ] Stock validation works
- [ ] Out-of-stock handled correctly
- [ ] Cart count endpoint works

### 10.7 Login/Merge Tests

- [ ] Guest cart persists during login flow
- [ ] Login redirects back to cart/checkout
- [ ] Merge completes with empty user cart
- [ ] Merge completes with non-empty user cart
- [ ] Merge handles overlapping products
- [ ] Guest cart cleared after successful merge
- [ ] Merge is idempotent

### 10.8 Checkout Flow Tests

- [ ] Guest checkout redirects to login
- [ ] Cart persists through redirect
- [ ] Login returns to checkout
- [ ] Checkout displays cart contents

### 10.9 Edge Case Tests

- [ ] Large cart (50+ items)
- [ ] Long product names
- [ ] Special characters in names
- [ ] Price edge cases ($0.01, $1M+)
- [ ] Concurrent tab modifications
- [ ] Rapid add/remove operations
- [ ] Zero quantity rejection
- [ ] Negative quantity rejection

### 10.10 Error Handling Tests

- [ ] Network disconnect handling
- [ ] Backend error handling
- [ ] Invalid product ID handling
- [ ] Storage quota exceeded handling
- [ ] Malformed localStorage data handling

### 10.11 Browser Compatibility Tests

- [ ] Chrome desktop test
- [ ] Firefox desktop test
- [ ] Safari desktop test
- [ ] Edge desktop test
- [ ] Chrome mobile test
- [ ] Safari iOS test

### 10.12 Final Verification

- [ ] All console errors reviewed
- [ ] All network requests verified
- [ ] localStorage data verified
- [ ] Test results documented
- [ ] Issues logged and triaged

---

## Appendix

### A. Key Files Reference

| File | Purpose |
|------|---------|
| [`frontend/src/contexts/CartContext.tsx`](frontend/src/contexts/CartContext.tsx) | Zustand state management for cart |
| [`frontend/src/lib/utils/guestCart.ts`](frontend/src/lib/utils/guestCart.ts) | localStorage utilities for guest cart |
| [`backend/routes/cart.js`](backend/routes/cart.js) | Express routes with guest endpoints |

### B. Storage Keys Reference

| Key | Location | Purpose |
|-----|----------|---------|
| `smart_tech_guest_session` | localStorage | Guest session identifier and metadata |
| `smart_tech_guest_cart` | localStorage | Guest cart items and totals |
| `x-session-id` | Cookie | Server-side session identification |

### C. Session ID Format

```
guest_{unix_timestamp}_{random_hex}
```

Example: `guest_1707824400000_a1b2c3d4e5f6`

### D. Cart Expiration

- Session expiration: 7 days from creation
- Cart expiration: 7 days from last update
- Automatic cleanup on page load if expired

### E. Test Data Recommendations

For comprehensive testing, prepare products with:
- High stock (100+ units)
- Limited stock (1-5 units)
- Out of stock (0 units)
- Various price points
- Multiple variants (color, size)
- Products with special characters
- Products with long names

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-13  
**Tested With:** Guest Cart Implementation v1.0
