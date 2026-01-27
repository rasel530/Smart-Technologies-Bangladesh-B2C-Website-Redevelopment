# Phase 4, Task 1: Product Entity Enhancement - Browser Testing Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Testing Environment Setup](#testing-environment-setup)
3. [Test Data Setup](#test-data-setup)
4. [Browser Testing Scenarios](#browser-testing-scenarios)
5. [Cross-Browser Testing](#cross-browser-testing)
6. [Responsive Design Testing](#responsive-design-testing)
7. [Performance Testing](#performance-testing)
8. [Accessibility Testing](#accessibility-testing)
9. [SEO Testing](#seo-testing)
10. [Error Handling Testing](#error-handling-testing)
11. [Integration Testing](#integration-testing)
12. [Test Checklist](#test-checklist)

---

## Prerequisites

### Required Environment Setup

#### 1. PostgreSQL Database
- Ensure PostgreSQL is installed and running
- Database should have the Phase 4, Task 1 schema migrated
- Verify database connection: `psql -U postgres -d smart_ecommerce`

#### 2. Redis Server
- Ensure Redis is installed and running
- Default port: 6379
- Verify Redis connection: `redis-cli ping` (should return PONG)

#### 3. Backend Server
- Node.js version: 18.x or higher
- Backend should be running on port 3001 (or configured port)
- Verify backend is running: Access `http://localhost:3001/api/health` or check logs

#### 4. Frontend Development Server
- Node.js version: 18.x or higher
- Next.js version: 14.x or higher
- Frontend should be running on port 3000
- Verify frontend is running: Access `http://localhost:3000`

### Required Dependencies

#### Backend Dependencies
```bash
cd backend
npm install
```

#### Frontend Dependencies
```bash
cd frontend
npm install
```

### Database Migration Steps

1. **Run database migrations:**
```bash
cd backend
npx prisma migrate deploy
```

2. **Verify migration:**
```bash
npx prisma migrate status
```

3. **Seed test data (optional):**
```bash
npm run seed
```

### Seed Data Requirements

For comprehensive testing, ensure the following data exists:

#### Minimum Test Data Requirements

**Products:**
- At least 20 active products
- 5-10 out of stock products
- 5-10 low stock products
- 5-10 featured products
- 5-10 new arrival products
- 5-10 best seller products
- Products with multiple images (3-5 images)
- Products with specifications (5-10 specs per product)
- Products with variants (2-5 variants per product)

**Brands:**
- At least 10 active brands
- 2-3 inactive brands
- Brands with website URLs
- Brands with descriptions

**Categories:**
- At least 10 active categories
- 2-3 inactive categories
- Categories with subcategories (2-3 levels deep)
- Categories with banner images
- Categories with descriptions

---

## Testing Environment Setup

### How to Start the Backend Server

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Set environment variables:**
Create or update `.env` file:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/smart_ecommerce"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-jwt-secret-here"
NEXTAUTH_SECRET="your-nextauth-secret-here"
NODE_ENV="development"
PORT=3001
```

3. **Start backend server:**
```bash
npm run dev
```

4. **Verify backend is running:**
- Check terminal for "Server running on port 3001" message
- Access `http://localhost:3001/api/health` in browser
- Check backend logs for any errors

### How to Start the Frontend Development Server

1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Set environment variables:**
Create or update `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV="development"
```

3. **Start frontend development server:**
```bash
npm run dev
```

4. **Verify frontend is running:**
- Check terminal for "Ready on http://localhost:3000" message
- Access `http://localhost:3000` in browser
- Check browser console for any errors

### How to Verify Services Are Running

#### Backend Verification
```bash
# Check if backend is responding
curl http://localhost:3001/api/health

# Expected response: {"status":"ok"}
```

#### Frontend Verification
```bash
# Check if frontend is responding
curl http://localhost:3000

# Expected response: HTML content
```

#### Database Verification
```bash
# Connect to PostgreSQL
psql -U postgres -d smart_ecommerce

# Run test query
SELECT COUNT(*) FROM "Product";

# Expected: Number of products in database
```

#### Redis Verification
```bash
# Connect to Redis
redis-cli

# Ping Redis
PING

# Expected response: PONG
```

### How to Access the Application in Browser

1. **Open web browser** (Chrome, Firefox, Safari, or Edge)
2. **Navigate to:** `http://localhost:3000`
3. **Verify home page loads** without errors
4. **Check browser console** (F12) for any JavaScript errors
5. **Check Network tab** for failed API requests

---

## Test Data Setup

### How to Create Test Products

#### Option 1: Via Database (Direct SQL)
```sql
INSERT INTO "Product" (
  id,
  sku,
  name,
  name_en,
  slug,
  short_description,
  description,
  category_id,
  brand_id,
  regular_price,
  sale_price,
  cost_price,
  stock_quantity,
  low_stock_threshold,
  status,
  is_featured,
  is_new_arrival,
  is_best_seller,
  created_at,
  updated_at
) VALUES (
  'prod-001',
  'SKU-001',
  'Test Product 1',
  'Test Product 1',
  'test-product-1',
  'Short description',
  'Full product description',
  'cat-001',
  'brand-001',
  1000.00,
  800.00,
  500.00,
  50,
  10,
  'active',
  true,
  true,
  false,
  NOW(),
  NOW()
);
```

#### Option 2: Via Backend API
```bash
# Create product via API
curl -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "sku": "SKU-002",
    "name": "Test Product 2",
    "nameEn": "Test Product 2",
    "slug": "test-product-2",
    "shortDescription": "Short description",
    "description": "Full description",
    "categoryId": "cat-001",
    "brandId": "brand-001",
    "regularPrice": 1500.00,
    "salePrice": 1200.00,
    "costPrice": 800.00,
    "stockQuantity": 100,
    "lowStockThreshold": 20,
    "status": "active",
    "isFeatured": true,
    "isNewArrival": true,
    "isBestSeller": false
  }'
```

### How to Create Test Brands

#### Option 1: Via Database
```sql
INSERT INTO "Brand" (
  id,
  name,
  slug,
  description,
  website,
  is_active,
  created_at,
  updated_at
) VALUES (
  'brand-001',
  'Test Brand 1',
  'test-brand-1',
  'Test brand description',
  'https://example.com',
  true,
  NOW(),
  NOW()
);
```

#### Option 2: Via Backend API
```bash
curl -X POST http://localhost:3001/api/brands \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "Test Brand 2",
    "slug": "test-brand-2",
    "description": "Test brand description",
    "website": "https://example.com",
    "isActive": true
  }'
```

### How to Create Test Categories

#### Option 1: Via Database
```sql
INSERT INTO "Category" (
  id,
  name,
  slug,
  description,
  is_active,
  parent_id,
  sort_order,
  created_at,
  updated_at
) VALUES (
  'cat-001',
  'Test Category 1',
  'test-category-1',
  'Test category description',
  true,
  NULL,
  1,
  NOW(),
  NOW()
);
```

#### Option 2: Via Backend API
```bash
curl -X POST http://localhost:3001/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "Test Category 2",
    "slug": "test-category-2",
    "description": "Test category description",
    "isActive": true,
    "sortOrder": 1
  }'
```

### How to Create Test Product Images

#### Option 1: Via Database
```sql
INSERT INTO "ProductImage" (
  id,
  product_id,
  url,
  alt,
  sort_order
) VALUES (
  'img-001',
  'prod-001',
  'https://example.com/images/product1.jpg',
  'Product image 1',
  0
);
```

#### Option 2: Via Backend API
```bash
curl -X POST http://localhost:3001/api/products/prod-001/images \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "url": "https://example.com/images/product2.jpg",
    "alt": "Product image 2",
    "sortOrder": 1
  }'
```

### How to Create Test Product Specifications

#### Option 1: Via Database
```sql
INSERT INTO "ProductSpecification" (
  id,
  product_id,
  name,
  value,
  sort_order
) VALUES (
  'spec-001',
  'prod-001',
  'Weight',
  '5kg',
  0
);
```

#### Option 2: Via Backend API
```bash
curl -X POST http://localhost:3001/api/products/prod-001/specifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "Dimensions",
    "value": "10x20x30 cm",
    "sortOrder": 0
  }'
```

### How to Create Test Product Variants

#### Option 1: Via Database
```sql
INSERT INTO "ProductVariant" (
  id,
  product_id,
  name,
  sku,
  price,
  compare_price,
  stock,
  is_active
) VALUES (
  'variant-001',
  'prod-001',
  'Red',
  'SKU-001-RED',
  1100.00,
  1000.00,
  25,
  true
);
```

#### Option 2: Via Backend API
```bash
curl -X POST http://localhost:3001/api/products/prod-001/variants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "Blue",
    "sku": "SKU-001-BLUE",
    "price": 1200.00,
    "comparePrice": 1000.00,
    "stock": 30,
    "isActive": true
  }'
```

---

## Browser Testing Scenarios

### A. Product Listing Page (`/products`)

#### Test URL
```
http://localhost:3000/products
```

#### 1. Verify Page Loads Correctly
- [ ] Navigate to `/products`
- [ ] Page loads without errors
- [ ] No console errors in browser
- [ ] Page displays within 3 seconds
- [ ] All sections render correctly

#### 2. Verify Product Grid Displays Products
- [ ] Product grid is visible
- [ ] Products are displayed in grid layout
- [ ] Each product card shows:
  - [ ] Product image
  - [ ] Product name
  - [ ] Brand name
  - [ ] Price (regular and sale if applicable)
  - [ ] Rating (if available)
  - [ ] Stock status badge (if applicable)

#### 3. Verify Pagination Works
- [ ] Pagination controls are visible
- [ ] Page numbers are correct
- [ ] Clicking page numbers navigates to correct page
- [ ] "Previous" button works correctly
- [ ] "Next" button works correctly
- [ ] "First" button works correctly
- [ ] "Last" button works correctly
- [ ] Jump to page functionality works
- [ ] URL updates with `?page=` parameter

#### 4. Verify Filters Work

##### Category Filter
- [ ] Category filter dropdown is visible
- [ ] Selecting a category filters products
- [ ] Only products from selected category are shown
- [ ] URL updates with `?category=` parameter
- [ ] Filter can be cleared

##### Brand Filter
- [ ] Brand filter dropdown is visible
- [ ] Selecting a brand filters products
- [ ] Only products from selected brand are shown
- [ ] URL updates with `?brand=` parameter
- [ ] Filter can be cleared

##### Price Range Filter
- [ ] Min price input is visible
- [ ] Max price input is visible
- [ ] Entering min price filters products
- [ ] Entering max price filters products
- [ ] Products within price range are shown
- [ ] URL updates with `?minPrice=` and `?maxPrice=` parameters
- [ ] Filter can be cleared

##### Stock Status Filter
- [ ] Stock status filter is visible
- [ ] "In Stock" option works
- [ ] "Out of Stock" option works
- [ ] Products with matching status are shown
- [ ] URL updates with `?status=` parameter
- [ ] Filter can be cleared

##### Feature Flags Filter
- [ ] "Featured" checkbox works
- [ ] "New Arrivals" checkbox works
- [ ] "Best Sellers" checkbox works
- [ ] Multiple feature flags can be selected
- [ ] Products with matching flags are shown
- [ ] URL updates with `?isFeatured=`, `?isNewArrival=`, `?isBestSeller=` parameters
- [ ] Filters can be cleared

##### Clear All Filters
- [ ] "Clear All" button is visible (when filters are active)
- [ ] Clicking "Clear All" resets all filters
- [ ] All products are shown after clearing
- [ ] URL parameters are removed

#### 5. Verify Sorting Works

##### Sort By Options
- [ ] Sort dropdown is visible
- [ ] "Price" sort option works
- [ ] "Name" sort option works
- [ ] "Newest" sort option works
- [ ] "Stock" sort option works
- [ ] Products are sorted correctly
- [ ] URL updates with `?sortBy=` parameter

##### Sort Order Toggle
- [ ] Sort order toggle button is visible
- [ ] "A-Z" (ascending) works
- [ ] "Z-A" (descending) works
- [ ] Products are sorted in correct order
- [ ] URL updates with `?sortOrder=` parameter

#### 6. Verify Responsive Design

##### Mobile (320px - 640px)
- [ ] Layout adjusts to single column
- [ ] Product cards stack vertically
- [ ] Filter panel is accessible via toggle
- [ ] Sort controls remain accessible
- [ ] Touch targets are large enough (44x44px minimum)

##### Tablet (641px - 1024px)
- [ ] Layout adjusts to 2-3 columns
- [ ] Product cards display in grid
- [ ] Filter panel is visible (if space permits)
- [ ] All controls remain accessible

##### Desktop (1025px+)
- [ ] Layout displays in 3-4 columns
- [ ] Product cards display in optimal grid
- [ ] Filter sidebar is visible
- [ ] All features are accessible

#### 7. Verify Product Cards Display Correctly
- [ ] Product image loads correctly
- [ ] Product image has alt text
- [ ] Product name is visible
- [ ] Brand name is visible (if applicable)
- [ ] Price displays correctly (BDT currency)
- [ ] Sale price shows with strikethrough regular price
- [ ] Discount percentage badge shows (if applicable)
- [ ] Rating stars display correctly
- [ ] Review count is visible
- [ ] Stock status badge shows (if applicable)
- [ ] "New" badge shows (if applicable)
- [ ] "Featured" badge shows (if applicable)
- [ ] "Best Seller" badge shows (if applicable)

#### 8. Verify Add to Cart Buttons Work
- [ ] Add to cart button is visible (on hover for in-stock products)
- [ ] Clicking add to cart button triggers action
- [ ] Console shows "Add to cart: [productId]" log
- [ ] Button is disabled for out-of-stock products
- [ ] Button has proper hover state

#### 9. Verify Wishlist Buttons Work
- [ ] Wishlist button is visible (on hover)
- [ ] Clicking wishlist button toggles state
- [ ] Console shows "Toggle wishlist: [productId]" log
- [ ] Heart icon fills when wishlisted
- [ ] Heart icon is empty when not wishlisted
- [ ] Button has proper hover state

#### 10. Verify Product Ratings Display
- [ ] Rating stars display for products with reviews
- [ ] Correct number of stars are filled
- [ ] Review count is visible
- [ ] Rating displays as number (e.g., 4.5)
- [ ] Empty state handles products without reviews

#### 11. Verify Product Badges Display

##### Out of Stock Badge
- [ ] Red "Out of Stock" badge shows for out-of-stock products
- [ ] Badge is positioned correctly
- [ ] Product has reduced opacity

##### Low Stock Badge
- [ ] Orange "Low Stock" badge shows for low-stock products
- [ ] Badge is positioned correctly

##### New Arrival Badge
- [ ] Green "New" badge shows for new arrivals
- [ ] Badge is positioned correctly

##### Featured Badge
- [ ] Blue "Featured" badge shows for featured products
- [ ] Badge is positioned correctly

##### Best Seller Badge
- [ ] Purple "Best Seller" badge shows for best sellers
- [ ] Badge is positioned correctly

---

### B. Product Detail Page (`/products/[slug]`)

#### Test URL
```
http://localhost:3000/products/test-product-1
```

#### 1. Verify Page Loads Correctly with Dynamic Slug
- [ ] Navigate to `/products/test-product-1`
- [ ] Page loads without errors
- [ ] No console errors in browser
- [ ] Page displays within 3 seconds
- [ ] Product data is fetched correctly
- [ ] 404 page shows for non-existent slugs

#### 2. Verify Product Information Displays Correctly
- [ ] Product name is visible
- [ ] Product description is visible
- [ ] Short description is visible
- [ ] Brand name is visible (with link)
- [ ] Category name is visible (with link)
- [ ] SKU is visible
- [ ] Stock status is visible
- [ ] Warranty information is visible (if applicable)

#### 3. Verify Image Gallery Works

##### Main Image Display
- [ ] Main product image loads correctly
- [ ] Image has proper aspect ratio
- [ ] Image alt text is correct

##### Thumbnail Navigation
- [ ] Thumbnails are visible (if multiple images)
- [ ] Clicking thumbnail changes main image
- [ ] Selected thumbnail has border highlight
- [ ] Thumbnails are in correct order

##### Navigation Arrows
- [ ] Previous arrow works
- [ ] Next arrow works
- [ ] Arrows navigate through images correctly
- [ ] Image counter updates (e.g., "1 / 5")

##### Zoom on Hover
- [ ] Image zooms on hover
- [ ] Zoom animation is smooth
- [ ] Image returns to normal on mouse leave

##### Lightbox
- [ ] Clicking main image opens lightbox
- [ ] Lightbox displays full-size image
- [ ] Lightbox has close button
- [ ] Close button works (click and ESC key)
- [ ] Navigation arrows work in lightbox
- [ ] Keyboard navigation works (arrow keys)
- [ ] Body scroll is disabled when lightbox is open

#### 4. Verify Product Specifications Display Correctly
- [ ] Specifications section is visible
- [ ] Specifications are grouped correctly
- [ ] Specification names are visible
- [ ] Specification values are visible
- [ ] Groups can be expanded/collapsed
- [ ] Expand/collapse icons work
- [ ] Empty state shows if no specifications

#### 5. Verify Product Variants Work

##### Variant Selection
- [ ] Variants are visible (if applicable)
- [ ] Variant buttons are clickable
- [ ] Selected variant has highlight
- [ ] Clicking variant updates selection
- [ ] Out-of-stock variants are disabled
- [ ] Out-of-stock badge shows on disabled variants

##### Price Updates
- [ ] Price updates when variant is selected
- [ ] Sale price shows for variant (if applicable)
- [ ] Discount percentage updates

##### Stock Information
- [ ] Stock count shows for selected variant
- [ ] "In stock" message shows
- [ ] "Low stock" message shows (if applicable)
- [ ] "Out of stock" message shows (if applicable)
- [ ] SKU updates for selected variant

#### 6. Verify Add to Cart Works with Quantity Selector

##### Quantity Selector
- [ ] Quantity input is visible
- [ ] Minus button works
- [ ] Plus button works
- [ ] Manual input works
- [ ] Quantity cannot go below 1
- [ ] Quantity respects stock limit
- [ ] Quantity updates correctly

##### Add to Cart Button
- [ ] Add to cart button is visible
- [ ] Button is disabled for out-of-stock products
- [ ] Clicking button adds product with quantity
- [ ] Console shows correct log message
- [ ] Button has proper hover and active states

#### 7. Verify Wishlist Button Works
- [ ] Wishlist button is visible
- [ ] Clicking toggles wishlist state
- [ ] Heart icon fills when added
- [ ] Heart icon is empty when removed
- [ ] Console shows correct log message

#### 8. Verify Share Buttons Work

##### Facebook Share
- [ ] Facebook button is visible
- [ ] Clicking opens Facebook share dialog
- [ ] URL is correct
- [ ] Product name is included

##### Twitter Share
- [ ] Twitter button is visible
- [ ] Clicking opens Twitter share dialog
- [ ] URL is correct
- [ ] Product name is included

##### WhatsApp Share
- [ ] WhatsApp button is visible
- [ ] Clicking opens WhatsApp share dialog
- [ ] URL is correct
- [ ] Product name is included

##### Copy Link
- [ ] Copy link button is visible
- [ ] Clicking copies URL to clipboard
- [ ] Success feedback shows (checkmark icon)
- [ ] Feedback disappears after 2 seconds

#### 9. Verify Product Reviews Section Displays
- [ ] Reviews section is visible (if reviews exist)
- [ ] Review count is visible
- [ ] Individual reviews display:
  - [ ] Reviewer name
  - [ ] Review rating (stars)
  - [ ] Review title
  - [ ] Review comment
  - [ ] Review date
  - [ ] "Verified Purchase" badge (if applicable)
- [ ] Empty state shows if no reviews

#### 10. Verify Related Products Section Displays
- [ ] Related products section is visible
- [ ] Section title is visible
- [ ] Related products display in grid
- [ ] Each related product card displays correctly
- [ ] Related products are from same category
- [ ] Current product is not included

#### 11. Verify Breadcrumb Navigation Works
- [ ] Breadcrumb is visible
- [ ] "Home" link works
- [ ] Category link works (if applicable)
- [ ] Brand link works (if applicable)
- [ ] Current product name is shown (not linked)
- [ ] Breadcrumb hierarchy is correct

#### 12. Verify SEO Metadata is Correct
- [ ] Page title includes product name
- [ ] Meta description is set
- [ ] Meta keywords are set
- [ ] Open Graph title is set
- [ ] Open Graph description is set
- [ ] Open Graph image is set (if product has image)
- [ ] Twitter Card is set

#### 13. Verify Structured Data (JSON-LD) is Present
- [ ] JSON-LD script tag is present
- [ ] `@type` is "Product"
- [ ] Product name is included
- [ ] Product image is included
- [ ] Product description is included
- [ ] Product SKU is included
- [ ] Brand information is included
- [ ] Category information is included
- [ ] Price information is included
- [ ] Availability status is included
- [ ] Aggregate rating is included (if reviews exist)

---

### C. Brand Listing Page (`/brands`)

#### Test URL
```
http://localhost:3000/brands
```

#### 1. Verify Page Loads Correctly
- [ ] Navigate to `/brands`
- [ ] Page loads without errors
- [ ] No console errors in browser
- [ ] Page displays within 3 seconds
- [ ] All sections render correctly

#### 2. Verify Brand Grid/List Displays Brands
- [ ] Brand grid/list is visible
- [ ] Brands are displayed correctly
- [ ] Each brand card shows:
  - [ ] Brand logo/image
  - [ ] Brand name
  - [ ] Brand description (if enabled)
  - [ ] Product count (if enabled)

#### 3. Verify Search Works
- [ ] Search input is visible
- [ ] Typing in search filters brands
- [ ] Search is case-insensitive
- [ ] Search matches brand names
- [ ] Search matches descriptions (if applicable)
- [ ] Clearing search shows all brands
- [ ] URL updates with `?search=` parameter

#### 4. Verify Filter by Active/Inactive Works
- [ ] "Show inactive" checkbox is visible
- [ ] Unchecked shows only active brands
- [ ] Checked shows all brands (active and inactive)
- [ ] Inactive brands have reduced opacity
- [ ] "Inactive" badge shows on inactive brands
- [ ] Filter state persists across navigation

#### 5. Verify Responsive Design

##### Mobile (320px - 640px)
- [ ] Layout adjusts to 2 columns
- [ ] Brand cards stack correctly
- [ ] Search input is accessible
- [ ] Filter controls are accessible
- [ ] Layout toggle is accessible

##### Tablet (641px - 1024px)
- [ ] Layout adjusts to 3-4 columns
- [ ] Brand cards display in grid
- [ ] All controls remain accessible

##### Desktop (1025px+)
- [ ] Layout displays in 4-5 columns
- [ ] Brand cards display in optimal grid
- [ ] All features are accessible

#### 6. Verify Brand Cards Display Correctly
- [ ] Brand logo/image loads correctly
- [ ] Fallback shows if logo fails to load
- [ ] Brand name is visible
- [ ] Brand description is visible (if enabled)
- [ ] Product count is visible (if enabled)
- [ ] "Inactive" badge shows (if applicable)
- [ ] Card has proper hover effect
- [ ] Card links to brand detail page

#### 7. Verify Brand Links Work
- [ ] Clicking brand card navigates to brand detail page
- [ ] URL is correct (`/brands/[slug]`)
- [ ] Page loads without errors
- [ ] Brand detail shows correct brand information

---

### D. Brand Detail Page (`/brands/[slug]`)

#### Test URL
```
http://localhost:3000/brands/test-brand-1
```

#### 1. Verify Page Loads Correctly with Dynamic Slug
- [ ] Navigate to `/brands/test-brand-1`
- [ ] Page loads without errors
- [ ] No console errors in browser
- [ ] Page displays within 3 seconds
- [ ] Brand data is fetched correctly
- [ ] 404 page shows for non-existent slugs

#### 2. Verify Brand Information Displays
- [ ] Brand logo loads correctly
- [ ] Fallback shows if logo fails to load
- [ ] Brand name is visible
- [ ] Brand description is visible (if applicable)
- [ ] Product count is visible
- [ ] "Inactive" badge shows (if inactive)
- [ ] Website link is visible (if applicable)

#### 3. Verify Brand Products Display Correctly
- [ ] Products section is visible
- [ ] Products display in grid
- [ ] Each product card displays correctly
- [ ] Only products from this brand are shown
- [ ] Product count matches expected

#### 4. Verify Filters and Sorting Work for Brand Products

##### Sort Control
- [ ] Sort dropdown is visible
- [ ] All sort options work (Price, Name, Newest, Stock)
- [ ] Sort order toggle works
- [ ] Products are sorted correctly
- [ ] URL updates with sort parameters

##### Filter Controls
- [ ] Price range filter works
- [ ] Stock status filter works
- [ ] Feature flags filter works
- [ ] Multiple filters can be applied
- [ ] Filters can be cleared

#### 5. Verify Pagination Works
- [ ] Pagination controls are visible
- [ ] Page numbers are correct
- [ ] Clicking page numbers navigates correctly
- [ ] Previous/Next buttons work
- [ ] Jump to page works
- [ ] URL updates with page parameter

#### 6. Verify Related Brands Section Displays
- [ ] Related brands section is visible
- [ ] Section title is visible
- [ ] Related brands display in grid
- [ ] Each brand card displays correctly
- [ ] Related brands are different from current brand
- [ ] Only active brands are shown

#### 7. Verify Breadcrumb Navigation Works
- [ ] Breadcrumb is visible
- [ ] "Home" link works
- [ ] "Brands" link works
- [ ] Current brand name is shown (not linked)
- [ ] Breadcrumb hierarchy is correct

---

### E. Category Listing Page (`/categories`)

#### Test URL
```
http://localhost:3000/categories
```

#### 1. Verify Page Loads Correctly
- [ ] Navigate to `/categories`
- [ ] Page loads without errors
- [ ] No console errors in browser
- [ ] Page displays within 3 seconds
- [ ] All sections render correctly

#### 2. Verify Category Grid/Tree Displays Categories
- [ ] Category grid/tree is visible
- [ ] Categories are displayed correctly
- [ ] Each category card shows:
  - [ ] Category image/icon
  - [ ] Category name
  - [ ] Category description (if enabled)
  - [ ] Product count (if enabled)
  - [ ] Subcategory count (if enabled)

#### 3. Verify Search Works
- [ ] Search input is visible
- [ ] Typing in search filters categories
- [ ] Search is case-insensitive
- [ ] Search matches category names
- [ ] Search matches descriptions (if applicable)
- [ ] Clearing search shows all categories
- [ ] URL updates with `?search=` parameter

#### 4. Verify Filter by Active/Inactive Works
- [ ] "Show inactive" checkbox is visible
- [ ] Unchecked shows only active categories
- [ ] Checked shows all categories (active and inactive)
- [ ] Inactive categories have reduced opacity
- [ ] "Inactive" badge shows on inactive categories
- [ ] Filter state persists across navigation

#### 5. Verify Grid/Tree View Toggle Works
- [ ] Grid view button is visible
- [ ] Tree view button is visible
- [ ] Clicking grid switches to grid view
- [ ] Clicking tree switches to tree view
- [ ] Active button has highlight
- [ ] View preference persists

#### 6. Verify Responsive Design

##### Mobile (320px - 640px)
- [ ] Layout adjusts to 1 column
- [ ] Category cards stack correctly
- [ ] Tree view is accessible
- [ ] Search input is accessible
- [ ] Filter controls are accessible

##### Tablet (641px - 1024px)
- [ ] Layout adjusts to 2-3 columns
- [ ] Category cards display in grid
- [ ] All controls remain accessible

##### Desktop (1025px+)
- [ ] Layout displays in 3-4 columns
- [ ] Category cards display in optimal grid
- [ ] All features are accessible

#### 7. Verify Category Cards Display Correctly
- [ ] Category image/icon loads correctly
- [ ] Fallback shows if image fails to load
- [ ] Category name is visible
- [ ] Category description is visible (if enabled)
- [ ] Product count is visible (if enabled)
- [ ] Subcategory count is visible (if enabled)
- [ ] "Inactive" badge shows (if applicable)
- [ ] Card has proper hover effect
- [ ] Card links to category detail page

#### 8. Verify Category Links Work
- [ ] Clicking category card navigates to category detail page
- [ ] URL is correct (`/categories/[slug]`)
- [ ] Page loads without errors
- [ ] Category detail shows correct category information

---

### F. Category Detail Page (`/categories/[slug]`)

#### Test URL
```
http://localhost:3000/categories/test-category-1
```

#### 1. Verify Page Loads Correctly with Dynamic Slug
- [ ] Navigate to `/categories/test-category-1`
- [ ] Page loads without errors
- [ ] No console errors in browser
- [ ] Page displays within 3 seconds
- [ ] Category data is fetched correctly
- [ ] 404 page shows for non-existent slugs

#### 2. Verify Category Information Displays
- [ ] Category banner image loads (if applicable)
- [ ] Category name is visible
- [ ] Category description is visible (if applicable)
- [ ] Category name is overlaid on banner
- [ ] Banner has gradient overlay

#### 3. Verify Subcategories Display
- [ ] Subcategories section is visible (if exist)
- [ ] Section title is visible
- [ ] Subcategories display in grid
- [ ] Each subcategory card displays correctly
- [ ] Subcategories are from current category
- [ ] Subcategory count matches expected

#### 4. Verify Category Products Display Correctly
- [ ] Products section is visible
- [ ] Products display in grid
- [ ] Each product card displays correctly
- [ ] Only products from this category are shown
- [ ] Product count matches expected

#### 5. Verify Filters and Sorting Work for Category Products

##### Sort Control
- [ ] Sort dropdown is visible
- [ ] All sort options work (Price, Name, Newest, Stock)
- [ ] Sort order toggle works
- [ ] Products are sorted correctly
- [ ] URL updates with sort parameters

##### Filter Controls
- [ ] Price range filter works
- [ ] Stock status filter works
- [ ] Feature flags filter works
- [ ] Multiple filters can be applied
- [ ] Filters can be cleared

#### 6. Verify Pagination Works
- [ ] Pagination controls are visible
- [ ] Page numbers are correct
- [ ] Clicking page numbers navigates correctly
- [ ] Previous/Next buttons work
- [ ] Jump to page works
- [ ] URL updates with page parameter

#### 7. Verify Related Categories Section Displays
- [ ] Related categories section is visible
- [ ] Section title is visible
- [ ] Related categories display in grid
- [ ] Each category card displays correctly
- [ ] Related categories are at same level
- [ ] Current category is not included

#### 8. Verify Breadcrumb Navigation Works
- [ ] Breadcrumb is visible
- [ ] "Home" link works
- [ ] "Categories" link works
- [ ] Current category name is shown (not linked)
- [ ] Breadcrumb hierarchy is correct

---

### G. Home Page (`/`)

#### Test URL
```
http://localhost:3000/
```

#### 1. Verify Page Loads Correctly
- [ ] Navigate to `/`
- [ ] Page loads without errors
- [ ] No console errors in browser
- [ ] Page displays within 3 seconds
- [ ] All sections render correctly

#### 2. Verify Hero Section Displays
- [ ] Hero section is visible
- [ ] Background gradient is visible
- [ ] Main heading is visible
- [ ] Subheading is visible
- [ ] "Shop Now" button is visible
- [ ] "Browse Categories" button is visible
- [ ] Buttons have proper hover states

#### 3. Verify Featured Products Section Displays
- [ ] Section is visible (if featured products exist)
- [ ] Section title is visible
- [ ] "View All" link is visible
- [ ] Products display in grid
- [ ] Each product card displays correctly
- [ ] Only featured products are shown
- [ ] Link navigates to products page with featured filter

#### 4. Verify New Arrivals Section Displays
- [ ] Section is visible (if new arrivals exist)
- [ ] Section title is visible
- [ ] "View All" link is visible
- [ ] Products display in grid
- [ ] Each product card displays correctly
- [ ] Only new arrivals are shown
- [ ] Link navigates to products page with new arrival filter

#### 5. Verify Best Sellers Section Displays
- [ ] Section is visible (if best sellers exist)
- [ ] Section title is visible
- [ ] "View All" link is visible
- [ ] Products display in grid
- [ ] Each product card displays correctly
- [ ] Only best sellers are shown
- [ ] Link navigates to products page with best seller filter

#### 6. Verify Popular Brands Section Displays
- [ ] Section is visible (if brands exist)
- [ ] Section title is visible
- [ ] "View All Brands" link is visible
- [ ] Brands display in grid
- [ ] Each brand card displays correctly
- [ ] Only first 6 brands are shown
- [ ] Link navigates to brands page

#### 7. Verify Popular Categories Section Displays
- [ ] Section is visible (if categories exist)
- [ ] Section title is visible
- [ ] "View All Categories" link is visible
- [ ] Categories display in grid
- [ ] Each category card displays correctly
- [ ] Only first 8 categories are shown
- [ ] Link navigates to categories page

#### 8. Verify Features Section Displays
- [ ] Features section is visible
- [ ] Three feature cards are visible
- [ ] Each feature shows:
  - [ ] Icon
  - [ ] Title
  - [ ] Description
- [ ] Icons are properly styled
- [ ] Cards have proper hover states

#### 9. Verify CTA Section Displays
- [ ] CTA section is visible
- [ ] Background gradient is visible
- [ ] Heading is visible
- [ ] Subheading is visible
- [ ] "Browse All Products" button is visible
- [ ] Button has proper hover state

#### 10. Verify All Links Work
- [ ] "Shop Now" button navigates to `/products`
- [ ] "Browse Categories" button navigates to `/categories`
- [ ] "View All" links work correctly
- [ ] "Browse All Products" button navigates to `/products`
- [ ] All links open in same tab
- [ ] No broken links

#### 11. Verify Responsive Design

##### Mobile (320px - 640px)
- [ ] Hero section adjusts to single column
- [ ] Feature cards stack vertically
- [ ] Product grids show 1 column
- [ ] Brand/category grids show 2 columns
- [ ] All buttons remain accessible
- [ ] Touch targets are large enough

##### Tablet (641px - 1024px)
- [ ] Hero section adjusts layout
- [ ] Feature cards display in grid
- [ ] Product grids show 2-3 columns
- [ ] Brand/category grids show 3-4 columns
- [ ] All features remain accessible

##### Desktop (1025px+)
- [ ] Hero section displays optimally
- [ ] Feature cards display in 3 columns
- [ ] Product grids show 4 columns
- [ ] Brand/category grids show 4-6 columns
- [ ] All features are accessible

---

## Cross-Browser Testing

### Chrome
- [ ] All pages load correctly
- [ ] All features work as expected
- [ ] No console errors
- [ ] Layout displays correctly
- [ ] Animations play smoothly

### Firefox
- [ ] All pages load correctly
- [ ] All features work as expected
- [ ] No console errors
- [ ] Layout displays correctly
- [ ] Animations play smoothly

### Safari
- [ ] All pages load correctly
- [ ] All features work as expected
- [ ] No console errors
- [ ] Layout displays correctly
- [ ] Animations play smoothly

### Edge
- [ ] All pages load correctly
- [ ] All features work as expected
- [ ] No console errors
- [ ] Layout displays correctly
- [ ] Animations play smoothly

### Mobile Browsers
#### Chrome Mobile
- [ ] All pages load correctly
- [ ] All features work as expected
- [ ] Touch interactions work correctly
- [ ] Layout displays correctly

#### Safari Mobile
- [ ] All pages load correctly
- [ ] All features work as expected
- [ ] Touch interactions work correctly
- [ ] Layout displays correctly

---

## Responsive Design Testing

### Mobile (320px - 640px)
- [ ] Layout uses single column
- [ ] Text is readable (16px minimum)
- [ ] Touch targets are 44x44px minimum
- [ ] Horizontal scrolling is minimal
- [ ] Images scale appropriately
- [ ] Navigation is accessible
- [ ] Filter panel is accessible via toggle
- [ ] All buttons are clickable

### Tablet (641px - 1024px)
- [ ] Layout uses 2-3 columns
- [ ] Grid layouts work correctly
- [ ] Images scale appropriately
- [ ] Navigation is accessible
- [ ] All features are accessible
- [ ] No horizontal scrolling issues

### Desktop (1025px+)
- [ ] Layout uses 3-4 columns
- [ ] Grid layouts work correctly
- [ ] Images display at optimal size
- [ ] All features are accessible
- [ ] No layout issues

### Test with DevTools Device Emulation

1. **Open Chrome DevTools** (F12)
2. **Click Device Toolbar** icon (or press Ctrl+Shift+M)
3. **Select device:**
   - iPhone SE (375x667)
   - iPhone 12 Pro (390x844)
   - iPad (768x1024)
   - iPad Pro (1024x1366)
   - Desktop (1920x1080)
4. **Test all features** on each device size
5. **Verify:**
   - [ ] Layout adjusts correctly
   - [ ] No horizontal scrolling
   - [ ] All features are accessible
   - [ ] Touch targets are large enough (mobile)

---

## Performance Testing

### Page Load Times
- [ ] Home page loads in < 2 seconds
- [ ] Products listing page loads in < 2 seconds
- [ ] Product detail page loads in < 2 seconds
- [ ] Brands listing page loads in < 2 seconds
- [ ] Brand detail page loads in < 2 seconds
- [ ] Categories listing page loads in < 2 seconds
- [ ] Category detail page loads in < 2 seconds

### Image Loading Performance
- [ ] Product images load progressively
- [ ] Lazy loading works for below-fold images
- [ ] Images are optimized (WebP format preferred)
- [ ] Image sizes are appropriate for display
- [ ] No layout shift during image loading

### API Response Times
- [ ] Product list API responds in < 500ms
- [ ] Product detail API responds in < 500ms
- [ ] Brand list API responds in < 500ms
- [ ] Brand detail API responds in < 500ms
- [ ] Category list API responds in < 500ms
- [ ] Category detail API responds in < 500ms
- [ ] No API timeout errors

### Lighthouse Scores

#### Performance
- [ ] Score is 90+ (green)
- [ ] First Contentful Paint is < 1.8s
- [ ] Largest Contentful Paint is < 2.5s
- [ ] Time to Interactive is < 3.8s

#### Accessibility
- [ ] Score is 90+ (green)
- [ ] Color contrast is sufficient
- [ ] ARIA labels are present
- [ ] Keyboard navigation works

#### Best Practices
- [ ] Score is 90+ (green)
- [ ] HTTPS is used (production)
- [ ] Images have alt text
- [ ] Links have descriptive text

#### SEO
- [ ] Score is 90+ (green)
- [ ] Meta tags are present
- [ ] Structured data is valid
- [ ] Canonical URLs are set

---

## Accessibility Testing

### Keyboard Navigation
- [ ] Tab key navigates through interactive elements
- [ ] Focus indicator is visible
- [ ] Enter/Space keys activate buttons
- [ ] Arrow keys navigate lists
- [ ] Escape key closes modals
- [ ] No keyboard traps

### Screen Reader Compatibility
- [ ] Images have alt text
- [ ] Form inputs have labels
- [ ] Buttons have accessible names
- [ ] Links have descriptive text
- [ ] ARIA roles are correct
- [ ] ARIA labels are present

### ARIA Labels
- [ ] All form inputs have aria-label or associated label
- [ ] All buttons have aria-label (if icon-only)
- [ ] Modals have role="dialog"
- [ ] Navigation landmarks are present
- [ ] Live regions are used appropriately

### Focus Indicators
- [ ] Focus outline is visible
- [ ] Focus order is logical
- [ ] Focus doesn't get lost
- [ ] Focus returns to trigger element after modal close

### Color Contrast
- [ ] Text contrast ratio is 4.5:1 or higher
- [ ] Large text contrast ratio is 3:1 or higher
- [ ] UI elements have sufficient contrast
- [ ] Focus indicators have sufficient contrast
- [ ] No color-only information

---

## SEO Testing

### Meta Tags
- [ ] Title tag is present and unique
- [ ] Meta description is present
- [ ] Meta keywords are present
- [ ] Robots meta tag is appropriate
- [ ] Canonical URL is set

### Open Graph Tags
- [ ] og:title is present
- [ ] og:description is present
- [ ] og:type is "website"
- [ ] og:image is present (if applicable)
- [ ] og:url is set

### Twitter Card Tags
- [ ] twitter:card is set
- [ ] twitter:title is present
- [ ] twitter:description is present
- [ ] twitter:image is present (if applicable)

### Structured Data (JSON-LD)
- [ ] JSON-LD script is present
- [ ] Schema.org vocabulary is used
- [ ] Product schema is valid
- [ ] Organization schema is present (if applicable)
- [ ] BreadcrumbList schema is present
- [ ] No syntax errors in JSON-LD

### Canonical URLs
- [ ] Canonical link is present
- [ ] Canonical URL is correct
- [ ] No duplicate canonical tags
- [ ] Canonical URL is absolute

---

## Error Handling Testing

### 404 Pages for Non-Existent Products/Brands/Categories
- [ ] Non-existent product slug shows 404 page
- [ ] Non-existent brand slug shows 404 page
- [ ] Non-existent category slug shows 404 page
- [ ] 404 page has helpful message
- [ ] 404 page has navigation links
- [ ] 404 page returns 404 status code

### Network Error Handling
- [ ] API errors show user-friendly message
- [ ] Network errors show user-friendly message
- [ ] Error states display correctly
- [ ] Retry option is available (if applicable)
- [ ] No console errors exposed to users

### API Error Handling
- [ ] 400 errors show validation message
- [ ] 401 errors redirect to login
- [ ] 403 errors show permission message
- [ ] 404 errors show not found message
- [ ] 500 errors show server error message
- [ ] Error messages are clear and actionable

### Loading States
- [ ] Skeleton loaders show during data fetch
- [ ] Loading indicators are visible
- [ ] Skeletons match actual content structure
- [ ] Loading state doesn't block interaction
- [ ] Loading state transitions smoothly to content

### Empty States
- [ ] Empty state shows when no products
- [ ] Empty state shows when no brands
- [ ] Empty state shows when no categories
- [ ] Empty state has helpful message
- [ ] Empty state has illustration/icon
- [ ] Empty state suggests next steps

---

## Integration Testing

### Add to Cart Functionality
- [ ] Add to cart button triggers action
- [ ] Console log shows correct product ID
- [ ] Console log shows variant ID (if selected)
- [ ] Console log shows quantity
- [ ] Action can be intercepted by cart system
- [ ] No errors in console

### Wishlist Functionality
- [ ] Wishlist button toggles state
- [ ] Console log shows correct product ID
- [ ] Heart icon updates correctly
- [ ] Action can be intercepted by wishlist system
- [ ] No errors in console

### Share Functionality
- [ ] Facebook share opens correct URL
- [ ] Twitter share opens correct URL
- [ ] WhatsApp share opens correct URL
- [ ] Copy link copies correct URL
- [ ] All share buttons include product name
- [ ] All share buttons work on mobile

### Navigation Between Pages
- [ ] Internal links work correctly
- [ ] Browser back/forward works
- [ ] URL parameters persist filters
- [ ] Page state is preserved
- [ ] No navigation errors

### URL Parameter Handling for Filters/Sorting/Pagination
- [ ] Category parameter works: `?category=cat-001`
- [ ] Brand parameter works: `?brand=brand-001`
- [ ] Search parameter works: `?search=test`
- [ ] Min price parameter works: `?minPrice=100`
- [ ] Max price parameter works: `?maxPrice=1000`
- [ ] Status parameter works: `?status=active`
- [ ] Sort by parameter works: `?sortBy=price`
- [ ] Sort order parameter works: `?sortOrder=asc`
- [ ] Page parameter works: `?page=2`
- [ ] Feature flags work: `?isFeatured=true`, `?isNewArrival=true`, `?isBestSeller=true`
- [ ] Multiple parameters work together
- [ ] Parameters can be cleared

---

## Test Checklist

### Product Listing Page (`/products`)

#### Page Load & Display
- [ ] Page loads without errors
- [ ] Product grid displays correctly
- [ ] No console errors
- [ ] Page loads within 3 seconds

#### Filtering
- [ ] Category filter works
- [ ] Brand filter works
- [ ] Price range filter works
- [ ] Stock status filter works
- [ ] Feature flags filter works
- [ ] Clear all filters works

#### Sorting
- [ ] Sort by price works
- [ ] Sort by name works
- [ ] Sort by newest works
- [ ] Sort by stock works
- [ ] Sort order toggle works

#### Pagination
- [ ] Page numbers work
- [ ] Previous/Next buttons work
- [ ] First/Last buttons work
- [ ] Jump to page works

#### Responsive Design
- [ ] Mobile layout works (320-640px)
- [ ] Tablet layout works (641-1024px)
- [ ] Desktop layout works (1025px+)

#### Product Cards
- [ ] Images load correctly
- [ ] Names display correctly
- [ ] Prices display correctly
- [ ] Ratings display correctly
- [ ] Badges display correctly
- [ ] Add to cart works
- [ ] Wishlist works

### Product Detail Page (`/products/[slug]`)

#### Page Load & Display
- [ ] Page loads without errors
- [ ] Product data displays correctly
- [ ] No console errors
- [ ] 404 works for non-existent slugs

#### Image Gallery
- [ ] Main image displays
- [ ] Thumbnails work
- [ ] Navigation arrows work
- [ ] Lightbox works
- [ ] Keyboard navigation works

#### Product Information
- [ ] Name displays
- [ ] Description displays
- [ ] Specifications display
- [ ] Variants work
- [ ] Price updates with variant
- [ ] Stock info displays

#### Actions
- [ ] Add to cart works
- [ ] Quantity selector works
- [ ] Wishlist works
- [ ] Share buttons work

#### SEO & Structured Data
- [ ] Meta tags are correct
- [ ] Open Graph tags are correct
- [ ] JSON-LD is valid
- [ ] Canonical URL is set

### Brand Listing Page (`/brands`)

#### Page Load & Display
- [ ] Page loads without errors
- [ ] Brand grid displays correctly
- [ ] No console errors

#### Search & Filter
- [ ] Search works
- [ ] Active/inactive filter works
- [ ] Clear filters works

#### Responsive Design
- [ ] Mobile layout works
- [ ] Tablet layout works
- [ ] Desktop layout works

#### Brand Cards
- [ ] Logos load correctly
- [ ] Names display
- [ ] Descriptions display
- [ ] Product counts display
- [ ] Links work

### Brand Detail Page (`/brands/[slug]`)

#### Page Load & Display
- [ ] Page loads without errors
- [ ] Brand data displays correctly
- [ ] No console errors
- [ ] 404 works for non-existent slugs

#### Brand Products
- [ ] Products display correctly
- [ ] Filters work
- [ ] Sorting works
- [ ] Pagination works

#### Related Brands
- [ ] Related brands display
- [ ] Links work

### Category Listing Page (`/categories`)

#### Page Load & Display
- [ ] Page loads without errors
- [ ] Category grid/tree displays
- [ ] No console errors

#### Search & Filter
- [ ] Search works
- [ ] Active/inactive filter works
- [ ] Grid/tree toggle works

#### Responsive Design
- [ ] Mobile layout works
- [ ] Tablet layout works
- [ ] Desktop layout works

#### Category Cards
- [ ] Images load correctly
- [ ] Names display
- [ ] Descriptions display
- [ ] Counts display
- [ ] Links work

### Category Detail Page (`/categories/[slug]`)

#### Page Load & Display
- [ ] Page loads without errors
- [ ] Category data displays correctly
- [ ] No console errors
- [ ] 404 works for non-existent slugs

#### Category Products
- [ ] Products display correctly
- [ ] Filters work
- [ ] Sorting works
- [ ] Pagination works

#### Subcategories
- [ ] Subcategories display
- [ ] Links work

#### Related Categories
- [ ] Related categories display
- [ ] Links work

### Home Page (`/`)

#### Page Load & Display
- [ ] Page loads without errors
- [ ] All sections display
- [ ] No console errors

#### Hero Section
- [ ] Hero displays correctly
- [ ] Buttons work

#### Product Sections
- [ ] Featured products display
- [ ] New arrivals display
- [ ] Best sellers display
- [ ] View all links work

#### Brand & Category Sections
- [ ] Popular brands display
- [ ] Popular categories display
- [ ] View all links work

#### Features & CTA
- [ ] Features display correctly
- [ ] CTA displays correctly
- [ ] Buttons work

### Cross-Browser
- [ ] Chrome works correctly
- [ ] Firefox works correctly
- [ ] Safari works correctly
- [ ] Edge works correctly

### Performance
- [ ] Page load times are acceptable
- [ ] Lighthouse scores are good
- [ ] No performance issues

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] ARIA labels present
- [ ] Focus indicators visible
- [ ] Color contrast sufficient

### SEO
- [ ] Meta tags present
- [ ] Open Graph tags present
- [ ] Twitter Card tags present
- [ ] Structured data valid
- [ ] Canonical URLs set

### Error Handling
- [ ] 404 pages work
- [ ] Network errors handled
- [ ] API errors handled
- [ ] Loading states work
- [ ] Empty states work

### Integration
- [ ] Add to cart works
- [ ] Wishlist works
- [ ] Share works
- [ ] Navigation works
- [ ] URL parameters work

---

## Notes

### Test Environment
- **Backend URL:** `http://localhost:3001`
- **Frontend URL:** `http://localhost:3000`
- **Database:** PostgreSQL on port 5432
- **Cache:** Redis on port 6379

### Test Data
- **Products:** 20+ active, 5+ out of stock, 5+ low stock
- **Brands:** 10+ active, 2+ inactive
- **Categories:** 10+ active, 2+ inactive, with subcategories

### Browser Versions Tested
- **Chrome:** Version 120+
- **Firefox:** Version 121+
- **Safari:** Version 17+
- **Edge:** Version 120+

### Test Date
- **Date:** _______________________
- **Tester:** _______________________
- **Environment:** Development / Staging / Production

### Issues Found
1. _______________________
2. _______________________
3. _______________________

### Overall Status
- [ ] All tests passed
- [ ] Some tests failed (see notes)
- [ ] Critical issues found
- [ ] Ready for production

---

## Appendix: Quick Reference

### Common Test URLs
- Home: `http://localhost:3000/`
- Products: `http://localhost:3000/products`
- Product Detail: `http://localhost:3000/products/[slug]`
- Brands: `http://localhost:3000/brands`
- Brand Detail: `http://localhost:3000/brands/[slug]`
- Categories: `http://localhost:3000/categories`
- Category Detail: `http://localhost:3000/categories/[slug]`

### Useful Browser DevTools Shortcuts
- **Open DevTools:** F12
- **Device Toolbar:** Ctrl+Shift+M
- **Console:** Ctrl+Shift+J
- **Elements:** Ctrl+Shift+C
- **Network:** Ctrl+Shift+E
- **Performance:** Ctrl+Shift+I
- **Lighthouse:** Ctrl+Shift+L

### API Endpoints for Testing
- **Products:** `http://localhost:3001/api/products`
- **Product by slug:** `http://localhost:3001/api/products/slug/[slug]`
- **Featured:** `http://localhost:3001/api/products/featured/list`
- **Brands:** `http://localhost:3001/api/brands`
- **Categories:** `http://localhost:3001/api/categories`
- **Category tree:** `http://localhost:3001/api/categories/tree/all`

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-22  
**Phase:** Phase 4, Task 1: Product Entity Enhancement
