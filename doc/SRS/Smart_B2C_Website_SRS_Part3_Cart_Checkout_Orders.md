# Smart Technologies Bangladesh B2C Website Redevelopment
## Software Requirements Specification (SRS) - Part 3
### Shopping Cart, Checkout & Order Management

**Document Version:** 2.0  
**Date:** November 29, 2024  
**Status:** Final

---

## Table of Contents - Part 3

8. [Shopping Cart & Wishlist](#8-shopping-cart--wishlist)
9. [Checkout & Payment](#9-checkout--payment)
10. [Order Management](#10-order-management)
11. [Customer Reviews & Ratings](#11-customer-reviews--ratings)

---

# 8. Shopping Cart & Wishlist

## 8.1 Shopping Cart Functionality

### FR-CART-001: Add to Cart
**Priority:** P0 (Critical) 🔴  
**Module:** Shopping Cart  
**Status:** APPROVED

**User Story:**  
As a customer, I want to add products to my cart so that I can review my selections before purchasing.

**Functional Requirements:**

1. **Add to Cart Actions:**
   - Click "Add to Cart" button on Product Detail Page
   - Click "Add to Cart" on Product Card (from listing page)
   - Select quantity before adding
   - Show success animation/notification
   - Update cart count badge in header
   - Mini-cart preview dropdown

2. **Cart Item Data:**
   - Product ID and SKU
   - Product name and image
   - Selected quantity
   - Unit price (current price at time of adding)
   - Subtotal (quantity × price)
   - Availability status
   - Applied discounts/offers

3. **Cart Validation:**
   - Check product availability
   - Check stock quantity
   - Maximum quantity limits (per product)
   - Price verification
   - Discount eligibility check

4. **Mini-Cart Preview:**
   - Shows last added item
   - Cart item count
   - Cart total amount
   - "View Cart" button
   - "Checkout" button
   - Auto-hide after 5 seconds or on click outside

5. **Guest vs. Logged-in Cart:**
   - **Guest:** Cart stored in browser localStorage/sessionStorage
   - **Logged-in:** Cart stored in database, synced across devices
   - **Guest to Logged-in:** Merge carts on login

**Acceptance Criteria:**
- [ ] Add to cart creates/updates cart item
- [ ] Cart count badge updates immediately
- [ ] Mini-cart preview displays correctly
- [ ] Stock validation prevents overselling
- [ ] Success notification appears
- [ ] Guest cart persists in browser
- [ ] Logged-in cart syncs across devices
- [ ] Cart merge works correctly on login
- [ ] Add to cart response time <500ms
- [ ] Out-of-stock products cannot be added

**Technical Specifications:**
```typescript
interface AddToCartDTO {
  productId: string;
  quantity: number;
  userId?: string; // null for guest
  sessionId?: string; // for guest
}

interface CartItemDTO {
  cartItemId: string;
  productId: string;
  sku: string;
  name: string;
  image: string;
  quantity: number;
  unitPrice: number;
  discountedPrice?: number;
  subtotal: number;
  availability: 'in_stock' | 'out_of_stock' | 'low_stock';
  maxQuantity: number;
}
```

**Business Rules:**
- BR-CART-001: Maximum 50 different items per cart
- BR-CART-002: Maximum quantity per item: stock quantity or 10 (whichever is lower)
- BR-CART-003: Guest cart expires after 7 days
- BR-CART-004: Logged-in cart never expires until checkout or manual removal
- BR-CART-005: Price locked at time of adding (updated on cart page refresh)

---

### FR-CART-002: Shopping Cart Page
**Priority:** P0 (Critical) 🔴  
**Module:** Shopping Cart  
**Status:** APPROVED

**User Story:**  
As a customer, I want to view and manage all items in my cart before proceeding to checkout.

**Functional Requirements:**

1. **Cart Page Layout:**
   - Header: "Shopping Cart (X items)"
   - Cart items list table/cards
   - Order summary sidebar
   - Continue shopping button
   - Proceed to checkout button
   - Empty cart state if no items

2. **Cart Item Row/Card:**
   - Product image (clickable to PDP)
   - Product name (clickable to PDP)
   - SKU and brand
   - Unit price
   - Quantity selector (stepper: +/- buttons)
   - Subtotal
   - Remove item button (trash icon)
   - Move to wishlist button
   - Stock status indicator

3. **Quantity Management:**
   - Increase quantity button
   - Decrease quantity button
   - Direct input of quantity
   - Real-time subtotal update
   - Stock availability check on quantity change
   - Save for later if out of stock

4. **Cart Actions:**
   - Remove item (with "Undo" option for 5 seconds)
   - Move to wishlist
   - Update cart (if batch update mode)
   - Clear entire cart (with confirmation)
   - Save cart for later (logged-in users)

5. **Order Summary Sidebar:**
   - Subtotal (sum of all items)
   - Discount amount (if applicable)
   - Estimated shipping cost (or "Calculated at checkout")
   - Estimated tax/VAT (15%)
   - **Grand Total** (prominent, large font)
   - Coupon code input field
   - "Apply Coupon" button
   - "Proceed to Checkout" button (primary CTA)

6. **Promotional Messages:**
   - Free delivery threshold: "Add BDT X more for free delivery"
   - Quantity discount: "Buy 2 get 10% off"
   - Time-limited offers countdown
   - Product recommendations: "Complete your setup"

7. **Empty Cart State:**
   - Empty cart illustration/icon
   - Message: "Your cart is empty"
   - "Continue Shopping" button
   - Recently viewed products
   - Popular products suggestions

**Acceptance Criteria:**
- [ ] Cart items display correctly
- [ ] Quantity update works in real-time
- [ ] Subtotal recalculates immediately
- [ ] Remove item works with undo option
- [ ] Move to wishlist works correctly
- [ ] Coupon code validation works
- [ ] Order summary calculates correctly
- [ ] Proceed to checkout button enabled/disabled based on stock
- [ ] Stock validation happens on every quantity change
- [ ] Page load time <2 seconds
- [ ] Mobile layout responsive and usable

**Technical Specifications:**
```typescript
interface CartDTO {
  cartId: string;
  userId?: string;
  sessionId?: string;
  items: CartItemDTO[];
  subtotal: number;
  discountAmount: number;
  shippingEstimate: number;
  taxAmount: number;
  grandTotal: number;
  couponCode?: string;
  couponDiscount?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface UpdateCartItemDTO {
  cartItemId: string;
  quantity: number;
}
```

**Business Rules:**
- BR-CART-006: Cart auto-refreshes prices every 5 minutes
- BR-CART-007: Out-of-stock items show alert but remain in cart
- BR-CART-008: Removed items can be restored via "Undo" for 5 seconds
- BR-CART-009: Coupon validation checks eligibility and expiry
- BR-CART-010: VAT calculated at 15% of subtotal (before shipping)

---

## 8.2 Wishlist Management

### FR-CART-003: Wishlist Functionality
**Priority:** P1 (High)  
**Module:** Wishlist  
**Status:** APPROVED

**User Story:**  
As a customer, I want to save products to a wishlist so that I can purchase them later.

**Functional Requirements:**

1. **Add to Wishlist:**
   - Heart icon on product cards
   - Heart icon on product detail page
   - Click to add/remove (toggle)
   - Visual feedback (heart fills, animation)
   - Login required (redirect if guest)

2. **Wishlist Page:**
   - Grid/list view of saved products
   - Product image, name, price
   - Current availability status
   - Price change indicator (increased/decreased)
   - Add to cart button
   - Remove from wishlist button
   - Share wishlist button

3. **Wishlist Features:**
   - Unlimited products
   - Multiple wishlists (optional - Premium feature)
   - Wishlist name and privacy (Public/Private)
   - Share wishlist via link
   - Move to cart (single or all items)

4. **Price Drop Alerts:**
   - Notify when wishlist item price drops
   - Email notification
   - In-app notification badge
   - Push notification (if enabled)

**Acceptance Criteria:**
- [ ] Add to wishlist works from all product locations
- [ ] Login redirect works for guest users
- [ ] Wishlist syncs across devices
- [ ] Wishlist page displays all saved items
- [ ] Price change indicator works correctly
- [ ] Move to cart works for single/all items
- [ ] Remove from wishlist works
- [ ] Share wishlist generates correct link
- [ ] Price drop alerts sent correctly

**Technical Specifications:**
```typescript
interface WishlistItemDTO {
  wishlistItemId: string;
  userId: string;
  productId: string;
  addedAt: Date;
  priceAtAdd: number;
  currentPrice: number;
  priceChanged: boolean;
  notifyOnPriceDrop: boolean;
}

interface WishlistDTO {
  wishlistId: string;
  userId: string;
  name: string;
  items: WishlistItemDTO[];
  privacy: 'public' | 'private';
  shareableLink?: string;
}
```

---

# 9. Checkout & Payment

## 9.1 Checkout Process

### FR-CHK-001: Multi-Step Checkout
**Priority:** P0 (Critical) 🔴  
**Module:** Checkout  
**Status:** APPROVED

**User Story:**  
As a customer, I want a smooth checkout process so that I can complete my purchase quickly and securely.

**Functional Requirements:**

**Checkout Flow (4 Steps):**

**Step 1: Delivery Address**
1. Display saved addresses (radio select)
2. "Add New Address" option
3. Address form (as per FR-USER-006)
4. Default address pre-selected
5. Validate address before proceeding
6. "Continue to Shipping" button

**Step 2: Shipping Method**
1. Display available shipping options:
   - Standard Delivery (3-5 business days) - Free
   - Express Delivery (1-2 business days) - BDT 100
   - Same Day Delivery (Dhaka only) - BDT 200
2. Delivery time estimate
3. Shipping cost display
4. Special instructions text area (optional)
5. "Continue to Payment" button

**Step 3: Payment Method** 🟡
1. Payment options:
   - **bKash** (Mobile Financial Service)
   - **Nagad** (Mobile Financial Service)
   - **Rocket** (Mobile Financial Service)
   - **Credit/Debit Card** (via SSLCommerz)
   - **Cash on Delivery** (COD)
   - **Bank Transfer** (manual verification)
2. Payment method selection (radio buttons)
3. Payment-specific fields (card number, mobile number, etc.)
4. Save payment info checkbox (cards only, tokenized)
5. Order notes text area
6. "Review Order" button

**Step 4: Order Review**
1. **Delivery Address** - Display full address with edit button
2. **Shipping Method** - Display selected method with change button
3. **Payment Method** - Display selected method with change button
4. **Order Items** - All cart items with image, name, qty, price
5. **Order Summary:**
   - Subtotal
   - Discount (if any)
   - Shipping cost
   - VAT (15%)
   - **Grand Total** (prominent)
6. Terms and conditions checkbox (required)
7. **Place Order** button (primary, large CTA)

**Progress Indicator:**
- Visual stepper showing current step (1/4, 2/4, etc.)
- Completed steps marked with checkmark
- Click previous steps to edit
- Disabled future steps

**Guest Checkout:**
- Allow guest checkout without registration
- Collect email and phone for order updates
- Option to create account after order
- Send order tracking link via email

**Logged-in Checkout:**
- Pre-fill address and contact info
- Show saved payment methods
- Order history accessible
- Faster checkout flow

**Checkout Security:**
- HTTPS required for entire checkout flow
- PCI-DSS compliance for card payments
- Payment gateway tokenization
- No storage of sensitive payment data
- SSL certificates verified

**Acceptance Criteria:**
- [ ] All 4 checkout steps work correctly
- [ ] Progress indicator updates correctly
- [ ] Back/Edit buttons work correctly
- [ ] Address validation works
- [ ] Shipping cost calculated correctly
- [ ] Payment method selection works
- [ ] Order review displays all info correctly
- [ ] Terms checkbox validation works
- [ ] Place Order button triggers payment flow
- [ ] Guest checkout works without login
- [ ] Logged-in checkout pre-fills data
- [ ] Session maintained throughout checkout
- [ ] Checkout works on mobile devices
- [ ] Checkout completion time <60 seconds

**Technical Specifications:**
```typescript
interface CheckoutSessionDTO {
  sessionId: string;
  userId?: string; // null for guest
  cartId: string;
  
  step: 1 | 2 | 3 | 4;
  
  deliveryAddress?: DeliveryAddressDTO;
  shippingMethod?: {
    method: 'standard' | 'express' | 'same_day';
    cost: number;
    estimatedDays: number;
  };
  
  paymentMethod?: {
    type: 'bkash' | 'nagad' | 'rocket' | 'card' | 'cod' | 'bank';
    details?: any; // method-specific
  };
  
  orderSummary: {
    subtotal: number;
    discount: number;
    shipping: number;
    vat: number;
    total: number;
  };
  
  specialInstructions?: string;
  termsAccepted: boolean;
  
  createdAt: Date;
  expiresAt: Date; // 30 minutes
}
```

**Business Rules:**
- BR-CHK-001: Checkout session expires after 30 minutes of inactivity
- BR-CHK-002: Cart inventory reserved for 15 minutes during checkout
- BR-CHK-003: VAT calculated at 15% of (subtotal - discount)
- BR-CHK-004: Free shipping for orders above BDT 5,000
- BR-CHK-005: COD available only for orders below BDT 50,000
- BR-CHK-006: Same-day delivery only for Dhaka within 10 AM cutoff

---

### FR-CHK-002: Payment Gateway Integration 🔴 🔵 🟡
**Priority:** P0 (Critical)  
**Module:** Payment Integration  
**Status:** APPROVED

**User Story:**  
As a customer, I want to pay using my preferred payment method (bKash, cards, COD) so that I can complete my purchase conveniently.

**Functional Requirements:**

**1. bKash Payment Integration** 🟡 🔵

**Flow:**
1. User selects bKash as payment method
2. User enters bKash mobile number
3. Click "Pay with bKash" button
4. Redirect to bKash payment page/app
5. User completes payment in bKash
6. Redirect back to website with payment status
7. Show order confirmation if successful

**Requirements:**
- bKash Merchant API integration
- Tokenization for saved accounts (optional)
- Payment status webhook handling
- Automatic retry on failure
- Payment timeout: 10 minutes
- SMS OTP verification

**Test Mode:**
- Sandbox environment for testing
- Test mobile numbers and amounts
- Simulated payment flows

**2. Nagad Payment Integration** 🟡 🔵

**Flow:** Similar to bKash
- Nagad merchant integration
- Mobile number input
- Redirect to Nagad payment gateway
- Payment verification
- Callback handling

**3. Rocket Payment Integration** 🟡 🔵

**Flow:** Similar to bKash/Nagad
- Dutch-Bangla Bank Rocket integration
- Mobile banking flow
- Payment verification

**4. SSLCommerz Integration (Cards)** 🔵

**Supported Cards:**
- Visa
- MasterCard
- American Express
- Maestro
- Bangladesh local bank cards

**Flow:**
1. User selects "Card Payment"
2. Redirect to SSLCommerz payment page
3. Enter card details (number, CVV, expiry)
4. 3D Secure authentication (if required)
5. Payment processing
6. Redirect back with payment status

**Features:**
- PCI-DSS compliant (SSLCommerz handles)
- Card tokenization (save cards)
- Recurring payment support
- Multi-currency support

**5. Cash on Delivery (COD)** 🟡

**Requirements:**
- Phone number verification (OTP)
- Order confirmation via SMS
- COD fee: BDT 50 (for orders <BDT 10,000)
- Delivery partner cash collection integration

**Flow:**
1. User selects COD
2. Phone OTP verification
3. Order confirmed
4. Pay on delivery

**6. Bank Transfer (Manual)**

**Requirements:**
- Display bank account details
- Upload payment proof (image/PDF)
- Manual verification by admin
- Order confirmed after verification (1-2 business days)

**Payment Security:**
- All payment pages HTTPS
- No storage of CVV or full card numbers
- Payment gateway tokenization
- PCI-DSS compliance
- Fraud detection (velocity checks)
- SSL certificate validation

**Payment Status Handling:**
- **Success:** Order confirmed, send confirmation email/SMS
- **Pending:** Show pending status, check with gateway
- **Failed:** Show error, allow retry or change method
- **Cancelled:** Release cart reservation, return to checkout

**Acceptance Criteria:**
- [ ] bKash payment flow works end-to-end
- [ ] Nagad payment flow works end-to-end
- [ ] Rocket payment flow works end-to-end
- [ ] Card payment via SSLCommerz works
- [ ] COD option works with OTP verification
- [ ] Bank transfer shows correct account details
- [ ] Payment success redirects to order confirmation
- [ ] Payment failure shows error and retry option
- [ ] Payment status updates in real-time
- [ ] Webhook/callback handling works correctly
- [ ] Payment security measures in place
- [ ] Test transactions work in staging
- [ ] Refund process works (for returns)

**Technical Specifications:**
```typescript
interface PaymentRequest {
  orderId: string;
  amount: number;
  currency: 'BDT';
  paymentMethod: 'bkash' | 'nagad' | 'rocket' | 'card' | 'cod' | 'bank';
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  returnUrl: string;
  cancelUrl: string;
  webhookUrl: string;
}

interface PaymentResponse {
  paymentId: string;
  transactionId: string;
  status: 'success' | 'pending' | 'failed' | 'cancelled';
  amount: number;
  paymentMethod: string;
  paidAt?: Date;
  errorMessage?: string;
}
```

**Business Rules:**
- BR-PAY-001: Payment gateway charges borne by company
- BR-PAY-002: COD orders require phone verification
- BR-PAY-003: Failed payments allow 3 retry attempts
- BR-PAY-004: Payment timeout after 15 minutes
- BR-PAY-005: Refunds processed within 7-10 business days
- BR-PAY-006: bKash/Nagad minimum transaction: BDT 50

---

# 10. Order Management

## 10.1 Order Confirmation

### FR-ORD-001: Order Confirmation Page
**Priority:** P0 (Critical) 🔴  
**Module:** Order Management  
**Status:** APPROVED

**User Story:**  
As a customer, I want to see order confirmation immediately after successful payment so that I know my order was placed successfully.

**Functional Requirements:**

1. **Order Confirmation Display:**
   - Success message: "Thank you! Your order has been placed."
   - Order number (unique, e.g., #SMT-2024-001234)
   - Order date and time
   - Estimated delivery date
   - Delivery address
   - Payment method
   - Payment status (Paid/COD)

2. **Order Summary:**
   - All ordered items with images
   - Quantities and prices
   - Subtotal, shipping, VAT, total
   - Discount applied (if any)

3. **Next Steps Information:**
   - Order tracking instructions
   - Expected processing time
   - Delivery timeline
   - Contact information for support

4. **Call-to-Action Buttons:**
   - "View Order Details" (go to order page)
   - "Track Order" (go to tracking page)
   - "Continue Shopping"
   - "Download Invoice" (PDF)

5. **Confirmation Communications:**
   - **Email:** Send order confirmation email immediately
   - **SMS:** Send order confirmation SMS with order number
   - **WhatsApp:** Send order confirmation (if opted in)

**Acceptance Criteria:**
- [ ] Order confirmation page displays immediately
- [ ] Order number generated correctly
- [ ] All order details accurate
- [ ] Confirmation email sent within 1 minute
- [ ] Confirmation SMS sent within 1 minute
- [ ] Download invoice works correctly
- [ ] Tracking link works
- [ ] Page accessible via unique URL
- [ ] Page printable
- [ ] Mobile layout responsive

**Technical Specifications:**
```typescript
interface OrderConfirmationDTO {
  orderId: string;
  orderNumber: string;
  orderDate: Date;
  estimatedDelivery: Date;
  
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  
  deliveryAddress: DeliveryAddressDTO;
  
  items: OrderItemDTO[];
  
  pricing: {
    subtotal: number;
    discount: number;
    shipping: number;
    vat: number;
    total: number;
  };
  
  payment: {
    method: string;
    status: 'paid' | 'pending' | 'cod';
    transactionId?: string;
  };
  
  trackingUrl: string;
  invoiceUrl: string;
}
```

---

### FR-ORD-002: Order Tracking
**Priority:** P0 (Critical) 🔴  
**Module:** Order Management  
**Status:** APPROVED

**User Story:**  
As a customer, I want to track my order status in real-time so that I know when my order will arrive.

**Functional Requirements:**

1. **Order Status Flow:**
   1. **Order Placed** - Order confirmed, payment received
   2. **Processing** - Order being prepared for shipment
   3. **Packed** - Order packed and ready for dispatch
   4. **Shipped** - Order handed to courier
   5. **Out for Delivery** - Order out for delivery
   6. **Delivered** - Order delivered successfully
   
   **Alternative Status:**
   - **Cancelled** - Order cancelled (by customer or system)
   - **Returned** - Order returned by customer
   - **Refunded** - Refund processed

2. **Tracking Page Features:**
   - Order number and date
   - Current status (visual progress bar)
   - Status history (timeline with timestamps)
   - Estimated delivery date
   - Courier name and tracking number (if shipped)
   - Link to courier tracking (external)
   - Delivery address
   - Contact support button

3. **Status Updates:**
   - Real-time status from ERP/courier
   - Email notification on status change
   - SMS notification on key statuses (Shipped, Delivered)
   - Push notification (if app available)

4. **Tracking Access:**
   - Logged-in users: My Orders page
   - Guest/anyone: Track by order number + phone/email
   - Public tracking URL (shareable)

**Acceptance Criteria:**
- [ ] Order status displays correctly
- [ ] Progress bar reflects current status
- [ ] Status history shows all transitions
- [ ] Courier tracking link works (if available)
- [ ] Email notifications sent on status change
- [ ] SMS sent for Shipped and Delivered
- [ ] Guest tracking works with order number
- [ ] Status updates in real-time (or near real-time)
- [ ] Mobile layout responsive

**Technical Specifications:**
```typescript
interface OrderStatusDTO {
  orderId: string;
  orderNumber: string;
  currentStatus: OrderStatus;
  statusHistory: OrderStatusHistory[];
  estimatedDelivery: Date;
  courierInfo?: {
    courierName: string;
    trackingNumber: string;
    trackingUrl: string;
  };
}

enum OrderStatus {
  ORDER_PLACED = 'order_placed',
  PROCESSING = 'processing',
  PACKED = 'packed',
  SHIPPED = 'shipped',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
  REFUNDED = 'refunded',
}

interface OrderStatusHistory {
  status: OrderStatus;
  timestamp: Date;
  note?: string;
  updatedBy?: string; // system or admin
}
```

**Business Rules:**
- BR-ORD-001: Order status synced from UniERP every 15 minutes
- BR-ORD-002: Email sent on every status change
- BR-ORD-003: SMS sent only for Shipped, Out for Delivery, Delivered
- BR-ORD-004: Delivered status requires delivery confirmation
- BR-ORD-005: Orders auto-marked delivered after 7 days if shipped

---

Continues in Part 4...
