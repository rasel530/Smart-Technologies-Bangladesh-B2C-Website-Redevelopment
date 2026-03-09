# Guest Checkout Payment Progress Bar, Payment Method, and Review System Fix Specification

**Document Version:** 1.0  
**Date:** 2026-02-24  
**Author:** System Architecture Team  
**Status:** Draft for Review

---

## Executive Summary

This specification provides a comprehensive plan to fix the Guest Checkout Payment Progress bar, Payment Method selection, and Review system to match the logged-in user implementation. The guest checkout system currently has significant gaps in functionality compared to the logged-in checkout, which serves as the reference implementation.

**Scope:** Three main areas requiring fixes:

1. Payment Progress Bar
2. Payment Method Selection and Validation
3. Review System

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Gap Analysis](#gap-analysis)
3. [File-by-File Modification Plan](#file-by-file-modification-plan)
4. [Function-by-Function Implementation Guide](#function-by-function-implementation-guide)
5. [Component Integration Plan](#component-integration-plan)
6. [Step-by-Step Implementation Order](#step-by-step-implementation-order)
7. [Risk Assessment](#risk-assessment)
8. [Testing Strategy](#testing-strategy)
9. [Rollback Plan](#rollback-plan)

---

## 1. Current State Analysis

### 1.1 Guest Checkout Implementation

**Location:** [`frontend/src/app/checkout/guest/page.tsx`](frontend/src/app/checkout/guest/page.tsx)

#### Payment Progress Bar (Lines 432-637)

- **Implementation:** Inline progress bar within page component
- **Steps:** 5 steps (info, address, shipping, payment, review)
- **Features:**
  - Basic progress percentage display
  - Step indicators with icons
  - Desktop and mobile responsive views
  - Basic step navigation
- **Issues:**
  - Duplicated code from logged-in checkout
  - Different step count (5 vs 4)
  - No dedicated reusable component
  - Missing "info" step in logged-in checkout

#### Payment Method Selection (Lines 63-100, 1133-1196)

- **Implementation:** Basic payment method array with 6 methods
- **Methods:** cod, card, emi, bkash, nagad, rocket
- **Features:**
  - Simple radio-button style selection
  - Basic icon display
  - Click-to-select functionality
- **Issues:**
  - No MCash payment method (7th method in logged-in)
  - No validation for any payment method
  - No EMI plan selection UI
  - No COD validation with fees
  - No local payment details (phone/PIN inputs)
  - No payment fee display
  - No payment instructions

#### Review System (Lines 1199-1299)

- **Implementation:** Basic summary display
- **Features:**
  - Shipping address summary
  - Billing address summary
  - Payment method name only
  - Shipping method summary
- **Issues:**
  - Only shows payment method name
  - No EMI details breakdown
  - No COD fee display
  - No local payment fee display
  - No payment phone number display
  - No detailed payment breakdown

### 1.2 Logged-In Checkout Implementation (Reference)

**Location:** [`frontend/src/app/checkout/page.tsx`](frontend/src/app/checkout/page.tsx)

#### Payment Progress Bar (Lines 1052-1070)

- **Implementation:** Dedicated [`CheckoutProgress`](frontend/src/components/checkout/CheckoutProgress.tsx) component
- **Steps:** 4 steps (address, shipping, payment, review)
- **Features:**
  - Reusable component
  - Progress percentage display
  - Step indicators with checkmarks
  - Desktop and mobile responsive views
  - Clickable steps when allowed
  - Bilingual support (English/Bangla)
  - Step descriptions (optional)

#### Payment Method Selection (Lines 67-110, 1557-1846)

- **Implementation:** Full-featured payment system
- **Methods:** 7 methods (cod, card, emi, bkash, nagad, rocket, mcash)
- **Features:**
  - Comprehensive validation for each method
  - EMI plan selection with [`EmiSelector`](frontend/src/components/cart/EmiSelector.tsx) component
  - EMI details display with [`EmiSummary`](frontend/src/components/cart/EmiSummary.tsx) component
  - COD validation with [`validateCodOrder`](frontend/src/lib/api/cod.ts) API
  - COD fee display with [`CodFeeDisplay`](frontend/src/components/cart/CodFeeDisplay.tsx) component
  - Local payment method selection with [`LocalPaymentMethodSelector`](frontend/src/components/cart/LocalPaymentMethodSelector.tsx) component
  - Local payment fee display with [`LocalPaymentFeeDisplay`](frontend/src/components/cart/LocalPaymentFeeDisplay.tsx) component
  - Local payment instructions with [`LocalPaymentInstructions`](frontend/src/components/cart/LocalPaymentInstructions.tsx) component
  - Phone and PIN input fields for local payments
  - Payment fee breakdown in order summary

#### Review System (Lines 1850-2020)

- **Implementation:** Comprehensive summary with detailed breakdowns
- **Features:**
  - Full address summaries
  - EMI details breakdown (provider, plan, monthly EMI, duration, total payable)
  - COD details breakdown (COD fee, delivery days, verification requirements)
  - Local payment details breakdown (method, payment fee, total amount, phone number)
  - Detailed fee breakdown in order summary

---

## 2. Gap Analysis

### 2.1 Payment Progress Bar Gaps

| Gap                    | Guest Checkout                                     | Logged-In Checkout                           | Impact                               |
| ---------------------- | -------------------------------------------------- | -------------------------------------------- | ------------------------------------ |
| Component Architecture | Inline implementation                              | Dedicated reusable component                 | Code duplication, maintenance issues |
| Step Count             | 5 steps (info, address, shipping, payment, review) | 4 steps (address, shipping, payment, review) | Inconsistent user experience         |
| Step Configuration     | Hardcoded in page                                  | Configurable via type definitions            | Less flexible                        |
| Clickable Steps        | Basic navigation                                   | Advanced navigation with validation          | Poor UX                              |

### 2.2 Payment Method Selection Gaps

| Gap                   | Guest Checkout | Logged-In Checkout                   | Impact                   |
| --------------------- | -------------- | ------------------------------------ | ------------------------ |
| Payment Methods       | 6 methods      | 7 methods (includes MCash)           | Missing payment option   |
| Validation            | None           | Comprehensive validation             | Invalid orders possible  |
| EMI Support           | None           | Full EMI support with plan selection | Lost revenue opportunity |
| COD Validation        | None           | Full COD validation with fees        | Invalid COD orders       |
| Local Payment Details | None           | Phone/PIN inputs, fee display        | Poor payment experience  |
| Payment Instructions  | None           | Detailed instructions per method     | User confusion           |

### 2.3 Review System Gaps

| Gap             | Guest Checkout   | Logged-In Checkout               | Impact                             |
| --------------- | ---------------- | -------------------------------- | ---------------------------------- |
| Payment Details | Method name only | Full breakdown (EMI, COD, local) | User cannot verify payment details |
| Fee Display     | None             | All fees displayed               | User surprise at checkout          |
| Payment Phone   | None             | Displayed for local payments     | User cannot verify payment info    |

### 2.4 State Management Gaps

| Gap                   | Guest Checkout | Logged-In Checkout  | Impact                  |
| --------------------- | -------------- | ------------------- | ----------------------- |
| saveProgress Function | Missing        | Implemented         | No progress persistence |
| Security State        | Missing        | Implemented         | No security monitoring  |
| Abandonment Recovery  | Partial        | Full implementation | Lost checkout data      |

---

## 3. File-by-File Modification Plan

### 3.1 Files to Modify

| File                                                                                                             | Type             | Purpose                                              | Changes Required |
| ---------------------------------------------------------------------------------------------------------------- | ---------------- | ---------------------------------------------------- | ---------------- |
| [`frontend/src/app/checkout/guest/page.tsx`](frontend/src/app/checkout/guest/page.tsx)                           | Page Component   | Main checkout page - add payment features            |
| [`frontend/src/hooks/useGuestCheckout.ts`](frontend/src/hooks/useGuestCheckout.ts)                               | Custom Hook      | Add saveProgress, security state, payment validation |
| [`frontend/src/types/guestCheckout.ts`](frontend/src/types/guestCheckout.ts)                                     | Type Definitions | Add missing types for EMI, COD, local payments       |
| [`frontend/src/components/checkout/CheckoutProgress.tsx`](frontend/src/components/checkout/CheckoutProgress.tsx) | Component        | Update to support guest checkout steps               |

### 3.2 Files to Create

| File                                                         | Type       | Purpose                                                  |
| ------------------------------------------------------------ | ---------- | -------------------------------------------------------- |
| `frontend/src/components/checkout/GuestCheckoutProgress.tsx` | Component  | Dedicated guest checkout progress component (optional)   |
| `frontend/src/lib/api/guestPayment.ts`                       | API Module | Guest payment validation APIs (COD, EMI, local payments) |

### 3.3 Files to Reuse (No Changes)

| File                                                                                                                         | Type             | Purpose                                      |
| ---------------------------------------------------------------------------------------------------------------------------- | ---------------- | -------------------------------------------- |
| [`frontend/src/components/cart/EmiSelector.tsx`](frontend/src/components/cart/EmiSelector.tsx)                               | Component        | EMI plan selection (reuse as-is)             |
| [`frontend/src/components/cart/EmiSummary.tsx`](frontend/src/components/cart/EmiSummary.tsx)                                 | Component        | EMI details display (reuse as-is)            |
| [`frontend/src/components/cart/CodFeeDisplay.tsx`](frontend/src/components/cart/CodFeeDisplay.tsx)                           | Component        | COD fee display (reuse as-is)                |
| [`frontend/src/components/cart/LocalPaymentMethodSelector.tsx`](frontend/src/components/cart/LocalPaymentMethodSelector.tsx) | Component        | Local payment method selection (reuse as-is) |
| [`frontend/src/components/cart/LocalPaymentFeeDisplay.tsx`](frontend/src/components/cart/LocalPaymentFeeDisplay.tsx)         | Component        | Local payment fee display (reuse as-is)      |
| [`frontend/src/components/cart/LocalPaymentInstructions.tsx`](frontend/src/components/cart/LocalPaymentInstructions.tsx)     | Component        | Local payment instructions (reuse as-is)     |
| [`frontend/src/lib/api/cod.ts`](frontend/src/lib/api/cod.ts)                                                                 | API Module       | COD validation (reuse as-is)                 |
| [`frontend/src/lib/api/emi.ts`](frontend/src/lib/api/emi.ts)                                                                 | API Module       | EMI plans and calculation (reuse as-is)      |
| [`frontend/src/types/emi.ts`](frontend/src/types/emi.ts)                                                                     | Type Definitions | EMI types (reuse as-is)                      |
| [`frontend/src/types/cod.ts`](frontend/src/types/cod.ts)                                                                     | Type Definitions | COD types (reuse as-is)                      |
| [`frontend/src/types/localPayment.ts`](frontend/src/types/localPayment.ts)                                                   | Type Definitions | Local payment types (reuse as-is)            |

---

## 4. Function-by-Function Implementation Guide

### 4.1 Payment Progress Bar Functions

#### 4.1.1 Function: `useGuestCheckout.saveProgress`

**Location:** [`frontend/src/hooks/useGuestCheckout.ts`](frontend/src/hooks/useGuestCheckout.ts) (NEW)

**Purpose:** Save guest checkout progress to backend and update local state

**Signature:**

```typescript
const saveProgress = useCallback(
  async (data: Partial<GuestCheckoutData>) => {
    // Implementation
  },
  [session, calculateProgress],
);
```

**Parameters:**

- `data: Partial<GuestCheckoutData>` - Partial checkout data to save

**Return Type:** `Promise<GuestSession>`

**Implementation Steps:**

1. Check if session exists, throw error if not
2. Set loading state to true
3. Clear any existing error
4. Call API endpoint `/guest/checkout/save` with session ID and data
5. Update session state with response
6. Recalculate progress based on updated session data
7. Update last activity timestamp
8. Return response

**Error Handling:**

- Throw error if no active session
- Display toast error on API failure
- Return error state

**Example Usage:**

```typescript
await saveProgress({
  payment: {
    method: "cod",
    codFee: 50,
    completed: true,
  },
});
```

---

#### 4.1.2 Function: `validateGuestPaymentMethod`

**Location:** [`frontend/src/hooks/useGuestCheckout.ts`](frontend/src/hooks/useGuestCheckout.ts) (NEW)

**Purpose:** Validate selected payment method for guest checkout

**Signature:**

```typescript
const validateGuestPaymentMethod = useCallback(
  async (
    method: string,
    address: GuestShippingAddress,
    amount: number,
  ): Promise<GuestPaymentValidationResult> => {
    // Implementation
  },
  [],
);
```

**Parameters:**

- `method: string` - Payment method ID (cod, card, emi, bkash, nagad, rocket, mcash)
- `address: GuestShippingAddress` - Shipping address for validation
- `amount: number` - Order total amount

**Return Type:** `Promise<GuestPaymentValidationResult>`

**Implementation Steps:**

1. Switch on payment method type
2. For COD: Call `validateCodOrder` API, check availability and fee
3. For EMI: Check minimum amount (5000), load available plans
4. For Local Payments (bkash, nagad, rocket, mcash): Load available methods and fees
5. For Card: Basic validation (no special checks)
6. Return validation result with success status, details, and any errors

**Error Handling:**

- Return validation error result on API failure
- Display toast error on unexpected errors

**Example Usage:**

```typescript
const validation = await validateGuestPaymentMethod(
  "cod",
  shippingAddress,
  total,
);
if (!validation.isValid) {
  toast.error(validation.message);
}
```

---

### 4.2 Payment Method Selection Functions

#### 4.2.1 Function: `handleGuestEmiPlanSelect`

**Location:** [`frontend/src/app/checkout/guest/page.tsx`](frontend/src/app/checkout/guest/page.tsx) (NEW)

**Purpose:** Handle EMI plan selection for guest checkout

**Signature:**

```typescript
const handleGuestEmiPlanSelect = async (planId: string, plan: EmiPlan) => {
  // Implementation
};
```

**Parameters:**

- `planId: string` - Selected EMI plan ID
- `plan: EmiPlan` - EMI plan object

**Return Type:** `void`

**Implementation Steps:**

1. Set selected EMI plan ID state
2. Set selected EMI plan state
3. Call `calculateEmi` API with total and plan ID
4. Set EMI details state with response
5. Update payment details state with EMI information
6. Save progress to backend

**Error Handling:**

- Log error to console
- Display toast error on failure
- Clear EMI selection on error

**Example Usage:**

```typescript
<EmiSelector
  availablePlans={emiPlans}
  selectedPlanId={selectedEmiPlanId || undefined}
  onPlanSelect={handleGuestEmiPlanSelect}
  language={language}
/>
```

---

#### 4.2.2 Function: `validateGuestCod`

**Location:** [`frontend/src/app/checkout/guest/page.tsx`](frontend/src/app/checkout/guest/page.tsx) (NEW)

**Purpose:** Validate COD availability for guest checkout

**Signature:**

```typescript
const validateGuestCod = async () => {
  // Implementation
};
```

**Parameters:** None (uses state variables)

**Return Type:** `void`

**Implementation Steps:**

1. Check if selected payment is COD and address has district
2. Set validating state to true
3. Call `validateCodOrder` API with guest ID (null), address, and total
4. Set COD validation state with response
5. Call `getCodFee` API to get COD fee
6. Set COD fee state
7. Update payment details state with COD information
8. Set validating state to false

**Error Handling:**

- Log error to console
- Clear COD validation and fee on error
- Set validating state to false

**Example Usage:**

```typescript
useEffect(() => {
  const validateCOD = async () => {
    if (selectedPayment === "cod" && shippingAddress.district) {
      await validateGuestCod();
    }
  };
  validateCOD();
}, [selectedPayment, shippingAddress.district, total]);
```

---

#### 4.2.3 Function: `handleGuestLocalPaymentMethodSelect`

**Location:** [`frontend/src/app/checkout/guest/page.tsx`](frontend/src/app/checkout/guest/page.tsx) (NEW)

**Purpose:** Handle local payment method selection for guest checkout

**Signature:**

```typescript
const handleGuestLocalPaymentMethodSelect = async (
  method: LocalPaymentMethod,
  feeResult?: PaymentFeeResult,
) => {
  // Implementation
};
```

**Parameters:**

- `method: LocalPaymentMethod` - Selected local payment method
- `feeResult?: PaymentFeeResult` - Payment fee result (optional)

**Return Type:** `void`

**Implementation Steps:**

1. Set selected local payment method state
2. Set local payment fee state
3. Update payment details state with local payment information
4. Save progress to backend

**Error Handling:**

- Log error to console
- Display toast error on failure

**Example Usage:**

```typescript
<LocalPaymentMethodSelector
  amount={total}
  selectedMethodCode={selectedPayment}
  onMethodSelect={handleGuestLocalPaymentMethodSelect}
  language={language}
  showFee={true}
/>
```

---

### 4.3 Review System Functions

#### 4.3.1 Function: `getGuestPaymentSummaryDetails`

**Location:** [`frontend/src/app/checkout/guest/page.tsx`](frontend/src/app/checkout/guest/page.tsx) (NEW)

**Purpose:** Get detailed payment summary for review display

**Signature:**

```typescript
const getGuestPaymentSummaryDetails = (): PaymentSummaryDetails => {
  // Implementation
};
```

**Parameters:** None (uses state variables)

**Return Type:** `PaymentSummaryDetails`

**Implementation Steps:**

1. Switch on selected payment method
2. For EMI: Return EMI details (provider, plan, monthly EMI, duration, total payable, processing fee)
3. For COD: Return COD details (COD fee, delivery days, verification requirements)
4. For Local Payments: Return local payment details (method, payment fee, total amount, phone number)
5. For Card: Return basic card details
6. Return object with payment type and relevant details

**Error Handling:**

- Return empty details on error
- Log error to console

**Example Usage:**

```typescript
const paymentDetails = getGuestPaymentSummaryDetails();
{paymentDetails.type === 'emi' && (
  <EmiSummary emiDetails={paymentDetails.details} language={language} />
)}
```

---

### 4.4 State Management Functions

#### 4.4.1 Function: `initializeGuestSecurityState`

**Location:** [`frontend/src/hooks/useGuestCheckout.ts`](frontend/src/hooks/useGuestCheckout.ts) (NEW)

**Purpose:** Initialize security state for guest checkout

**Signature:**

```typescript
const initializeGuestSecurityState = useCallback(() => {
  // Implementation
}, []);
```

**Parameters:** None

**Return Type:** `void`

**Implementation Steps:**

1. Create security state object with:
   - isSecure: true
   - isHttps: Check window.location.protocol
   - sslCertificate: Valid certificate info
   - sessionTimeout: 30 minutes
   - sessionExpiresAt: Current time + 30 minutes
   - warnings: Empty array
   - badges: SSL, PCI DSS, data protection badges
   - compliance: PCI DSS, GDPR, data protection info
2. Set security state

**Error Handling:**

- Use default values if window is not available

**Example Usage:**

```typescript
useEffect(() => {
  initializeGuestSecurityState();
}, []);
```

---

## 5. Component Integration Plan

### 5.1 Progress Bar Integration

#### Option 1: Reuse Existing CheckoutProgress Component

**Approach:** Modify existing [`CheckoutProgress`](frontend/src/components/checkout/CheckoutProgress.tsx) to support both logged-in and guest checkout steps

**Changes Required:**

1. Add prop `steps?: CheckoutStep[] | GuestCheckoutStep[]` to allow custom steps
2. Update step configuration to accept dynamic steps
3. Maintain backward compatibility with default 4-step logged-in checkout

**Pros:**

- Single source of truth
- Consistent UI across both checkout types
- Less code duplication

**Cons:**

- Component becomes more complex
- May need conditional logic

**Implementation:**

```typescript
// CheckoutProgress.tsx
interface CheckoutProgressProps {
  currentStep: CheckoutStep | GuestCheckoutStep;
  completedSteps: (CheckoutStep | GuestCheckoutStep)[];
  steps?: Array<{
    step: CheckoutStep | GuestCheckoutStep;
    label: string;
    labelBn: string;
    icon: React.ReactNode;
  }>;
  // ... other props
}

// Use default steps if not provided
const stepsToUse = steps || CHECKOUT_STEPS;
```

#### Option 2: Create Dedicated GuestCheckoutProgress Component

**Approach:** Create new component specifically for guest checkout with 5 steps

**Changes Required:**

1. Create `frontend/src/components/checkout/GuestCheckoutProgress.tsx`
2. Copy logic from CheckoutProgress
3. Update to use 5 steps (info, address, shipping, payment, review)
4. Add guest-specific step configurations

**Pros:**

- Separate concerns
- No impact on existing logged-in checkout
- Can have guest-specific features

**Cons:**

- Code duplication
- Two components to maintain

**Recommendation:** Use Option 1 (reuse existing component) to maintain consistency and reduce duplication.

---

### 5.2 Payment Method Components Integration

#### 5.2.1 EMI Components

**Components to Integrate:**

- [`EmiSelector`](frontend/src/components/cart/EmiSelector.tsx) - EMI plan selection
- [`EmiSummary`](frontend/src/components/cart/EmiSummary.tsx) - EMI details display

**Integration Steps:**

1. Import components in guest checkout page
2. Add EMI state variables (emiAvailable, emiPlans, selectedEmiPlanId, selectedEmiPlan, emiDetails, isLoadingEmi)
3. Load EMI plans when total >= 5000
4. Display EmiSelector when EMI payment method is selected
5. Display EmiSummary when EMI plan is selected
6. Add EMI details to review summary

**Example Code:**

```typescript
// Add state
const [emiAvailable, setEmiAvailable] = useState(false);
const [emiPlans, setEmiPlans] = useState<EmiPlan[]>([]);
const [selectedEmiPlanId, setSelectedEmiPlanId] = useState<string | null>(null);
const [selectedEmiPlan, setSelectedEmiPlan] = useState<EmiPlan | null>(null);
const [emiDetails, setEmiDetails] = useState<EmiDetails | null>(null);
const [isLoadingEmi, setIsLoadingEmi] = useState(false);

// Load EMI plans
useEffect(() => {
  const loadEmiPlans = async () => {
    try {
      setIsLoadingEmi(true);
      const { getAvailableEmiPlans } = await import('@/lib/api/emi');
      const response = await getAvailableEmiPlans(total);

      if (response.success && response.data) {
        setEmiPlans(response.data.plans);
        setEmiAvailable(response.data.plans.length > 0);
      }
    } catch (error) {
      console.error('Error loading EMI plans:', error);
      setEmiAvailable(false);
    } finally {
      setIsLoadingEmi(false);
    }
  };

  if (total >= 5000) {
    loadEmiPlans();
  } else {
    setEmiAvailable(false);
  }
}, [total]);

// Display in payment step
{selectedPayment === 'emi' && (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <div className="flex items-center gap-3 mb-6">
      <CreditCard className="w-6 h-6 text-purple-600" />
      <h2 className="text-lg font-semibold text-gray-900">EMI Options</h2>
    </div>

    {isLoadingEmi ? (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="ml-3 text-gray-600">Loading EMI options...</span>
      </div>
    ) : emiAvailable ? (
      <>
        <EmiSelector
          availablePlans={emiPlans}
          selectedPlanId={selectedEmiPlanId || undefined}
          onPlanSelect={handleGuestEmiPlanSelect}
          language={language}
        />

        {emiDetails && (
          <div className="mt-6">
            <EmiSummary
              emiDetails={emiDetails}
              language={language}
              showBreakdown={true}
            />
          </div>
        )}
      </>
    ) : (
      <div className="bg-gray-50 border border-gray-200 rounded-md p-6">
        <p className="text-sm text-gray-700">
          EMI is available for orders of ৳5,000 and above.
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Current order total: ৳{total.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
        </p>
      </div>
    )}
  </div>
)}

// Display in review step
{selectedPayment === 'emi' && emiDetails && (
  <div className="mt-3 space-y-2">
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-600">Provider:</span>
      <span className="font-medium text-gray-900">{emiDetails.provider.name}</span>
    </div>
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-600">Plan:</span>
      <span className="font-medium text-gray-900">{emiDetails.planName}</span>
    </div>
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-600">Monthly EMI:</span>
      <span className="font-medium text-blue-600">
        ৳{emiDetails.emiAmount.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
      </span>
    </div>
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-600">Duration:</span>
      <span className="font-medium text-gray-900">{emiDetails.duration} months</span>
    </div>
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-600">Total Payable:</span>
      <span className="font-medium text-green-600">
        ৳{emiDetails.totalPayable.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
      </span>
    </div>
  </div>
)}
```

---

#### 5.2.2 COD Components

**Components to Integrate:**

- [`CodFeeDisplay`](frontend/src/components/cart/CodFeeDisplay.tsx) - COD fee display

**Integration Steps:**

1. Import component in guest checkout page
2. Add COD state variables (codValidation, codFee, isValidatingCod)
3. Validate COD when COD payment method is selected
4. Display CodFeeDisplay in payment step
5. Add COD details to review summary

**Example Code:**

```typescript
// Add state
const [codValidation, setCodValidation] = useState<CodValidationResult | null>(null);
const [codFee, setCodFee] = useState<number>(0);
const [isValidatingCod, setIsValidatingCod] = useState(false);

// Validate COD
useEffect(() => {
  const validateCOD = async () => {
    if (selectedPayment === 'cod' && shippingAddress.district) {
      setIsValidatingCod(true);
      try {
        const validation = await validateCodOrder(
          null, // guest user
          {
            division: getDivisionFromDistrict(shippingAddress.district),
            district: shippingAddress.district,
            city: shippingAddress.city,
            address: shippingAddress.addressLine1
          },
          total
        );
        setCodValidation(validation.data);

        // Calculate COD fee
        const feeResponse = await getCodFee(total);
        setCodFee(feeResponse);
      } catch (error) {
        console.error('Error validating COD:', error);
        setCodValidation(null);
        setCodFee(0);
      } finally {
        setIsValidatingCod(false);
      }
    } else {
      setCodValidation(null);
      setCodFee(0);
    }
  };

  validateCOD();
}, [selectedPayment, shippingAddress.district, shippingAddress.city, total]);

// Display in payment step
{selectedPayment === 'cod' && (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <div className="flex items-center gap-3 mb-6">
      <Truck className="w-6 h-6 text-blue-600" />
      <h2 className="text-lg font-semibold text-gray-900">COD Availability</h2>
    </div>

    {isValidatingCod && (
      <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
        <span className="text-sm text-blue-600">Validating COD availability...</span>
      </div>
    )}

    {!isValidatingCod && codValidation && (
      <>
        {codValidation.valid ? (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-green-800 font-medium">COD is available</p>
                {codFee > 0 && (
                  <p className="text-sm text-green-700 mt-1">Additional COD fee: ৳{codFee.toFixed(0)}</p>
                )}
                <p className="text-sm text-green-700 mt-1">Estimated delivery: {codValidation.deliveryDays} days</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800 font-medium">COD is not available</p>
                <p className="text-sm text-red-700 mt-1">{codValidation.reason}</p>
              </div>
            </div>
          </div>
        )}
      </>
    )}

    {/* COD Fee Display */}
    <div className="mt-4">
      <CodFeeDisplay
        amount={total}
        fee={codFee}
        language={language}
        showBreakdown={true}
      />
    </div>
  </div>
)}

// Display in review step
{selectedPayment === 'cod' && codValidation && (
  <div className="mt-3 space-y-2">
    {codFee > 0 && (
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600">COD Fee:</span>
        <span className="font-medium text-gray-900">
          ৳{codFee.toFixed(0)}
        </span>
      </div>
    )}
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-600">Delivery:</span>
      <span className="font-medium text-gray-900">
        {codValidation.deliveryDays} days
      </span>
    </div>
  </div>
)}
```

---

#### 5.2.3 Local Payment Components

**Components to Integrate:**

- [`LocalPaymentMethodSelector`](frontend/src/components/cart/LocalPaymentMethodSelector.tsx) - Local payment method selection
- [`LocalPaymentFeeDisplay`](frontend/src/components/cart/LocalPaymentFeeDisplay.tsx) - Local payment fee display
- [`LocalPaymentInstructions`](frontend/src/components/cart/LocalPaymentInstructions.tsx) - Local payment instructions

**Integration Steps:**

1. Import components in guest checkout page
2. Add local payment state variables (localPaymentMethods, selectedLocalPaymentMethod, localPaymentFee, localPaymentPhone, localPaymentPin, isLoadingLocalPayment)
3. Load local payment methods when local payment is selected
4. Display LocalPaymentMethodSelector in payment step
5. Display LocalPaymentFeeDisplay and LocalPaymentInstructions
6. Add phone and PIN input fields
7. Add local payment details to review summary

**Example Code:**

```typescript
// Add state
const [localPaymentMethods, setLocalPaymentMethods] = useState<LocalPaymentMethod[]>([]);
const [selectedLocalPaymentMethod, setSelectedLocalPaymentMethod] = useState<LocalPaymentMethod | null>(null);
const [localPaymentFee, setLocalPaymentFee] = useState<PaymentFeeResult | null>(null);
const [localPaymentPhone, setLocalPaymentPhone] = useState('');
const [localPaymentPin, setLocalPaymentPin] = useState('');
const [isLoadingLocalPayment, setIsLoadingLocalPayment] = useState(false);

// Local payment handlers
const handleGuestLocalPaymentMethodSelect = async (method: LocalPaymentMethod, feeResult?: PaymentFeeResult) => {
  setSelectedLocalPaymentMethod(method);
  setLocalPaymentFee(feeResult || null);
};

const handleLocalPaymentPhoneChange = (value: string) => {
  setLocalPaymentPhone(value);
};

const handleLocalPaymentPinChange = (value: string) => {
  setLocalPaymentPin(value);
};

// Auto-select first available local payment method
useEffect(() => {
  if (['bkash', 'nagad', 'rocket', 'mcash'].includes(selectedPayment) &&
      localPaymentMethods.length > 0 &&
      !selectedLocalPaymentMethod) {
    const firstMethod = localPaymentMethods[0];
    handleGuestLocalPaymentMethodSelect(firstMethod);
  }
}, [selectedPayment, localPaymentMethods, selectedLocalPaymentMethod]);

// Display in payment step
{['bkash', 'nagad', 'rocket', 'mcash'].includes(selectedPayment) && (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <div className="flex items-center gap-3 mb-6">
      <Smartphone className="w-6 h-6 text-blue-600" />
      <h2 className="text-lg font-semibold text-gray-900">Mobile Payment</h2>
    </div>

    {/* Selection Required Indicator */}
    {!selectedLocalPaymentMethod && (
      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-amber-800">
            Please select a payment method from options below to continue
          </p>
        </div>
      </div>
    )}

    <LocalPaymentMethodSelector
      amount={total}
      selectedMethodCode={selectedPayment}
      onMethodSelect={handleGuestLocalPaymentMethodSelect}
      language={language}
      showFee={true}
    />

    {/* Local Payment Fee Display */}
    {localPaymentFee && (
      <div className="mt-4">
        <LocalPaymentFeeDisplay
          amount={total}
          methodCode={selectedPayment}
          language={language}
        />
      </div>
    )}

    {/* Local Payment Instructions */}
    <div className="mt-4">
      <LocalPaymentInstructions
        methodCode={selectedPayment}
        language={language}
      />
    </div>

    {/* Phone and PIN Input */}
    {selectedLocalPaymentMethod && (
      <div className="mt-4 space-y-4">
        {selectedLocalPaymentMethod.requiresPhone && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              value={localPaymentPhone}
              onChange={(e) => handleLocalPaymentPhoneChange(e.target.value)}
              placeholder="01XXXXXXXXX"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {selectedLocalPaymentMethod.requiresPin && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PIN *
            </label>
            <input
              type="password"
              value={localPaymentPin}
              onChange={(e) => handleLocalPaymentPinChange(e.target.value)}
              placeholder="Enter your PIN"
              maxLength={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>
    )}
  </div>
)}

// Display in review step
{['bkash', 'nagad', 'rocket', 'mcash'].includes(selectedPayment) && selectedLocalPaymentMethod && (
  <div className="mt-3 space-y-2">
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-600">Method:</span>
      <span className="font-medium text-gray-900">{selectedLocalPaymentMethod.displayName}</span>
    </div>
    {localPaymentFee && localPaymentFee.totalFee > 0 && (
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600">Payment Fee:</span>
        <span className="font-medium text-red-600">
          +৳{localPaymentFee.totalFee.toFixed(2)}
        </span>
      </div>
    )}
    {localPaymentFee && (
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600">Total Amount:</span>
        <span className="font-medium text-blue-600">
          ৳{localPaymentFee.totalAmount.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
        </span>
      </div>
    )}
    {localPaymentPhone && (
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600">Phone:</span>
        <span className="font-medium text-gray-900">{localPaymentPhone}</span>
      </div>
    )}
  </div>
)}
```

---

### 5.3 Review System Integration

**Integration Steps:**

1. Add detailed payment breakdown section to review step
2. Display EMI details when EMI is selected
3. Display COD details when COD is selected
4. Display local payment details when local payment is selected
5. Update order summary to include payment fees

**Example Code:**

```typescript
{/* Payment Method Summary */}
<div className="mb-6 p-4 bg-gray-50 rounded-lg">
  <h3 className="font-medium text-gray-900 mb-2">
    {language === 'bn' ? 'পেমেন্ট পদ্ধতি:' : 'Payment Method:'}
  </h3>
  <p className="text-gray-600">
    {paymentMethods.find(m => m.id === selectedPayment)?.name}
  </p>

  {/* EMI Details */}
  {selectedPayment === 'emi' && emiDetails && (
    <div className="mt-3 space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600">Provider:</span>
        <span className="font-medium text-gray-900">{emiDetails.provider.name}</span>
      </div>
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600">Plan:</span>
        <span className="font-medium text-gray-900">{emiDetails.planName}</span>
      </div>
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600">Monthly EMI:</span>
        <span className="font-medium text-blue-600">
          ৳{emiDetails.emiAmount.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
        </span>
      </div>
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600">Duration:</span>
        <span className="font-medium text-gray-900">{emiDetails.duration} months</span>
      </div>
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600">Total Payable:</span>
        <span className="font-medium text-green-600">
          ৳{emiDetails.totalPayable.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  )}

  {/* COD Details */}
  {selectedPayment === 'cod' && codValidation && (
    <div className="mt-3 space-y-2">
      {codFee > 0 && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">COD Fee:</span>
          <span className="font-medium text-gray-900">
            ৳{codFee.toFixed(0)}
          </span>
        </div>
      )}
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600">Delivery:</span>
        <span className="font-medium text-gray-900">
          {codValidation.deliveryDays} days
        </span>
      </div>
    </div>
  )}

  {/* Local Payment Details */}
  {['bkash', 'nagad', 'rocket', 'mcash'].includes(selectedPayment) && selectedLocalPaymentMethod && (
    <div className="mt-3 space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600">Method:</span>
        <span className="font-medium text-gray-900">{selectedLocalPaymentMethod.displayName}</span>
      </div>
      {localPaymentFee && localPaymentFee.totalFee > 0 && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Payment Fee:</span>
          <span className="font-medium text-red-600">
            +৳{localPaymentFee.totalFee.toFixed(2)}
          </span>
        </div>
      )}
      {localPaymentFee && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Total Amount:</span>
          <span className="font-medium text-blue-600">
            ৳{localPaymentFee.totalAmount.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
          </span>
        </div>
      )}
      {localPaymentPhone && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Phone:</span>
          <span className="font-medium text-gray-900">{localPaymentPhone}</span>
        </div>
      )}
    </div>
  )}
</div>
```

---

## 6. Step-by-Step Implementation Order

### Phase 1: Type Definitions and State Management (Foundation)

**Step 1.1:** Update Guest Checkout Types

- **File:** [`frontend/src/types/guestCheckout.ts`](frontend/src/types/guestCheckout.ts)
- **Changes:**
  - Add `GuestCheckoutSecurity` type
  - Add `GuestSecurityWarning` type
  - Add `GuestSecurityBadge` type
  - Add `GuestComplianceInfo` type
  - Add `GuestPaymentValidationResult` type
  - Add `PaymentSummaryDetails` type
  - Import EMI, COD, and Local Payment types from existing type files

**Step 1.2:** Add Security State to useGuestCheckout Hook

- **File:** [`frontend/src/hooks/useGuestCheckout.ts`](frontend/src/hooks/useGuestCheckout.ts)
- **Changes:**
  - Add `security` state variable
  - Add `initializeGuestSecurityState` function
  - Add `setSecurityWarning` function
  - Add `dismissSecurityWarning` function
  - Export security state and functions

**Step 1.3:** Add saveProgress Function to useGuestCheckout Hook

- **File:** [`frontend/src/hooks/useGuestCheckout.ts`](frontend/src/hooks/useGuestCheckout.ts)
- **Changes:**
  - Add `saveProgress` function
  - Implement API call to `/guest/checkout/save`
  - Update session and progress state
  - Export saveProgress function

---

### Phase 2: Payment Progress Bar (UI Enhancement)

**Step 2.1:** Update CheckoutProgress Component for Guest Support

- **File:** [`frontend/src/components/checkout/CheckoutProgress.tsx`](frontend/src/components/checkout/CheckoutProgress.tsx)
- **Changes:**
  - Add optional `steps` prop to allow custom step configuration
  - Support both CheckoutStep and GuestCheckoutStep types
  - Maintain backward compatibility with default 4-step logged-in checkout

**Step 2.2:** Replace Inline Progress Bar in Guest Checkout

- **File:** [`frontend/src/app/checkout/guest/page.tsx`](frontend/src/app/checkout/guest/page.tsx)
- **Changes:**
  - Remove inline progress bar code (lines 432-637)
  - Import CheckoutProgress component
  - Add guest checkout steps configuration
  - Use CheckoutProgress component with guest steps

---

### Phase 3: Payment Method Selection (Core Functionality)

**Step 3.1:** Add MCash Payment Method

- **File:** [`frontend/src/app/checkout/guest/page.tsx`](frontend/src/app/checkout/guest/page.tsx)
- **Changes:**
  - Add MCash to paymentMethods array
  - Update payment method count from 6 to 7

**Step 3.2:** Add EMI Support

- **File:** [`frontend/src/app/checkout/guest/page.tsx`](frontend/src/app/checkout/guest/page.tsx)
- **Changes:**
  - Import EMI components (EmiSelector, EmiSummary)
  - Add EMI state variables
  - Add handleGuestEmiPlanSelect function
  - Add EMI plans loading useEffect
  - Display EmiSelector when EMI payment method is selected
  - Display EmiSummary when EMI plan is selected
  - Add EMI validation function

**Step 3.3:** Add COD Validation

- **File:** [`frontend/src/app/checkout/guest/page.tsx`](frontend/src/app/checkout/guest/page.tsx)
- **Changes:**
  - Import COD components (CodFeeDisplay)
  - Add COD state variables
  - Add validateGuestCod function
  - Add COD validation useEffect
  - Display CodFeeDisplay in payment step
  - Add COD availability indicator

**Step 3.4:** Add Local Payment Support

- **File:** [`frontend/src/app/checkout/guest/page.tsx`](frontend/src/app/checkout/guest/page.tsx)
- **Changes:**
  - Import local payment components (LocalPaymentMethodSelector, LocalPaymentFeeDisplay, LocalPaymentInstructions)
  - Add local payment state variables
  - Add handleGuestLocalPaymentMethodSelect function
  - Add phone and PIN change handlers
  - Display LocalPaymentMethodSelector in payment step
  - Display LocalPaymentFeeDisplay and LocalPaymentInstructions
  - Add phone and PIN input fields

**Step 3.5:** Add Payment Validation

- **File:** [`frontend/src/app/checkout/guest/page.tsx`](frontend/src/app/checkout/guest/page.tsx)
- **Changes:**
  - Add validateGuestPaymentMethod function
  - Add validateEmi function
  - Add validateLocalPayment function
  - Update handlePaymentSubmit to include all validations
  - Save payment details with validation results

---

### Phase 4: Review System (Final Display)

**Step 4.1:** Add Payment Summary Details Function

- **File:** [`frontend/src/app/checkout/guest/page.tsx`](frontend/src/app/checkout/guest/page.tsx)
- **Changes:**
  - Add getGuestPaymentSummaryDetails function
  - Implement logic to return details based on payment method
  - Handle EMI, COD, local payments, and card

**Step 4.2:** Update Review Step Display

- **File:** [`frontend/src/app/checkout/guest/page.tsx`](frontend/src/app/checkout/guest/page.tsx)
- **Changes:**
  - Replace basic payment method name display with detailed breakdown
  - Add EMI details section
  - Add COD details section
  - Add local payment details section
  - Update order summary to include payment fees

---

### Phase 5: Integration and Testing (Quality Assurance)

**Step 5.1:** Update Payment Submission Handler

- **File:** [`frontend/src/app/checkout/guest/page.tsx`](frontend/src/app/checkout/guest/page.tsx)
- **Changes:**
  - Update handlePaymentSubmit to save comprehensive payment details
  - Include EMI details when EMI is selected
  - Include COD details when COD is selected
  - Include local payment details when local payment is selected
  - Call saveProgress with complete payment data

**Step 5.2:** Update Order Placement Handler

- **File:** [`frontend/src/app/checkout/guest/page.tsx`](frontend/src/app/checkout/guest/page.tsx)
- **Changes:**
  - Update handlePlaceOrder to include payment details in order
  - Save review data before placing order
  - Ensure all payment details are sent to backend

**Step 5.3:** Comprehensive Testing

- **Actions:**
  - Test all payment methods
  - Test EMI plan selection
  - Test COD validation
  - Test local payment selection
  - Test review display for all payment types
  - Test order placement with all payment methods
  - Test error handling
  - Test edge cases

---

## 7. Risk Assessment

### 7.1 Technical Risks

| Risk                                                     | Probability | Impact | Mitigation Strategy                                                                  |
| -------------------------------------------------------- | ----------- | ------ | ------------------------------------------------------------------------------------ |
| Breaking existing guest checkout functionality           | Medium      | High   | Thorough testing before deployment, feature flags for gradual rollout                |
| API incompatibility between guest and logged-in checkout | Low         | Medium | Verify API endpoints support both checkout types, create wrapper functions if needed |
| State management conflicts                               | Low         | Medium | Use separate state variables for guest checkout, avoid shared state                  |
| Performance degradation with additional validation       | Low         | Low    | Implement lazy loading for payment validation, cache validation results              |
| Type definition conflicts                                | Low         | Medium | Use proper TypeScript imports, create type aliases if needed                         |

### 7.2 Business Risks

| Risk                                               | Probability | Impact | Mitigation Strategy                                                 |
| -------------------------------------------------- | ----------- | ------ | ------------------------------------------------------------------- |
| User confusion with new payment options            | Medium      | Medium | Clear UI labels and instructions, help text for each payment method |
| Increased cart abandonment due to validation       | Low         | Medium | Provide clear error messages, allow easy correction of errors       |
| Payment processing errors with new payment methods | Low         | High   | Test payment processing thoroughly, have rollback plan ready        |
| Revenue impact from payment method changes         | Low         | Medium | Monitor payment method usage, adjust as needed                      |

### 7.3 Operational Risks

| Risk                      | Probability | Impact | Mitigation Strategy                                     |
| ------------------------- | ----------- | ------ | ------------------------------------------------------- |
| Deployment issues         | Low         | High   | Use blue-green deployment, have rollback plan ready     |
| Increased support tickets | Medium      | Medium | Provide comprehensive documentation, train support team |
| Monitoring gaps           | Low         | Medium | Add logging for all new payment flows, set up alerts    |

---

## 8. Testing Strategy

### 8.1 Unit Testing

**Test Coverage Goals:**

- Payment progress bar: 90%+
- Payment method selection: 85%+
- Payment validation: 90%+
- Review system: 85%+

**Test Cases:**

#### Payment Progress Bar

- [ ] Test progress percentage calculation for each step
- [ ] Test step completion indicators
- [ ] Test step navigation (forward and backward)
- [ ] Test clickable steps when allowed
- [ ] Test disabled steps when not allowed
- [ ] Test bilingual support (English/Bangla)
- [ ] Test mobile responsive display
- [ ] Test desktop responsive display

#### Payment Method Selection

- [ ] Test all 7 payment methods are displayed
- [ ] Test payment method selection
- [ ] Test MCash payment method availability
- [ ] Test EMI plan loading
- [ ] Test EMI plan selection
- [ ] Test EMI details calculation
- [ ] Test COD validation with valid address
- [ ] Test COD validation with invalid address
- [ ] Test COD fee calculation
- [ ] Test local payment method loading
- [ ] Test local payment method selection
- [ ] Test local payment fee calculation
- [ ] Test phone number validation
- [ ] Test PIN validation

#### Payment Validation

- [ ] Test EMI validation with valid plan
- [ ] Test EMI validation with no plan selected
- [ ] Test EMI validation with amount below minimum
- [ ] Test COD validation when available
- [ ] Test COD validation when not available
- [ ] Test local payment validation with phone
- [ ] Test local payment validation without phone
- [ ] Test local payment validation with PIN
- [ ] Test local payment validation without PIN

#### Review System

- [ ] Test EMI details display
- [ ] Test COD details display
- [ ] Test local payment details display
- [ ] Test card payment details display
- [ ] Test payment fee display
- [ ] Test total amount calculation

---

### 8.2 Integration Testing

**Test Scenarios:**

#### End-to-End Checkout Flows

- [ ] Test complete guest checkout with COD payment
- [ ] Test complete guest checkout with EMI payment
- [ ] Test complete guest checkout with bKash payment
- [ ] Test complete guest checkout with Nagad payment
- [ ] Test complete guest checkout with Rocket payment
- [ ] Test complete guest checkout with MCash payment
- [ ] Test complete guest checkout with Card payment

#### State Persistence

- [ ] Test progress saving on each step
- [ ] Test progress recovery after page refresh
- [ ] Test progress recovery after navigation away
- [ ] Test session timeout handling

#### Error Handling

- [ ] Test API error handling during payment validation
- [ ] Test API error handling during progress saving
- [ ] Test API error handling during order placement
- [ ] Test network error handling
- [ ] Test timeout error handling

---

### 8.3 User Acceptance Testing (UAT)

**Test Scenarios:**

#### Usability Testing

- [ ] Test payment method selection clarity
- [ ] Test EMI plan selection ease of use
- [ ] Test COD availability indicator visibility
- [ ] Test local payment instructions clarity
- [ ] Test review summary completeness
- [ ] Test error message clarity

#### Accessibility Testing

- [ ] Test keyboard navigation
- [ ] Test screen reader compatibility
- [ ] Test color contrast
- [ ] Test focus indicators
- [ ] Test ARIA labels

#### Cross-Browser Testing

- [ ] Test on Chrome
- [ ] Test on Firefox
- [ ] Test on Safari
- [ ] Test on Edge
- [ ] Test on mobile browsers

#### Cross-Device Testing

- [ ] Test on desktop (1920x1080)
- [ ] Test on laptop (1366x768)
- [ ] Test on tablet (768x1024)
- [ ] Test on mobile (375x667)
- [ ] Test on mobile large (414x896)

---

### 8.4 Performance Testing

**Test Metrics:**

- Page load time: < 2 seconds
- Payment validation response time: < 1 second
- EMI plans loading time: < 1 second
- COD validation response time: < 1 second
- Local payment loading time: < 1 second

**Test Scenarios:**

- [ ] Test page load time with all components
- [ ] Test payment validation performance
- [ ] Test EMI plans loading performance
- [ ] Test COD validation performance
- [ ] Test local payment loading performance
- [ ] Test memory usage during checkout
- [ ] Test CPU usage during checkout

---

### 8.5 Security Testing

**Test Scenarios:**

- [ ] Test payment method selection security
- [ ] Test EMI plan selection security
- [ ] Test COD validation security
- [ ] Test local payment data security
- [ ] Test session timeout security
- [ ] Test XSS vulnerability prevention
- [ ] Test CSRF protection
- [ ] Test data encryption in transit

---

## 9. Rollback Plan

### 9.1 Rollback Triggers

**Automatic Rollback Triggers:**

- Error rate > 5% for payment validation
- Error rate > 3% for order placement
- Page load time > 5 seconds
- Checkout abandonment rate increase > 20%

**Manual Rollback Triggers:**

- Critical bugs discovered during testing
- User complaints > 10 per hour
- Payment processing failures > 1% of orders
- Security vulnerabilities discovered

### 9.2 Rollback Procedure

**Step 1:** Immediate Actions

1. Stop deployment if in progress
2. Revert to previous version using version control
3. Clear all caches (CDN, browser, server)
4. Monitor error rates and performance

**Step 2:** Communication

1. Notify development team of rollback
2. Notify support team of rollback
3. Notify stakeholders of rollback
4. Post status update to monitoring dashboard

**Step 3:** Investigation

1. Analyze error logs
2. Review test results
3. Identify root cause
4. Document findings

**Step 4:** Remediation

1. Fix identified issues
2. Update test cases
3. Perform additional testing
4. Prepare for redeployment

### 9.3 Rollback Verification

**Verification Steps:**

1. Verify guest checkout page loads correctly
2. Verify payment methods display correctly
3. Verify order placement works
4. Verify error rates return to normal
5. Verify performance metrics return to normal
6. Verify no data loss occurred

---

## 10. Success Criteria

### 10.1 Functional Requirements

- [ ] Guest checkout has 7 payment methods (including MCash)
- [ ] EMI support is fully functional for guest checkout
- [ ] COD validation is fully functional for guest checkout
- [ ] Local payment support is fully functional for guest checkout
- [ ] Review system displays detailed payment breakdown
- [ ] Payment fees are correctly calculated and displayed
- [ ] Payment validation prevents invalid orders
- [ ] Progress bar matches logged-in checkout design

### 10.2 Non-Functional Requirements

- [ ] Page load time < 2 seconds
- [ ] Payment validation response time < 1 second
- [ ] Error rate < 1% for payment validation
- [ ] Error rate < 0.5% for order placement
- [ ] Checkout abandonment rate does not increase
- [ ] All accessibility standards are met
- [ ] All security requirements are met

### 10.3 User Experience Requirements

- [ ] Payment method selection is clear and intuitive
- [ ] EMI plan selection is easy to use
- [ ] COD availability is clearly indicated
- [ ] Local payment instructions are clear
- [ ] Review summary is comprehensive
- [ ] Error messages are clear and actionable
- [ ] Checkout flow is smooth and efficient

---

## 11. Dependencies

### 11.1 External Dependencies

- **EMI API:** Existing EMI API must support guest checkout
- **COD API:** Existing COD API must support guest checkout (guest ID can be null)
- **Local Payment API:** Existing local payment API must support guest checkout
- **Backend:** Backend must support new guest checkout payment fields

### 11.2 Internal Dependencies

- **CheckoutProgress Component:** Must be updated to support guest checkout steps
- **EMI Components:** Must be compatible with guest checkout
- **COD Components:** Must be compatible with guest checkout
- **Local Payment Components:** Must be compatible with guest checkout
- **Type Definitions:** Must be updated to include guest checkout types

---

## 12. Timeline Estimate

**Note:** This is a rough estimate for planning purposes only. Actual time may vary based on team size, experience, and unforeseen issues.

| Phase                                          | Estimated Time  | Dependencies |
| ---------------------------------------------- | --------------- | ------------ |
| Phase 1: Type Definitions and State Management | 1-2 days        | None         |
| Phase 2: Payment Progress Bar                  | 0.5-1 day       | Phase 1      |
| Phase 3: Payment Method Selection              | 3-4 days        | Phase 1      |
| Phase 4: Review System                         | 1-2 days        | Phase 3      |
| Phase 5: Integration and Testing               | 2-3 days        | Phases 2-4   |
| **Total**                                      | **7.5-12 days** |              |

---

## 13. Appendices

### Appendix A: Type Definitions

#### GuestCheckoutSecurity Type

```typescript
export interface GuestCheckoutSecurity {
  isSecure: boolean;
  isHttps: boolean;
  sslCertificate: {
    valid: boolean;
    issuer: string;
    expiresAt: string;
  };
  sessionTimeout: number; // in minutes
  sessionExpiresAt: string; // ISO 8601 timestamp
  warnings: GuestSecurityWarning[];
  badges: GuestSecurityBadge[];
  compliance: GuestComplianceInfo;
}
```

#### GuestPaymentValidationResult Type

```typescript
export interface GuestPaymentValidationResult {
  isValid: boolean;
  method: string;
  details?: {
    emiDetails?: EmiDetails;
    codDetails?: CodValidationResult;
    localPaymentDetails?: LocalPaymentMethod;
  };
  errors: string[];
  warnings: string[];
  canProceed: boolean;
}
```

#### PaymentSummaryDetails Type

```typescript
export interface PaymentSummaryDetails {
  type: "card" | "cod" | "emi" | "local";
  method?: string;
  details?: {
    emiDetails?: EmiDetails;
    codDetails?: {
      codFee: number;
      deliveryDays: number;
      requiresVerification: {
        phone: boolean;
        address: boolean;
      };
    };
    localPaymentDetails?: {
      method: LocalPaymentMethod;
      paymentFee: number;
      totalAmount: number;
      phoneNumber: string;
    };
  };
}
```

---

### Appendix B: API Endpoints

#### Guest Checkout Save Progress

```
POST /guest/checkout/save
Request Body:
{
  sessionId: string,
  step: GuestCheckoutStep,
  data: Partial<GuestCheckoutData>
}
Response: GuestSession
```

#### Guest Checkout Validate Payment

```
POST /guest/checkout/validate-payment
Request Body:
{
  sessionId: string,
  method: string,
  address: GuestShippingAddress,
  amount: number
}
Response: GuestPaymentValidationResult
```

---

### Appendix C: Component Props Reference

#### CheckoutProgress Component Props (Updated)

```typescript
interface CheckoutProgressProps {
  currentStep: CheckoutStep | GuestCheckoutStep;
  completedSteps: (CheckoutStep | GuestCheckoutStep)[];
  steps?: Array<{
    step: CheckoutStep | GuestCheckoutStep;
    label: string;
    labelBn: string;
    icon: React.ReactNode;
  }>;
  onStepClick?: (step: CheckoutStep | GuestCheckoutStep) => void;
  language?: "en" | "bn";
  className?: string;
  showLabels?: boolean;
  showDescriptions?: boolean;
  clickable?: boolean;
}
```

---

## Conclusion

This specification provides a comprehensive plan to fix the Guest Checkout Payment Progress bar, Payment Method selection, and Review system to match the logged-in user implementation. By following this specification, the development team can ensure feature parity between guest and logged-in checkout experiences while maintaining code quality, performance, and security.

**Key Success Factors:**

1. Thorough testing at each phase
2. Clear communication with stakeholders
3. Proper rollback plan in place
4. Monitoring and alerting configured
5. Documentation updated throughout the process

**Next Steps:**

1. Review and approve this specification
2. Assign development team members
3. Set up development and testing environments
4. Begin Phase 1 implementation
5. Monitor progress and adjust timeline as needed

---

**Document Control**

| Version | Date       | Author                   | Changes       |
| ------- | ---------- | ------------------------ | ------------- |
| 1.0     | 2026-02-24 | System Architecture Team | Initial draft |
