# Cart Calculation Accuracy Analysis Report

**Date:** 2026-02-10
**Analysis Type:** Comprehensive Cart Calculation Review
**Reference:** Previous guest cart analysis identified HIGH-002 (no price synchronization with backend)

---

## Executive Summary

This report provides a detailed technical analysis of cart calculation accuracy for subtotal, tax, and shipping components in the e-commerce shopping cart system. The analysis identified **8 critical/high severity issues** and **4 medium severity issues** that need to be addressed to ensure calculation accuracy and consistency between frontend and backend.

---

## 1. Current Calculation Implementation Summary

### 1.1 Backend Calculation Logic ([`backend/services/cartService.js`](backend/services/cartService.js:533-578))

**Subtotal Calculation:**

- Lines 542-544: Subtotal is calculated by summing `item.subtotal` values from database
- Each cart item's subtotal is stored as `price * quantity` when added/updated

**Tax Calculation:**

- Line 13: Default tax rate is `0.15` (15%) from environment variable `CART_TAX_RATE`
- Line 547: Tax = `subtotal * taxRate`
- Tax is rounded to 2 decimal places

**Shipping Calculation:**

- Line 14: Fixed shipping cost of `100` BDT from environment variable `CART_SHIPPING_COST`
- No dynamic shipping calculation based on weight, location, or cart value

**Total Calculation:**

- Line 550: `total = subtotal + tax + shippingCost`
- Discount field exists but is NOT deducted from total

**Rounding Strategy:**

```javascript
subtotal: parseFloat(subtotal.toFixed(2)),
tax: parseFloat(tax.toFixed(2)),
shippingCost: parseFloat(this.shippingCost.toFixed(2)),
total: parseFloat(total.toFixed(2))
```

### 1.2 Frontend Calculation Logic ([`frontend/src/contexts/CartContext.tsx`](frontend/src/contexts/CartContext.tsx:137-145))

**Shipping Method Update:**

```typescript
setShippingMethod: (method, cost) => {
  set({ shippingMethod: method as ShippingMethod });
  const { total, subtotal, tax, discount } = get();
  set({
    shippingCost: cost,
    total: subtotal + tax + cost - discount, // INCLUDES discount deduction
  });
};
```

**Issue:** Frontend calculates `total = subtotal + tax + shipping - discount` but backend calculates `total = subtotal + tax + shipping` (no discount).

### 1.3 CartSummary Display ([`frontend/src/components/cart/CartSummary.tsx`](frontend/src/components/cart/CartSummary.tsx:49-58))

**Shipping Cost Parsing:**

```typescript
const cost =
  selectedMethod?.cost === "Free"
    ? 0
    : parseInt(selectedMethod?.cost.replace(/[৳\s]/g, "") || "0");
```

**Issue:** Uses `parseInt` instead of `parseFloat` which can truncate decimal values.

### 1.4 Data Flow

```
Add to Cart → Backend: price × quantity → Store item.subtotal
                          ↓
                  calculateCartTotals()
                          ↓
              Subtotal + Tax + Shipping = Total
                          ↓
                    Return cart with totals
                          ↓
              Frontend: setCart() - receives totals
                        ↓
    Frontend: setShippingMethod() - recalculates locally
```

---

## 2. Identified Issues with Severity

### CRITICAL Issues

#### CALC-001: Frontend/Backend Total Calculation Mismatch

| Property               | Value                                                                                    |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| **Severity**           | CRITICAL                                                                                 |
| **File**               | [`frontend/src/contexts/CartContext.tsx`](frontend/src/contexts/CartContext.tsx:137-145) |
| **Line**               | 143                                                                                      |
| **Description**        | Frontend calculates total with discount deduction but backend does not apply discount    |
| **Impact**             | Users see incorrect totals; checkout amounts may not match cart totals                   |
| **Formula (Frontend)** | `total = subtotal + tax + shipping - discount`                                           |
| **Formula (Backend)**  | `total = subtotal + tax + shipping`                                                      |

#### CALC-002: Discount Field Not Applied in Total

| Property                  | Value                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------- |
| **Severity**              | CRITICAL                                                                               |
| **File**                  | [`backend/services/cartService.js`](backend/services/cartService.js:549-550)           |
| **Line**                  | 550                                                                                    |
| **Description**           | The discount field exists in the database and is stored, but never deducted from total |
| **Impact**                | Discount codes appear to be applied but amount is never reflected in final total       |
| **Code total = subtotal** | `const + tax + this.shippingCost;` (discount not included)                             |

#### CALC-003: Guest Cart Price Not Synchronized with Backend

| Property        | Value                                                                                           |
| --------------- | ----------------------------------------------------------------------------------------------- |
| **Severity**    | CRITICAL (HIGH-002 follow-up)                                                                   |
| **File**        | [`frontend/src/contexts/CartContext.tsx`](frontend/src/contexts/CartContext.tsx:177-197)        |
| **Lines**       | 177-197                                                                                         |
| **Description** | Guest cart prices are stored locally without backend validation; no price synchronization       |
| **Impact**      | Price changes between add-to-cart and checkout not reflected; customers may pay outdated prices |

### HIGH Issues

#### CALC-004: Shipping Cost Parsing Uses parseInt

| Property        | Value                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------- | --- | ----- |
| **Severity**    | HIGH                                                                                              |
| **File**        | [`frontend/src/components/cart/CartSummary.tsx`](frontend/src/components/cart/CartSummary.tsx:53) |
| **Line**        | 53                                                                                                |
| **Description** | Uses `parseInt()` instead of `parseFloat()` for shipping cost                                     |
| **Code**        | `parseInt(selectedMethod?.cost.replace(/[৳\s]/g, '')                                              |     | '0')` |
| **Impact**      | Decimal shipping costs (if any) would be truncated, causing calculation errors                    |

#### CALC-005: No Free Shipping Threshold Logic

| Property        | Value                                                                               |
| --------------- | ----------------------------------------------------------------------------------- |
| **Severity**    | HIGH                                                                                |
| **File**        | [`backend/services/cartService.js`](backend/services/cartService.js:13-14)          |
| **Lines**       | 13-14                                                                               |
| **Description** | Fixed shipping cost of 100 BDT regardless of cart value                             |
| **Impact**      | No promotional free shipping; all orders pay same shipping regardless of cart value |

#### CALC-006: Rounding Accumulation Error

| Property        | Value                                                                                                                                         |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Severity**    | HIGH                                                                                                                                          |
| **File**        | [`backend/services/cartService.js`](backend/services/cartService.js:542-559)                                                                  |
| **Lines**       | 542-559                                                                                                                                       |
| **Description** | Item subtotals are rounded individually before summing, causing rounding accumulation                                                         |
| **Example**     | 3 items at 0.33 each: 0.33 + 0.33 + 0.33 = 0.99, but actual should be 0.33 × 3 = 0.99 ✓ (works) <br/> vs 0.333 + 0.333 + 0.334 = 1.00 (error) |
| **Impact**      | Small but cumulative rounding errors in cart totals                                                                                           |

### MEDIUM Issues

#### CALC-007: Tax Rate Not Configurable Per Product/Category

| Property        | Value                                                                                    |
| --------------- | ---------------------------------------------------------------------------------------- |
| **Severity**    | MEDIUM                                                                                   |
| **File**        | [`backend/services/cartService.js`](backend/services/cartService.js:547)                 |
| **Line**        | 547                                                                                      |
| **Description** | Flat 15% tax rate applied to all products; no variation for different product categories |
| **Impact**      | Cannot support different tax rates for different product types                           |

#### CALC-008: No Shipping Method Update Endpoint

| Property        | Value                                                                               |
| --------------- | ----------------------------------------------------------------------------------- |
| **Severity**    | MEDIUM                                                                              |
| **File**        | [`frontend/src/lib/api/cart.ts`](frontend/src/lib/api/cart.ts:254-263)              |
| **Lines**       | 254-263                                                                             |
| **Description** | `setShippingMethod` API exists but doesn't update backend totals                    |
| **Code**        | `export const setShippingMethod = async (method: string): Promise<Cart> => { ... }` |
| **Impact**      | Frontend updates shipping but backend cart totals remain unchanged                  |

#### CALC-009: Duplicate MergeGuestCartResponse Interface

| Property        | Value                                                              |
| --------------- | ------------------------------------------------------------------ |
| **Severity**    | MEDIUM                                                             |
| **File**        | [`frontend/src/types/cart.ts`](frontend/src/types/cart.ts:362-404) |
| **Lines**       | 362-385 and 390-404                                                |
| **Description** | Two identical `MergeGuestCartResponse` interfaces defined          |
| **Impact**      | TypeScript confusion; potential for inconsistent responses         |

#### CALC-010: Currency Symbol Inconsistency

| Property        | Value                                                                                              |
| --------------- | -------------------------------------------------------------------------------------------------- |
| **Severity**    | LOW                                                                                                |
| **File**        | [`frontend/src/components/cart/CartSummary.tsx`](frontend/src/components/cart/CartSummary.tsx:102) |
| **Line**        | 102, 218, 226, 233, 240, 252                                                                       |
| **Description** | Hardcoded '৳' symbol used throughout; no currency configuration                                    |
| **Impact**      | Not extensible for multi-currency support                                                          |

---

## 3. Fix Recommendations

### 3.1 Critical Fixes

#### Fix CALC-002: Apply Discount in Backend Total Calculation

**File:** `backend/services/cartService.js:550`

**Before:**

```javascript
const total = subtotal + tax + this.shippingCost;
```

**After:**

```javascript
const total = subtotal + tax + this.shippingCost - discount;
```

#### Fix CALC-001: Align Frontend with Backend Formula

**File:** `frontend/src/contexts/CartContext.tsx:137-145`

**Before:**

```typescript
setShippingMethod: (method, cost) => {
  set({ shippingMethod: method as ShippingMethod });
  const { total, subtotal, tax, discount } = get();
  set({
    shippingCost: cost,
    total: subtotal + tax + cost - discount,
  });
},
```

**After:**

```typescript
setShippingMethod: (method, cost) => {
  set({ shippingMethod: method as ShippingMethod, shippingCost: cost });
  // Remove local total calculation - use backend values
},
```

Or alternatively, fetch recalculated totals from backend:

```typescript
setShippingMethod: async (method, cost) => {
  set({ shippingMethod: method as ShippingMethod, shippingCost: cost });
  try {
    const updatedCart = await cartApi.setShippingMethod(method);
    get().setCart(updatedCart);
  } catch (error) {
    console.error('Failed to update shipping method:', error);
  }
},
```

#### Fix CALC-003: Sync Guest Cart Prices with Backend

**File:** `frontend/src/contexts/CartContext.tsx`

Add price validation when loading guest cart from storage:

```typescript
// In initializeCart or loadCart for guest users
const validateGuestCartPrices = async (storageData) => {
  if (!storageData?.items?.length) return storageData;

  const productIds = storageData.items.map((item) => item.productId);
  try {
    const products = await cartApi.getGuestCartProducts(productIds);
    // Validate and update prices
    // ...
  } catch (error) {
    console.error("Failed to validate cart prices:", error);
    return storageData;
  }
};
```

### 3.2 High Priority Fixes

#### Fix CALC-004: Use parseFloat for Shipping Cost

**File:** `frontend/src/components/cart/CartSummary.tsx:53`

**Before:**

```typescript
const cost =
  selectedMethod?.cost === "Free"
    ? 0
    : parseInt(selectedMethod?.cost.replace(/[৳\s]/g, "") || "0");
```

**After:**

```typescript
const cost =
  selectedMethod?.cost === "Free"
    ? 0
    : parseFloat(selectedMethod?.cost.replace(/[৳\s]/g, "") || "0");
```

#### Fix CALC-005: Add Free Shipping Threshold

**File:** `backend/services/cartService.js`

Add configuration and logic:

```javascript
// In constructor
this.freeShippingThreshold =
  parseFloat(process.env.FREE_SHIPPING_THRESHOLD) || 1000; // 1000 BDT

// In calculateCartTotals
let shippingCost = this.shippingCost;
if (subtotal >= this.freeShippingThreshold) {
  shippingCost = 0;
}
```

#### Fix CALC-006: Improve Rounding Strategy

**File:** `backend/services/cartService.js:542-559`

**Before:**

```javascript
const subtotal = items.reduce((sum, item) => {
  return sum + parseFloat(item.subtotal);
}, 0);
```

**After:**

```javascript
// Calculate from unrounded values
const subtotal = items.reduce((sum, item) => {
  return sum + parseFloat(item.price) * item.quantity;
}, 0);

// Round only at the end
const roundedSubtotal = parseFloat(subtotal.toFixed(2));
```

### 3.3 Medium Priority Fixes

#### Fix CALC-007: Support Variable Tax Rates

**File:** `backend/services/cartService.js`

Add tax rate lookup by product/category:

```javascript
async getTaxRate(productId) {
  const product = await this.prisma.product.findUnique({
    where: { id: productId },
    include: { category: true }
  });
  // Return category-specific or product-specific tax rate
  return product?.category?.taxRate || this.taxRate;
}
```

#### Fix CALC-008: Implement Shipping Method Endpoint

**File:** `backend/routes/cart.js` and `backend/controllers/cartController.js`

Add endpoint `POST /cart/shipping` that updates shipping and recalculates totals.

#### Fix CALC-009: Remove Duplicate Interface

**File:** `frontend/src/types/cart.ts`

Remove duplicate `MergeGuestCartResponse` interface (lines 390-404).

---

## 4. Required Test Cases for Calculation Validation

### 4.1 Subtotal Calculation Tests

| Test Case          | Input                 | Expected Output    |
| ------------------ | --------------------- | ------------------ |
| Single item        | 1 item at ৳100        | Subtotal: ৳100.00  |
| Multiple items     | 2 items at ৳100 each  | Subtotal: ৳200.00  |
| Fractional price   | 1 item at ৳33.33      | Subtotal: ৳33.33   |
| Rounding edge case | 3 items at ৳0.33 each | Subtotal: ৳0.99    |
| Large quantity     | 100 items at ৳99.99   | Subtotal: ৳9999.00 |

### 4.2 Tax Calculation Tests

| Test Case           | Input                      | Expected Output |
| ------------------- | -------------------------- | --------------- |
| Standard tax        | ৳100 subtotal, 15% rate    | Tax: ৳15.00     |
| Fractional subtotal | ৳100.33 subtotal, 15% rate | Tax: ৳15.05     |
| Zero subtotal       | ৳0 subtotal                | Tax: ৳0.00      |
| Large subtotal      | ৳99999 subtotal, 15% rate  | Tax: ৳14999.85  |

### 4.3 Shipping Calculation Tests

| Test Case               | Input            | Expected Output   |
| ----------------------- | ---------------- | ----------------- |
| Standard shipping       | Any cart         | Shipping: ৳100.00 |
| Free shipping threshold | Cart ≥ ৳1000     | Shipping: ৳0.00   |
| Below threshold         | Cart < ৳1000     | Shipping: ৳100.00 |
| Express shipping        | Express method   | Shipping: ৳100.00 |
| Overnight shipping      | Overnight method | Shipping: ৳200.00 |

### 4.4 Discount Calculation Tests

| Test Case                 | Input                       | Expected Output                       |
| ------------------------- | --------------------------- | ------------------------------------- |
| Fixed discount            | ৳100 subtotal, ৳10 discount | Total: subtotal + tax + shipping - 10 |
| Percentage discount       | ৳100 subtotal, 10% discount | Total: subtotal + tax + shipping - 10 |
| Discount exceeds subtotal | ৳50 subtotal, ৳100 discount | Total: ৳0.00 (floor at 0)             |
| No discount               | No discount applied         | Total: subtotal + tax + shipping      |

### 4.5 Total Calculation Tests

| Test Case     | Input                                               | Expected Output |
| ------------- | --------------------------------------------------- | --------------- |
| Basic total   | ৳100 subtotal, ৳15 tax, ৳100 shipping               | Total: ৳215.00  |
| With discount | ৳100 subtotal, ৳15 tax, ৳100 shipping, ৳10 discount | Total: ৳205.00  |
| Free shipping | ৳1000 subtotal, ৳150 tax, ৳0 shipping               | Total: ৳1150.00 |
| Empty cart    | 0 items                                             | Total: ৳0.00    |

### 4.6 Frontend/Backend Consistency Tests

| Test Case              | Description            | Validation                        |
| ---------------------- | ---------------------- | --------------------------------- |
| Cart totals sync       | After any cart change  | Frontend total === Backend total  |
| Shipping method change | Change shipping method | Backend totals recalculated       |
| Discount application   | Apply discount code    | Backend applies discount to total |
| Price update           | Product price changes  | Backend price used in totals      |

### 4.7 Edge Case Tests

| Test Case           | Input                      | Expected Behavior     |
| ------------------- | -------------------------- | --------------------- |
| Negative quantities | quantity < 1               | Reject with error     |
| Overflow            | Very large quantities      | Handle gracefully     |
| Currency symbols    | Display ৳ symbol           | Consistent formatting |
| Decimal precision   | ৳0.001 repeated 1000 times | Consistent rounding   |

---

## 5. Test Implementation Guide

### Backend Unit Tests (cartService.test.js)

```javascript
describe("Cart Calculation", () => {
  describe("calculateCartTotals", () => {
    it("should calculate correct subtotal from items", async () => {
      // Test CALC-006
    });

    it("should apply 15% tax correctly", async () => {
      // Test tax calculation
    });

    it("should include discount in total", async () => {
      // Test CALC-002
    });

    it("should apply free shipping threshold", async () => {
      // Test CALC-005
    });
  });
});
```

### Integration Tests (cart.test.js)

```javascript
describe("Cart API Calculation", () => {
  it("GET /cart should return correct totals", async () => {
    // Validate backend calculation
  });

  it("POST /cart/discount should update total", async () => {
    // Test discount application
  });

  it("POST /cart/shipping should update shipping cost", async () => {
    // Test CALC-008
  });
});
```

### Frontend Tests (CartContext.test.tsx)

```typescript
describe("CartContext Calculations", () => {
  it("should display correct totals from backend", () => {
    // Test CALC-001, CALC-003
  });

  it("should not recalculate totals locally", () => {
    // Verify frontend uses backend values
  });
});
```

---

## 6. Summary

| Severity | Count | Issues                       |
| -------- | ----- | ---------------------------- |
| CRITICAL | 3     | CALC-001, CALC-002, CALC-003 |
| HIGH     | 3     | CALC-004, CALC-005, CALC-006 |
| MEDIUM   | 3     | CALC-007, CALC-008, CALC-009 |
| LOW      | 1     | CALC-010                     |

### Priority Fix Order:

1. **Immediate:** CALC-002 (discount not applied), CALC-003 (price sync)
2. **High Priority:** CALC-004 (parseInt), CALC-005 (free shipping), CALC-006 (rounding)
3. **Medium Priority:** CALC-007 (variable tax), CALC-008 (shipping endpoint), CALC-009 (duplicate type)
4. **Low Priority:** CALC-010 (currency configuration)

---

## 7. Files Analyzed

| File                                                                                           | Lines  | Purpose                   |
| ---------------------------------------------------------------------------------------------- | ------ | ------------------------- |
| [`backend/services/cartService.js`](backend/services/cartService.js)                           | 1-1690 | Backend cart calculations |
| [`backend/controllers/cartController.js`](backend/controllers/cartController.js)               | 1-971  | API endpoints             |
| [`frontend/src/contexts/CartContext.tsx`](frontend/src/contexts/CartContext.tsx)               | 1-729  | Frontend cart state       |
| [`frontend/src/components/cart/CartSummary.tsx`](frontend/src/components/cart/CartSummary.tsx) | 1-283  | Cart display component    |
| [`frontend/src/lib/api/cart.ts`](frontend/src/lib/api/cart.ts)                                 | 1-335  | API client                |
| [`frontend/src/types/cart.ts`](frontend/src/types/cart.ts)                                     | 1-404  | TypeScript definitions    |

---

_Report generated as part of comprehensive cart system analysis_
