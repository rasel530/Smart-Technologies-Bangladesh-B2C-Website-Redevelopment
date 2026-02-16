/**
 * Address Selection Interface UI/UX Specification
 * 
 * Date: February 12, 2026
 * Project: Smart Tech B2C Website Redevelopment
 * Version: 1.0
 * Status: Final Specification
 * 
 * This file contains the comprehensive UI/UX specification for the Address Selection
 * Interface feature to be implemented on the checkout page.
 */

import type { Address } from '@/lib/api/profile';

// ============================================================================
// SECTION 1: USER FLOW DESIGN
// ============================================================================
//
// The checkout page displays a Saved Addresses section above the shipping address form.
// Users can select from saved addresses or add new ones. Selected addresses auto-fill
// the form fields with validation.
//
// Flow Steps:
// 1. Page Load & Address Fetching
//    - User navigates to checkout page
//    - System checks authentication status
//    - System fetches user's saved addresses via AddressAPI.getAddresses()
//    - Loading state displayed while fetching
//    - Addresses grouped by type (SHIPPING/BILLING)
//    - Default address pre-selected if available
//
// 2. Address Selection
//    Option A: Selecting a Saved Address
//    - User clicks on a saved address card
//    - Selected address highlighted with blue border and checkmark
//    - Form fields auto-populate with address data
//    - Validation runs automatically
//    - User can modify any field if needed
//    - "Same address for billing" checkbox appears
//
//    Option B: Adding a New Address
//    - User clicks "Add New Address" button
//    - Modal or inline form appears
//    - User fills in address details
//    - On save, new address added to list and selected
//    - Form fields populate with new address data
//
// 3. Billing Address Selection
//    - After shipping address is selected, billing section appears
//    - "Same address for billing" checkbox defaults to checked
//    - If checked, billing form uses shipping address data
//    - If unchecked, billing address selector appears

// ============================================================================
// SECTION 2: COMPONENT ARCHITECTURE
// ============================================================================
//
// Component Hierarchy:
// src/components/checkout/
// ├── SavedAddressesSelector.tsx    [NEW - Main selector component]
// ├── AddressCard.tsx               [EXISTING - Reused with modifications]
// ├── AddressForm.tsx               [EXISTING - Reused in modal]
// ├── CheckoutAddressContext.tsx    [NEW - Optional context for state]
// ├── BillingAddressToggle.tsx      [NEW - Same address toggle]
// └── AddressPreview.tsx           [NEW - Selected address display]

// ============================================================================
// SECTION 3: TYPE DEFINITIONS
// ============================================================================

export interface ShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  district: string;
  postalCode: string;
}

export interface BillingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  district: string;
  postalCode: string;
}

export interface SavedAddress extends Address {
  createdAt: string;
  updatedAt: string;
}

export interface SavedAddressesSelectorProps {
  addresses: Address[];
  selectedAddressId: string | null;
  onSelect: (address: Address) => void;
  onAddNew: () => void;
  onEdit?: (address: Address) => void;
  onDelete?: (addressId: string) => void;
  onSetDefault?: (addressId: string) => void;
  language: 'en' | 'bn';
  addressType?: 'SHIPPING' | 'BILLING';
  isLoading?: boolean;
  error?: string | null;
  maxVisible?: number;
  className?: string;
  showActions?: boolean;
}

export interface BillingAddressToggleProps {
  isSameAsShipping: boolean;
  onToggle: (isSame: boolean) => void;
  shippingAddress: ShippingAddress;
  onSelectBillingAddress: () => void;
  language: 'en' | 'bn';
  className?: string;
  isDisabled?: boolean;
}

export interface AddressPreviewProps {
  address: ShippingAddress | Address;
  onChange: () => void;
  onEdit?: () => void;
  language: 'en' | 'bn';
  type?: 'shipping' | 'billing';
  className?: string;
  showEditButton?: boolean;
}

export interface CheckoutAddressState {
  savedAddresses: SavedAddress[];
  savedAddressesLoading: boolean;
  savedAddressesError: string | null;
  selectedShippingAddressId: string | null;
  selectedBillingAddressId: string | null;
  shippingAddress: ShippingAddress;
  billingAddress: BillingAddress;
  isSameAsShipping: boolean;
  shippingValidationErrors: Partial<ShippingAddress>;
  billingValidationErrors: Partial<BillingAddress>;
  showAddAddressModal: boolean;
  showEditAddressModal: boolean;
  editingAddress: SavedAddress | null;
}

// ============================================================================
// SECTION 4: VISUAL DESIGN SPECIFICATION
// ============================================================================
//
// Address Card States:
// | State          | Visual Treatment                  | Border Color      | Background |
// |---------------|----------------------------------|-------------------|-----------|
// | Default       | Standard card                     | Gray-300 (#D1D5DB)| White     |
// | Selected      | Blue border + checkmark          | Blue-500 (#3B82F6)| Blue-50   |
// | Hovered       | Slight shadow                    | Gray-300 -> Gray-400| White   |
// | Focused       | Focus ring                       | Blue-500 (#3B82F6)| White     |
// | Disabled      | Grayed out                       | Gray-200 (#E5E7EB)| Gray-50   |
// | Error         | Red border                       | Red-500 (#EF4444)| Red-50    |
//
// Responsive Breakpoints:
// | Breakpoint | Width  | Layout Changes                              |
// |------------|--------|---------------------------------------------|
// | sm         | 640px  | Single column, full-width cards             |
// | md         | 768px  | Side-by-side form fields                    |
// | lg         | 1024px | 2-column main layout (content + sidebar)    |
// | xl         | 1280px | Full layout, comfortable spacing             |
//
// Badge Styles:
// .badge-shipping: px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800
// .badge-billing: px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-800
// .badge-default: flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800

// ============================================================================
// SECTION 5: INTERACTION DESIGN
// ============================================================================
//
// Selection Mechanism: Clickable Cards with Visual Radio Indicator
//
// Rationale:
// - Larger click target improves usability
// - Visual consistency with existing AddressCard
// - Natural mapping to address selection
// - Easier touch targets for mobile
//
// Auto-fill Behavior:
// function mapAddressToCheckout(saved: SavedAddress): ShippingAddress {
//   return {
//     fullName: `${saved.firstName} ${saved.lastName}`,
//     phone: saved.phone || '',
//     addressLine1: saved.address,
//     addressLine2: saved.addressLine2 || '',
//     city: saved.city,
//     district: saved.district,
//     postalCode: saved.postalCode || '',
//   };
// }
//
// Edit Flow Options:
// A. Inline Editing - Pros: No context loss, faster. Cons: Complex state, less space
// B. Modal Editing - Pros: Focused attention, full form space. Cons: Context loss
// C. Navigate to Profile - Pros: Reuse existing editing. Cons: User leaves checkout
//
// Recommendation: Modal Editing with option to navigate to profile for complete editing.

// ============================================================================
// SECTION 6: ACCESSIBILITY CONSIDERATIONS
// ============================================================================
//
// Keyboard Navigation:
// - Tab sequence through address cards
// - Arrow keys within address list (Up/Down for navigation, Enter/Space to select)
// - Home/End for first/last address focus
//
// ARIA Labels and Roles:
// - role="listbox" for address list container
// - role="option" for individual address cards
// - aria-selected={isSelected} for selected state
// - aria-label with full address details for screen readers
// - Live announcements for status updates
//
// Color Contrast Requirements:
// - WCAG AA compliance (4.5:1 for normal text, 3:1 for large text)
// - All badges meet contrast requirements
//
// Accessibility Checklist:
// [x] Keyboard navigation - Tab, Shift+Tab, Arrow keys within lists
// [x] Focus indicators - Visible focus ring on all interactive elements
// [x] Screen reader labels - ARIA labels on all form fields and buttons
// [x] Live announcements - Status updates announced to screen readers
// [x] Error messages - Associated with form fields via aria-describedby
// [x] Color contrast - Minimum 4.5:1 ratio for text
// [x] Focus trap in modals - Prevent focus escaping during modal interaction
// [ ] Skip links - Add skip link for main content (future enhancement)
// [x] Form labels - Visible labels for all form fields
// [x] Required fields - Marked with asterisk and aria-required
// [x] Error identification - Error messages use role="alert"

// ============================================================================
// SECTION 7: EDGE CASES AND ERROR HANDLING
// ============================================================================
//
// Edge Cases Covered:
// 1. No saved addresses available -> Empty state with CTA
// 2. Network errors when fetching addresses -> Error state with retry
// 3. Invalid or outdated saved addresses -> Validation before selection
// 4. Form validation conflicts -> Manual edit tracking
// 5. Race conditions -> Pending operations tracking

// ============================================================================
// SECTION 8: IMPLEMENTATION FILES REFERENCE
// ============================================================================
//
// - Checkout Page: frontend/src/app/checkout/page.tsx
// - Address API: frontend/src/lib/api/profile.ts
// - Address Card: frontend/src/components/profile/AddressCard.tsx
// - Address Form: frontend/src/components/profile/AddressForm.tsx
// - Bangladesh Data: frontend/src/data/bangladesh-data.ts
// - Analysis Report: CHECKOUT_ADDRESS_ANALYSIS_REPORT.md

// ============================================================================
// SECTION 9: NEXT STEPS FOR IMPLEMENTATION
// ============================================================================
//
// 1. Create SavedAddressesSelector component
// 2. Create BillingAddressToggle component
// 3. Create AddressPreview component
// 4. Optionally create CheckoutAddressContext
// 5. Integrate components into checkout page
// 6. Add unit tests for address mapping
// 7. Test accessibility with screen readers
