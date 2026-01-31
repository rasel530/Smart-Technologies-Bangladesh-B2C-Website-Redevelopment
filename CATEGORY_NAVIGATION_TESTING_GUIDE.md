# Category Navigation Testing Guide

**Document Version:** 1.0  
**Last Updated:** 2026-01-31  
**System Version:** Smart Tech B2C Website Redevelopment

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Access URLs](#access-urls)
4. [Frontend Testing Guide](#frontend-testing-guide)
5. [Admin Panel Testing Guide](#admin-panel-testing-guide)
6. [Common Issues and Troubleshooting](#common-issues-and-troubleshooting)
7. [Success Criteria](#success-criteria)

---

## Overview

This testing guide provides comprehensive instructions for verifying the Category Navigation features in the Smart Tech B2C Website. All 5 features are fully implemented:

1. **Multi-level category navigation** - Hierarchical category tree with unlimited depth
2. **Responsive category menu** - Adaptive navigation for mobile, tablet, and desktop
3. **Category page layouts** - Rich category pages with hero sections, subcategories, and products
4. **Breadcrumb navigation** - Clear path navigation from root to current category
5. **Category-based product filtering** - Advanced filtering by category, brand, price, and specifications

---

## Prerequisites

Before testing, ensure the following services are running:

### 1. Backend API Server

- **Port:** 3001 (default)
- **Status:** Running and accessible
- **Verification:** Open `http://localhost:3001/api/v1/health` (if available) or check logs

**Start Backend:**
```bash
cd backend
npm run dev
# or
docker-compose up backend
```

### 2. Frontend Application

- **Port:** 3000 (default)
- **Status:** Running and accessible
- **Verification:** Open `http://localhost:3000` in browser

**Start Frontend:**
```bash
cd frontend
npm run dev
# or
docker-compose up frontend
```

### 3. Database

- **Type:** PostgreSQL
- **Status:** Running and accessible
- **Connection:** Backend should be able to connect

**Start Database:**
```bash
docker-compose up postgres
# or
# Ensure PostgreSQL service is running
```

### 4. Test Data

For comprehensive testing, ensure the following data exists:

- **Categories:** At least 3-5 root categories with 2-3 levels of subcategories
- **Products:** Multiple products assigned to different categories
- **Brands:** At least 3-5 brands
- **Category Images:** Optional but recommended for visual testing

**Seed Test Data:**
```bash
# Run database seed script if available
cd backend
npm run seed:categories
npm run seed:products
```

---

## Access URLs

### Frontend URLs

| Page | URL | Description |
|------|-----|-------------|
| Homepage | `http://localhost:3000` | Main landing page |
| All Categories | `http://localhost:3000/categories` | Category listing page |
| Category Page | `http://localhost:3000/categories/{slug}` | Specific category page |
| Products | `http://localhost:3000/products` | All products listing |
| Search | `http://localhost:3000/search` | Search page |

### Admin Panel URLs

| Page | URL | Description |
|------|-----|-------------|
| Admin Dashboard | `http://localhost:3000/admin` | Admin home |
| Categories List | `http://localhost:3000/admin/categories` | Category management |
| New Category | `http://localhost:3000/admin/categories/new` | Create category |
| Edit Category | `http://localhost:3000/admin/categories/{id}/edit` | Edit category |
| Tree Editor | `http://localhost:3000/admin/categories/tree` | Drag-and-drop editor |

### API Endpoints (for testing)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/categories/tree` | GET | Get category hierarchy |
| `/api/v1/categories` | GET | List categories |
| `/api/v1/categories/:id` | GET | Get category details |
| `/api/v1/categories` | POST | Create category |
| `/api/v1/categories/:id` | PUT | Update category |
| `/api/v1/categories/:id` | DELETE | Delete category |

---

## Frontend Testing Guide

### 1. Homepage Category Navigation

#### Test Case 1.1: Category Menu Display

**What to Test:**
- Category navigation menu is visible on homepage
- Categories are displayed in a clear, organized manner

**Steps:**
1. Navigate to `http://localhost:3000`
2. Look for category navigation in the header or main content area
3. Verify categories are visible

**Expected Behavior:**
- Category menu is prominently displayed
- Categories are organized hierarchically (if applicable)
- Menu is responsive and adapts to screen size

**Visual Indicators:**
- Category links are visible and clickable
- Hover effects on category items
- Icons or images associated with categories (if configured)

**How to Verify:**
- Screenshot: Capture homepage showing category menu
- Check browser console for errors: `F12` → Console tab
- Test hover states on category items

---

#### Test Case 1.2: Category Navigation Click

**What to Test:**
- Clicking a category navigates to the correct category page
- URL updates to `/categories/{slug}`

**Steps:**
1. On homepage, click on any category
2. Observe the navigation
3. Check the URL in the browser address bar

**Expected Behavior:**
- Browser navigates to category page
- URL shows correct category slug
- Page loads without errors

**Visual Indicators:**
- Category page displays with category name
- Products belonging to category are shown
- Breadcrumb navigation appears

**How to Verify:**
- Note the URL: `http://localhost:3000/categories/electronics`
- Check browser console for 404 or other errors
- Verify page title matches category name

---

### 2. Category Pages

#### Test Case 2.1: Category Page Header

**What to Test:**
- Category page displays correct header information
- Category name, description, and image are shown

**Steps:**
1. Navigate to a category page: `http://localhost:3000/categories/{slug}`
2. Examine the page header section

**Expected Behavior:**
- Category name is displayed prominently
- Category description is shown (if configured)
- Category hero image is displayed (if configured)
- Header is visually appealing and well-formatted

**Visual Indicators:**
- Large category name at top of page
- Optional hero banner with image overlay
- Category description text below name
- Background color or gradient for hero section

**How to Verify:**
- Screenshot: Capture category page header
- Check that category name matches what you clicked
- Verify description text is readable
- Test with and without category image

---

#### Test Case 2.2: Breadcrumb Navigation

**What to Test:**
- Breadcrumb shows correct path from home to current category
- Breadcrumb links are clickable and functional

**Steps:**
1. Navigate to a deep category: `http://localhost:3000/categories/electronics/computers/laptops`
2. Examine the breadcrumb at the top of the page

**Expected Behavior:**
- Breadcrumb shows: Home > Electronics > Computers > Laptops
- All breadcrumb items except the last are clickable links
- Clicking a breadcrumb navigates to that category level
- Current category is highlighted or not linked

**Visual Indicators:**
- Breadcrumb located near top of page (below header)
- Separator symbols between items (e.g., `>` or `/`)
- Different styling for current category (bold, no underline)
- Hover effects on clickable breadcrumb items

**How to Verify:**
- Screenshot: Capture breadcrumb section
- Click each breadcrumb item and verify navigation
- Test with root categories (should show: Home > Category)
- Test with nested categories (should show full path)

---

#### Test Case 2.3: Subcategories Display

**What to Test:**
- Subcategories are displayed in a grid layout
- Subcategory cards are clickable and navigate correctly

**Steps:**
1. Navigate to a category with subcategories
2. Scroll to the "Subcategories" section
3. Examine the subcategory cards

**Expected Behavior:**
- Subcategories are displayed in a responsive grid (2-4 columns)
- Each subcategory shows name and optional icon
- Clicking a subcategory navigates to its page
- Grid adapts to screen size (mobile: 2 cols, desktop: 4-6 cols)

**Visual Indicators:**
- Card-style layout for each subcategory
- Icons or images for subcategories (if configured)
- Hover effects on subcategory cards
- Clean spacing between cards

**How to Verify:**
- Screenshot: Capture subcategories section
- Click each subcategory and verify navigation
- Test on different screen sizes (mobile, tablet, desktop)
- Count subcategories and verify all are displayed

---

#### Test Case 2.4: Product Grid in Category

**What to Test:**
- Products belonging to category are displayed
- Product cards show correct information
- Pagination works correctly

**Steps:**
1. Navigate to a category with products
2. Scroll to the products section
3. Examine product cards
4. Test pagination if present

**Expected Behavior:**
- Products are displayed in a grid layout
- Each product shows: image, name, price
- Products are sorted by default (newest first)
- Pagination controls appear if products exceed page limit
- Clicking a product navigates to product detail page

**Visual Indicators:**
- Product cards with images, names, prices
- Sale prices shown in red with strikethrough for regular price
- Hover effects on product cards (zoom, shadow)
- Pagination buttons at bottom (Previous, Page numbers, Next)

**How to Verify:**
- Screenshot: Capture product grid
- Count products and verify against API response
- Click a product and verify navigation
- Test pagination (click Next, Previous, page numbers)
- Check product count display: "Showing 1-20 of 50 products"

---

### 3. Product Filtering

#### Test Case 3.1: Category Filter

**What to Test:**
- Filter sidebar allows filtering by category
- Multiple categories can be selected
- Products update when filters change

**Steps:**
1. Navigate to a category page
2. Open filter sidebar (desktop: visible, mobile: click "Filters" button)
3. Expand "Category" filter section
4. Select one or more category checkboxes
5. Observe product grid updates

**Expected Behavior:**
- Category filter shows all available categories
- Checkboxes allow multi-select
- Selecting categories filters products to show only those in selected categories
- URL updates with `?category=id1&category=id2`
- Product count updates

**Visual Indicators:**
- Checkboxes for each category
- Checked items show selected state
- Active filter count badge increases
- Products grid refreshes with filtered results

**How to Verify:**
- Screenshot: Capture filter sidebar with selections
- Check URL for category parameters
- Verify only products from selected categories appear
- Clear filters and verify all products return

---

#### Test Case 3.2: Price Range Filter

**What to Test:**
- Price range inputs filter products by price
- Min and max price inputs work correctly
- Invalid inputs are handled gracefully

**Steps:**
1. Open filter sidebar
2. Expand "Price Range" section
3. Enter min price (e.g., 1000)
4. Enter max price (e.g., 5000)
5. Observe product grid updates

**Expected Behavior:**
- Min and max price inputs accept numeric values
- Products are filtered to show only those within price range
- URL updates with `?minPrice=1000&maxPrice=5000`
- Empty or invalid values are ignored
- Min cannot be greater than max

**Visual Indicators:**
- Two input fields: Min and Max
- Input validation (numbers only)
- Products update as you type or on blur
- No error messages for valid inputs

**How to Verify:**
- Screenshot: Capture price filter with values
- Check URL for price parameters
- Verify product prices fall within range
- Test edge cases (min=0, max=very large number)
- Test invalid input (negative numbers, text)

---

#### Test Case 3.3: Brand Filter

**What to Test:**
- Brand filter allows filtering by brand
- Multiple brands can be selected
- Products update correctly

**Steps:**
1. Open filter sidebar
2. Expand "Brand" filter section
3. Select one or more brand checkboxes
4. Observe product grid updates

**Expected Behavior:**
- Brand filter shows all available brands
- Checkboxes allow multi-select
- Selecting brands filters products to show only those from selected brands
- URL updates with `?brand=id1&brand=id2`
- Product count updates

**Visual Indicators:**
- Checkboxes for each brand
- Checked items show selected state
- Active filter count badge increases
- Products grid refreshes with filtered results

**How to Verify:**
- Screenshot: Capture brand filter with selections
- Check URL for brand parameters
- Verify only products from selected brands appear
- Clear filters and verify all products return

---

#### Test Case 3.4: Rating Filter

**What to Test:**
- Rating filter allows filtering by minimum rating
- Star ratings are visually displayed
- Products update correctly

**Steps:**
1. Open filter sidebar
2. Expand "Rating" filter section
3. Select a rating option (e.g., "4 & Up")
4. Observe product grid updates

**Expected Behavior:**
- Rating options: 4 & Up, 3 & Up, 2 & Up, 1 & Up
- Radio buttons allow single selection
- Star icons are visually appealing
- Selecting rating filters products
- URL updates with `?rating=4`

**Visual Indicators:**
- Star icons filled up to selected rating
- Radio buttons for each option
- Hover effects on rating options
- Selected option is highlighted

**How to Verify:**
- Screenshot: Capture rating filter with selection
- Check URL for rating parameter
- Verify products have rating >= selected value
- Test each rating option
- Clear filters and verify all products return

---

#### Test Case 3.5: Clear All Filters

**What to Test:**
- "Clear All" button removes all active filters
- Products reset to show all
- URL parameters are cleared

**Steps:**
1. Apply multiple filters (category, brand, price, rating)
2. Click "Clear All" button in filter sidebar
3. Observe changes

**Expected Behavior:**
- All filters are cleared (checkboxes unchecked, inputs cleared)
- Product grid shows all products
- URL parameters are removed
- Active filter count badge disappears

**Visual Indicators:**
- "Clear All" button appears when filters are active
- Button disappears when no filters active
- All filter sections reset to default state
- Products grid refreshes with all products

**How to Verify:**
- Screenshot: Before and after clearing filters
- Check URL is clean (no query parameters)
- Verify all products are displayed
- Count matches total product count

---

### 4. Responsive Behavior

#### Test Case 4.1: Mobile Navigation (< 768px)

**What to Test:**
- Category menu adapts to mobile screens
- Hamburger menu or drawer navigation works
- Touch interactions are responsive

**Steps:**
1. Open browser DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select mobile device (e.g., iPhone 12)
4. Test category navigation

**Expected Behavior:**
- Category menu is hidden behind hamburger menu or drawer
- Tapping menu icon opens navigation drawer
- Categories are displayed in list format
- Drawer can be closed by tapping outside or close button
- Touch targets are large enough (min 44x44px)

**Visual Indicators:**
- Hamburger menu icon in header
- Full-screen or slide-in drawer
- Categories in vertical list
- Smooth animations for drawer open/close

**How to Verify:**
- Screenshot: Capture mobile view with menu open
- Test on actual mobile device if possible
- Verify drawer opens and closes smoothly
- Test category links in drawer
- Check for horizontal scrolling issues

---

#### Test Case 4.2: Tablet Navigation (768px - 1024px)

**What to Test:**
- Category menu adapts to tablet screens
- Navigation is optimized for touch
- Layout adjusts appropriately

**Steps:**
1. Open browser DevTools
2. Toggle device toolbar
3. Select tablet device (e.g., iPad)
4. Test category navigation

**Expected Behavior:**
- Category menu may be visible or collapsible
- Dropdown menus work with touch
- Subcategory grids show 2-3 columns
- Layout is balanced and not cramped

**Visual Indicators:**
- Category menu visible in header or collapsible
- Dropdowns expand on tap
- Grid layouts adjust to 2-3 columns
- Adequate spacing between elements

**How to Verify:**
- Screenshot: Capture tablet view
- Test dropdown menus with touch
- Verify subcategory grid columns
- Check for layout issues or overlapping

---

#### Test Case 4.3: Desktop Navigation (> 1024px)

**What to Test:**
- Category menu is fully visible on desktop
- Hover interactions work smoothly
- Mega menu or dropdown displays correctly

**Steps:**
1. Open browser at full screen (> 1024px width)
2. Test category navigation
3. Hover over category items

**Expected Behavior:**
- Category menu is fully visible in header
- Hovering shows dropdown or mega menu
- Subcategories displayed in grid (4-6 columns)
- Smooth transitions and animations
- Keyboard navigation works (Tab, Enter, Escape)

**Visual Indicators:**
- Horizontal menu bar with category links
- Dropdowns appear on hover
- Mega menu with rich content (if configured)
- Active category highlighting

**How to Verify:**
- Screenshot: Capture desktop view with dropdown
- Test hover states with mouse
- Test keyboard navigation (Tab through menu)
- Verify mega menu content (if applicable)

---

#### Test Case 4.4: Mobile Filter Drawer

**What to Test:**
- Filter drawer works on mobile
- Filters can be applied and cleared
- Drawer can be opened and closed

**Steps:**
1. Navigate to category page on mobile
2. Click "Filters" button
3. Apply some filters
4. Click "Apply Filters" or close drawer

**Expected Behavior:**
- Filter drawer slides in from right
- All filter sections are collapsible
- "Apply Filters" button at bottom
- Products update when filters applied
- Drawer can be closed with X button or outside tap

**Visual Indicators:**
- Full-height drawer on right side
- Close button in header
- Scrollable filter content
- "Apply Filters" button fixed at bottom

**How to Verify:**
- Screenshot: Capture mobile filter drawer
- Test opening and closing drawer
- Apply filters and verify products update
- Test clearing filters
- Check for scroll issues in drawer

---

### 5. Breadcrumb Navigation

#### Test Case 5.1: Breadcrumb on Root Category

**What to Test:**
- Breadcrumb shows correct path for root categories
- Home link and category name are displayed

**Steps:**
1. Navigate to a root category: `http://localhost:3000/categories/electronics`
2. Examine breadcrumb

**Expected Behavior:**
- Breadcrumb shows: Home > Electronics
- Home link navigates to homepage
- Electronics is current page (not linked or highlighted)
- Separator between items

**Visual Indicators:**
- Home icon or text
- Arrow or slash separator
- Current category in bold
- Hover effect on Home link

**How to Verify:**
- Screenshot: Capture breadcrumb
- Click Home link and verify navigation
- Verify category name matches page title
- Test with different root categories

---

#### Test Case 5.2: Breadcrumb on Nested Category

**What to Test:**
- Breadcrumb shows full path for nested categories
- All parent categories are clickable

**Steps:**
1. Navigate to a nested category: `http://localhost:3000/categories/electronics/computers/laptops`
2. Examine breadcrumb

**Expected Behavior:**
- Breadcrumb shows: Home > Electronics > Computers > Laptops
- Home, Electronics, Computers are clickable links
- Laptops is current page (not linked)
- Clicking parent navigates to that level

**Visual Indicators:**
- Multiple breadcrumb items
- All except last are links
- Current item highlighted
- Consistent separator style

**How to Verify:**
- Screenshot: Capture breadcrumb
- Click each parent link and verify navigation
- Verify path matches category hierarchy
- Test with different nesting levels

---

#### Test Case 5.3: Breadcrumb Navigation

**What to Test:**
- Clicking breadcrumb items navigates correctly
- Browser back button works after breadcrumb navigation

**Steps:**
1. Navigate to a deep category
2. Click a parent category in breadcrumb
3. Verify navigation
4. Use browser back button

**Expected Behavior:**
- Clicking parent navigates to that category page
- Page loads correctly
- Browser back button returns to previous page
- URL updates correctly

**Visual Indicators:**
- Smooth page transitions
- Correct page loads
- No 404 errors

**How to Verify:**
- Test each breadcrumb item
- Verify URL changes
- Test browser back/forward buttons
- Check for any console errors

---

## Admin Panel Testing Guide

### 1. Category Management Dashboard

#### Test Case 1.1: Categories List Page

**What to Test:**
- Categories list displays all categories
- Categories are shown in tree structure
- Search and filter functionality works

**Steps:**
1. Navigate to `http://localhost:3000/admin/categories`
2. Examine the categories list
3. Test search functionality
4. Test status filter

**Expected Behavior:**
- All categories displayed in hierarchical tree
- Expand/collapse buttons for categories with children
- Search filters categories by name
- Status filter (All/Active/Inactive) works
- Category counts shown (total, active, inactive)
- "Add Category" button visible

**Visual Indicators:**
- Tree structure with indentation
- Expand/collapse arrows
- Status badges (green for active, gray for inactive)
- Subcategory counts
- Search input field
- Status dropdown filter

**How to Verify:**
- Screenshot: Capture categories list
- Count categories and verify against database
- Test search with known category name
- Test status filter (select Active, verify only active shown)
- Expand and collapse categories with children

---

#### Test Case 1.2: Category Tree View

**What to Test:**
- Category tree displays hierarchy correctly
- Expand/collapse functionality works
- Visual hierarchy is clear

**Steps:**
1. On categories list page
2. Click expand buttons on categories with children
3. Observe tree structure

**Expected Behavior:**
- Categories with children show expand button
- Clicking expand shows children with indentation
- Children can also be expanded if they have subcategories
- Tree structure is visually clear
- Indentation increases with depth

**Visual Indicators:**
- Chevron arrows (rotate when expanded)
- Indented child categories
- Connecting lines or borders
- Smooth animations

**How to Verify:**
- Screenshot: Capture expanded tree
- Count levels of nesting
- Verify parent-child relationships
- Test expanding multiple levels
- Check for circular reference issues

---

### 2. Creating Categories

#### Test Case 2.1: Create Root Category

**What to Test:**
- New root category can be created
- All required fields work correctly
- Category appears in list after creation

**Steps:**
1. Navigate to `http://localhost:3000/admin/categories/new`
2. Fill in category details:
   - Name: "Test Root Category"
   - Slug: "test-root-category" (auto-generated or manual)
   - Description: "Test description"
   - Parent Category: Leave blank or select "None"
   - Status: Active
3. Click "Create Category"
4. Verify category appears in list

**Expected Behavior:**
- Form validates required fields
- Slug auto-generates from name
- Category is created successfully
- Success message appears
- Redirected to categories list
- New category visible in list as root

**Visual Indicators:**
- Form with labeled fields
- Validation errors for missing required fields
- Success notification
- Category in list with no parent

**How to Verify:**
- Screenshot: Capture form and success message
- Check categories list for new category
- Verify category has no parent
- Test creating without required fields (should show error)
- Verify slug is URL-friendly

---

#### Test Case 2.2: Create Subcategory

**What to Test:**
- Subcategory can be created under parent
- Parent selection works correctly
- Hierarchy is maintained

**Steps:**
1. Navigate to `http://localhost:3000/admin/categories/new`
2. Fill in category details:
   - Name: "Test Subcategory"
   - Slug: "test-subcategory"
   - Parent Category: Select "Test Root Category"
   - Status: Active
3. Click "Create Category"
4. Verify subcategory appears under parent

**Expected Behavior:**
- Parent dropdown shows all categories
- Categories are indented in dropdown to show hierarchy
- Subcategory is created under selected parent
- Success message appears
- Subcategory visible as child of parent in list

**Visual Indicators:**
- Parent dropdown with hierarchical options
- Indentation in dropdown (4 spaces per level)
- Success notification
- Subcategory indented under parent in list

**How to Verify:**
- Screenshot: Capture form with parent selected
- Check categories list for subcategory
- Verify subcategory is child of correct parent
- Test creating multiple levels of subcategories
- Verify dropdown prevents circular references

---

#### Test Case 2.3: Category Form Validation

**What to Test:**
- Form validates all fields correctly
- Error messages are clear
- Invalid data is rejected

**Steps:**
1. Navigate to new category form
2. Try to submit with empty name
3. Try to submit with invalid slug (spaces, special chars)
4. Try to submit with duplicate slug
5. Observe validation messages

**Expected Behavior:**
- Required field validation prevents submission
- Slug validation allows only lowercase, hyphens, numbers
- Duplicate slug shows error
- Clear error messages guide user
- Form highlights invalid fields

**Visual Indicators:**
- Red border on invalid fields
- Error text below invalid fields
- Submit button disabled or shows error
- Success message on valid submission

**How to Verify:**
- Screenshot: Capture validation errors
- Test each validation rule
- Verify error messages are helpful
- Test with valid data after invalid attempt
- Check browser console for validation errors

---

### 3. Editing Categories

#### Test Case 3.1: Edit Category Details

**What to Test:**
- Category details can be edited
- Changes are saved correctly
- Form pre-fills with existing data

**Steps:**
1. Navigate to categories list
2. Click edit button on a category
3. Modify category details (name, description, status)
4. Click "Update Category"
5. Verify changes are saved

**Expected Behavior:**
- Form pre-fills with current category data
- Parent dropdown excludes current category and descendants
- Changes are saved successfully
- Success message appears
- Updated data visible in list

**Visual Indicators:**
- Form with current values
- Edit page title shows category name
- Success notification
- Updated values in list

**How to Verify:**
- Screenshot: Capture edit form and success
- Verify form pre-fills correctly
- Check that parent dropdown excludes current category
- Verify changes appear in list
- Test changing parent (move category)

---

#### Test Case 3.2: Change Category Parent

**What to Test:**
- Category can be moved to different parent
- Hierarchy updates correctly
- Circular references are prevented

**Steps:**
1. Edit a category
2. Change parent category to a different one
3. Click "Update Category"
4. Verify category moved to new parent

**Expected Behavior:**
- Parent dropdown shows valid options
- Current category and its descendants are excluded
- Category moves to new parent
- Children move with category
- Success message appears

**Visual Indicators:**
- Parent dropdown with options
- Category appears under new parent in list
- Success notification
- Tree structure updates

**How to Verify:**
- Screenshot: Before and after parent change
- Verify category is under new parent
- Check that children moved with parent
- Test moving to root (no parent)
- Test circular reference prevention (try to move parent under child)

---

#### Test Case 3.3: Change Category Status

**What to Test:**
- Category status can be changed between Active/Inactive
- Status change affects visibility

**Steps:**
1. Edit a category
2. Change status from Active to Inactive
3. Click "Update Category"
4. Verify status badge changes
5. Check if category appears in frontend

**Expected Behavior:**
- Status dropdown has Active/Inactive options
- Status changes successfully
- Badge color changes (green for active, gray for inactive)
- Inactive categories may not appear in frontend

**Visual Indicators:**
- Status dropdown
- Colored badge in list
- Success notification
- Updated badge color

**How to Verify:**
- Screenshot: Before and after status change
- Verify badge color changes
- Check frontend to see if inactive category hidden
- Test changing back to Active
- Verify frontend shows category when Active

---

### 4. Category Tree Editor

#### Test Case 4.1: Drag-and-Drop Reorganization

**What to Test:**
- Categories can be moved via drag-and-drop
- Hierarchy updates correctly
- Visual feedback during drag

**Steps:**
1. Navigate to `http://localhost:3000/admin/categories/tree`
2. Drag a category and drop onto another category
3. Observe the change
4. Verify hierarchy updated

**Expected Behavior:**
- Dragged category becomes child of target
- Visual feedback during drag (highlight target)
- Drop zone is clearly indicated
- Category moves in tree
- Success message appears

**Visual Indicators:**
- Drag cursor appears
- Target category highlights
- Drop zone indicator
- Tree updates after drop
- Success notification

**How to Verify:**
- Screenshot: Before and after drag
- Verify category moved to correct parent
- Test moving multiple levels
- Test moving to root (drop outside tree)
- Check for circular reference prevention

---

#### Test Case 4.2: Reorder Categories

**What to Test:**
- Categories can be reordered within same parent
- Display order updates correctly
- Reordering works via drag-and-drop

**Steps:**
1. In tree editor
2. Drag a category and drop between siblings
3. Observe order change
4. Verify display order updated

**Expected Behavior:**
- Category moves to new position
- Display order values update
- Tree reflects new order
- Success message appears

**Visual Indicators:**
- Visual indicator of drop position
- Tree reorders after drop
- Success notification
- Consistent ordering

**How to Verify:**
- Screenshot: Before and after reorder
- Verify order in list
- Check display order values (if visible)
- Test reordering multiple categories
- Verify order persists after page refresh

---

### 5. Deleting Categories

#### Test Case 5.1: Delete Category Without Children

**What to Test:**
- Category without children can be deleted
- Confirmation dialog appears
- Category is removed from list

**Steps:**
1. Create a test category without children
2. Click delete button
3. Confirm deletion
4. Verify category removed

**Expected Behavior:**
- Delete confirmation dialog appears
- Dialog shows category name
- Confirming deletes category
- Success message appears
- Category removed from list

**Visual Indicators:**
- Delete button with trash icon
- Confirmation dialog
- Success notification
- Category no longer in list

**How to Verify:**
- Screenshot: Capture confirmation dialog
- Verify category removed from list
- Check database for deletion
- Test canceling deletion
- Verify deletion persists after refresh

---

#### Test Case 5.2: Delete Category With Children (Blocked)

**What to Test:**
- Category with children cannot be deleted
- Error message explains requirement
- User must delete children first

**Steps:**
1. Create a category with subcategories
2. Click delete button
3. Confirm deletion
4. Observe error message

**Expected Behavior:**
- Deletion is blocked
- Error message appears
- Message explains children must be deleted first
- Category remains in list

**Visual Indicators:**
- Error notification (red)
- Clear error message
- Category still visible in list
- No deletion occurred

**How to Verify:**
- Screenshot: Capture error message
- Verify error message is clear
- Try deleting children first
- Then delete parent
- Verify both deleted successfully

---

#### Test Case 5.3: Delete Category With Products (Blocked)

**What to Test:**
- Category with products cannot be deleted
- Error message explains requirement
- User must move or delete products first

**Steps:**
1. Create a category with assigned products
2. Click delete button
3. Confirm deletion
4. Observe error message

**Expected Behavior:**
- Deletion is blocked
- Error message appears
- Message explains products must be moved/deleted first
- Category remains in list

**Visual Indicators:**
- Error notification (red)
- Clear error message
- Category still visible in list
- No deletion occurred

**How to Verify:**
- Screenshot: Capture error message
- Verify error message is clear
- Move products to another category
- Then delete category
- Verify deletion succeeds

---

### 6. Category Images and Icons

#### Test Case 6.1: Upload Category Image

**What to Test:**
- Category hero image can be uploaded
- Image displays correctly on category page
- Image is stored properly

**Steps:**
1. Edit or create a category
2. Click "Upload Image" button
3. Select an image file (JPG, PNG)
4. Click upload
5. Verify image appears

**Expected Behavior:**
- File picker opens
- Image uploads successfully
- Preview appears in form
- Image displays on category page
- Success message appears

**Visual Indicators:**
- Upload button
- Image preview after upload
- Success notification
- Image visible on category page

**How to Verify:**
- Screenshot: Capture form with image
- Check category page for hero image
- Verify image URL is correct
- Test with different image formats
- Check image dimensions and quality

---

#### Test Case 6.2: Upload Category Icon

**What to Test:**
- Category icon can be uploaded
- Icon displays in category lists and cards
- Icon is stored properly

**Steps:**
1. Edit or create a category
2. Click "Upload Icon" button
3. Select an icon file (PNG, SVG)
4. Click upload
5. Verify icon appears

**Expected Behavior:**
- File picker opens
- Icon uploads successfully
- Preview appears in form
- Icon displays in category lists
- Success message appears

**Visual Indicators:**
- Upload button
- Icon preview after upload
- Success notification
- Icon visible in category cards

**How to Verify:**
- Screenshot: Capture form with icon
- Check category list for icon
- Verify icon URL is correct
- Test with different icon formats
- Check icon size and clarity

---

## Common Issues and Troubleshooting

### Issue 1: Categories Not Loading

**Symptoms:**
- Category list shows loading spinner indefinitely
- Error message appears
- Console shows API errors

**Possible Causes:**
- Backend API not running
- Database connection issue
- Network connectivity problem
- CORS configuration issue

**Troubleshooting Steps:**
1. Check backend is running: `http://localhost:3001/api/v1/categories`
2. Check browser console for errors (F12 → Console)
3. Check backend logs for errors
4. Verify database is running and accessible
5. Check CORS configuration in backend

**Solution:**
- Start backend server if not running
- Restart backend and database
- Check network connection
- Verify API endpoint is correct

---

### Issue 2: Category Page Shows 404

**Symptoms:**
- Navigating to category shows 404 page
- Category not found error

**Possible Causes:**
- Category slug doesn't match
- Category is inactive
- Category was deleted
- URL is incorrect

**Troubleshooting Steps:**
1. Verify category slug in admin panel
2. Check category status (must be Active)
3. Check category exists in database
4. Verify URL is correct

**Solution:**
- Use correct category slug
- Set category status to Active
- Recreate category if deleted
- Check for typos in URL

---

### Issue 3: Breadcrumb Not Showing

**Symptoms:**
- Breadcrumb navigation is missing
- Breadcrumb doesn't update on category change

**Possible Causes:**
- Category path not returned by API
- Breadcrumb component not rendering
- Data structure mismatch

**Troubleshooting Steps:**
1. Check API response for category path
2. Check browser console for errors
3. Verify breadcrumb component is imported
4. Check category data structure

**Solution:**
- Ensure API returns category path
- Fix breadcrumb component rendering
- Verify data structure matches component expectations
- Check for missing category data

---

### Issue 4: Filters Not Working

**Symptoms:**
- Clicking filters doesn't update products
- Filters don't apply
- URL parameters not updating

**Possible Causes:**
- JavaScript error in filter component
- API not accepting filter parameters
- Filter state not updating
- URL routing issue

**Troubleshooting Steps:**
1. Check browser console for errors
2. Verify API accepts filter parameters
3. Check network tab for API requests
4. Test filter component state

**Solution:**
- Fix JavaScript errors
- Verify API endpoint supports filters
- Check filter state management
- Ensure URL routing works correctly

---

### Issue 5: Mobile Menu Not Working

**Symptoms:**
- Hamburger menu doesn't open
- Drawer doesn't slide in
- Touch events not working

**Possible Causes:**
- JavaScript error
- CSS display issue
- Touch event handler missing
- Z-index issue

**Troubleshooting Steps:**
1. Check browser console for errors
2. Test on actual mobile device
3. Check CSS for display properties
4. Verify touch event handlers

**Solution:**
- Fix JavaScript errors
- Check CSS for mobile breakpoints
- Ensure touch events are handled
- Verify z-index of drawer

---

### Issue 6: Drag-and-Drop Not Working

**Symptoms:**
- Categories can't be dragged
- Drop doesn't work
- Visual feedback missing

**Possible Causes:**
- Drag-and-drop library not loaded
- JavaScript error
- Missing drag event handlers
- Browser compatibility issue

**Troubleshooting Steps:**
1. Check browser console for errors
2. Verify drag-and-drop library is loaded
3. Test in different browser
4. Check for drag event handlers

**Solution:**
- Load drag-and-drop library
- Fix JavaScript errors
- Ensure event handlers are attached
- Test in supported browsers

---

### Issue 7: Category Images Not Displaying

**Symptoms:**
- Category hero image doesn't show
- Icon images missing
- Broken image icons

**Possible Causes:**
- Image URL is incorrect
- Image file not found
- CORS issue
- Image not uploaded successfully

**Troubleshooting Steps:**
1. Check image URL in browser
2. Verify image file exists
3. Check browser console for errors
4. Verify upload succeeded

**Solution:**
- Upload image again
- Check image path
- Fix CORS configuration
- Verify image file is accessible

---

### Issue 8: Circular Reference Error

**Symptoms:**
- Can't move category under its descendant
- Error message about circular reference

**Possible Causes:**
- Trying to create invalid hierarchy
- Parent selection includes descendants

**Troubleshooting Steps:**
1. Review category hierarchy
2. Identify circular reference
3. Choose valid parent

**Solution:**
- Select a different parent category
- Move category to root level
- Reorganize hierarchy to avoid circular references

---

### Issue 9: Products Not Showing in Category

**Symptoms:**
- Category page shows no products
- Products exist but not displayed

**Possible Causes:**
- Products not assigned to category
- Products are inactive
- API not returning products
- Filter excluding products

**Troubleshooting Steps:**
1. Check product-category assignments in admin
2. Verify product status is Active
3. Check API response for products
4. Clear all filters

**Solution:**
- Assign products to category
- Set product status to Active
- Fix API endpoint
- Clear or adjust filters

---

### Issue 10: Pagination Not Working

**Symptoms:**
- Can't navigate to next page
- Page numbers don't work
- All products shown on one page

**Possible Causes:**
- Pagination component error
- API not respecting page parameter
- Total count incorrect

**Troubleshooting Steps:**
1. Check browser console for errors
2. Verify API accepts page parameter
3. Check pagination component state
4. Verify total product count

**Solution:**
- Fix pagination component
- Ensure API supports pagination
- Update total count
- Check page parameter in URL

---

## Success Criteria

### Frontend Success Criteria

✅ **Category Navigation**
- [ ] Category menu is visible and accessible on all pages
- [ ] Categories are displayed in hierarchical structure
- [ ] Clicking category navigates to correct page
- [ ] URL updates to `/categories/{slug}`
- [ ] No console errors on category navigation

✅ **Category Pages**
- [ ] Category page displays correct header (name, description, image)
- [ ] Breadcrumb shows full path from home to current category
- [ ] Subcategories are displayed in responsive grid
- [ ] Products are displayed in grid layout
- [ ] Product cards show image, name, price
- [ ] Pagination works correctly

✅ **Product Filtering**
- [ ] Category filter allows multi-select
- [ ] Price range filter works (min/max inputs)
- [ ] Brand filter allows multi-select
- [ ] Rating filter works (radio buttons)
- [ ] "Clear All" button removes all filters
- [ ] URL updates with filter parameters
- [ ] Product grid updates when filters change
- [ ] Active filter count badge displays correctly

✅ **Responsive Design**
- [ ] Mobile (< 768px): Hamburger menu or drawer works
- [ ] Mobile: Filter drawer opens and closes correctly
- [ ] Tablet (768-1024px): Layout adapts appropriately
- [ ] Desktop (> 1024px): Full navigation visible
- [ ] Hover interactions work on desktop
- [ ] Touch interactions work on mobile/tablet
- [ ] No horizontal scrolling issues
- [ ] Text is readable on all screen sizes

✅ **Breadcrumb Navigation**
- [ ] Breadcrumb appears on all category pages
- [ ] Breadcrumb shows correct path
- [ ] Home link navigates to homepage
- [ ] Parent category links navigate correctly
- [ ] Current category is highlighted/not linked
- [ ] Breadcrumb updates when navigating

---

### Admin Panel Success Criteria

✅ **Category Management**
- [ ] Categories list displays all categories
- [ ] Categories shown in tree structure
- [ ] Expand/collapse works for categories with children
- [ ] Search filters categories by name
- [ ] Status filter (All/Active/Inactive) works
- [ ] Category counts displayed correctly

✅ **Creating Categories**
- [ ] New category can be created
- [ ] Root categories can be created (no parent)
- [ ] Subcategories can be created (with parent)
- [ ] Form validates required fields
- [ ] Slug auto-generates from name
- [ ] Success message appears on creation
- [ ] Category appears in list after creation

✅ **Editing Categories**
- [ ] Category details can be edited
- [ ] Form pre-fills with existing data
- [ ] Parent can be changed
- [ ] Status can be changed (Active/Inactive)
- [ ] Changes are saved successfully
- [ ] Success message appears on update
- [ ] Updated data visible in list

✅ **Category Tree Editor**
- [ ] Drag-and-drop works for moving categories
- [ ] Categories can be reordered
- [ ] Visual feedback during drag
- [ ] Hierarchy updates after drop
- [ ] Circular references are prevented
- [ ] Success message appears after move

✅ **Deleting Categories**
- [ ] Category without children can be deleted
- [ ] Category with children cannot be deleted (blocked)
- [ ] Category with products cannot be deleted (blocked)
- [ ] Confirmation dialog appears before deletion
- [ ] Success message appears after deletion
- [ ] Category removed from list

✅ **Category Images and Icons**
- [ ] Category hero image can be uploaded
- [ ] Category icon can be uploaded
- [ ] Images display correctly on category pages
- [ ] Icons display in category lists
- [ ] Image preview appears in form
- [ ] Success message appears after upload

---

### Overall Success Criteria

✅ **All Features Working**
- [ ] All 5 features are fully functional
- [ ] No critical bugs or errors
- [ ] User experience is smooth and intuitive
- [ ] Performance is acceptable (fast page loads)
- [ ] Accessibility standards met (keyboard navigation, screen readers)
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- [ ] Mobile devices work correctly
- [ ] Tablet devices work correctly
- [ ] Desktop devices work correctly

✅ **Documentation Complete**
- [ ] This testing guide is comprehensive
- [ ] All test cases documented
- [ ] Success criteria clearly defined
- [ ] Troubleshooting section is helpful
- [ ] Screenshots captured for visual verification

---

## Testing Checklist

Use this checklist to track your testing progress:

### Frontend Testing
- [ ] Homepage category navigation
- [ ] Category page header
- [ ] Breadcrumb navigation (root category)
- [ ] Breadcrumb navigation (nested category)
- [ ] Subcategories display
- [ ] Product grid
- [ ] Category filter
- [ ] Price range filter
- [ ] Brand filter
- [ ] Rating filter
- [ ] Clear all filters
- [ ] Mobile navigation (< 768px)
- [ ] Tablet navigation (768-1024px)
- [ ] Desktop navigation (> 1024px)
- [ ] Mobile filter drawer
- [ ] Breadcrumb navigation clicks

### Admin Panel Testing
- [ ] Categories list page
- [ ] Category tree view
- [ ] Create root category
- [ ] Create subcategory
- [ ] Category form validation
- [ ] Edit category details
- [ ] Change category parent
- [ ] Change category status
- [ ] Drag-and-drop reorganization
- [ ] Reorder categories
- [ ] Delete category without children
- [ ] Delete category with children (blocked)
- [ ] Delete category with products (blocked)
- [ ] Upload category image
- [ ] Upload category icon

---

## Additional Resources

### Related Documentation
- [Multi-Level Category Hierarchy Guide](./MULTI_LEVEL_CATEGORY_HIERARCHY_GUIDE.md)
- [Backend API Documentation](./backend/README.md)
- [Frontend Component Documentation](./frontend/README.md)

### Component Files
- [`CategoryNavigation.tsx`](frontend/src/components/category/CategoryNavigation.tsx)
- [`CategoryPage.tsx`](frontend/src/components/category/CategoryPage.tsx)
- [`CategoryBreadcrumb.tsx`](frontend/src/components/category/CategoryBreadcrumb.tsx)
- [`FilterSidebar.tsx`](frontend/src/components/product/FilterSidebar.tsx)
- [`CategoryList.tsx`](frontend/src/components/admin/CategoryList.tsx)
- [`CategoryForm.tsx`](frontend/src/components/admin/CategoryForm.tsx)
- [`CategoryTreeEditor.tsx`](frontend/src/components/admin/CategoryTreeEditor.tsx)

### API Endpoints
- [`/api/v1/categories`](backend/routes/categories.js)
- [`/api/v1/categories/tree`](backend/routes/categories.js)

---

**End of Testing Guide**

For questions or issues, please refer to the troubleshooting section or contact the development team.
