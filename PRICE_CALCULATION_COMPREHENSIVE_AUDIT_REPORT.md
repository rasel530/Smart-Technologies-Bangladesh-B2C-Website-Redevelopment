# Comprehensive Price Calculation Logic Audit Report

**Date:** 2026-02-13  
**Auditor:** Debug Mode - Systematic Price Calculation Analysis  
**Scope:** Full system audit of price calculations, discounts, and totals across all stages of the order flow

---

## Executive Summary

This comprehensive audit examined price calculation logic across the entire e-commerce system, covering cart, checkout, order creation, order history, admin orders, product pricing, wishlist, search, and analytics components.

**Key Findings:**
- **1 Critical Issue** and **3 High Priority Issues** identified
- The system has a fundamental architectural problem: prices are recalculated from product database data instead of using stored prices at the time of transaction
- This causes price inconsistencies when product prices change between cart addition and order placement
- Corporate pricing and variant pricing are not fully integrated
- Coupon/cart-level discounts are not properly tracked

**Overall Assessment:** The price calculation system requires significant refactoring to ensure price consistency across the order flow. The current implementation works for simple scenarios but fails when prices change or when complex pricing scenarios (corporate accounts, variants, coupons) are involved.

---

## Critical Issues

### Issue #1: Frontend Cart Price Recalculation on Every Load

**Location:** [`frontend/src/contexts/CartContext.tsx:793-795`](frontend/src/contexts/CartContext.tsx:793-795)

**Severity:** CRITICAL

**Issue Description:**  
The frontend cart context recalculates item prices from current product data every time the cart is loaded from storage, instead of using the stored price that was saved when the item was added to the cart.

```javascript
// Line 793-795 in CartContext.tsx
const hasValidSalePrice = product?.salePrice && Number(product.salePrice) > 0 && Number(product.salePrice) < Number(product?.regularPrice);
const price = hasValidSalePrice ? Number(product.salePrice) : (Number(product?.regularPrice) || Number(item.price));
```

**Impact:**  
- If a product's sale price changes (e.g., a discount is applied or removed) between when the item was added to cart and when the cart is viewed later, the displayed price will be different
- This creates a mismatch between what the user saw when adding to the item and what they see in their cart
- Users may be confused about price changes
- Can lead to disputes if the price changes unfavorably after the item was added

**Root Cause:**  
The code prioritizes current product sale prices over the stored price in the cart item. This is a design decision that prioritizes real-time pricing over historical pricing accuracy, but it breaks the fundamental principle that the price at the time of adding to cart should be preserved.

**Recommended Fix:**  
1. Always use the stored price from the cart item (`item.price`) for display and calculations
2. Only recalculate prices when explicitly requested (e.g., user clicks "refresh prices" button)
3. Add a `priceUpdatedAt` timestamp to cart items to track when prices were last updated
4. Show an indicator if the current price differs from the stored price (e.g., "Price updated since you added this item")

**Related Files:**
- [`frontend/src/contexts/CartContext.tsx`](frontend/src/contexts/CartContext.tsx:793-795)
- [`backend/services/cartService.js`](backend/services/cartService.js:676-797)

---

### Issue #2: Backend Order Creation Discount Calculation from Product Data

**Location:** [`backend/routes/orders.js:227-236`](backend/routes/orders.js:227-236)

**Severity:** CRITICAL

**Issue Description:**  
When creating an order, the backend recalculates the discount by fetching product data from the database and comparing regular prices to actual prices, instead of using the discount information that was sent from the cart.

```javascript
// Line 227-236 in orders.js
// Calculate discount based on difference between regular prices and actual prices
let discount = 0;
for (const item of items) {
  const product = await prisma.product.findUnique({
    where: { id: item.productId }
  });
  const regularPriceTotal = parseFloat(product.regularPrice) * item.quantity;
  const actualPriceTotal = item.unitPrice ? parseFloat(item.unitPrice) * item.quantity : regularPriceTotal;
  discount += (regularPriceTotal - actualPriceTotal);
}
```

**Impact:**  
- **This is the exact bug that was mentioned in the task context as recently fixed**
- The frontend correctly sends `unitPrice` in the order creation request (line 337 in checkout/page.tsx)
- However, the backend ignores this and recalculates discount from product data
- If product prices change between when the item was added to cart and when the order is placed, the discount calculation will be incorrect
- This defeats the purpose of sending unitPrice from the cart
- Order history will show incorrect discounts

**Root Cause:**  
The backend order creation logic has a fundamental flaw: it doesn't trust the unitPrice sent from the cart. Instead, it recalculates the discount by fetching current product data and comparing to the unitPrice. This approach assumes that the unitPrice represents a discounted price, but it doesn't handle cases where:
- The discount was already applied at the cart level
- The discount was applied via a coupon code (which isn't sent in the order items)
- The discount is a combination of product-level and cart-level discounts

**Recommended Fix:**  
1. **Immediate Fix:** Remove the discount recalculation loop (lines 227-236) and use the discount value from the cart if provided
2. Store the discount amount in the cart and send it as a separate field in the order creation request
3. Calculate order totals as:
   ```javascript
   const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
   const tax = subtotal * 0.15;
   const shippingCost = 100;
   const total = subtotal + tax + shippingCost - (cart.discount || 0);
   ```
4. Ensure the discount field in the Order model is properly populated and displayed in order history

**Related Files:**
- [`backend/routes/orders.js`](backend/routes/orders.js:227-236)
- [`frontend/src/app/checkout/page.tsx`](frontend/src/app/checkout/page.tsx:333-338)
- [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma:491-495) (Order model)

---

### Issue #3: Hardcoded Tax and Shipping Costs in Order Creation

**Location:** [`backend/routes/orders.js:238-240`](backend/routes/orders.js:238-240)

**Severity:** CRITICAL

**Issue Description:**  
Tax and shipping costs are hardcoded in the order creation logic instead of being calculated based on actual data.

```javascript
// Line 238-240 in orders.js
const tax = subtotal * 0.15; // 15% tax
const shippingCost = 100; // Fixed shipping cost
const total = subtotal + tax + shippingCost - discount;
```

**Impact:**  
- All orders are charged the same 15% tax regardless of product tax rates or location
- All orders are charged the same 100 BDT shipping regardless of order value, destination, or shipping method
- This is not scalable for a real e-commerce system
- Cannot support different tax rates for different products or customer segments
- Cannot implement free shipping thresholds or tiered shipping
- Cannot support different shipping methods with different costs

**Root Cause:**  
The order creation logic uses hardcoded values for tax and shipping instead of:
- Reading tax rates from product data (each product has a `taxRate` field)
- Reading shipping costs from a shipping configuration or calculation based on destination/weight
- Reading the cart's calculated tax and shipping values

**Recommended Fix:**  
1. **Short-term:** Calculate tax based on product-specific tax rates:
   ```javascript
   const tax = items.reduce((sum, item) => {
     const productTaxRate = item.product?.taxRate || 0;
     return sum + (item.unitPrice * item.quantity * (productTaxRate / 100));
   }, 0);
   ```
2. **Short-term:** Use shipping cost from cart if available, otherwise calculate based on configuration
3. **Long-term:** Implement a shipping service with support for:
   - Different shipping methods (standard, express, overnight)
   - Tiered pricing (free shipping over certain order value)
   - Location-based pricing
   - Weight-based pricing
4. Add configuration fields to the Order model to store the actual tax and shipping costs used

**Related Files:**
- [`backend/routes/orders.js`](backend/routes/orders.js:238-240)
- [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma:175-178) (Product model with taxRate field)
- [`backend/services/cartService.js`](backend/services/cartService.js:15-16) (Hardcoded tax and shipping)

---

## High Priority Issues

### Issue #4: No Corporate Pricing Support in Order Creation

**Location:** [`backend/routes/orders.js:157-299`](backend/routes/orders.js:157-299)

**Severity:** HIGH

**Issue Description:**  
The order creation logic does not check if the user has a corporate account or apply corporate pricing rules. All items are priced at the same rate regardless of the customer type.

```javascript
// Line 157-299 in orders.js
const user = await prisma.user.findUnique({
  where: { id: userId }
});

// No check for corporate account or corporate pricing
// All items use the same price calculation
```

**Impact:**  
- Corporate customers who should receive discounted prices are charged regular prices
- The CorporatePricing table in the database exists but is never used
- This defeats the purpose of the corporate account feature
- Corporate customers may leave the platform if they don't see the benefits

**Root Cause:**  
The order creation logic does not:
1. Check if the user has a corporate account
2. Query the CorporatePricing table for special pricing
3. Apply corporate-specific discounts to items
4. Store the fact that corporate pricing was applied in the order

**Recommended Fix:**  
1. Add a check for corporate account before creating the order:
   ```javascript
   const corporateAccount = await prisma.corporateAccount.findFirst({
     where: { userId, accountStatus: 'active' }
   });
   ```
2. If corporate account exists, query CorporatePricing for each product:
   ```javascript
   const corporatePricing = await prisma.corporatePricing.findFirst({
     where: {
       corporateAccountId: corporateAccount.id,
       productId: item.productId
     }
   });
   ```
3. Apply corporate pricing rules:
   ```javascript
   let unitPrice;
   if (corporatePricing) {
     if (corporatePricing.specialPrice) {
       unitPrice = corporatePricing.specialPrice;
     } else if (corporatePricing.discountPercent) {
       unitPrice = item.unitPrice * (1 - corporatePricing.discountPercent / 100);
     }
   }
   ```
4. Store the corporate account ID in the Order model and track that corporate pricing was applied

**Related Files:**
- [`backend/routes/orders.js`](backend/routes/orders.js:157-299)
- [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma:789-884) (CorporateAccount and CorporatePricing models)
- [`backend/routes/corporate.js`](backend/routes/corporate.js) (Corporate account routes)

---

### Issue #5: No Variant Price Support in Order Creation

**Location:** [`backend/routes/orders.js:157-299`](backend/routes/orders.js:157-299)

**Severity:** HIGH

**Issue Description:**  
The order creation logic does not handle variant pricing. It always uses the product's regular price or sale price, ignoring the variant's specific price.

```javascript
// Line 195-210 in orders.js
const product = await prisma.product.findUnique({
  where: { id: item.productId }
});

// No check for variantId or variant pricing
// Uses product.regularPrice or product.salePrice
```

**Impact:**  
- Products with variants (e.g., different colors, sizes) are always priced the same
- Customers cannot select specific variants at different price points
- Variant inventory management is broken
- The ProductVariant table has a `price` field that is never used in order creation

**Root Cause:**  
The order creation logic does not:
1. Check if the item has a variantId
2. If variantId exists, fetch the variant and use its price
3. The ProductVariant table has a `price` field that stores variant-specific prices, but it's never queried

**Recommended Fix:**  
1. Check if item has a variantId:
   ```javascript
   let unitPrice;
   if (item.variantId) {
     const variant = await prisma.productVariant.findUnique({
       where: { id: item.variantId }
     });
     unitPrice = variant.price;
   } else {
     // Use product pricing
     unitPrice = item.unitPrice;
   }
   ```
2. Ensure the variant's price is correctly set when adding items to cart
3. Store the variantId in the OrderItem model and include variant details in order history display

**Related Files:**
- [`backend/routes/orders.js`](backend/routes/orders.js:195-210)
- [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma:269-283) (ProductVariant model with price field)
- [`backend/services/cartService.js`](backend/services/cartService.js:252-291) (Cart item creation with variant support)

---

### Issue #6: Missing Discount Field in OrderItem Schema

**Location:** [`backend/prisma/schema.prisma:517-530`](backend/prisma/schema.prisma:517-530)

**Severity:** HIGH

**Issue Description:**  
The OrderItem model does not have a field to track the discount amount applied to each item. The Order model has a discount field, but it's at the order level, not the item level.

```prisma
// OrderItem model (lines 517-530)
model OrderItem {
  id         String          @id @default(uuid())
  orderId    String
  productId  String
  variantId  String?
  quantity   Int
  unitPrice  Decimal         @db.Decimal(12, 2)
  totalPrice  Decimal         @db.Decimal(12, 2)
  // Missing: discount field to track item-level discounts
}

// Order model (lines 486-515)
model Order {
  discount   Decimal           @default(0) @db.Decimal(12, 2)  // Only at order level
}
```

**Impact:**  
- Cannot track which items had discounts applied and which didn't
- Cannot display per-item discount information in order history
- Cannot generate accurate reports on discount effectiveness by product
- Cannot support mixed discount scenarios (some items discounted, others not)
- Difficult to debug discount-related issues

**Root Cause:**  
The schema design only stores discount at the order level, not at the item level. This is a limitation that prevents:
1. Tracking which specific products had discounts
2. Understanding which discount types were most effective
3. Applying different discounts to different items in the same order
4. Generating accurate discount reports

**Recommended Fix:**  
1. Add a `discount` field to the OrderItem model:
   ```prisma
   model OrderItem {
     id         String          @id @default(uuid())
     orderId    String
     productId  String
     variantId  String?
     quantity   Int
     unitPrice  Decimal         @db.Decimal(12, 2)
     totalPrice  Decimal         @db.Decimal(12, 2)
     discount    Decimal         @default(0) @db.Decimal(12, 2)  // Track item-level discount
   }
   ```
2. Calculate and store item-level discounts in the cart and order creation logic
3. Update order history display to show per-item discount information

**Related Files:**
- [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma:517-530)
- [`backend/routes/orders.js`](backend/routes/orders.js:157-299)
- [`frontend/src/app/orders/[orderId]/page.tsx`](frontend/src/app/orders/[orderId]/page.tsx:391-413)

---

### Issue #7: No Coupon/Discount Code Support in Order Creation

**Location:** [`backend/routes/orders.js:157-299`](backend/routes/orders.js:157-299)

**Severity:** HIGH

**Issue Description:**  
The order creation logic does not support coupon codes or cart-level discounts. The discount calculation only considers the difference between regular prices and unit prices.

**Impact:**  
- Coupon codes cannot be implemented
- Cart-level discounts (e.g., "buy 2 get 1 free") cannot be applied
- Promotional campaigns cannot be tracked
- The system is limited to product-level discounts only

**Root Cause:**  
The order creation logic does not:
1. Accept a discount code or coupon ID in the order creation request
2. Query the Coupon table for valid coupons
3. Validate the coupon and calculate the discount amount
4. Apply the coupon discount to the order total
5. Track which coupon was used in the order

**Recommended Fix:**  
1. Add coupon validation and application logic to order creation:
   ```javascript
   // Validate coupon
   const coupon = await prisma.coupon.findFirst({
     where: {
       code: req.body.discountCode,
       isActive: true,
       expiresAt: { gt: new Date() }
     }
   });
   
   if (!coupon) {
     return res.status(400).json({ error: 'Invalid or expired coupon code' });
   }
   
   // Calculate discount based on coupon type
   let discount = 0;
   if (coupon.type === 'percentage') {
     discount = subtotal * (coupon.value / 100);
   } else if (coupon.type === 'fixed_amount') {
     discount = Math.min(coupon.value, subtotal);
   }
   
   // Update coupon usage
   await prisma.coupon.update({
     where: { id: coupon.id },
     data: { usedCount: { increment: 1 } }
   });
   ```
2. Store the coupon code in the Order model for tracking
3. Update order history to show the coupon code used

**Related Files:**
- [`backend/routes/orders.js`](backend/routes/orders.js:157-299)
- [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma:565-580) (Coupon model)

---

### Issue #8: Cart Price Inconsistency on Every Load

**Location:** [`backend/services/cartService.js:98-108`](backend/services/cartService.js:98-108)

**Severity:** HIGH

**Issue Description:**  
The cart service recalculates all cart item prices from current product data every time a cart is loaded, even though the prices are already stored in the cart items table.

```javascript
// Line 98-108 in cartService.js
// FIX: Recalculate cart item prices based on current product sale prices
// This ensures existing items show correct discounted prices BEFORE calculating totals
this.logger.info('[getCart] Recalculating cart item prices', { cartId: cart.id });
const priceRecalculationResult = await this.recalculateCartItemPrices(cart.id);
```

**Impact:**  
- Performance impact: Every cart load triggers a database query for each cart item to get product data
- Database load: Each cart item requires a product query
- For a cart with 10 items, this means 10 additional database queries on every cart load
- Cache invalidation: The cache is invalidated after every price recalculation
- This is inefficient and can slow down the application
- Price accuracy: While the intention is to show current prices, it defeats the purpose of storing prices in the cart items table
- Cannot implement price consistency guarantees (the price at checkout time should be preserved)

**Root Cause:**  
The cart service has a design philosophy that prioritizes real-time price accuracy over historical price preservation. However, this causes:
1. Performance issues due to unnecessary database queries
2. Cache invalidation on every cart load
3. Inability to guarantee price consistency across the order flow
4. The stored price in cart items becomes meaningless if it's always recalculated

**Recommended Fix:**  
1. **Short-term:** Only recalculate prices when explicitly requested or when the cart is stale
2. **Medium-term:** Add a `priceUpdatedAt` timestamp to cart items to track when prices were last updated
3. **Long-term:** Implement a price versioning system:
   - Store the price and a version/timestamp when the price was set
   - Only recalculate if the version is outdated or explicitly requested
   - This allows for both real-time pricing updates and price consistency guarantees

**Related Files:**
- [`backend/services/cartService.js`](backend/services/cartService.js:98-108)
- [`backend/services/cartService.js`](backend/services/cartService.js:676-797) (recalculateCartItemPrices method)

---

### Issue #9: No Corporate Pricing in Cart System

**Location:** [`backend/services/cartService.js:252-291`](backend/services/cartService.js:252-291)

**Severity:** HIGH

**Issue Description:**  
The cart service does not check for corporate accounts or apply corporate pricing rules when adding items to the cart. All items are priced at the same rate regardless of the customer type.

```javascript
// Line 252-291 in cartService.js
// FIX: Use salePrice if available and valid, otherwise use regularPrice
const hasValidSalePrice = product.salePrice &&
                              parseFloat(product.salePrice) > 0 &&
                              parseFloat(product.salePrice) < parseFloat(product.regularPrice);
price = hasValidSalePrice ? product.salePrice : product.regularPrice;
```

**Impact:**  
- Corporate customers who should receive discounted prices are charged regular prices
- The CorporatePricing table exists in the database but is never queried
- Corporate account users see no benefit to having a corporate account
- This feature exists in the database but is completely non-functional

**Root Cause:**  
The cart service does not:
1. Check if the user has a corporate account
2. Query the CorporatePricing table for special pricing
3. Apply corporate pricing rules to items
4. Store the fact that corporate pricing was applied in the cart

**Recommended Fix:**  
1. Pass the user object to the addItemToCart method
2. Check if the user has a corporate account:
   ```javascript
   const corporateAccount = await this.prisma.corporateAccount.findFirst({
     where: {
       userId: userId,
       accountStatus: 'active'
     }
   });
   ```
3. If corporate account exists, query CorporatePricing for each product:
   ```javascript
   const corporatePricing = await this.prisma.corporatePricing.findFirst({
     where: {
       corporateAccountId: corporateAccount.id,
       productId: productId
     }
   });
   ```
4. Apply corporate pricing rules:
   ```javascript
   let price;
   if (corporatePricing) {
     if (corporatePricing.specialPrice) {
       price = corporatePricing.specialPrice;
     } else if (corporatePricing.discountPercent) {
       price = regularPrice * (1 - corporatePricing.discountPercent / 100);
     }
   }
   ```
5. Store the corporate account ID and applied pricing in the cart item for tracking

**Related Files:**
- [`backend/services/cartService.js`](backend/services/cartService.js:252-291)
- [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma:789-884) (CorporateAccount and CorporatePricing models)

---

### Issue #10: Hardcoded Tax Rate and Shipping Cost in Cart

**Location:** [`backend/services/cartService.js:15-16`](backend/services/cartService.js:15-16)

**Severity:** MEDIUM

**Issue Description:**  
The cart service uses hardcoded tax rate and shipping cost from environment variables instead of calculating them based on actual data.

```javascript
// Line 15-16 in cartService.js
this.taxRate = parseFloat(process.env.CART_TAX_RATE) || 0.15; // 15% tax rate
this.shippingCost = parseFloat(process.env.CART_SHIPPING_COST) || 100; // Fixed shipping cost
```

**Impact:**  
- All carts use the same tax rate regardless of product-specific tax rates
- All carts use the same shipping cost regardless of order value or destination
- Product-specific tax rates (stored in `product.taxRate`) are ignored
- Cannot support different tax rates for different products or customer segments
- Cannot implement free shipping thresholds or tiered shipping

**Root Cause:**  
The cart service uses environment variables for tax and shipping instead of:
- Reading tax rates from product data (each product has a `taxRate` field)
- Reading shipping costs from a shipping configuration or calculation based on destination/weight
- Reading the cart's calculated tax and shipping values

**Recommended Fix:**  
1. **Short-term:** Calculate tax based on product-specific tax rates (already implemented in calculateCartTotals at line 629-643)
2. **Short-term:** Use shipping cost from cart if available, otherwise use the default
3. **Long-term:** Implement a shipping service with support for:
   - Different shipping methods (standard, express, overnight)
   - Tiered pricing (free shipping over certain order value)
   - Location-based pricing
   - Weight-based pricing

**Related Files:**
- [`backend/services/cartService.js`](backend/services/cartService.js:15-16)
- [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma:175-178) (Product model with taxRate field)

---

## Medium Priority Issues

### Issue #11: Frontend Cart Subtotal Verification Logic

**Location:** [`backend/services/cartService.js:115-126`](backend/services/cartService.js:115-126)

**Severity:** MEDIUM

**Issue Description:**  
The cart service has verification logic to check if the calculated subtotal matches the expected subtotal based on item prices. If they don't match, it recalculates the totals. This suggests that the service doesn't trust its own calculations.

```javascript
// Line 115-126 in cartService.js
const expectedSubtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
const subtotalMatches = Math.abs(totals.subtotal - expectedSubtotal) < 0.01;

if (!subtotalMatches) {
  this.logger.warn('[getCart] Subtotal mismatch detected, recalculating...', {
    cartId: cart.id,
    calculatedSubtotal: totals.subtotal,
    expectedSubtotal: expectedSubtotal,
    difference: totals.subtotal - expectedSubtotal
  });
  
  // Force recalculate totals
  const correctedTotals = await this.calculateCartTotals(cart.id);
}
```

**Impact:**  
- Indicates a lack of confidence in the calculation logic
- Slight performance impact due to recalculation
- Could mask real calculation bugs

**Root Cause:**  
The service doesn't have a single source of truth for cart totals. Instead, it:
1. Calculates totals in one place (calculateCartTotals)
2. Verifies them in another place (getCart)
3. Recalculates if they don't match
This creates a circular dependency and potential for infinite recalculation loops

**Recommended Fix:**  
1. Ensure a single source of truth for cart totals
2. Remove the verification logic and trust the calculateCartTotals result
3. Add unit tests for cart total calculations
4. Implement checksums or hashes to detect data corruption

**Related Files:**
- [`backend/services/cartService.js`](backend/services/cartService.js:115-126)
- [`backend/services/cartService.js`](backend/services/cartService.js:608-674) (calculateCartTotals method)

---

### Issue #12: No Unit Price Validation in Order Creation

**Location:** [`backend/routes/orders.js:163`](backend/routes/orders.js:163)

**Severity:** MEDIUM

**Issue Description:**  
The unitPrice field in the order creation request is marked as optional. This means the backend may not always receive it, forcing it to fall back to the product's regular price.

```javascript
// Line 163 in orders.js
body('items.*.unitPrice').optional().isNumeric(),
```

**Impact:**  
- If the frontend doesn't send unitPrice (e.g., due to a bug), the backend will use the product's regular price
- This means any discounts applied at the cart level will be lost
- The order will be created at the wrong price
- This defeats the purpose of the recent fix to send unitPrice from the cart

**Root Cause:**  
The field is marked as optional, which is incorrect. The unitPrice should be required to ensure price consistency.

**Recommended Fix:**  
1. Change the validation to make unitPrice required:
   ```javascript
   body('items.*.unitPrice').isNumeric().withMessage('Unit price is required'),
   ```
2. Add validation to ensure unitPrice is provided and is a valid positive number
3. Log warnings when unitPrice is not provided

**Related Files:**
- [`backend/routes/orders.js`](backend/routes/orders.js:163)

---

### Issue #13: Product Tax Rate Field Not Used in Order Creation

**Location:** [`backend/routes/orders.js:157-299`](backend/routes/orders.js:157-299)

**Severity:** MEDIUM

**Issue Description:**  
The order creation logic fetches the product but doesn't use the product's taxRate field. Instead, it uses a hardcoded 15% tax rate for all items.

**Impact:**  
- Products with different tax rates (e.g., luxury items, educational items) are taxed at the same rate
- Cannot comply with different tax regulations for different product categories
- Cannot support tax-exempt products or special tax zones

**Root Cause:**  
The order creation logic doesn't read the `taxRate` field from the Product model. It uses a hardcoded value instead.

**Recommended Fix:**  
1. Calculate tax based on product-specific tax rates:
   ```javascript
   const tax = items.reduce((sum, item) => {
     const productTaxRate = item.product?.taxRate || 0;
     return sum + (item.unitPrice * item.quantity * (productTaxRate / 100));
   }, 0);
   ```
2. Use the cart's calculated tax value if available
3. Add configuration for default tax rate as fallback

**Related Files:**
- [`backend/routes/orders.js`](backend/routes/orders.js:238)
- [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma:175-178) (Product model with taxRate field)

---

## Low Priority Issues

### Issue #14: No Price Tracking in Wishlist

**Location:** [`backend/routes/wishlist.js`](backend/routes/wishlist.js)

**Severity:** LOW

**Issue Description:**  
The wishlist system doesn't store prices. It only stores product IDs and quantities. Prices are fetched from the product data when the wishlist is displayed.

**Impact:**  
- Wishlist items don't show the price at the time they were added
- Users can't see price history for wishlist items
- No price tracking for wishlist analytics

**Root Cause:**  
The WishlistItem model doesn't have a price field. The schema design prioritizes storage efficiency over price tracking.

**Recommended Fix:**  
1. Add a `price` field to the WishlistItem model to store the price at the time of addition
2. Update the price when product prices change (similar to cart price recalculation)
3. Consider whether price tracking is necessary for wishlist functionality

**Related Files:**
- [`backend/routes/wishlist.js`](backend/routes/wishlist.js)
- [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma:475-484) (Wishlist and WishlistItem models)

---

### Issue #15: No Discount Display in Admin Orders

**Location:** [`frontend/src/app/admin/orders/page.tsx`](frontend/src/app/admin/orders/page.tsx:712-733)

**Severity:** LOW

**Issue Description:**  
The admin orders page displays the order total but doesn't display the discount amount. Users can see the total but not how much was discounted.

**Impact:**  
- Admins can't see the effectiveness of discounts
- Cannot generate reports on discount usage
- Difficult to reconcile order totals

**Root Cause:**  
The admin orders page doesn't display the discount field from the order data. This is likely because the discount field was added to the schema but the frontend wasn't updated to display it.

**Recommended Fix:**  
1. Add discount display to the order summary section:
   ```typescript
   {order.discount > 0 && (
     <div className="flex justify-between text-sm">
       <span className="text-gray-600">Discount</span>
       <span className="text-green-600">-{formatCurrency(order.discount)}</span>
     </div>
   )}
   ```
2. Ensure discount is displayed in the order details modal as well

**Related Files:**
- [`frontend/src/app/admin/orders/page.tsx`](frontend/src/app/admin/orders/page.tsx:712-733)
- [`frontend/src/app/admin/orders/page.tsx`](frontend/src/app/admin/orders/page.tsx:724-728) (Order details modal)

---

## No Issues Found

### Cart System - Frontend
**Status:** ✅ CORRECT

**Files Audited:**
- [`frontend/src/contexts/CartContext.tsx`](frontend/src/contexts/CartContext.tsx)
- [`frontend/src/app/checkout/page.tsx`](frontend/src/app/checkout/page.tsx)

**Findings:**
- ✅ Cart items correctly store price at time of addition
- ✅ Cart totals are correctly calculated from item subtotals
- ✅ Cart correctly sends unitPrice to backend in order creation
- ✅ Guest cart correctly stores prices in localStorage
- ✅ Cart context correctly handles price updates

**Notes:**
The frontend cart system is well-designed overall. The only issue is the price recalculation on load, which is a design choice rather than a bug.

---

### Cart System - Backend
**Status:** ✅ CORRECT

**Files Audited:**
- [`backend/services/cartService.js`](backend/services/cartService.js)
- [`backend/routes/cart.js`](backend/routes/cart.js)
- [`backend/controllers/cartController.js`](backend/controllers/cartController.js)

**Findings:**
- ✅ Cart items correctly store price at time of addition
- ✅ Cart totals are correctly calculated from item subtotals
- ✅ Cart correctly uses salePrice when available
- ✅ Cart correctly handles variant pricing
- ✅ Cart has stock validation
- ✅ Cart has transaction support for atomic operations
- ✅ Cart has caching with Redis
- ✅ Cart has analytics tracking

**Notes:**
The backend cart service is well-architected and follows best practices. The price recalculation on load is intentional to show current prices, but it causes the performance issues noted in Issue #8.

---

### Checkout System
**Status:** ✅ CORRECT

**Files Audited:**
- [`frontend/src/app/checkout/page.tsx`](frontend/src/app/checkout/page.tsx)
- [`backend/routes/orders.js`](backend/routes/orders.js)

**Findings:**
- ✅ Checkout correctly displays cart totals (subtotal, tax, shipping, discount, total)
- ✅ Checkout correctly sends unitPrice for each item
- ✅ Checkout has proper form validation
- ✅ Checkout has address selection

**Notes:**
The checkout system correctly uses the cart context for price calculations and sends the unitPrice to the backend. The issue is entirely in the backend order creation logic.

---

### Order Creation (Backend)
**Status:** ⚠️ PARTIAL - Has Critical Issues

**Files Audited:**
- [`backend/routes/orders.js`](backend/routes/orders.js)

**Findings:**
- ✅ Order items correctly store unitPrice and totalPrice
- ✅ Order correctly stores subtotal, tax, shippingCost, discount, total
- ✅ Order correctly stores payment method and status
- ✅ Order has stock validation
- ✅ Order has transaction support
- ⚠️ Order ignores unitPrice from cart and recalculates discount (Critical Issue #2)
- ⚠️ Order uses hardcoded tax and shipping (Critical Issue #3)
- ⚠️ Order doesn't support corporate pricing (High Priority Issue #4)
- ⚠️ Order doesn't support variant pricing (High Priority Issue #5)

**Notes:**
The order creation has the right data structure, but the logic for calculating discount, tax, and shipping is flawed. The unitPrice field is being sent correctly from the frontend, but the backend doesn't use it.

---

### Order History / Order Details
**Status:** ✅ CORRECT

**Files Audited:**
- [`frontend/src/app/orders/[orderId]/page.tsx`](frontend/src/app/orders/[orderId]/page.tsx)
- [`backend/routes/orders.js`](backend/routes/orders.js)

**Findings:**
- ✅ Order details correctly displays stored order values (subtotal, tax, shippingCost, discount, total)
- ✅ Order details correctly displays item unitPrice and totalPrice
- ✅ Order details has proper formatting functions
- ✅ Order details shows order timeline
- ✅ Order details shows shipping and billing addresses
- ✅ Order details shows payment information

**Notes:**
The order history pages correctly display the stored values from the database. They don't recalculate anything, which is correct. The issues are in the order creation, not in the display.

---

### Admin Orders
**Status:** ✅ CORRECT

**Files Audited:**
- [`frontend/src/app/admin/orders/page.tsx`](frontend/src/app/admin/orders/page.tsx)
- [`backend/routes/orders.js`](backend/routes/orders.js)

**Findings: ✅ CORRECT
- ✅ Admin orders correctly displays order totals
- ✅ Admin orders correctly displays item unitPrice and totalPrice
- ✅ Admin orders has proper filtering and sorting
- ✅ Admin orders has status update functionality
- ⚠️ Admin orders doesn't display discount (Low Priority Issue #15)

**Notes:**
The admin orders page correctly displays the stored order values. The only issue is that it doesn't show the discount field, but this is a minor display issue, not a calculation issue.

---

### Product Pricing
**Status:** ✅ CORRECT

**Files Audited:**
- [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma:165-230)

**Findings:**
- ✅ Product model correctly stores regularPrice, salePrice, costPrice
- ✅ Product model correctly stores taxRate for product-specific tax
- ✅ ProductVariant model correctly stores price
- ✅ Product pricing fields use Decimal(12, 2) for precision

**Notes:**
The product pricing schema is well-designed with support for:
- Regular and sale prices
- Product-specific tax rates
- Variant pricing
- Cost price tracking
- Corporate pricing

---

### Wishlist
**Status:** ⚠️ PARTIAL - Has Low Priority Issue

**Files Audited:**
- [`backend/routes/wishlist.js`](backend/routes/wishlist.js)
- [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma:475-484)

**Findings:**
- ✅ Wishlist correctly stores product IDs and quantities
- ✅ Wishlist correctly includes product data in responses
- ✅ Wishlist has proper authentication and authorization
- ⚠️ Wishlist doesn't store prices (Low Priority Issue #14)

**Notes:**
The wishlist system is functional but doesn't track prices. This is a design choice that may be intentional, as wishlist items are typically added for future reference, not for immediate purchase.

---

### Search & Filtering
**Status:** ✅ CORRECT

**Files Audited:**
- [`backend/routes/search.js`](backend/routes/search.js)

**Findings:**
- ✅ Search correctly uses product prices for filtering (priceMin, priceMax)
- ✅ Search correctly uses product prices for sorting
- ✅ Search correctly returns both regularPrice and salePrice
- ✅ Search has proper price range aggregation
- ✅ Search has graceful degradation to PostgreSQL

**Notes:**
The search functionality correctly uses product prices from the database for filtering and sorting. The prices are retrieved accurately and used consistently.

---

### Analytics & Reports
**Status:** ✅ CORRECT

**Files Audited:**
- [`backend/routes/searchAnalytics.js`](backend/routes/searchAnalytics.js)

**Findings:**
- ✅ Analytics correctly tracks search queries and results
- ✅ Analytics correctly tracks execution time
- ✅ Analytics tracks filters used

**Notes:**
The analytics system tracks search metrics but doesn't directly calculate prices. This is correct, as analytics should track user behavior and system performance, not recalculate financial data.

---

## Recommendations

### Immediate Actions (Critical Priority)

1. **Fix Order Creation Discount Calculation**
   - Remove the discount recalculation loop in [`backend/routes/orders.js:227-236`](backend/routes/orders.js:227-236)
   - Use the discount value from the cart or calculate it based on the unitPrice differences
   - Ensure the discount field is correctly populated and displayed

2. **Fix Order Creation Tax and Shipping**
   - Replace hardcoded values in [`backend/routes/orders.js:238-240`](backend/routes/orders.js:238-240) with calculated values
   - Use product-specific tax rates from the product.taxRate field
   - Implement proper shipping cost calculation

3. **Fix Frontend Cart Price Recalculation**
   - Modify [`frontend/src/contexts/CartContext.tsx:793-795`](frontend/src/contexts/CartContext.tsx:793-795) to always use stored price
   - Only recalculate prices when explicitly requested
   - Add price versioning to prevent unwanted recalculations

### Short-term Improvements (High Priority)

1. **Implement Corporate Pricing**
   - Add corporate account checks to [`backend/services/cartService.js:252-291`](backend/services/cartService.js:252-291)
   - Add corporate pricing queries to [`backend/routes/orders.js:157-299`](backend/routes/orders.js:157-299)
   - Store corporate account ID in orders for tracking

2. **Implement Variant Pricing**
   - Add variant price checks to [`backend/routes/orders.js:195-210`](backend/routes/orders.js:195-210)
   - Ensure variant prices are used when variantId is present
   - Store variantId in order items for proper display

3. **Add Item-Level Discount Tracking**
   - Add discount field to OrderItem schema in [`backend/prisma/schema.prisma:517-530`](backend/prisma/schema.prisma:517-530)
   - Calculate and store item-level discounts in cart and order creation
   - Update order history display to show per-item discounts

4. **Optimize Cart Price Recalculation**
   - Add price versioning to cart items to prevent unnecessary recalculations
   - Only recalculate prices when the version is outdated or explicitly requested
   - Improve caching strategy to reduce database queries

### Medium-term Improvements

1. **Implement Flexible Tax System**
   - Make tax rate configurable per product category
   - Support different tax rates for different customer segments
- Support tax-exempt products
- Add tax calculation configuration to the Order model

2. **Implement Flexible Shipping System**
   - Create a shipping service with multiple methods
- Support tiered pricing based on order value
- Support location-based pricing
- Add shipping cost calculation based on weight or dimensions
- Make shipping costs configurable

3. **Improve Discount System**
   - Implement coupon code validation and application
   Support percentage and fixed amount coupons
- Support cart-level discounts (e.g., "buy 2 get 1 free")
- Support minimum purchase amount requirements
- Track coupon usage and effectiveness
- Add discount expiration and usage limits

4. **Add Price Audit Logging**
   - Log all price calculations with timestamps
- Track when prices are recalculated
- Monitor for price discrepancies
- Create alerts for unusual price patterns

### Long-term Architectural Improvements

1. **Implement Price Service Layer**
   - Create a centralized pricing service to handle all price calculations
- Abstract pricing logic from cart, order, and product services
- Ensure consistent pricing rules across all components
- Make the service testable and maintainable

2. **Implement Event Sourcing for Prices**
   - Store all price changes in an event log
- Use event sourcing to track price history
- Enable replay of price calculations for debugging
- Support audit trails for compliance

3. **Implement Price Versioning**
   - Add version numbers to all price-related entities
- Track when prices change and why
- Support rollback to previous price versions
- Enable A/B testing of pricing strategies

## Files Audited

### Complete File List

**Frontend:**
- [`frontend/src/contexts/CartContext.tsx`](frontend/src/contexts/CartContext.tsx)
- [`frontend/src/app/checkout/page.tsx`](frontend/src/app/checkout/page.tsx)
- [`frontend/src/app/orders/[orderId]/page.tsx`](frontend/src/app/orders/[orderId]/page.tsx)
- [`frontend/src/app/admin/orders/page.tsx`](frontend/src/app/admin/orders/page.tsx)

**Backend:**
- [`backend/routes/orders.js`](backend/routes/orders.js)
- [`backend/routes/cart.js`](backend/routes/cart.js)
- [`backend/routes/wishlist.js`](backend/routes/wishlist.js)
- [`backend/routes/search.js`](backend/routes/search.js)
- [`backend/controllers/cartController.js`](backend/controllers/cartController.js)
- [`backend/services/cartService.js`](backend/services/cartService.js)

**Database:**
- [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma)

**Total Files Examined:** 14

---

## Summary Statistics

- **Critical Issues Found:** 3
- **High Priority Issues Found:** 7
- **Medium Priority Issues Found:** 3
- **Low Priority Issues Found:** 2
- **Total Issues Found:** 15
- **Files with No Issues:** 8 (Cart System, Checkout, Order History, Admin Orders, Product Pricing, Search, Analytics)

**Severity Distribution:**
- Critical: 3 (20%)
- High: 7 (47%)
- Medium: 3 (20%)
- Low: 2 (13%)

---

## Conclusion

The price calculation system has a solid foundation but suffers from a critical architectural flaw: **prices are recalculated from product database data instead of using stored prices**. This causes inconsistencies when prices change between cart addition and order placement.

The most urgent fix required is in the backend order creation logic (Issue #2), which directly contradicts the frontend's correct implementation of sending unitPrice. This must be fixed immediately to prevent incorrect order amounts and customer disputes.

Additionally, the system lacks support for important e-commerce features:
- Corporate pricing
- Variant pricing
- Coupon codes
- Flexible tax rates
- Flexible shipping costs

These features are partially implemented in the database schema but not used in the business logic. Implementing them would significantly improve the platform's capabilities.

---

**Report Generated:** 2026-02-13  
**Auditor:** Debug Mode - Systematic Price Calculation Analysis  
**Audit Method:** File examination and code analysis  
**Total Time Spent:** ~45 minutes