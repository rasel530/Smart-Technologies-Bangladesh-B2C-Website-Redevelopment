# Address Selection Interface UI/UX Specification

**Date:** February 12, 2026  
**Project:** Smart Tech B2C Website Redevelopment  
**Version:** 1.0  
**Status:** Final Specification

---

## 1. Overview

This document provides a comprehensive UI/UX specification for the Address Selection Interface to be implemented on the checkout page. The feature allows users to select from their previously saved shipping and billing addresses during the checkout process, reducing friction and improving the user experience.

### 1.1 Design Goals

- **Usability**: Enable users to quickly select a saved address with minimal effort
- **Consistency**: Maintain visual and interaction consistency with existing address components ([`AddressCard`](frontend/src/components/profile/AddressCard.tsx), [`AddressForm`](frontend/src/components/profile/AddressForm.tsx))
- **Accessibility**: Ensure full WCAG 2.1 AA compliance with keyboard navigation and screen reader support
- **Responsiveness**: Provide an optimal experience across all device sizes
- **Error Prevention**: Implement clear validation feedback and error recovery mechanisms

### 1.2 Scope

This specification covers:
- New `SavedAddressesSelector` component for checkout
- Integration with existing checkout page ([`page.tsx`](frontend/src/app/checkout/page.tsx))
- "Same address for billing" toggle functionality
- Address selection state management
- Accessibility features and keyboard navigation

---

## 2. User Flow Design

### 2.1 Primary User Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      CHECKOUT - SHIPPING STEP                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │                    SAVED ADDRESSES SECTION                          │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │ │
│  │  │  📋 Saved Addresses (3)                            [+ Add New]   │ │ │
│  │  │  ┌─────────────────────────────────────────────────────────────┐│ │ │
│  │  │  │  ○ [Address Card - Default - Most Recent]                  ││ │ │
│  │  │  │     ⭐ Default                                                ││ │ │
│  │  │  │     John Doe • 01XXXXXXXXX                                   ││ │ │
│  │  │  │     123 Main Street, Dhaka-1205, Dhaka                       ││ │ │
│  │  │  └─────────────────────────────────────────────────────────────┘│ │ │
│  │  │  ┌─────────────────────────────────────────────────────────────┐│ │ │
│  │  │  │  ○ [Address Card 2]                                         ││ │ │
│  │  │  │     Jane Smith • 01XXXXXXXXX                                ││ │ │
│  │  │  │     456 Oak Avenue, Chittagong-4000, Chittagong            ││ │ │
│  │  │  └─────────────────────────────────────────────────────────────┘│ │ │
│  │  │  ┌─────────────────────────────────────────────────────────────┐│ │ │
│  │  │  │  ○ [Address Card 3]                                         ││ │ │
│  │  │  │     Office • 01XXXXXXXXX                                   ││ │ │
│  │  │  │     789 Corporate Tower, Sylhet-3100, Sylhet                ││ │ │
│  │  │  └─────────────────────────────────────────────────────────────┘│ │ │
│  │  │                                                                 │ │ │
│  │  │  ┌─────────────────────────────────────────────────────────────┐│ │ │
│  │  │  │  + Add New Address                                         ││ │ │
│  │  │  └─────────────────────────────────────────────────────────────┘│ │ │
│  │  └─────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                      │ │
│  │  ┌────────────────────────────────────────────────────────────────┐  │ │
│  │  │  ☐ Same address for billing                                   │  │ │
│  │  └────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                      │ │
│  │  ┌────────────────────────────────────────────────────────────────┐  │ │
│  │  │  [SELECTED ADDRESS PREVIEW - Auto-filled form fields]         │  │ │
│  │  │  Full Name: John Doe    Phone: 01XXXXXXXXX                    │  │ │
│  │  │  Address: 123 Main Street...                                   │  │ │
│  │  │  [Edit Address] [Use Different Address]                        │  │ │
│  │  └────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                      │ │
│  │                                    [Continue to Payment →]           │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Step-by-Step Flow Description

#### Step 1: Page Load & Address Fetching

1. User navigates to checkout page
2. System checks authentication status
3. System fetches user's saved addresses via [`AddressAPI.getAddresses()`](frontend/src/lib/api/profile.ts:196)
4. Loading state displayed while fetching
5. Addresses grouped by type (SHIPPING/BILLING)
6. Default address pre-selected if available

#### Step 2: Address Selection

**Option A: Selecting a Saved Address**

1. User clicks on a saved address card
2. Selected address highlighted with blue border and checkmark
3. Form fields auto-populate with address data
4. Validation runs automatically
5. User can modify any field if needed
6. "Same address for billing" checkbox appears

**Option B: Adding a New Address**

1. User clicks "Add New Address" button
2. Modal or inline form appears (see Section 2.3)
3. User fills in address details
4. On save, new address added to list and selected
5. Form fields populate with new address data

#### Step 3: Billing Address Selection

1. After shipping address is selected, billing section appears
2. "Same address for billing" checkbox defaults to checked
3. If checked, billing form uses shipping address data
4. If unchecked, billing address selector appears
5. Billing addresses can be selected from saved addresses or added new

### 2.3 Adding New Address Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     ADD NEW ADDRESS MODAL                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  ×                                                          │  │
│  │                                                              │  │
│  │  Add New Address                                 [+ Add]   │  │
│  │  ─────────────────────────────────────────────────────────  │  │
│  │                                                              │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │ Address Type:                                          │  │  │
│  │  │  (●) Shipping  ○ Billing  ☐ Set as default             │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  │                                                              │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │ First Name *      │  Last Name *                       │  │  │
│  │  │ [Input]           │  [Input]                           │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  │                                                              │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │ Phone Number                                            │  │  │
│  │  │ [+880 | 01XXXXXXXXX]                                    │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  │                                                              │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │ Address Line 1 *                                        │  │  │
│  │  │ [Street address, house number]                         │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  │                                                              │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │ Address Line 2 (Optional)                              │  │  │
│  │  │ [Apartment, suite, unit, etc.]                        │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  │                                                              │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │ City *                                                  │  │  │
│  │  │ [Input]                                                │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  │                                                              │  │
│  │  ┌─── Division * ───┐  ┌─── District * ───┐  ┌─── Upazila *┐ │  │
│  │  │ [Select ▼]       │  │ [Select ▼]       │  │ [Select ▼] │ │  │
│  │  └──────────────────┘  └──────────────────┘  └────────────┘ │  │
│  │                                                              │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │ Postal Code                                            │  │  │
│  │  │ [Input]                                                │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  │                                                              │  │
│  │  ─────────────────────────────────────────────────────────    │  │
│  │                                                              │  │
│  │  [Cancel]                                      [Save Address] │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.4 "Same Address for Both" Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                 BILLING ADDRESS SECTION                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  ☐ Same address for billing                                   │  │
│  │     (When checked, billing uses shipping address)             │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  Current Selection:                                            │  │
│  │  📍 Shipping Address: John Doe, 123 Main St, Dhaka            │  │
│  │  📍 Billing Address: Same as shipping                         │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  When user unchecks:                                                 │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  ☑ Same address for billing                                   │  │
│  │     (User can now select different billing address)           │  │
│  │                                                                      │
│  │  ┌──────────────────────────────────────────────────────────┐ │  │
│  │  │  Select from saved billing addresses:                   │ │  │
│  │  │  ○ Office Address                                        │ │  │
│  │  │  ○ Home Address                                          │ │  │
│  │  │  ○ + Add New Billing Address                            │ │  │
│  │  └──────────────────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Architecture

### 3.1 Component Hierarchy

```
src/components/checkout/
├── SavedAddressesSelector.tsx    [NEW - Main selector component]
├── AddressCard.tsx              [EXISTING - Reused with modifications]
├── AddressForm.tsx              [EXISTING - Reused in modal]
├── CheckoutAddressContext.tsx   [NEW - Optional context for state]
├── BillingAddressToggle.tsx     [NEW - Same address toggle]
└── AddressPreview.tsx          [NEW - Selected address display]

src/app/checkout/
└── page.tsx                    [MODIFIED - Integrate new components]
```

### 3.2 SavedAddressesSelector Component

#### 3.2.1 Component Location
`frontend/src/components/checkout/SavedAddressesSelector.tsx`

#### 3.2.2 Props Interface

```typescript
interface SavedAddressesSelectorProps {
  /** List of available addresses to display */
  addresses: Address[];
  
  /** Currently selected address ID */
  selectedAddressId: string | null;
  
  /** Callback when an address is selected */
  onSelect: (address: Address) => void;
  
  /** Callback when user wants to add a new address */
  onAddNew: () => void;
  
  /** Callback when user wants to edit an address */
  onEdit?: (address: Address) => void;
  
  /** Callback when user wants to delete an address */
  onDelete?: (addressId: string) => void;
  
  /** Callback when user wants to set an address as default */
  onSetDefault?: (addressId: string) => void;
  
  /** Current language preference */
  language: 'en' | 'bn';
  
  /** Address type to filter (optional) */
  addressType?: 'SHIPPING' | 'BILLING';
  
  /** Loading state */
  isLoading?: boolean;
  
  /** Error message to display */
  error?: string | null;
  
  /** Maximum number of addresses to display before scrolling */
  maxVisible?: number;
  
  /** CSS class for custom styling */
  className?: string;
  
  /** Show/Hide action buttons (edit, delete, set default) */
  showActions?: boolean;
}
```

#### 3.2.3 Internal State

```typescript
interface SavedAddressesSelectorState {
  /** Currently expanded address card (for showing full details) */
  expandedAddressId: string | null;
  
  /** Address currently being edited */
  editingAddress: Address | null;
  
  /** Hovered address ID for visual feedback */
  hoveredAddressId: string | null;
  
  /** Search/filter query */
  searchQuery: string;
  
  /** Filtered addresses based on search */
  filteredAddresses: Address[];
}
```

#### 3.2.4 Component Structure

```tsx
// SavedAddressesSelector.tsx

interface SavedAddressesSelectorProps {
  // ... props defined above
}

export const SavedAddressesSelector: React.FC<SavedAddressesSelectorProps> = ({
  addresses,
  selectedAddressId,
  onSelect,
  onAddNew,
  onEdit,
  onDelete,
  onSetDefault,
  language,
  addressType,
  isLoading = false,
  error = null,
  maxVisible = 3,
  className = '',
  showActions = false,
}) => {
  // State
  const [expandedAddressId, setExpandedAddressId] = useState<string | null>(null);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [hoveredAddressId, setHoveredAddressId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter addresses by type if provided
  const filteredAddresses = useMemo(() => {
    let result = addresses;
    if (addressType) {
      result = result.filter(addr => addr.type === addressType || addr.type === 'SHIPPING');
    }
    if (searchQuery) {
      result = result.filter(addr => 
        addr.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        addr.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        addr.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        addr.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        addr.district.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return result;
  }, [addresses, addressType, searchQuery]);
  
  // Loading state
  if (isLoading) {
    return (
      <div className={`saved-addresses-selector ${className}`}>
        <SkeletonLoader count={3} height={120} />
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className={`saved-addresses-selector ${className}`}>
        <ErrorMessage 
          message={error} 
          onRetry={() => /* refetch addresses */}
        />
      </div>
    );
  }
  
  // Empty state
  if (filteredAddresses.length === 0) {
    return (
      <div className={`saved-addresses-selector ${className}`}>
        <EmptyState 
          title={language === 'en' ? 'No saved addresses' : 'কোনো সংরক্ষিত ঠিকানা নেই'}
          description={language === 'en' 
            ? 'Add a new address to use for faster checkout'
            : 'দ্রুত চেকআউটের জন্য একটি নতুন ঠিকানা যোগ করুন'}
          actionLabel={language === 'en' ? 'Add New Address' : 'নতুন ঠিকানা যোগ করুন'}
          onAction={onAddNew}
        />
      </div>
    );
  }
  
  return (
    <div 
      className={`saved-addresses-selector ${className}`}
      role="listbox"
      aria-label={language === 'en' ? 'Saved addresses' : 'সংরক্ষিত ঠিকানা'}
    >
      {/* Header with search */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {language === 'en' ? 'Saved Addresses' : 'সংরক্ষিত ঠিকানা'}
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({filteredAddresses.length})
          </span>
        </h3>
        <button
          onClick={onAddNew}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          aria-label={language === 'en' ? 'Add new address' : 'নতুন ঠিকানা যোগ করুন'}
        >
          + {language === 'en' ? 'Add New' : 'নতুন যোগ করুন'}
        </button>
      </div>
      
      {/* Search input (optional, for many addresses) */}
      {filteredAddresses.length > 5 && (
        <div className="mb-4">
          <input
            type="text"
            placeholder={language === 'en' ? 'Search addresses...' : 'ঠিকানা খুঁজুন...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}
      
      {/* Address list */}
      <div 
        className="space-y-3"
        style={{ maxHeight: maxVisible ? `${maxVisible * 140}px` : 'none', overflowY: maxVisible ? 'auto' : 'visible' }}
      >
        {filteredAddresses.map((address) => (
          <AddressCard
            key={address.id}
            address={address}
            isSelected={address.id === selectedAddressId}
            isExpanded={address.id === expandedAddressId}
            isHovered={address.id === hoveredAddressId}
            language={language}
            showActions={showActions}
            onSelect={() => onSelect(address)}
            onEdit={() => onEdit?.(address)}
            onDelete={() => onDelete?.(address.id)}
            onSetDefault={() => onSetDefault?.(address.id)}
            onToggleExpand={() => setExpandedAddressId(
              expandedAddressId === address.id ? null : address.id
            )}
            onMouseEnter={() => setHoveredAddressId(address.id)}
            onMouseLeave={() => setHoveredAddressId(null)}
          />
        ))}
      </div>
      
      {/* Add new address button (if not in header) */}
      {filteredAddresses.length < maxVisible && (
        <button
          onClick={onAddNew}
          className="w-full mt-4 p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>{language === 'en' ? 'Add New Address' : 'নতুন ঠিকানা যোগ করুন'}</span>
        </button>
      )}
    </div>
  );
};
```

### 3.3 BillingAddressToggle Component

#### 3.3.1 Component Location
`frontend/src/components/checkout/BillingAddressToggle.tsx`

#### 3.3.2 Props Interface

```typescript
interface BillingAddressToggleProps {
  /** Current toggle state */
  isSameAsShipping: boolean;
  
  /** Callback when toggle changes */
  onToggle: (isSame: boolean) => void;
  
  /** Shipping address data (for display) */
  shippingAddress: ShippingAddress;
  
  /** Callback when user wants to select different billing address */
  onSelectBillingAddress: () => void;
  
  /** Current language */
  language: 'en' | 'bn';
  
  /** CSS class for custom styling */
  className?: string;
  
  /** Disabled state */
  isDisabled?: boolean;
}
```

#### 3.3.3 Component Implementation

```tsx
export const BillingAddressToggle: React.FC<BillingAddressToggleProps> = ({
  isSameAsShipping,
  onToggle,
  shippingAddress,
  onSelectBillingAddress,
  language,
  className = '',
  isDisabled = false,
}) => {
  return (
    <div className={`billing-address-toggle ${className}`}>
      {/* Toggle checkbox */}
      <label 
        className={`
          flex items-center gap-3 p-4 border rounded-lg cursor-pointer
          ${isSameAsShipping ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-300'}
          transition-colors
        `}
      >
        <input
          type="checkbox"
          checked={isSameAsShipping}
          onChange={(e) => onToggle(e.target.checked)}
          disabled={isDisabled}
          className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          aria-label={language === 'en' 
            ? 'Use same address for billing' 
            : 'বিলিংয়ের জন্য একই ঠিকানা ব্যবহার করুন'}
        />
        <div className="flex-1">
          <span className="font-medium text-gray-900">
            {language === 'en' ? 'Same address for billing' : 'বিলিংয়ের জন্য একই ঠিকানা'}
          </span>
          <p className="text-sm text-gray-500 mt-1">
            {language === 'en' 
              ? 'Your billing address will be the same as your shipping address'
              : 'আপনার বিলিং ঠিকানা আপনার শিপিং ঠিকানার মতোই হবে'}
          </p>
        </div>
      </label>
      
      {/* Address preview when same as shipping */}
      {isSameAsShipping && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-medium">{shippingAddress.fullName}</span>
            <span className="mx-2">•</span>
            <span>{shippingAddress.addressLine1}</span>
            {shippingAddress.addressLine2 && (
              <>
                <span className="mx-2">,</span>
                <span>{shippingAddress.addressLine2}</span>
              </>
            )}
            <span className="mx-2">,</span>
            <span>{shippingAddress.city}</span>
            <span className="mx-2">,</span>
            <span>{shippingAddress.district}</span>
            <span className="mx-2">-</span>
            <span>{shippingAddress.postalCode}</span>
          </p>
        </div>
      )}
      
      {/* Different billing address selector (when unchecked) */}
      {!isSameAsShipping && (
        <div className="mt-3">
          <BillingAddressSelector
            onSelect={onSelectBillingAddress}
            language={language}
          />
        </div>
      )}
    </div>
  );
};
```

### 3.4 AddressPreview Component

#### 3.4.1 Component Location
`frontend/src/components/checkout/AddressPreview.tsx`

#### 3.4.2 Props Interface

```typescript
interface AddressPreviewProps {
  /** Address to display */
  address: ShippingAddress | Address;
  
  /** Callback when user wants to change address */
  onChange: () => void;
  
  /** Callback when user wants to edit the address */
  onEdit?: () => void;
  
  /** Current language */
  language: 'en' | 'bn';
  
  /** Variant/Type of address */
  type?: 'shipping' | 'billing';
  
  /** CSS class for custom styling */
  className?: string;
  
  /** Show edit button */
  showEditButton?: boolean;
}
```

#### 3.4.3 Component Implementation

```tsx
export const AddressPreview: React.FC<AddressPreviewProps> = ({
  address,
  onChange,
  onEdit,
  language,
  type = 'shipping',
  className = '',
  showEditButton = true,
}) => {
  // Normalize address format for display
  const displayAddress = {
    name: 'fullName' in address ? address.fullName : `${address.firstName} ${address.lastName}`,
    phone: address.phone,
    line1: 'addressLine1' in address ? address.addressLine1 : address.address,
    line2: address.addressLine2,
    city: address.city,
    district: address.district,
    postalCode: address.postalCode,
  };
  
  return (
    <div className={`address-preview ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {type === 'shipping' ? (
            <TruckIcon className="h-5 w-5 text-blue-600" />
          ) : (
            <CreditCardIcon className="h-5 w-5 text-purple-600" />
          )}
          <h4 className="font-medium text-gray-900">
            {type === 'shipping' 
              ? (language === 'en' ? 'Shipping Address' : 'শিপিং ঠিকানা')
              : (language === 'en' ? 'Billing Address' : 'বিলিং ঠিকানা')}
          </h4>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onChange}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {language === 'en' ? 'Change' : 'পরিবর্তন করুন'}
          </button>
          {showEditButton && onEdit && (
            <button
              onClick={onEdit}
              className="text-sm text-gray-500 hover:text-gray-700 font-medium"
            >
              {language === 'en' ? 'Edit' : 'সম্পাদনা করুন'}
            </button>
          )}
        </div>
      </div>
      
      <div className="mt-3 p-4 bg-gray-50 rounded-lg">
        <p className="font-medium text-gray-900">{displayAddress.name}</p>
        <p className="text-gray-600 mt-1">{displayAddress.line1}</p>
        {displayAddress.line2 && (
          <p className="text-gray-600">{displayAddress.line2}</p>
        )}
        <p className="text-gray-600">
          {displayAddress.city}, {displayAddress.district} {displayAddress.postalCode}
        </p>
        <p className="text-gray-600 mt-1">{displayAddress.phone}</p>
      </div>
    </div>
  );
};
```

---

## 4. Visual Design Specification

### 4.1 Layout and Positioning

#### 4.1.1 Checkout Page Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              HEADER                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [Progress Steps: 1.Shipping → 2.Payment → 3.Review]                    │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────┐  ┌──────────────────────────────────────────┐ │
│  │                      │  │                                          │ │
│  │   MAIN CONTENT      │  │          ORDER SUMMARY                   │ │
│  │                      │  │                                          │ │
│  │  ┌────────────────┐  │  │  ┌────────────────────────────────────┐  │ │
│  │  │Saved Addresses │  │  │  │ Items (scrollable)                   │  │ │
│  │  │ Selector       │  │  │  │                                      │  │ │
│  │  └────────────────┘  │  │  └────────────────────────────────────┘  │ │
│  │                      │  │                                          │ │
│  │  ┌────────────────┐  │  │  ┌────────────────────────────────────┐  │ │
│  │  │ Address Form   │  │  │  │ Subtotal                            │  │ │
│  │  │ (auto-filled) │  │  │  │ Shipping                            │  │ │
│  │  └────────────────┘  │  │  │ Tax                                 │  │ │
│  │                      │  │  │ Discount                            │  │ │
│  │  ┌────────────────┐  │  │  │ ───────────────────────────         │  │ │
│  │  │Billing Toggle  │  │  │  │ Total                               │  │ │
│  │  └────────────────┘  │  │  └────────────────────────────────────┘  │ │
│  │                      │  │                                          │ │
│  │  ┌────────────────┐  │  │                                          │ │
│  │  │[Continue Btn]  │  │  │                                          │ │
│  │  └────────────────┘  │  │                                          │ │
│  │                      │  │                                          │ │
│  └──────────────────────┘  └──────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 4.1.2 Saved Address Card Design

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                                                                 ││
│  │  ○━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ││
│  │  ┃                                                             ┃│
│  │  ┃  ┌───────────────────────────────────────────────────────┐  ┃│
│  │  ┃  │ [SHIPPING] [⭐ Default]                               │  ┃│
│  │  ┃  └───────────────────────────────────────────────────────┘  ┃│
│  │  ┃                                                             ┃│
│  │  ┃  ┌───────────────────────────────────────────────────────┐  ┃│
│  │  ┃  │  📍 John Doe • 01XXXXXXXXX                             │  ┃│
│  │  ┃  │  123 Main Street, Apartment 4B                          │  ┃│
│  │  ┃  │  Dhaka - 1205, Dhaka Division                          │  ┃│
│  │  ┃  │  Postal Code: 1205                                    │  ┃│
│  │  ┃  └───────────────────────────────────────────────────────┘  ┃│
│  │  ┃                                                             ┃│
│  │  ┃  ┌───────────────────────────────────────────────────────┐  ┃│
│  │  ┃  │ [Set Default] [edit_icon] [trash_icon]               │  ┃│
│  │  ┃  └───────────────────────────────────────────────────────┘  ┃│
│  │  ┃                                                             ┃│
│  │  ○━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  Selected State (Blue border + checkmark):                          │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  ✓ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ││
│  │  ┃  ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ┃│
│  │  ┃  ┃                                                             ┃│
│  │  ┃  ┃  ┌───────────────────────────────────────────────────────┐  ┃│
│  │  ┃  ┃  │ ✅ [SHIPPING] [⭐ Default]                             │  ┃│
│  │  ┃  ┃  └───────────────────────────────────────────────────────┘  ┃│
│  │  ┃  ┃                                                             ┃│
│  │  ┃  ┃  ┌───────────────────────────────────────────────────────┐  ┃│
│  │  ┃  ┃  │  ✅ John Doe • 01XXXXXXXXX                            │  ┃│
│  │  ┃  ┃  │  123 Main Street, Apartment 4B                         │  ┃│
│  │  ┃  ┃  │  Dhaka - 1205, Dhaka Division                         │  ┃│
│  │  ┃  ┃  │  Postal Code: 1205                                    │  ┃│
│  │  ┃  ┃  └───────────────────────────────────────────────────────┘  ┃│
│  │  ┃  ┃                                                             ┃│
│  │  ┃  ┃  ┌───────────────────────────────────────────────────────┐  ┃│
│  │  ┃  ┃  │ [Set Default] [edit_icon] [trash_icon]               │  ┃│
│  │  ┃  ┃  └───────────────────────────────────────────────────────┘  ┃│
│  │  ┃  ┃                                                             ┃│
│  │  ┃  ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━      ││
│  │  └───────────────────────────────────────────────────────────────┘│
│  └───────────────────────────────────────────────────────────────────┘
```

### 4.2 Visual States

#### 4.2.1 Address Card States

| State | Visual Treatment | Border Color | Background |
|-------|------------------|--------------|------------|
| Default | Standard card | Gray-300 (#D1D5DB) | White |
| Selected | Blue border + checkmark | Blue-500 (#3B82F6) | Blue-50 |
| Hovered | Slight shadow | Gray-300 → Gray-400 | White |
| Focused (keyboard) | Focus ring | Blue-500 (#3B82F6) | White |
| Disabled | Grayed out | Gray-200 (#E5E7EB) | Gray-50 |
| Error | Red border | Red-500 (#EF4444) | Red-50 |

#### 4.2.2 Badge Styles

**Address Type Badge:**
```css
.badge-shipping {
  @apply px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800;
}

.badge-billing {
  @apply px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-800;
}
```

**Default Badge:**
```css
.badge-default {
  @apply flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800;
}
```

### 4.3 "Add New Address" Button Design

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                           │ │
│  │    [+ Add New Address]                                    │ │
│  │                                                           │ │
│  │  ┌───────────────────────────────────────────────────────┐ │ │
│  │  │                                                       │ │ │
│  │  │  Text: "Add New Address"                              │ │ │
│  │  │  Icon: PlusIcon (h-4 w-4)                             │ │ │
│  │  │  Color: text-gray-600 → text-blue-600 (hover)        │ │ │
│  │  │  Border: 2px dashed border-gray-300                    │ │ │
│  │  │  Hover: border-blue-400                                │ │ │
│  │  │  Background: transparent                                │ │ │
│  │  │  Padding: p-4                                          │ │ │
│  │  │  Radius: rounded-lg                                    │ │ │
│  │  │  Transition: border-color 200ms, color 200ms           │ │ │
│  │  │                                                       │ │ │
│  │  └───────────────────────────────────────────────────────────┘ │
│  └───────────────────────────────────────────────────────────────┘
```

### 4.4 Same Address Toggle Design

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ☐ Same address for billing                                     │
│    (checkbox unchecked state)                                    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ☑ Same address for billing                                     │
│    (checkbox checked state)                                     │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  📍 Shipping Address Preview:                              │ │
│  │     John Doe • 123 Main St, Dhaka-1205                    │ │
│  │  📍 Billing Address: Same as shipping                      │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  When user clicks to uncheck:                                    │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  ☑ Same address for billing                               │ │
│  │     (User can now select different billing address)      │ │
│  │                                                            │ │
│  │  📍 Select Billing Address:                                 │ │
│  │  ┌─────────────────────────────────────────────────────┐   │ │
│  │  │ ○ Office Address • 789 Corporate Tower, Sylhet   │   │ │
│  │  └─────────────────────────────────────────────────────┘   │ │
│  │  ┌─────────────────────────────────────────────────────┐   │ │
│  │  │ ○ Home Address • 456 Oak Avenue, Chittagong      │   │ │
│  │  └─────────────────────────────────────────────────────┘   │ │
│  │  ┌─────────────────────────────────────────────────────┐   │ │
│  │  │ ○ + Add New Billing Address                        │   │ │
│  │  └─────────────────────────────────────────────────────┘   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.5 Responsive Design Considerations

#### 4.5.1 Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| sm | 640px | Single column, full-width cards |
| md | 768px | Side-by-side form fields |
| lg | 1024px | 2-column main layout (content + sidebar) |
| xl | 1280px | Full layout, comfortable spacing |

#### 4.5.2 Mobile Layout (Default)

```
┌─────────────────────────────────────────┐
│  ┌─────────────────────────────────────┐ │
│  │ Saved Addresses (3) [+ Add New]     │ │
│  ├─────────────────────────────────────┤ │
│  │ ○ Address 1                         │ │
│  ├─────────────────────────────────────┤ │
│  │ ○ Address 2                         │ │
│  ├─────────────────────────────────────┤ │
│  │ ○ Address 3                         │ │
│  ├─────────────────────────────────────┤ │
│  │ + Add New Address                   │ │
│  └─────────────────────────────────────┘ │
│                                           │
│  ☐ Same address for billing              │
│                                           │
│  ┌─────────────────────────────────────┐ │
│  │ [Address Preview]                   │ │
│  │ [Continue to Payment →]             │ │
│  └─────────────────────────────────────┘ │
│                                           │
│  ┌─────────────────────────────────────┐ │
│  │ [Order Summary - Sticky bottom]     │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

#### 4.5.3 Desktop Layout (lg+)

```
┌────────────────────────────────────┬─────────────────────────────┐
│                                    │                             │
│  ┌────────────────────────────┐    │  ┌─────────────────────────┐ │
│  │ Saved Addresses (3)       │    │  │ Order Summary           │ │
│  │ [+ Add New]               │    │  ├─────────────────────────┤ │
│  ├────────────────────────────┤    │  │                         │ │
│  │ ○ Address 1               │    │  │ [Items]                  │ │
│  ├────────────────────────────┤    │  │                         │ │
│  │ ○ Address 2               │    │  ├─────────────────────────┤ │
│  ├────────────────────────────┤    │  │ Subtotal: ৳XXX          │ │
│  │ ○ Address 3               │    │  │ Shipping: ৳XX           │ │
│  ├────────────────────────────┤    │  │ Tax: ৳XX                │ │
│  │ + Add New Address         │    │  │ ─────────────────        │ │
│  └────────────────────────────┘    │  │ Total: ৳XXX             │ │
│                                    │  └─────────────────────────┘ │
│  ☐ Same address for billing       │                             │
│                                    │                             │
│  ┌────────────────────────────┐    │                             │
│  │ [Address Preview]          │    │                             │
│  │                            │    │                             │
│  │ [Continue to Payment →]   │    │                             │
│  └────────────────────────────┘    │                             │
│                                    │                             │
└────────────────────────────────────┴─────────────────────────────┘
```

---

## 5. Interaction Design

### 5.1 Selection Mechanisms

#### 5.1.1 Card Selection Interaction

```tsx
// AddressCard.tsx - Selection handling

interface AddressCardProps {
  isSelected: boolean;
  onSelect: () => void;
  // ... other props
}

const AddressCard: React.FC<AddressCardProps> = ({
  isSelected,
  onSelect,
  // ... other props
}) => {
  return (
    <div
      className={`
        border rounded-lg p-4 cursor-pointer transition-all duration-200
        ${isSelected 
          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
        }
      `}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      tabIndex={0}
      role="option"
      aria-selected={isSelected}
    >
      {/* Content */}
    </div>
  );
};
```

#### 5.1.2 Radio Button vs. Clickable Cards

**Decision: Clickable Cards with Visual Radio Indicator**

Rationale:
- Larger click target improves usability
- Visual consistency with existing AddressCard
- Natural mapping to address selection
- Easier touch targets for mobile

```tsx
// Visual radio indicator
<div className={`
  w-5 h-5 rounded-full border-2 flex items-center justify-center
  ${isSelected ? 'border-blue-600' : 'border-gray-300'}
`}>
  {isSelected && (
    <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
  )}
</div>
```

### 5.2 Auto-fill Behavior

#### 5.2.1 Address Selection to Form Mapping

```typescript
// Mapping saved address to checkout form

interface SavedAddress extends Address {
  // From API
  id: string;
  userId: string;
  type: 'SHIPPING' | 'BILLING';
  firstName: string;
  lastName: string;
  phone?: string;
  address: string;
  addressLine2?: string;
  city: string;
  district: string; // District ID or name
  division: string;
  upazila?: string;
  postalCode?: string;
  isDefault: boolean;
}

interface CheckoutAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  district: string;
  postalCode: string;
}

// Mapping function
function mapAddressToCheckout(saved: SavedAddress): CheckoutAddress {
  return {
    fullName: `${saved.firstName} ${saved.lastName}`,
    phone: saved.phone || '',
    addressLine1: saved.address,
    addressLine2: saved.addressLine2 || '',
    city: saved.city,
    district: saved.district, // May need ID-to-name conversion
    postalCode: saved.postalCode || '',
  };
}

// Usage
const handleAddressSelect = (address: SavedAddress) => {
  const checkoutAddress = mapAddressToCheckout(address);
  setShippingAddress(checkoutAddress);
  setSelectedAddressId(address.id);
  
  // Trigger validation after auto-fill
  validateShipping();
};
```

#### 5.2.2 Auto-fill Animation

```css
/* Smooth transition when auto-filling */

@keyframes autoFill {
  0% {
    background-color: transparent;
  }
  50% {
    background-color: rgba(59, 130, 246, 0.1);
  }
  100% {
    background-color: transparent;
  }
}

.form-field-auto-fill {
  animation: autoFill 0.5s ease-in-out;
}

/* Stagger animations for multiple fields */
.form-field:nth-child(1) { animation-delay: 0ms; }
.form-field:nth-child(2) { animation-delay: 50ms; }
.form-field:nth-child(3) { animation-delay: 100ms; }
/* ... etc */
```

### 5.3 Editing a Saved Address

#### 5.3.1 Edit Flow Options

**Option A: Inline Editing**
```
Pros: No context loss, faster
Cons: More complex state management, less space for form
```

**Option B: Modal Editing**
```
Pros: Focused attention, full form space, clear separation
Cons: Context loss, requires modal overlay
```

**Option C: Navigate to Profile**
```
Pros: Reuse existing profile editing, consistent experience
Cons: User leaves checkout flow, higher abandonment risk
```

**Recommendation: Modal Editing** with option to navigate to profile for complete editing.

#### 5.3.2 Modal Edit Implementation

```tsx
interface EditAddressModalProps {
  isOpen: boolean;
  address: Address | null;
  onClose: () => void;
  onSave: (address: Address) => void;
  language: 'en' | 'bn';
}

export const EditAddressModal: React.FC<EditAddressModalProps> = ({
  isOpen,
  address,
  onClose,
  onSave,
  language,
}) => {
  if (!isOpen || !address) return null;
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={language === 'en' ? 'Edit Address' : 'ঠিকানা সম্পাদনা'}
      size="lg"
    >
      <AddressForm
        address={address}
        onSubmit={onSave}
        onCancel={onClose}
        language={language}
      />
    </Modal>
  );
};
```

### 5.4 Deleting a Saved Address

#### 5.4.1 Delete Confirmation Flow

```tsx
const handleDeleteAddress = async (addressId: string) => {
  const confirmMessage = language === 'en'
    ? 'Are you sure you want to delete this address? This action cannot be undone.'
    : 'আপনি কি এই ঠিকানাটি মুছে ফেলতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।';
  
  if (window.confirm(confirmMessage)) {
    try {
      await AddressAPI.deleteAddress(userId, addressId);
      
      // If deleted address was selected, clear selection
      if (selectedAddressId === addressId) {
        setSelectedAddressId(null);
      }
      
      // Refresh addresses list
      await fetchAddresses();
      
      toast.success(
        language === 'en' 
          ? 'Address deleted successfully' 
          : 'ঠিকানা সফলভাবে মুছে ফেলা হয়েছে'
      );
    } catch (error) {
      toast.error(
        language === 'en'
          ? 'Failed to delete address'
          : 'ঠিকানা মুছতে ব্যর্থ হয়েছে'
      );
    }
  }
};
```

### 5.5 Setting Default Address

```tsx
const handleSetDefault = async (addressId: string) => {
  try {
    await AddressAPI.setDefaultAddress(userId, addressId);
    
    // Refresh addresses to update default status
    await fetchAddresses();
    
    toast.success(
      language === 'en'
        ? 'Default address updated'
        : 'ডিফল্ট ঠিকানা আপডেট হয়েছে'
    );
  } catch (error) {
    toast.error(
      language === 'en'
        ? 'Failed to set default address'
        : 'ডিফল্ট ঠিকানা সেট করতে ব্যর্থ হয়েছে'
    );
  }
};
```

---

## 6. State Management Design

### 6.1 Checkout Address State Structure

```typescript
// checkout-address-types.ts

interface ShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  district: string;
  postalCode: string;
}

interface BillingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  district: string;
  postalCode: string;
}

interface SavedAddress {
  id: string;
  userId: string;
  type: 'SHIPPING' | 'BILLING';
  firstName: string;
  lastName: string;
  phone?: string;
  address: string;
  addressLine2?: string;
  city: string;
  district: string;
  division: string;
  upazila?: string;
  postalCode?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CheckoutAddressState {
  // Saved addresses
  savedAddresses: SavedAddress[];
  savedAddressesLoading: boolean;
  savedAddressesError: string | null;
  
  // Selection state
  selectedShippingAddressId: string | null;
  selectedBillingAddressId: string | null;
  
  // Form state
  shippingAddress: ShippingAddress;
  billingAddress: BillingAddress;
  
  // Billing toggle
  isSameAsShipping: boolean;
  
  // Validation
  shippingValidationErrors: Partial<ShippingAddress>;
  billingValidationErrors: Partial<BillingAddress>;
  
  // UI state
  showAddAddressModal: boolean;
  showEditAddressModal: boolean;
  editingAddress: SavedAddress | null;
}
```

### 6.2 Checkout Context (Optional)

For complex checkout flows, consider creating a `CheckoutAddressContext`:

```typescript
// contexts/CheckoutAddressContext.tsx

interface CheckoutAddressContextType {
  // Saved addresses
  savedAddresses: SavedAddress[];
  isLoadingAddresses: boolean;
  addressesError: string | null;
  fetchAddresses: () => Promise<void>;
  
  // Selection
  selectedShippingId: string | null;
  selectedBillingId: string | null;
  selectShippingAddress: (address: SavedAddress) => void;
  selectBillingAddress: (address: SavedAddress) => void;
  
  // Form values
  shippingAddress: ShippingAddress;
  billingAddress: BillingAddress;
  updateShippingAddress: (address: Partial<ShippingAddress>) => void;
  updateBillingAddress: (address: Partial<BillingAddress>) => void;
  
  // Billing toggle
  isSameAsShipping: boolean;
  setIsSameAsShipping: (value: boolean) => void;
  
  // Modals
  showAddAddressModal: boolean;
  showEditAddressModal: boolean;
  editingAddress: SavedAddress | null;
  openAddAddressModal: () => void;
  closeAddAddressModal: () => void;
  openEditAddressModal: (address: SavedAddress) => void;
  closeEditAddressModal: () => void;
  
  // Actions
  addNewAddress: (address: CreateAddressRequest) => Promise<void>;
  updateAddress: (addressId: string, data: UpdateAddressRequest) => Promise<void>;
  deleteAddress: (addressId: string) => Promise<void>;
  setDefaultAddress: (addressId: string) => Promise<void>;
  
  // Validation
  validateShipping: () => boolean;
  validateBilling: () => boolean;
}

const CheckoutAddressContext = createContext<CheckoutAddressContextType | null>(null);

export const useCheckoutAddress = () => {
  const context = useContext(CheckoutAddressContext);
  if (!context) {
    throw new Error('useCheckoutAddress must be used within CheckoutAddressProvider');
  }
  return context;
};
```

### 6.3 Integration with Checkout Page

```tsx
// app/checkout/page.tsx - Updated implementation

export default function CheckoutPage() {
  const {
    savedAddresses,
    isLoadingAddresses,
    selectedShippingId,
    selectShippingAddress,
    shippingAddress,
    updateShippingAddress,
    isSameAsShipping,
    setIsSameAsShipping,
    showAddAddressModal,
    openAddAddressModal,
    closeAddAddressModal,
    // ... other state and methods
  } = useCheckoutAddress();
  
  // ... existing code
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header and Progress Steps */}
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Shipping Section */}
            {step === 'shipping' && (
              <div className="space-y-6">
                {/* Saved Addresses Selector */}
                <SavedAddressesSelector
                  addresses={savedAddresses}
                  selectedAddressId={selectedShippingId}
                  onSelect={selectShippingAddress}
                  onAddNew={openAddAddressModal}
                  language={language}
                  isLoading={isLoadingAddresses}
                  showActions={true}
                  maxVisible={4}
                />
                
                {/* Shipping Address Form */}
                <ShippingAddressForm
                  address={shippingAddress}
                  onChange={updateShippingAddress}
                  errors={shippingValidationErrors}
                />
                
                {/* Billing Toggle */}
                <BillingAddressToggle
                  isSameAsShipping={isSameAsShipping}
                  onToggle={setIsSameAsShipping}
                  shippingAddress={shippingAddress}
                  onSelectBillingAddress={() => {/* open billing selector */}}
                  language={language}
                />
                
                {/* Continue Button */}
                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleContinueToPayment}
                    disabled={!validateShipping()}
                    className="..."
                  >
                    Continue to Payment
                  </button>
                </div>
              </div>
            )}
            
            {/* Payment and Review Sections */}
            {/* ... */}
          </div>
          
          {/* Order Summary Sidebar */}
          {/* ... */}
        </div>
      </main>
      
      {/* Add Address Modal */}
      {showAddAddressModal && (
        <AddAddressModal
          isOpen={showAddAddressModal}
          onClose={closeAddAddressModal}
          onSave={handleSaveNewAddress}
          language={language}
        />
      )}
    </div>
  );
}
```

### 6.4 Local State Alternative

For simpler implementations, use local state in the checkout page:

```tsx
// Simpler approach - local state only

export default function CheckoutPage() {
  // ... existing state
  
  // Address-related state
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [savedAddressesLoading, setSavedAddressesLoading] = useState(false);
  const [savedAddressesError, setSavedAddressesError] = useState<string | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [isSameAsShipping, setIsSameAsShipping] = useState(true);
  
  // Fetch saved addresses on mount
  useEffect(() => {
    const fetchSavedAddresses = async () => {
      if (!user?.id) return;
      
      setSavedAddressesLoading(true);
      setSavedAddressesError(null);
      
      try {
        const addresses = await AddressAPI.getAddresses(user.id);
        setSavedAddresses(addresses);
        
        // Auto-select default address if available
        const defaultAddress = addresses.find(addr => addr.isDefault);
        if (defaultAddress) {
          selectAddress(defaultAddress);
        }
      } catch (error) {
        setSavedAddressesError(
          language === 'en' 
            ? 'Failed to load saved addresses' 
            : 'সংরক্ষিত ঠিকানা লোড করতে ব্যর্থ হয়েছে'
        );
      } finally {
        setSavedAddressesLoading(false);
      }
    };
    
    fetchSavedAddresses();
  }, [user?.id]);
  
  // Select address and auto-fill form
  const selectAddress = (address: SavedAddress) => {
    setSelectedAddressId(address.id);
    
    setShippingAddress({
      fullName: `${address.firstName} ${address.lastName}`,
      phone: address.phone || '',
      addressLine1: address.address,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      district: address.district,
      postalCode: address.postalCode || '',
    });
  };
  
  // ... rest of component
}
```

---

## 7. Accessibility Considerations

### 7.1 Keyboard Navigation

#### 7.1.1 Address List Keyboard Navigation

```tsx
// Using roving tabindex for address cards

const AddressCard: React.FC<AddressCardProps> = ({
  isSelected,
  onSelect,
  address,
  // ... props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        onSelect();
        break;
      case 'ArrowDown':
        e.preventDefault();
        focusNextCard();
        break;
      case 'ArrowUp':
        e.preventDefault();
        focusPreviousCard();
        break;
      case 'Home':
        e.preventDefault();
        focusFirstCard();
        break;
      case 'End':
        e.preventDefault();
        focusLastCard();
        break;
    }
  };
  
  return (
    <div
      ref={cardRef}
      tabIndex={isSelected ? 0 : -1} // Only selected or first item is focusable
      onKeyDown={handleKeyDown}
      role="option"
      aria-selected={isSelected}
      aria-label={`${address.firstName} ${address.lastName}, ${address.address}, ${address.city}`}
    >
      {/* Content */}
    </div>
  );
};
```

#### 7.1.2 Keyboard Navigation Flow

```
Tab Sequence:
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  [Tab] → Saved Addresses Section Header                             │
│  [Tab] → Address Card 1 (if selected/first)                         │
│  [Tab] → Address Card 2                                             │
│  [Tab] → Address Card 3                                             │
│  [Tab] → "Add New Address" button                                   │
│  [Tab] → "Same address for billing" checkbox                         │
│  [Tab] → Form fields (if auto-fill disabled)                        │
│  [Tab] → "Continue to Payment" button                               │
│                                                                     │
│  Arrow Keys (within address list):                                   │
│  • Arrow Down: Move focus to next address                           │
│  • Arrow Up: Move focus to previous address                         │
│  • Enter/Space: Select focused address                               │
│  • Home: Focus first address                                        │
│  • End: Focus last address                                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.2 Screen Reader Support

#### 7.2.1 ARIA Labels and Roles

```tsx
// SavedAddressesSelector

<div
  role="listbox"
  aria-label={language === 'en' ? 'Saved addresses' : 'সংরক্ষিত ঠিকানা'}
  aria-describedby="saved-addresses-help"
>
  <span id="saved-addresses-help" className="sr-only">
    {language === 'en'
      ? 'Select a saved address to auto-fill the shipping form, or enter a new address'
      : 'শিপিং ফর্মটি স্বয়ংক্রিয়ভাবে পূরণ করতে একটি সংরক্ষিত ঠিকানা নির্বাচন করুন, অথবা একটি নতুন ঠিকানা লিখুন'}
  </span>
  
  {/* Address items */}
</div>

// Individual address card

<div
  role="option"
  aria-selected={isSelected}
  aria-label={`
    ${address.firstName} ${address.lastName}, 
    ${address.address}, 
    ${address.city}, 
    ${address.district},
    ${address.isDefault ? 'Default address' : ''}
  `}
>
  {/* Content */}
</div>

// Add new address button

<button
  aria-label={language === 'en' ? 'Add new address' : 'নতুন ঠিকানা যোগ করুন'}
>
  + {language === 'en' ? 'Add New Address' : 'নতুন ঠিকানা যোগ করুন'}
</button>

// Same address toggle

<label className="flex items-center gap-3">
  <input
    type="checkbox"
    aria-describedby="same-address-help"
  />
  <span id="same-address-help" className="sr-only">
    {language === 'en'
      ? 'Check to use the same address for billing as shipping. Uncheck to enter a different billing address.'
      : 'শিপিংয়ের জন্য একই ঠিকানা ব্যবহার করতে চেক করুন। একটি ভিন্ন বিলিং ঠিকানা লিখতে আনচেক করুন।'}
  </span>
</label>
```

#### 7.2.2 Live Announcements

```tsx
// Use live region for status updates

const LiveAnnouncer: React.FC<{ message: string }> = ({ message }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
};

// Usage
const [announcement, setAnnouncement] = useState('');

const handleAddressSelect = (address: SavedAddress) => {
  selectAddress(address);
  setAnnouncement(
    language === 'en'
      ? `Selected address: ${address.firstName} ${address.lastName}, ${address.address}, ${address.city}`
      : `নির্বাচিত ঠিকানা: ${address.firstName} ${address.lastName}, ${address.address}, ${address.city}`
  );
};

return (
  <>
    <LiveAnnouncer message={announcement} />
    {/* Rest of component */}
  </>
);
```

### 7.3 Focus Management

#### 7.3.1 Focus Trap in Modals

```tsx
// Edit/Add Address Modal with focus trap

import { FocusTrap } from '@headlessui/react';

<Dialog open={isOpen} onClose={onClose}>
  <FocusTrap>
    <Dialog.Panel>
      <Dialog.Title>Edit Address</Dialog.Title>
      
      <AddressForm
        address={address}
        onSubmit={onSave}
        onCancel={onClose}
      />
      
      {/* Focus returns here after modal closes */}
    </Dialog.Panel>
  </FocusTrap>
</Dialog>
```

#### 7.3.2 Focus Restoration

```tsx
// After saving a new address, focus returns to the form

const handleSaveNewAddress = async (newAddress: SavedAddress) => {
  await addNewAddress(newAddress);
  
  // Focus back on the continue button
  continueButtonRef.current?.focus();
};
```

### 7.4 Color Contrast Requirements

```css
/* Ensure WCAG AA compliance (4.5:1 for normal text, 3:1 for large text) */

/* Address type badges */
.badge-shipping {
  background-color: #DBEAFE; /* blue-100 */
  color: #1E40AF; /* blue-800 - contrast ratio: 8.9:1 ✓ */
}

.badge-billing {
  background-color: #F3E8FF; /* purple-100 */
  color: #6B21A8; /* purple-800 - contrast ratio: 7.5:1 ✓ */
}

.badge-default {
  background-color: #DCFCE7; /* green-100 */
  color: #166534; /* green-800 - contrast ratio: 7.3:1 ✓ */
}

/* Error states */
.error-message {
  color: #DC2626; /* red-600 - contrast ratio: 4.8:1 ✓ */
}

/* Focus indicators */
.address-card:focus {
  outline: 2px solid #2563EB; /* blue-600 */
  outline-offset: 2px;
}
```

### 7.5 Accessibility Checklist

| Item | Status | Implementation |
|------|--------|----------------|
| Keyboard navigation | ✅ | Tab, Shift+Tab, Arrow keys within lists |
| Focus indicators | ✅ | Visible focus ring on all interactive elements |
| Screen reader labels | ✅ | ARIA labels on all form fields and buttons |
| Live announcements | ✅ | Status updates announced to screen readers |
| Error messages | ✅ | Associated with form fields via aria-describedby |
| Color contrast | ✅ | Minimum 4.5:1 ratio for text |
| Focus trap in modals | ✅ | Prevent focus escaping during modal interaction |
| Skip links | ☐ | Add skip link for main content |
| Form labels | ✅ | Visible labels for all form fields |
| Required fields | ✅ | Marked with asterisk and aria-required |
| Error identification | ✅ | Error messages use role="alert" |

---

## 8. Edge Cases and Error Handling

### 8.1 No Saved Addresses

```tsx
// Empty state for saved addresses

const EmptyAddressesState: React.FC<{ onAddNew: () => void; language: 'en' | 'bn' }> = ({
  onAddNew,
  language,
}) => {
  return (
    <div className="text-center py-8">
      <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <MapPin className="h-8 w-8 text-gray-400" />
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {language === 'en' ? 'No saved addresses' : 'কোনো সংরক্ষিত ঠিকানা নেই'}
      </h3>
      
      <p className="text-gray-500 mb-6 max-w-sm mx-auto">
        {language === 'en'
          ? 'Save an address to check out faster next time. For now, you can enter your address manually.'
          : 'পরবর্তীবার দ্রুত চেকআউট করতে একটি ঠিকানা সংরক্ষণ করুন। এখন আপনি আপনার ঠিকানা ম্যানুয়ালি লিখতে পারেন।'}
      </p>
      
      <button
        onClick={onAddNew}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <PlusIcon className="h-5 w-5" />
        {language === 'en' ? 'Add New Address' : 'নতুন ঠিকানা যোগ করুন'}
      </button>
    </div>
  );
};
```

### 8.2 Network Errors

```tsx
// Error handling for address fetching

interface AddressFetchError {
  message: string;
  retryable: boolean;
  onRetry?: () => void;
}

const AddressErrorState: React.FC<AddressFetchError> = ({
  message,
  retryable,
  onRetry,
}) => {
  return (
    <div className="text-center py-6">
      <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="h-6 w-6 text-red-600" />
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {message}
      </h3>
      
      {retryable && onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshIcon className="h-5 w-5" />
          {language === 'en' ? 'Try Again' : 'আবার চেষ্টা করুন'}
        </button>
      )}
      
      <p className="mt-4 text-sm text-gray-500">
        {language === 'en'
          ? 'You can also enter your address manually below.'
          : 'আপনি নিচে আপনার ঠিকানা ম্যানুয়ালিও লিখতে পারেন।'}
      </p>
    </div>
  );
};

// Usage
{
  error ? (
    <AddressErrorState
      message={error}
      retryable={true}
      onRetry={fetchAddresses}
    />
  ) : (
    <SavedAddressesSelector {...props} />
  )
}
```

### 8.3 Invalid or Outdated Addresses

```tsx
// Address validation before selection

const validateAddressForCheckout = (address: SavedAddress): AddressValidationResult => {
  const errors: string[] = [];
  
  // Check required fields
  if (!address.firstName || !address.lastName) {
    errors.push('Missing recipient name');
  }
  
  if (!address.address) {
    errors.push('Missing street address');
  }
  
  if (!address.city) {
    errors.push('Missing city');
  }
  
  if (!address.district) {
    errors.push('Missing district');
  }
  
  // Phone validation (optional but recommended)
  if (address.phone && !/^(\+880|01)(1[3-9]\d{8}|\d{9})$/.test(address.phone)) {
    errors.push('Invalid phone number format');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    severity: errors.length > 2 ? 'warning' : 'info',
  };
};

// Usage when selecting address
const handleAddressSelect = (address: SavedAddress) => {
  const validation = validateAddressForCheckout(address);
  
  if (!validation.isValid) {
    // Show warning but allow selection
    toast.warning(
      language === 'en'
        ? 'This address may be incomplete. Please review before continuing.'
        : 'এই ঠিকানা অসম্পূর্ণ হতে পারে। চালিয়ে যাওয়ার আগে অনুগ্রহ করে পর্যালোচনা করুন।',
      {
        duration: 5000,
        action: {
          label: language === 'en' ? 'Review' : 'পর্যালোচনা',
          onClick: () => setShowAddressReview(true),
        },
      }
    );
  }
  
  selectAddress(address);
};
```

### 8.4 Form Validation Conflicts

```tsx
// Handling when user manually edits an auto-filled form

const ShippingAddressForm: React.FC<{
  address: ShippingAddress;
  onChange: (updates: Partial<ShippingAddress>) => void;
  errors: Partial<ShippingAddress>;
  selectedFromSaved: boolean;
}> = ({
  address,
  onChange,
  errors,
  selectedFromSaved,
}) => {
  const [manuallyEdited, setManuallyEdited] = useState<Set<keyof ShippingAddress>>(new Set());
  
  const handleFieldChange = (field: keyof ShippingAddress, value: string) => {
    onChange({ [field]: value });
    setManuallyEdited(prev => new Set([...prev, field]));
    
    // Clear error when user starts typing
    if (errors[field]) {
      clearError(field);
    }
  };
  
  // Show warning if address was modified after selection
  const showModificationWarning = manuallyEdited.size > 0 && selectedFromSaved;
  
  return (
    <div className="space-y-4">
      {showModificationWarning && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            {language === 'en'
              ? 'You have modified a saved address. Changes will not be saved to your profile.'
              : 'আপনি একটি সংরক্ষিত ঠিকানা পরিবর্তন করেছেন। পরিবর্তনগুলি আপনার প্রোফাইলে সংরক্ষিত হবে না।'}
          </p>
        </div>
      )}
      
      {/* Form fields */}
    </div>
  );
};
```

### 8.5 Race Conditions

```tsx
// Handling concurrent address operations

const useAddressOperations = (userId: string) => {
  const [pendingOperations, setPendingOperations] = useState<Set<string>>(new Set());
  
  const executeOperation = async <T,>(
    operationId: string,
    operation: () => Promise<T>
  ): Promise<T | null> => {
    // Check if same operation is already pending
    if (pendingOperations.has(operationId)) {
      return null;
    }
    
    setPendingOperations(prev => new Set([...prev, operationId]));
    
    try {
      const result = await operation();
      return result;
    } finally {
      setPendingOperations(prev => {
        const next = new Set(prev);
        next.delete(operationId);
        return next;
      });
    }
  };
  
