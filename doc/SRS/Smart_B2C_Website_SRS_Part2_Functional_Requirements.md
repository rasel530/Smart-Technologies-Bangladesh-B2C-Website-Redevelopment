# Smart Technologies Bangladesh B2C Website Redevelopment
## Software Requirements Specification (SRS) - Part 2
### Functional Requirements: Core E-Commerce Features

**Document Version:** 2.0  
**Date:** November 29, 2024  
**Status:** Final

---

## Table of Contents - Part 2

6. [User Management & Authentication](#6-user-management--authentication)
7. [Product Catalog & Discovery](#7-product-catalog--discovery)
8. [Shopping Cart & Wishlist](#8-shopping-cart--wishlist)
9. [Checkout & Payment](#9-checkout--payment)
10. [Order Management](#10-order-management)

---

# 6. User Management & Authentication

## 6.1 User Registration

### FR-USER-001: User Registration via Email/Phone
**Priority:** P0 (Critical) 🔴  
**Module:** User Authentication  
**Status:** APPROVED

**User Story:**  
As a new customer, I want to create an account using my email or phone number so that I can place orders and track my purchases.

**Functional Requirements:**

1. **Registration Form Fields:**
   - Full Name (required, 3-50 characters)
   - Email Address (required, valid email format)
   - Phone Number (required, Bangladesh format: +880-XXXXXXXXXX)
   - Password (required, minimum 8 characters with complexity rules)
   - Confirm Password (must match password)
   - Terms and Conditions acceptance (required, checkbox)
   - Privacy Policy acceptance (required, checkbox)

2. **Password Complexity Rules:**
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
   - Optional special character
   - Cannot be common passwords (dictionary check)

3. **Validation Rules:**
   - Email must be unique (not already registered)
   - Phone number must be unique (not already registered)
   - Phone number must be valid Bangladesh format (+880)
   - Real-time validation feedback during input
   - CAPTCHA verification to prevent bots

4. **Verification Process:**
   - Email verification: Send OTP to email address
   - Phone verification: Send OTP via SMS
   - User must verify both email and phone within 24 hours
   - Ability to resend OTP (max 3 times with 2-minute cooldown)
   - OTP valid for 10 minutes

5. **Post-Registration:**
   - Send welcome email with account details
   - Auto-login after successful verification
   - Redirect to profile completion page
   - Assign unique customer ID
   - Create default delivery address placeholder

**Acceptance Criteria:**
- [ ] User can register with email and phone number
- [ ] Email format validation works correctly
- [ ] Phone number format validation works correctly
- [ ] Password strength meter displays during input
- [ ] Duplicate email/phone detection works
- [ ] CAPTCHA prevents bot registrations
- [ ] OTP sent to email within 30 seconds
- [ ] OTP sent to phone via SMS within 30 seconds
- [ ] OTP verification works correctly
- [ ] Welcome email sent after verification
- [ ] User logged in automatically after verification
- [ ] Account creation time <2 seconds (excluding OTP delivery)

**Technical Specifications:**
```typescript
interface UserRegistrationDTO {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  captchaToken: string;
}

interface VerificationOTPDTO {
  userId: string;
  otp: string;
  verificationType: 'email' | 'phone';
}
```

**Business Rules:**
- BR-USER-001: Email must be unique across all users
- BR-USER-002: Phone must be valid Bangladesh number (+880)
- BR-USER-003: Users under 18 require parental consent checkbox
- BR-USER-004: Passwords stored encrypted using bcrypt (salt rounds: 12)
- BR-USER-005: Unverified accounts deleted after 7 days

**Error Messages:**
- "This email is already registered. Please login or use a different email."
- "This phone number is already registered. Please login or use a different number."
- "Password must be at least 8 characters with uppercase, lowercase, and numbers."
- "Invalid OTP. Please check and try again. (X attempts remaining)"
- "OTP expired. Please request a new OTP."

---

### FR-USER-002: Social Login Integration
**Priority:** P1 (High)  
**Module:** User Authentication  
**Status:** APPROVED

**User Story:**  
As a customer, I want to register/login using my Google or Facebook account so that I can quickly access the website without creating a new password.

**Functional Requirements:**

1. **Supported Providers:**
   - Google OAuth 2.0
   - Facebook Login

2. **Social Login Button Placement:**
   - Registration page (above email registration form)
   - Login page (above email login form)
   - Checkout page (guest user conversion)

3. **First-Time Social Login (Registration):**
   - Fetch user data: Name, Email, Profile Picture
   - Check if email already exists (link accounts if verified)
   - Auto-fill registration form with social data
   - Still require phone number verification
   - Create account and link social provider

4. **Returning Social Login:**
   - Direct login without password
   - Session creation with 30-day remember me
   - Redirect to original intended page

5. **Account Linking:**
   - Allow users to link multiple social accounts to one profile
   - Display linked accounts in profile settings
   - Ability to unlink social accounts (must have password or another linked account)

**Acceptance Criteria:**
- [ ] Google login button displays correctly
- [ ] Facebook login button displays correctly
- [ ] Google OAuth flow works without errors
- [ ] Facebook login flow works without errors
- [ ] User data fetched correctly from social providers
- [ ] Phone verification still required for social logins
- [ ] Existing account linking works correctly
- [ ] User can unlink social accounts
- [ ] Profile picture imported from social account
- [ ] Login time <3 seconds

**Technical Specifications:**
```typescript
interface SocialLoginDTO {
  provider: 'google' | 'facebook';
  accessToken: string;
  idToken?: string;
}

interface SocialAccountLinkDTO {
  userId: string;
  provider: 'google' | 'facebook';
  providerId: string;
  email: string;
  displayName: string;
  photoURL?: string;
}
```

---

## 6.2 User Login & Session Management

### FR-USER-003: Email/Phone Login
**Priority:** P0 (Critical) 🔴  
**Module:** User Authentication  
**Status:** APPROVED

**User Story:**  
As a registered customer, I want to login using my email or phone number and password so that I can access my account and place orders.

**Functional Requirements:**

1. **Login Form Fields:**
   - Email/Phone (accepts either format)
   - Password
   - Remember Me checkbox (optional)
   - Forgot Password link

2. **Login Methods:**
   - Login with Email + Password
   - Login with Phone Number + Password
   - Auto-detect input format (email vs. phone)

3. **Remember Me Feature:**
   - If checked: Session valid for 30 days
   - If unchecked: Session valid for 24 hours
   - Secure HTTP-only cookie for session token

4. **Security Features:**
   - Account lockout after 5 failed attempts
   - Lockout duration: 15 minutes
   - CAPTCHA after 3 failed attempts
   - Send security alert email on successful login from new device

5. **Multi-Device Session Management:**
   - Allow up to 5 concurrent sessions
   - Display active sessions in account settings
   - Ability to logout from specific devices
   - "Logout from all devices" option

**Acceptance Criteria:**
- [ ] User can login with email + password
- [ ] User can login with phone + password
- [ ] Input format auto-detected correctly
- [ ] Remember me extends session to 30 days
- [ ] Account locks after 5 failed attempts
- [ ] CAPTCHA appears after 3 failed attempts
- [ ] Lockout timer works correctly (15 minutes)
- [ ] Security alert email sent on new device login
- [ ] Session management displays active devices
- [ ] User can logout from specific devices
- [ ] Login response time <1 second

**Technical Specifications:**
```typescript
interface LoginDTO {
  credential: string; // email or phone
  password: string;
  rememberMe: boolean;
  captchaToken?: string;
}

interface SessionInfo {
  sessionId: string;
  userId: string;
  deviceInfo: string;
  ipAddress: string;
  loginTime: Date;
  lastActivity: Date;
  expiresAt: Date;
}
```

**Business Rules:**
- BR-USER-006: Failed login attempts tracked per user account
- BR-USER-007: Session tokens must be JWT with RS256 signing
- BR-USER-008: Refresh token rotation on each use
- BR-USER-009: Logout invalidates both access and refresh tokens

---

### FR-USER-004: Password Reset
**Priority:** P0 (Critical) 🔴  
**Module:** User Authentication  
**Status:** APPROVED

**User Story:**  
As a customer who forgot my password, I want to reset it using my email or phone number so that I can regain access to my account.

**Functional Requirements:**

1. **Password Reset Request:**
   - Enter email or phone number
   - CAPTCHA verification
   - Send reset link via email
   - Send OTP via SMS (if phone provided)

2. **Reset Link (Email):**
   - Unique token valid for 1 hour
   - Token can only be used once
   - Clicking link opens password reset page
   - Token embedded in URL parameter

3. **Reset via OTP (SMS):**
   - 6-digit OTP sent to phone
   - OTP valid for 10 minutes
   - Maximum 3 OTP requests per hour
   - OTP verification before password reset form

4. **New Password Form:**
   - New Password field
   - Confirm Password field
   - Password strength meter
   - Submit button

5. **Security Measures:**
   - Cannot reuse last 5 passwords
   - Send confirmation email after password change
   - Force logout from all devices after reset
   - Log password change in security audit

**Acceptance Criteria:**
- [ ] User can request password reset via email
- [ ] User can request password reset via phone/OTP
- [ ] Reset email sent within 30 seconds
- [ ] Reset OTP sent within 30 seconds
- [ ] Reset link expires after 1 hour
- [ ] Reset link can only be used once
- [ ] OTP expires after 10 minutes
- [ ] Password history check prevents reuse
- [ ] Confirmation email sent after successful reset
- [ ] All sessions invalidated after password change
- [ ] Password reset page responsive on mobile

**Technical Specifications:**
```typescript
interface PasswordResetRequestDTO {
  credential: string; // email or phone
  method: 'email' | 'sms';
  captchaToken: string;
}

interface PasswordResetDTO {
  token: string; // for email method
  otp?: string; // for SMS method
  userId?: string;
  newPassword: string;
}
```

---

## 6.3 User Profile Management

### FR-USER-005: View and Edit Profile
**Priority:** P0 (Critical) 🔴  
**Module:** User Profile  
**Status:** APPROVED

**User Story:**  
As a registered customer, I want to view and update my personal information so that my account details are current and accurate.

**Functional Requirements:**

1. **Profile Information Fields:**
   - Full Name (editable)
   - Email Address (display only, change requires verification)
   - Phone Number (display only, change requires verification)
   - Date of Birth (optional, editable)
   - Gender (optional, editable: Male/Female/Other/Prefer not to say)
   - Profile Picture (optional, upload)

2. **Edit Email Address:**
   - Enter new email
   - Send verification OTP to new email
   - Verify OTP before updating
   - Keep old email for 7 days (rollback option)

3. **Edit Phone Number:**
   - Enter new phone number
   - Send verification OTP to new number
   - Verify OTP before updating
   - Keep old phone for 7 days (rollback option)

4. **Profile Picture:**
   - Upload image (JPG, PNG, max 5MB)
   - Crop and resize functionality
   - Preview before save
   - Remove picture option (revert to initials)

5. **Notification Preferences:**
   - Email notifications (on/off)
   - SMS notifications (on/off)
   - WhatsApp notifications (on/off)
   - Marketing communications (on/off)
   - Newsletter subscription (on/off)

**Acceptance Criteria:**
- [ ] User can view all profile information
- [ ] User can edit name, DOB, gender
- [ ] Email change requires OTP verification
- [ ] Phone change requires OTP verification
- [ ] Profile picture upload works correctly
- [ ] Image crop/resize functionality works
- [ ] Profile picture displays in header
- [ ] Notification preferences save correctly
- [ ] Changes saved within 1 second
- [ ] Success message displays after save

**Technical Specifications:**
```typescript
interface UserProfileDTO {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  profilePicture?: string; // URL
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
    marketing: boolean;
    newsletter: boolean;
  };
}
```

---

### FR-USER-006: Address Management
**Priority:** P0 (Critical) 🔴 🟡  
**Module:** User Profile  
**Status:** APPROVED

**User Story:**  
As a customer, I want to save multiple delivery addresses so that I can quickly select an address during checkout.

**Functional Requirements:**

1. **Address Fields (Bangladesh-Specific):** 🟡
   - Address Label (Home, Office, Other - custom)
   - Full Name (recipient name)
   - Phone Number (recipient phone)
   - Division (dropdown: Dhaka, Chattogram, etc.)
   - District (dropdown, filtered by division)
   - Upazila/Thana (dropdown, filtered by district)
   - Area/Locality (text input)
   - Address Line 1 (House/Flat number, Road, Block)
   - Address Line 2 (optional, Landmark)
   - Postal Code (if available)
   - Mark as Default Address (checkbox)

2. **Address Management Features:**
   - Add new address
   - Edit existing address
   - Delete address (with confirmation)
   - Set default address
   - Unlimited number of addresses

3. **Default Address Logic:**
   - First address automatically set as default
   - Only one default address allowed
   - Default address pre-selected at checkout
   - Changing default updates previous default

4. **Address Validation:**
   - All required fields must be filled
   - Phone number format validation
   - Division-District-Upazila cascade validation
   - Address cannot be deleted if it's the only address
   - Cannot delete address with pending orders

**Acceptance Criteria:**
- [ ] User can add new delivery address
- [ ] User can edit existing addresses
- [ ] User can delete addresses (with confirmation)
- [ ] User can set default address
- [ ] Division dropdown populated correctly
- [ ] District dropdown filtered by selected division
- [ ] Upazila dropdown filtered by selected district
- [ ] Default address badge displays correctly
- [ ] Address format displays correctly (BD format)
- [ ] Address validation works for all fields
- [ ] Cannot delete address with pending orders
- [ ] Save/update response time <1 second

**Technical Specifications:**
```typescript
interface DeliveryAddressDTO {
  addressId?: string;
  userId: string;
  label: string;
  recipientName: string;
  recipientPhone: string;
  division: string;
  district: string;
  upazila: string;
  area: string;
  addressLine1: string;
  addressLine2?: string;
  postalCode?: string;
  isDefault: boolean;
}
```

**Business Rules:**
- BR-USER-010: Users can have unlimited delivery addresses
- BR-USER-011: At least one address required to place order
- BR-USER-012: Default address auto-selected at checkout
- BR-USER-013: Cannot delete address if used in active/pending orders

---

# 7. Product Catalog & Discovery

## 7.1 Product Categories

### FR-PROD-001: Category Navigation
**Priority:** P0 (Critical) 🔴  
**Module:** Product Catalog  
**Status:** APPROVED

**User Story:**  
As a customer, I want to browse products by categories so that I can easily find the type of product I'm looking for.

**Functional Requirements:**

1. **Category Hierarchy:**
   - **Level 1:** Main Categories (e.g., Laptops, Desktops, Components, Accessories)
   - **Level 2:** Sub-categories (e.g., Gaming Laptops, Business Laptops, Ultrabooks)
   - **Level 3:** Specific Categories (e.g., Intel Gaming Laptops, AMD Gaming Laptops)
   - Support up to 3 levels deep

2. **Category Data:**
   - Category Name
   - Category Slug (URL-friendly)
   - Category Description
   - Category Banner Image
   - Category Icon
   - Product Count (dynamic)
   - Display Order
   - Active/Inactive Status

3. **Mega Menu Navigation:**
   - Display all Level 1 categories in header
   - Hover/Click shows Level 2 and Level 3 in mega menu
   - Visual icons for each category
   - Product count badge
   - Featured products preview (optional)

4. **Mobile Navigation:**
   - Hamburger menu for mobile
   - Expandable/collapsible category tree
   - Back button for sub-category navigation
   - Search bar always visible

5. **Category Page Features:**
   - Category banner with description
   - Breadcrumb navigation
   - Total product count
   - Filter sidebar (brand, price, specs)
   - Sort options
   - Product grid/list view toggle

**Acceptance Criteria:**
- [ ] Mega menu displays all categories correctly
- [ ] Category hierarchy up to 3 levels works
- [ ] Hover/click interaction smooth
- [ ] Mobile hamburger menu functions correctly
- [ ] Category pages load correctly
- [ ] Breadcrumb navigation works
- [ ] Product count accurate for each category
- [ ] Category images display correctly
- [ ] Active/inactive categories respected
- [ ] Category page load time <2 seconds

**Technical Specifications:**
```typescript
interface ProductCategoryDTO {
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  bannerImage?: string;
  icon?: string;
  parentCategoryId?: string; // null for top-level
  level: 1 | 2 | 3;
  displayOrder: number;
  productCount: number; // computed
  isActive: boolean;
}
```

---

### FR-PROD-002: Product Listing Page (PLP)
**Priority:** P0 (Critical) 🔴  
**Module:** Product Catalog  
**Status:** APPROVED

**User Story:**  
As a customer, I want to see a list of products in a category with filters and sorting options so that I can find the exact product I need.

**Functional Requirements:**

1. **Product Card Display:**
   - Product image (hover to see alternate images)
   - Product name/title
   - Brand name and logo
   - Key specifications (2-3 bullet points)
   - Price (strikethrough if on sale)
   - Discount price (highlighted if applicable)
   - Discount percentage badge
   - Stock status (In Stock / Out of Stock / Pre-Order)
   - Rating stars and review count
   - Quick view button (hover)
   - Add to Cart button
   - Add to Wishlist icon
   - Add to Compare checkbox

2. **Layout Options:**
   - Grid View: 3-4 columns (desktop), 2 columns (tablet), 1-2 columns (mobile)
   - List View: Detailed single column with more specs
   - Compact View: Higher density grid

3. **Filtering (Sidebar):**
   - **Brand:** Multi-select checkboxes with product count
   - **Price Range:** Slider with min/max input
   - **Availability:** In Stock / Pre-Order / All
   - **Rating:** 4+ stars, 3+ stars, etc.
   - **Specifications:** Dynamic based on category (RAM, Storage, Processor, etc.)
   - Applied Filters display with remove option
   - Clear All Filters button

4. **Sorting Options:**
   - Relevance (default)
   - Price: Low to High
   - Price: High to Low
   - Newest First
   - Best Selling
   - Top Rated
   - Name: A-Z / Z-A

5. **Pagination:**
   - Products per page: 12, 24, 48, 96 (user selectable)
   - Page numbers (show max 7 pages)
   - Previous/Next buttons
   - "Load More" button (infinite scroll option)
   - Jump to page input

6. **Result Count & Summary:**
   - Total products found
   - Current page products (e.g., "Showing 1-24 of 156 products")
   - Active filters summary

**Acceptance Criteria:**
- [ ] Product cards display all required information
- [ ] Grid/List/Compact views switch correctly
- [ ] Filters work correctly and update product count
- [ ] Price range slider functions properly
- [ ] Sorting changes product order correctly
- [ ] Pagination works without errors
- [ ] Product count accurate
- [ ] Filter combination logic works (AND logic)
- [ ] Page load time <2 seconds with 24 products
- [ ] Images lazy-load correctly
- [ ] Responsive on all devices

**Technical Specifications:**
```typescript
interface ProductListingQuery {
  categoryId?: string;
  brandIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  availability?: 'in_stock' | 'pre_order' | 'all';
  minRating?: number;
  specifications?: Record<string, string[]>;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

interface ProductListingResponse {
  products: ProductCardDTO[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  filters: FilterOptionsDTO;
}
```

---

### FR-PROD-003: Product Detail Page (PDP)
**Priority:** P0 (Critical) 🔴  
**Module:** Product Catalog  
**Status:** APPROVED

**User Story:**  
As a customer, I want to see complete product information including images, specifications, reviews, and pricing so that I can make an informed purchase decision.

**Functional Requirements:**

1. **Product Image Gallery:**
   - Main large image (zoomable on hover/click)
   - Thumbnail gallery (4-8 images)
   - 360-degree view (if available)
   - Product videos (if available)
   - User-uploaded images from reviews
   - Lightbox/modal for fullscreen view
   - Zoom lens functionality

2. **Product Title Section:**
   - Full product name and model number
   - Brand name with clickable logo
   - SKU/Product Code
   - Share buttons (Facebook, WhatsApp, Twitter, Copy Link)
   - Add to Wishlist button

3. **Pricing Information:**
   - Regular Price (strikethrough if discounted)
   - Discount Price (prominent, large font)
   - Discount Percentage Badge
   - "You Save: BDT X" message
   - EMI Information:
     - EMI options available (Yes/No)
     - Monthly EMI amount (starting from BDT X/month)
     - "View EMI Plans" expandable section
   - Tax information: "Price includes VAT"

4. **Availability & Stock:**
   - Stock Status Badge:
     - ✅ In Stock (Green)
     - ⚠️ Low Stock (X units remaining) (Orange)
     - ❌ Out of Stock (Red)
     - 🕒 Pre-Order (Estimated delivery date)
   - Delivery Estimate: "Delivery in 1-3 business days in Dhaka"

5. **Purchase Actions:**
   - Quantity Selector (min: 1, max: stock quantity or 10)
   - **Add to Cart** button (Primary, large)
   - **Buy Now** button (Skip cart, direct checkout)
   - **Add to Compare** button (show count if items in compare)
   - Contact for Bulk Order button (for quantities >10)

6. **Key Features/Highlights:**
   - 5-8 bullet points of key features
   - Highlighted specifications
   - Warranty information
   - Special offers/promotions

7. **Content Tabs:**
   - **Description:** Full product description with formatting
   - **Specifications:** Detailed spec table organized by categories
   - **Reviews:** Customer reviews and ratings section
   - **Questions & Answers:** Product Q&A
   - **Videos:** Embedded product demo videos
   - **Downloads:** Manuals, drivers, software downloads
   - **Warranty:** Warranty terms and registration info

8. **Trust Signals:**
   - "100% Genuine Product" badge
   - Warranty seal (1 Year / 2 Year, etc.)
   - Free Delivery badge (if applicable)
   - Easy Returns badge
   - Secure Payment badges

9. **Related Products:**
   - "You May Also Like" - Similar products
   - "Frequently Bought Together" - Bundle suggestions
   - "Customers Who Viewed This Also Viewed"
   - "Recently Viewed Products"

**Acceptance Criteria:**
- [ ] All product information displays correctly
- [ ] Image gallery with zoom works smoothly
- [ ] Add to Cart updates cart count
- [ ] Buy Now redirects to checkout
- [ ] Quantity selector enforces min/max limits
- [ ] Out of stock products cannot be added to cart
- [ ] All tabs load and display content correctly
- [ ] EMI calculator shows accurate monthly amounts
- [ ] Share buttons work correctly
- [ ] Related products load correctly
- [ ] Page load time <2 seconds
- [ ] Mobile layout responsive and usable
- [ ] Breadcrumb navigation accurate

**Technical Specifications:**
```typescript
interface ProductDetailDTO {
  productId: string;
  sku: string;
  name: string;
  brandId: string;
  brandName: string;
  categoryId: string;
  categoryName: string;
  description: string;
  keyFeatures: string[];
  
  pricing: {
    regularPrice: number;
    discountPrice?: number;
    discountPercentage?: number;
    emiAvailable: boolean;
    emiOptions?: EMIOptionDTO[];
  };
  
  availability: {
    status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'pre_order';
    quantity: number;
    estimatedDelivery?: string;
  };
  
  images: {
    mainImage: string;
    gallery: string[];
    videos?: string[];
  };
  
  specifications: SpecificationGroupDTO[];
  ratings: ProductRatingDTO;
  warranty: WarrantyInfoDTO;
}
```

---

## 7.2 Product Search

### FR-PROD-004: Search Functionality
**Priority:** P0 (Critical) 🔴  
**Module:** Product Search  
**Status:** APPROVED

**User Story:**  
As a customer, I want to search for products by name, brand, model, or specifications so that I can quickly find what I'm looking for.

**Functional Requirements:**

1. **Search Bar Features:**
   - Prominent search bar in header (all pages)
   - Placeholder text: "Search for products, brands, or models..."
   - Search icon button
   - Voice search button (mobile)
   - Clear search button ("X") when typing

2. **Search Autocomplete/Suggestions:**
   - Appears after typing 2+ characters
   - Shows matching:
     - Product names (top 5)
     - Brand names (top 3)
     - Categories (top 3)
     - Popular searches
   - Highlight matching text
   - Keyboard navigation (up/down arrows)
   - Click/Enter to select

3. **Search Indexing:**
   - Product name
   - Brand name
   - Model number
   - SKU
   - Key specifications
   - Category name
   - Product description (lower weight)

4. **Search Results Page:**
   - Same layout as Product Listing Page
   - Search query displayed: "Search results for: [query]"
   - Result count: "Found X products"
   - "Did you mean...?" suggestions for misspellings
   - No results message with suggestions:
     - Check spelling
     - Try different keywords
     - Browse categories
     - Popular products

5. **Search Filters:**
   - All standard PLP filters apply
   - Additional filter: Search in (Name/Description/SKU)
   - Sort by relevance (default for search)

6. **Search Analytics:**
   - Track all search queries
   - Track zero-result searches
   - Track popular searches
   - Track search-to-purchase conversion

**Acceptance Criteria:**
- [ ] Search bar visible on all pages
- [ ] Autocomplete appears after 2 characters
- [ ] Autocomplete suggestions relevant
- [ ] Search results accurate and relevant
- [ ] Misspelling suggestions work
- [ ] Zero results page displays suggestions
- [ ] Search response time <500ms
- [ ] Autocomplete response time <200ms
- [ ] Voice search works on mobile
- [ ] Special characters handled correctly
- [ ] Bengali search works (if implemented)

**Technical Specifications:**
```typescript
interface SearchQuery {
  query: string;
  filters?: ProductListingQuery;
  page: number;
  pageSize: number;
}

interface SearchSuggestionDTO {
  type: 'product' | 'brand' | 'category';
  text: string;
  url: string;
  image?: string;
}

interface SearchResultsDTO {
  query: string;
  suggestions: SearchSuggestionDTO[];
  products: ProductCardDTO[];
  totalCount: number;
  didYouMean?: string;
}
```

**Business Rules:**
- BR-PROD-001: Search results sorted by relevance score by default
- BR-PROD-002: Elasticsearch used for search indexing
- BR-PROD-003: Search index updated every 5 minutes
- BR-PROD-004: Inactive products excluded from search results

---

Continues in Part 3...
