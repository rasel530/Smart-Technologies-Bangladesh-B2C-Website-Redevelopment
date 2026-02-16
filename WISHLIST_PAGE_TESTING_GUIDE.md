# Wishlist Page Testing Guide

**Version:** 2.0  
**Date:** 2026-02-15  
**Component:** Wishlist Page (Refactored)  
**Test Coverage:** Responsive Design, Visual Design, Functionality, Accessibility, Performance

---

## Table of Contents

1. [Testing Prerequisites](#testing-prerequisites)
2. [Responsive Design Testing](#responsive-design-testing)
3. [Visual Design Testing](#visual-design-testing)
4. [Functional Testing](#functional-testing)
5. [Accessibility Testing](#accessibility-testing)
6. [Performance Testing](#performance-testing)
7. [Common Issues and Solutions](#common-issues-and-solutions)
8. [Browser Compatibility Notes](#browser-compatibility-notes)
9. [Test Execution Checklist](#test-execution-checklist)

---

## Testing Prerequisites

### 1. Browser Requirements

| Browser | Minimum Version | Recommended Version | Notes                      |
| ------- | --------------- | ------------------- | -------------------------- |
| Chrome  | 90+             | 120+                | Primary testing browser    |
| Firefox | 88+             | 120+                | Test for CSS compatibility |
| Safari  | 14+             | 17+                 | macOS and iOS testing      |
| Edge    | 90+             | 120+                | Chromium-based             |

### 2. Device Requirements

#### Mobile Devices (Recommended)

- **iPhone SE (3rd Gen)** - 375px width (Small mobile)
- **iPhone 14 Pro** - 393px width (Standard mobile)
- **Samsung Galaxy S23** - 360px width (Android mobile)

#### Tablet Devices (Recommended)

- **iPad Mini** - 768px width (Small tablet)
- **iPad Pro 11"** - 834px width (Standard tablet)
- **iPad Pro 12.9"** - 1024px width (Large tablet)

#### Desktop Devices (Recommended)

- **Small Desktop** - 1280px width
- **Standard Desktop** - 1440px width
- **Large Desktop** - 1920px width

### 3. Testing Tools

#### Essential Tools

- **Chrome DevTools** - Built-in browser inspector (F12)
- **Firefox Developer Tools** - Built-in browser inspector (F12)
- **Safari Web Inspector** - Enable in Safari > Preferences > Advanced

#### Accessibility Tools

- **axe DevTools** - Chrome extension for accessibility testing
- **Lighthouse** - Built-in Chrome audit tool
- **WAVE** - WebAIM accessibility evaluation tool

#### Performance Tools

- **Lighthouse** - Performance, accessibility, best practices
- **WebPageTest** - Detailed performance analysis
- **Chrome Performance Profiler** - Runtime performance analysis

### 4. Environment Setup

#### Development Environment

```bash
# Ensure development server is running
cd frontend
npm run dev

# Access wishlist page
http://localhost:3000/wishlist
```

#### Test Data Requirements

- User account with at least 10 wishlist items
- Multiple wishlists (minimum 3) for dropdown testing
- Mix of in-stock and out-of-stock items
- Items with discount prices
- Items with various image aspect ratios

---

## Responsive Design Testing

### Breakpoint Overview

| Breakpoint    | Screen Width    | Grid Columns | Key Changes                              |
| ------------- | --------------- | ------------ | ---------------------------------------- |
| Mobile        | < 640px         | 1 column     | Single column, mobile sticky CTA visible |
| Tablet        | 640px - 1023px  | 2 columns    | 2-column grid, sticky CTA hidden         |
| Desktop       | 1024px - 1279px | 3 columns    | 3-column grid, enhanced spacing          |
| Large Desktop | 1280px+         | 4 columns    | 4-column grid, maximum content width     |

### Test Case 1: Mobile Layout (< 640px)

#### Setup

1. Open Chrome DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select device: iPhone SE (375x667px)
4. Navigate to `/wishlist`

#### Verification Steps

**1.1 Header Layout**

- [ ] Page title displays on single line
- [ ] Wishlist selector button is full width
- [ ] Header buttons (Create, Share, Export) wrap to new line
- [ ] Header is sticky and stays at top when scrolling
- [ ] Header has shadow when scrolled

**1.2 Toolbar Layout**

- [ ] Search input is full width
- [ ] Sort and filter selects are side-by-side
- [ ] Bulk actions section is stacked vertically
- [ ] Select all checkbox and label are aligned
- [ ] Bulk action buttons are full width

**1.3 Grid Layout**

- [ ] Grid displays 1 column
- [ ] Cards have proper spacing (16px gap)
- [ ] Cards have consistent width
- [ ] Cards do not overflow viewport

**1.4 Card Layout**

- [ ] Product image maintains 4:5 aspect ratio
- [ ] Checkbox positioned at top-left
- [ ] Remove button positioned at top-right
- [ ] Product name truncates to 2 lines
- [ ] Add to Cart button is full width

**1.5 Mobile Sticky CTA**

- [ ] Sticky CTA appears when items are selected
- [ ] CTA is fixed at bottom of viewport
- [ ] CTA has shadow and border-top
- [ ] Selected count displays correctly
- [ ] Move to Cart and Remove buttons are visible
- [ ] Close button (X) is functional
- [ ] CTA does not overlap content

**1.6 Toast Notifications**

- [ ] Toast notifications appear at top-right
- [ ] Toast spans full width (minus margins)
- [ ] Toast does not overlap header

#### Expected Results

- All elements fit within 375px viewport
- No horizontal scrolling required
- Touch targets are at least 44x44px
- All interactive elements are easily tappable

---

### Test Case 2: Tablet Layout (640px - 1023px)

#### Setup

1. Open Chrome DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select device: iPad (768x1024px)
4. Navigate to `/wishlist`

#### Verification Steps

**2.1 Header Layout**

- [ ] Page title and wishlist selector are on same line
- [ ] Header buttons are on same line
- [ ] Header maintains sticky positioning
- [ ] All elements fit within viewport width

**2.2 Toolbar Layout**

- [ ] Search input, sort, and filter are on same line
- [ ] Bulk actions are on same line
- [ ] All toolbar elements are properly aligned

**2.3 Grid Layout**

- [ ] Grid displays 2 columns
- [ ] Cards have proper spacing (16px gap)
- [ ] Cards are equal height
- [ ] Grid is centered within viewport

**2.4 Card Layout**

- [ ] All card elements are properly aligned
- [ ] Images maintain aspect ratio
- [ ] Buttons are properly sized for touch

**2.5 Mobile Sticky CTA**

- [ ] Sticky CTA is NOT visible on tablet
- [ ] Bulk actions are in toolbar instead

#### Expected Results

- Layout adapts smoothly from mobile to tablet
- No layout shifts or overlapping elements
- All interactive elements remain accessible

---

### Test Case 3: Desktop Layout (1024px - 1279px)

#### Setup

1. Open Chrome DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Set responsive dimensions: 1024x768px
4. Navigate to `/wishlist`

#### Verification Steps

**3.1 Header Layout**

- [ ] All header elements are on single line
- [ ] Header has maximum width of 1400px
- [ ] Header is centered within viewport
- [ ] Sticky positioning works correctly

**3.2 Toolbar Layout**

- [ ] Toolbar is horizontal
- [ ] Search, sort, filter are on same line
- [ ] Bulk actions are on same line
- [ ] All elements are properly spaced

**3.3 Grid Layout**

- [ ] Grid displays 3 columns
- [ ] Cards have proper spacing (24px gap)
- [ ] Grid is centered with max-width 1400px
- [ ] Cards are equal height

**3.4 Card Layout**

- [ ] All card elements are properly aligned
- [ ] Hover effects work correctly
- [ ] Images scale on hover

**3.5 Mobile Sticky CTA**

- [ ] Sticky CTA is NOT visible on desktop
- [ ] All bulk actions are in toolbar

#### Expected Results

- Layout is optimized for desktop viewing
- Content is centered with appropriate margins
- Hover interactions work smoothly

---

### Test Case 4: Large Desktop Layout (1280px+)

#### Setup

1. Open Chrome DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Set responsive dimensions: 1920x1080px
4. Navigate to `/wishlist`

#### Verification Steps

**4.1 Header Layout**

- [ ] Header is centered with max-width 1400px
- [ ] All elements are properly aligned
- [ ] Sticky positioning works correctly

**4.2 Grid Layout**

- [ ] Grid displays 4 columns
- [ ] Cards have proper spacing (24px gap)
- [ ] Grid is centered with max-width 1400px
- [ ] Cards are equal height

**4.3 Content Width**

- [ ] Main content has max-width 1400px
- [ ] Content is centered within viewport
- [ ] No excessive white space on sides

#### Expected Results

- Layout utilizes available space efficiently
- Content is not stretched too wide
- Grid maintains readability

---

### Test Case 5: Spacing and Gaps

#### Verification Steps

**5.1 Mobile Spacing**

- [ ] Grid gap is 16px (var(--wishlist-spacing-md))
- [ ] Card padding is 16px
- [ ] Header padding is 16px
- [ ] Main content padding is 16px

**5.2 Tablet Spacing**

- [ ] Grid gap is 16px
- [ ] Header padding is 16px
- [ ] Main content padding is 16px

**5.3 Desktop Spacing**

- [ ] Grid gap is 24px (var(--wishlist-spacing-lg))
- [ ] Header padding is 24px
- [ ] Main content padding is 32px (left/right), 24px (top/bottom)

**5.4 Large Desktop Spacing**

- [ ] Grid gap is 24px
- [ ] Main content padding is 48px (left/right), 32px (top/bottom)

#### Expected Results

- Spacing is consistent across breakpoints
- Gaps scale appropriately with screen size
- No elements touch viewport edges

---

### Test Case 6: Orientation Changes

#### Verification Steps

**6.1 Portrait to Landscape (Mobile)**

- [ ] Layout adapts smoothly when rotating device
- [ ] No horizontal scrolling appears
- [ ] Elements reflow correctly
- [ ] Sticky elements maintain position

**6.2 Landscape to Portrait (Tablet)**

- [ ] Layout adapts smoothly
- [ ] Grid columns adjust if needed
- [ ] Toolbar elements reflow appropriately

#### Expected Results

- Layout transitions are smooth
- No content is lost or hidden
- All functionality remains intact

---

## Visual Design Testing

### Test Case 7: CSS Custom Properties Verification

#### Verification Steps

**7.1 Color Palette**

- [ ] Primary color (#000000) applied to primary buttons
- [ ] Secondary color (#3B82F6) applied to accents and focus rings
- [ ] Accent red (#EF4444) applied to remove buttons and error states
- [ ] Accent green (#10B981) applied to success states
- [ ] Accent orange (#F59E0B) applied to warning states

**7.2 Background Colors**

- [ ] Primary background (#F3F4F6) on page body
- [ ] Secondary background (#FFFFFF) on cards and header
- [ ] Tertiary background (#F9FAFB) on buttons and inputs

**7.3 Text Colors**

- [ ] Primary text (#111827) on headings and body text
- [ ] Secondary text (#6B7280) on descriptions and metadata
- [ ] Tertiary text (#9CA3AF) on placeholders and disabled states
- [ ] Inverse text (#FFFFFF) on dark backgrounds

**7.4 Border Colors**

- [ ] Default border (#E5E7EB) on cards and inputs
- [ ] Hover border (#D1D5DB) on interactive elements
- [ ] Focus border (#3B82F6) on focused elements

**7.5 Status Colors**

- [ ] Success background (#D1FAE5) and text (#065F46)
- [ ] Error background (#FEE2E2) and text (#991B1B)
- [ ] Info background (#DBEAFE) and text (#1E40AF)
- [ ] Warning background (#FEF3C7) and text (#92400E)

#### How to Verify

1. Open Chrome DevTools (F12)
2. Select an element with the color to verify
3. Go to Computed tab
4. Verify the color value matches the expected custom property

---

### Test Case 8: Shadow System

#### Verification Steps

**8.1 Shadow Levels**

- [ ] Shadow-xs (0 1px 2px) on small elements
- [ ] Shadow-sm (0 1px 3px) on header
- [ ] Shadow-md (0 4px 6px) on cards
- [ ] Shadow-lg (0 10px 15px) on dropdowns
- [ ] Shadow-xl (0 20px 25px) on card hover
- [ ] Shadow-2xl (0 25px 50px) on modals

**8.2 Shadow Transitions**

- [ ] Cards transition from shadow-md to shadow-xl on hover
- [ ] Transition is smooth (200ms)
- [ ] No flickering or jumping

#### How to Verify

1. Open Chrome DevTools (F12)
2. Select element with shadow
3. Go to Computed tab
4. Verify box-shadow value

---

### Test Case 9: Border Radius

#### Verification Steps

**9.1 Border Radius Values**

- [ ] Radius-sm (6px) on small elements
- [ ] Radius-md (8px) on buttons and inputs
- [ ] Radius-lg (12px) on cards
- [ ] Radius-xl (16px) on modals
- [ ] Radius-full (9999px) on badges and circular buttons

**9.2 Consistency**

- [ ] All cards have same border radius
- [ ] All buttons have same border radius
- [ ] All inputs have same border radius

#### How to Verify

1. Open Chrome DevTools (F12)
2. Select element with border radius
3. Go to Computed tab
4. Verify border-radius value

---

### Test Case 10: Typography Scale

#### Verification Steps

**10.1 Font Sizes**

- [ ] Font-xs (12px) on badges, SKU, counts
- [ ] Font-sm (14px) on labels, descriptions, buttons
- [ ] Font-base (16px) on body text, product names
- [ ] Font-lg (18px) on prices
- [ ] Font-xl (20px) on subheadings
- [ ] Font-2xl (24px) on empty state title
- [ ] Font-3xl (30px) on page title

**10.2 Font Weights**

- [ ] Weight-normal (400) on body text
- [ ] Weight-medium (500) on labels
- [ ] Weight-semibold (600) on headings
- [ ] Weight-bold (700) on prices and emphasis

**10.3 Line Heights**

- [ ] Line-height-tight (1.25) on headings
- [ ] Line-height-normal (1.5) on body text
- [ ] Line-height-relaxed (1.75) on descriptions

**10.4 Font Family**

- [ ] Primary font is 'Inter' or system font stack
- [ ] Font renders correctly across browsers
- [ ] No font loading issues

#### How to Verify

1. Open Chrome DevTools (F12)
2. Select text element
3. Go to Computed tab
4. Verify font-size, font-weight, line-height values

---

### Test Case 11: Interactive States

#### Verification Steps

**11.1 Hover States**

- [ ] Buttons change background color on hover
- [ ] Buttons have subtle lift effect (translateY(-1px))
- [ ] Cards have shadow increase on hover
- [ ] Cards have slight lift effect (translateY(-4px))
- [ ] Product images scale up on hover (scale(1.05))
- [ ] Links change color on hover
- [ ] Checkbox scales up slightly on hover (scale(1.1))
- [ ] Remove button scales up on hover (scale(1.1))

**11.2 Active/Pressed States**

- [ ] Buttons have pressed effect (translateY(0))
- [ ] Selector button has scale effect (scale(0.98))
- [ ] Wishlist options have background change on active
- [ ] Cards have reduced lift on active (translateY(-2px))
- [ ] Remove button has reduced scale on active (scale(1.05))

**11.3 Focus-Visible States**

- [ ] All interactive elements have focus ring
- [ ] Focus ring is 2px wide
- [ ] Focus ring color is #3B82F6 (blue)
- [ ] Focus ring offset is 2px
- [ ] Focus ring appears only with keyboard navigation
- [ ] Focus ring does not appear with mouse clicks

**11.4 Disabled States**

- [ ] Disabled buttons have 0.5 opacity
- [ ] Disabled buttons have "not-allowed" cursor
- [ ] Disabled buttons have no hover effects
- [ ] Disabled inputs have reduced opacity
- [ ] Disabled checkboxes are not interactive

#### How to Verify

1. **Hover States:** Move mouse over elements and observe changes
2. **Active States:** Click and hold on elements
3. **Focus States:** Use Tab key to navigate and observe focus rings
4. **Disabled States:** Test with disabled elements (loading states)

---

### Test Case 12: Transitions and Animations

#### Verification Steps

**12.1 Transition Durations**

- [ ] Instant transitions (50ms) on micro-interactions
- [ ] Fast transitions (150ms) on hover states
- [ ] Normal transitions (200ms) on card effects
- [ ] Slow transitions (300ms) on dropdowns
- [ ] Slower transitions (500ms) on modals

**12.2 Transition Timing**

- [ ] All transitions use ease-in-out
- [ ] Transitions are smooth and natural
- [ ] No jarring or abrupt changes

**12.3 Animations**

- [ ] Shimmer animation on skeleton loaders (1.5s infinite)
- [ ] Spin animation on loading spinners (0.8s linear infinite)
- [ ] Pulse animation on empty state icon (2s ease-in-out infinite)
- [ ] SlideIn animation on toast notifications (0.3s ease-out)

**12.4 Reduced Motion**

- [ ] Animations respect prefers-reduced-motion
- [ ] Reduced motion disables all animations
- [ ] Transition durations are reduced to 0.01ms

#### How to Verify

1. **Normal Mode:** Observe animations and transitions
2. **Reduced Motion:** Enable in DevTools > More tools > Rendering > Emulate CSS media feature prefers-reduced-motion

---

## Functional Testing

### Test Case 13: Wishlist Selector Dropdown

#### Verification Steps

**13.1 Open/Close Functionality**

- [ ] Clicking selector button opens dropdown
- [ ] Dropdown appears below button
- [ ] Dropdown has smooth fade-in and slide animation
- [ ] Clicking selector button again closes dropdown
- [ ] Dropdown has shadow-lg
- [ ] Dropdown has border-radius-lg
- [ ] Dropdown has max-height 400px
- [ ] Dropdown scrolls if content exceeds max-height

**13.2 Keyboard Navigation**

- [ ] Tab key focuses selector button
- [ ] Enter/Space key opens dropdown
- [ ] Arrow keys navigate between wishlist options
- [ ] Enter key selects focused wishlist
- [ ] Escape key closes dropdown
- [ ] Focus returns to selector button after close

**13.3 Click Outside to Close**

- [ ] Clicking outside dropdown closes it
- [ ] Clicking on another element closes dropdown
- [ ] Dropdown closes without selecting any option

**13.4 Wishlist Options**

- [ ] All wishlists are displayed in dropdown
- [ ] Wishlist names are displayed correctly
- [ ] Item counts are displayed correctly
- [ ] Default wishlist has "DEFAULT" badge
- [ ] Selected wishlist is highlighted (blue background)
- [ ] Hovering over option shows background change

**13.5 Selection Behavior**

- [ ] Clicking a wishlist selects it
- [ ] Dropdown closes after selection
- [ ] Selected wishlist displays in selector button
- [ ] Grid updates with selected wishlist items
- [ ] Previous selection is cleared
- [ ] URL updates with wishlist ID (if applicable)

**13.6 Dropdown Arrow**

- [ ] Arrow points down when dropdown is closed
- [ ] Arrow rotates 180° when dropdown is open
- [ ] Arrow transition is smooth (150ms)

#### Expected Results

- Dropdown opens and closes smoothly
- Keyboard navigation works correctly
- Selection updates the page immediately
- No console errors

---

### Test Case 14: Search Functionality

#### Verification Steps

**14.1 Search Input**

- [ ] Search input accepts text input
- [ ] Search icon is visible on left side
- [ ] Clear button appears when text is entered
- [ ] Clear button is hidden when input is empty
- [ ] Placeholder text is visible when empty
- [ ] Placeholder text is "Search wishlist..."

**14.2 Search Behavior**

- [ ] Typing filters items in real-time
- [ ] Search is case-insensitive
- [ ] Search matches product names
- [ ] Search matches SKU codes
- [ ] Empty search shows all items
- [ ] No results shows empty state

**14.3 Clear Button**

- [ ] Clicking clear button clears search input
- [ ] Clear button has hover effect
- [ ] Clear button has circular background on hover
- [ ] Clear button is properly positioned

**14.4 Input States**

- [ ] Input has border on focus
- [ ] Input has blue box-shadow on focus
- [ ] Input has focus ring on keyboard focus
- [ ] Input border darkens on hover

#### Expected Results

- Search filters items correctly
- Real-time filtering works smoothly
- Clear button functions correctly
- No lag in search performance

---

### Test Case 15: Sort and Filter Dropdowns

#### Verification Steps

**15.1 Sort Dropdown**

- [ ] Sort dropdown has all options:
  - [ ] "Added: Newest first" (default)
  - [ ] "Added: Oldest first"
  - [ ] "Name: A-Z"
  - [ ] "Name: Z-A"
  - [ ] "Price: Low to High"
  - [ ] "Price: High to Low"
- [ ] Changing sort option reorders items
- [ ] Sort is applied immediately
- [ ] Selected option is displayed

**15.2 Filter Dropdown**

- [ ] Filter dropdown has all options:
  - [ ] "All items" (default)
  - [ ] "In stock"
  - [ ] "Out of stock"
- [ ] Changing filter option filters items
- [ ] Filter is applied immediately
- [ ] Selected option is displayed

**15.3 Combined Sort and Filter**

- [ ] Sort and filter work together
- [ ] Items are both sorted and filtered
- [ ] Results are correct

**15.4 Dropdown States**

- [ ] Dropdowns have border on focus
- [ ] Dropdowns have blue box-shadow on focus
- [ ] Dropdowns have focus ring on keyboard focus
- [ ] Dropdowns have hover border effect

#### Expected Results

- Sort options work correctly
- Filter options work correctly
- Combined sort and filter works correctly
- No performance issues

---

### Test Case 16: Select All / Deselect All

#### Verification Steps

**16.1 Select All Checkbox**

- [ ] Checkbox is visible in toolbar
- [ ] Checkbox label is "Select all"
- [ ] Checkbox has focus ring on keyboard focus
- [ ] Checkbox scales on hover

**16.2 Select All Behavior**

- [ ] Clicking checkbox selects all visible items
- [ ] All item checkboxes become checked
- [ ] Selected items count updates
- [ ] Bulk action buttons become enabled
- [ ] Cards get selected outline

**16.3 Deselect All Behavior**

- [ ] Clicking checked checkbox deselects all items
- [ ] All item checkboxes become unchecked
- [ ] Selected items count becomes 0
- [ ] Bulk action buttons become disabled
- [ ] Cards lose selected outline

**16.4 Partial Selection**

- [ ] Selecting individual items shows partial state
- [ ] Select all checkbox shows indeterminate state
- [ ] Clicking select all selects remaining items
- [ ] Clicking select all again deselects all items

**16.5 With Search/Filter**

- [ ] Select all only selects filtered items
- [ ] Deselect all deselects filtered items
- [ ] Hidden items are not affected

#### Expected Results

- Select all works correctly
- Deselect all works correctly
- Partial selection works correctly
- Works with search and filter

---

### Test Case 17: Bulk Move to Cart

#### Verification Steps

**17.1 Button State**

- [ ] Button is disabled when no items selected
- [ ] Button is enabled when items selected
- [ ] Button shows "Move to Cart" text
- [ ] Button has hover effect

**17.2 Move to Cart Behavior**

- [ ] Clicking button moves selected items to cart
- [ ] Button shows loading spinner during operation
- [ ] Button is disabled during operation
- [ ] Success toast appears after completion
- [ ] Items are removed from wishlist
- [ ] Selection is cleared after completion
- [ ] Button returns to normal state

**17.3 Out of Stock Items**

- [ ] Error toast appears if any items are out of stock
- [ ] Items are not moved to cart
- [ ] Button remains enabled
- [ ] Error message is clear

**17.4 Empty Selection**

- [ ] Button cannot be clicked when no items selected
- [ ] Button has disabled styling

**17.5 Mobile Sticky CTA**

- [ ] Mobile CTA has "Move to Cart" button
- [ ] Button behavior matches desktop
- [ ] Loading spinner appears in mobile CTA

#### Expected Results

- Bulk move works correctly
- Loading state is visible
- Success/error messages are clear
- Items are removed from wishlist

---

### Test Case 18: Bulk Remove

#### Verification Steps

**18.1 Button State**

- [ ] Button is disabled when no items selected
- [ ] Button is enabled when items selected
- [ ] Button shows "Remove" text
- [ ] Button has danger styling (red color)
- [ ] Button has hover effect

**18.2 Remove Behavior**

- [ ] Clicking button removes selected items
- [ ] Button shows loading spinner during operation
- [ ] Button is disabled during operation
- [ ] Success toast appears after completion
- [ ] Items are removed from wishlist
- [ ] Selection is cleared after completion
- [ ] Button returns to normal state

**18.3 Empty Selection**

- [ ] Button cannot be clicked when no items selected
- [ ] Button has disabled styling

**18.4 Mobile Sticky CTA**

- [ ] Mobile CTA has "Remove" button
- [ ] Button behavior matches desktop
- [ ] Loading spinner appears in mobile CTA

#### Expected Results

- Bulk remove works correctly
- Loading state is visible
- Success messages are clear
- Items are removed permanently

---

### Test Case 19: Individual Item Add to Cart

#### Verification Steps

**19.1 Button State**

- [ ] Button shows "Add to Cart" text
- [ ] Button is enabled for in-stock items
- [ ] Button is disabled for out-of-stock items
- [ ] Out-of-stock items show "Out of Stock" text
- [ ] Button has hover effect

**19.2 Add to Cart Behavior**

- [ ] Clicking button adds item to cart
- [ ] Success toast appears
- [ ] Item remains in wishlist
- [ ] Button remains enabled

**19.3 Out of Stock**

- [ ] Button is disabled
- [ ] Button shows "Out of Stock" text
- [ ] Button has disabled styling
- [ ] No action on click

**19.4 Loading State**

- [ ] No loading state on individual add (instant)

#### Expected Results

- Individual add works correctly
- Out-of-stock items are properly disabled
- Success messages are clear

---

### Test Case 20: Individual Item Remove

#### Verification Steps

**20.1 Remove Button**

- [ ] Remove button is circular
- [ ] Remove button has X icon
- [ ] Remove button is positioned at top-right of card
- [ ] Remove button has red color
- [ ] Remove button has hover effect (white background, red icon)
- [ ] Remove button scales on hover
- [ ] Remove button has focus ring on keyboard focus

**20.2 Remove Behavior**

- [ ] Clicking remove button removes item
- [ ] Success toast appears
- [ ] Item is removed from grid
- [ ] Other items reflow to fill space
- [ ] No page reload occurs

**20.3 Confirmation**

- [ ] No confirmation dialog (direct removal)
- [ ] Toast provides feedback

**20.4 Keyboard Access**

- [ ] Tab key focuses remove button
- [ ] Enter/Space key removes item
- [ ] Focus ring is visible

#### Expected Results

- Remove works correctly
- No confirmation needed
- Smooth removal animation
- Toast provides feedback

---

### Test Case 21: Mobile Sticky CTA Close Button

#### Verification Steps

**21.1 Close Button**

- [ ] Close button (X) is visible on mobile CTA
- [ ] Close button is positioned at right
- [ ] Close button has X icon
- [ ] Close button has hover effect

**21.2 Close Behavior**

- [ ] Clicking close button hides mobile CTA
- [ ] CTA disappears smoothly
- [ ] Selection is NOT cleared
- [ ] Items remain selected
- [ ] Bulk actions in toolbar remain enabled

**21.3 Reopen Behavior**

- [ ] Selecting additional items reopens CTA
- [ ] CTA reappears at bottom
- [ ] CTA shows updated count

**21.4 Keyboard Access**

- [ ] Tab key focuses close button
- [ ] Enter/Space key closes CTA
- [ ] Focus ring is visible

#### Expected Results

- Close button works correctly
- Selection is preserved
- CTA can be reopened

---

### Test Case 22: Product Navigation

#### Verification Steps

**22.1 Product Image Click**

- [ ] Clicking product image navigates to product page
- [ ] Navigation uses Next.js router
- [ ] No full page reload occurs
- [ ] URL updates to `/products/{productId}`
- [ ] Browser back button returns to wishlist

**22.2 Product Name Click**

- [ ] Clicking product name navigates to product page
- [ ] Navigation uses Next.js router
- [ ] No full page reload occurs
- [ ] URL updates to `/products/{productId}`
- [ ] Browser back button returns to wishlist

**22.3 Hover State**

- [ ] Product name changes color on hover (blue)
- [ ] Cursor changes to pointer
- [ ] Underline appears (optional)

**22.4 Keyboard Access**

- [ ] Tab key focuses product name
- [ ] Enter key navigates to product page
- [ ] Focus ring is visible

#### Expected Results

- Navigation works correctly
- Uses Next.js router (soft navigation)
- No page reload
- Back button works

---

### Test Case 23: Toast Notifications

#### Verification Steps

**23.1 Success Toast**

- [ ] Success toast appears for successful operations
- [ ] Toast has green background (#D1FAE5)
- [ ] Toast has green text (#065F46)
- [ ] Toast has green left border (4px)
- [ ] Toast has success icon
- [ ] Toast displays correct message
- [ ] Toast auto-dismisses after 3 seconds
- [ ] Toast has close button
- [ ] Toast slides in from right

**23.2 Error Toast**

- [ ] Error toast appears for failed operations
- [ ] Toast has red background (#FEE2E2)
- [ ] Toast has red text (#991B1B)
- [ ] Toast has red left border (4px)
- [ ] Toast has error icon
- [ ] Toast displays correct message
- [ ] Toast auto-dismisses after 5 seconds
- [ ] Toast has close button

**23.3 Info Toast**

- [ ] Info toast appears for informational messages
- [ ] Toast has blue background (#DBEAFE)
- [ ] Toast has blue text (#1E40AF)
- [ ] Toast has blue left border (4px)
- [ ] Toast has info icon

**23.4 Toast Position**

- [ ] Toast appears at top-right
- [ ] Toast has proper margin from edges
- [ ] Toast does not overlap header
- [ ] Multiple toasts stack vertically

**23.5 Toast Close**

- [ ] Clicking close button dismisses toast
- [ ] Close button has hover effect
- [ ] Close button is keyboard accessible

#### Expected Results

- Toasts appear for all operations
- Toasts have correct styling
- Toasts auto-dismiss correctly
- Toasts are dismissible

---

### Test Case 24: Loading States

#### Verification Steps

**24.1 Page Loading**

- [ ] Loading spinner appears on initial page load
- [ ] Spinner is centered
- [ ] "Loading wishlist..." text appears below spinner
- [ ] Spinner rotates smoothly
- [ ] Grid is not visible during loading

**24.2 Bulk Operation Loading**

- [ ] Loading spinner appears in button during bulk operations
- [ ] Button text is replaced with spinner
- [ ] Button is disabled during loading
- [ ] Spinner is small (1rem)
- [ ] Spinner rotates smoothly

**24.3 Skeleton Loading**

- [ ] Skeleton cards appear during data fetching
- [ ] Skeleton has shimmer animation
- [ ] Skeleton matches card layout
- [ ] Skeleton has proper dimensions
- [ ] Skeleton has gray gradient background

**24.4 Loading Transitions**

- [ ] Loading state appears smoothly
- [ ] Loading state disappears smoothly
- [ ] No layout shifts during loading
- [ ] Content fades in after loading

#### Expected Results

- Loading states are visible
- Loading states are smooth
- No layout shifts
- Clear feedback to user

---

### Test Case 25: Empty State

#### Verification Steps

**25.1 Empty Wishlist**

- [ ] Empty state appears when wishlist has no items
- [ ] Empty icon is displayed
- [ ] Icon has pulse animation
- [ ] Title "Your wishlist is empty" is displayed
- [ ] Description is displayed
- [ ] "Start Shopping" button is displayed
- [ ] Clicking button navigates to shop/home

**25.2 No Search Results**

- [ ] Empty state appears when search has no results
- [ ] Title "No items found" is displayed
- [ ] Description "Try adjusting your search or filters" is displayed
- [ ] "Clear Filters" button is displayed
- [ ] Clicking button clears search and filters

**25.3 Empty State Styling**

- [ ] Empty state is centered
- [ ] Empty state has proper padding
- [ ] Icon has proper size (120px)
- [ ] Icon has gray color
- [ ] Buttons have hover effects
- [ ] Buttons have focus rings

#### Expected Results

- Empty state displays correctly
- Buttons navigate correctly
- Styling is consistent

---

## Accessibility Testing

### Test Case 26: Keyboard Navigation

#### Verification Steps

**26.1 Tab Navigation**

- [ ] Tab key moves focus to next interactive element
- [ ] Focus order is logical (left to right, top to bottom)
- [ ] Focus rings are visible on all elements
- [ ] Shift+Tab moves focus to previous element
- [ ] Focus does not get trapped
- [ ] Focus wraps around when reaching end

**26.2 Enter/Space Keys**

- [ ] Enter key activates buttons
- [ ] Space key activates buttons
- [ ] Enter key selects dropdown options
- [ ] Space key toggles checkboxes
- [ ] Enter key navigates links

**26.3 Arrow Keys**

- [ ] Arrow Up/Down navigates dropdown options
- [ ] Arrow keys navigate within dropdown
- [ ] Arrow keys wrap around dropdown options

**26.4 Escape Key**

- [ ] Escape key closes dropdowns
- [ ] Escape key closes modals
- [ ] Escape key returns focus to trigger element

**26.5 Focus Management**

- [ ] Focus is visible on all interactive elements
- [ ] Focus rings have 2px width
- [ ] Focus rings have blue color (#3B82F6)
- [ ] Focus rings have 2px offset
- [ ] Focus does not disappear unexpectedly
- [ ] Focus is not lost during interactions

#### How to Verify

1. Use Tab key to navigate through page
2. Use Enter/Space to activate elements
3. Use Arrow keys in dropdowns
4. Use Escape to close dropdowns/modals
5. Verify focus rings are visible

---

### Test Case 27: Screen Reader Compatibility

#### Verification Steps

**27.1 Semantic HTML**

- [ ] Page has proper heading hierarchy (h1, h2, h3)
- [ ] Buttons have button elements
- [ ] Links have anchor elements
- [ ] Inputs have label elements
- [ ] Form elements have associated labels

**27.2 ARIA Labels**

- [ ] Wishlist selector has `aria-expanded` attribute
- [ ] Wishlist selector has `aria-haspopup` attribute
- [ ] Dropdown options have `aria-selected` attribute
- [ ] Mobile CTA has `role="region"`
- [ ] Mobile CTA has `aria-label`
- [ ] Remove buttons have `aria-label`
- [ ] Icons have `aria-hidden="true"` (if decorative)

**27.3 Screen Reader Announcements**

- [ ] Toast notifications are announced
- [ ] Loading states are announced
- [ ] Error messages are announced
- [ ] Success messages are announced
- [ ] Item count changes are announced

**27.4 Live Regions**

- [ ] Toast notifications use live regions
- [ ] Dynamic content updates are announced
- [ ] Status changes are announced

#### How to Verify

1. Enable screen reader (NVDA on Windows, VoiceOver on Mac)
2. Navigate through page using keyboard
3. Verify all elements are announced correctly
4. Verify ARIA labels are read
5. Verify dynamic content is announced

---

### Test Case 28: Skip Link Functionality

#### Verification Steps

**28.1 Skip Link Visibility**

- [ ] Skip link is present in DOM
- [ ] Skip link is hidden by default (top: -100%)
- [ ] Skip link becomes visible on focus (top: 0)
- [ ] Skip link has high z-index (9999)

**28.2 Skip Link Behavior**

- [ ] Tab key focuses skip link first
- [ ] Skip link is visible when focused
- [ ] Enter key activates skip link
- [ ] Focus moves to main content
- [ ] Skip link text is "Skip to content"

**28.3 Skip Link Styling**

- [ ] Skip link has black background
- [ ] Skip link has white text
- [ ] Skip link has bold font weight
- [ ] Skip link has proper padding
- [ ] Skip link has focus ring

#### How to Verify

1. Press Tab key on page load
2. Verify skip link appears
3. Press Enter to activate
4. Verify focus moves to main content

---

### Test Case 29: High Contrast Mode

#### Verification Steps

**29.1 High Contrast Support**

- [ ] Page respects `prefers-contrast: high`
- [ ] Text colors are pure black (#000000)
- [ ] Secondary text is dark gray (#333333)
- [ ] Border colors are black (#000000)
- [ ] Focus rings are black (#000000)
- [ ] All text is readable

**29.2 High Contrast Styling**

- [ ] Backgrounds have sufficient contrast
- [ ] Borders are clearly visible
- [ ] Focus rings are clearly visible
- [ ] No low-contrast elements

#### How to Verify

1. Open Chrome DevTools (F12)
2. Go to More tools > Rendering
3. Enable "Emulate CSS media feature prefers-contrast: high"
4. Verify contrast is sufficient

---

### Test Case 30: Reduced Motion

#### Verification Steps

**30.1 Reduced Motion Support**

- [ ] Page respects `prefers-reduced-motion: reduce`
- [ ] All animations are disabled
- [ ] All transitions are instant (0.01ms)
- [ ] No motion effects

**30.2 Reduced Motion Elements**

- [ ] Shimmer animation is disabled
- [ ] Spin animation is disabled
- [ ] Pulse animation is disabled
- [ ] SlideIn animation is disabled
- [ ] Hover transitions are instant
- [ ] Card lift effects are instant

#### How to Verify

1. Open Chrome DevTools (F12)
2. Go to More tools > Rendering
3. Enable "Emulate CSS media feature prefers-reduced-motion: reduce"
4. Verify all animations are disabled

---

### Test Case 31: Focus Management

#### Verification Steps

**31.1 Focus Visibility**

- [ ] Focus rings appear on all interactive elements
- [ ] Focus rings have 2px width
- [ ] Focus rings have blue color (#3B82F6)
- [ ] Focus rings have 2px offset
- [ ] Focus rings do not overlap content

**31.2 Focus Order**

- [ ] Focus order is logical
- [ ] Focus moves left to right, top to bottom
- [ ] Focus does not jump unexpectedly
- [ ] Focus wraps around at end

**31.3 Focus Trapping**

- [ ] Modals trap focus within modal
- [ ] Dropdowns trap focus within dropdown
- [ ] Focus returns to trigger after close

**31.4 Focus Restoration**

- [ ] Focus is restored after modal close
- [ ] Focus is restored after dropdown close
- [ ] Focus is not lost during interactions

#### How to Verify

1. Use Tab key to navigate
2. Verify focus order is logical
3. Open and close modals/dropdowns
4. Verify focus is restored

---

### Test Case 32: Color Contrast

#### Verification Steps

**32.1 Text Contrast**

- [ ] Primary text (#111827) on white background meets WCAG AA (4.5:1)
- [ ] Secondary text (#6B7280) on white background meets WCAG AA (4.5:1)
- [ ] Tertiary text (#9CA3AF) on white background meets WCAG AA (4.5:1)
- [ ] White text (#FFFFFF) on black background meets WCAG AA (4.5:1)

**32.2 Button Contrast**

- [ ] Button text meets WCAG AA
- [ ] Disabled button text meets WCAG AA
- [ ] Button backgrounds have sufficient contrast

**32.3 Icon Contrast**

- [ ] Icons have sufficient contrast
- [ ] Disabled icons have sufficient contrast
- [ ] Hover states have sufficient contrast

#### How to Verify

1. Use axe DevTools extension
2. Run accessibility audit
3. Verify no contrast errors
4. Or use WebAIM Contrast Checker

---

### Test Case 33: Touch Targets

#### Verification Steps

**33.1 Touch Target Size**

- [ ] All buttons have minimum 44x44px touch target
- [ ] All links have minimum 44x44px touch target
- [ ] All checkboxes have minimum 44x44px touch target
- [ ] All dropdowns have minimum 44x44px touch target

**33.2 Touch Target Spacing**

- [ ] Touch targets have adequate spacing
- [ ] Touch targets do not overlap
- [ ] Touch targets are easily tappable

#### How to Verify

1. Use DevTools to measure element sizes
2. Verify all interactive elements are at least 44x44px
3. Test on actual mobile device

---

## Performance Testing

### Test Case 34: Image Optimization

#### Verification Steps

**34.1 Next.js Image Component**

- [ ] All product images use Next.js Image component
- [ ] Images have proper width and height attributes
- [ ] Images have proper aspect ratio
- [ ] Images have alt text
- [ ] Images are lazy loaded

**34.2 Image Loading**

- [ ] Images load progressively
- [ ] Images have blur-up placeholder
- [ ] Images do not cause layout shift
- [ ] Images load in correct order

**34.3 Image Formats**

- [ ] Images use WebP format (when supported)
- [ ] Images use appropriate format for browser
- [ ] Images are properly sized for device

**34.4 Image Performance**

- [ ] Largest Contentful Paint (LCP) is < 2.5s
- [ ] Cumulative Layout Shift (CLS) is < 0.1
- [ ] Images do not block rendering

#### How to Verify

1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Reload page
4. Verify images are loaded with Next.js optimization
5. Check Lighthouse score for images

---

### Test Case 35: Animation Performance

#### Verification Steps

**35.1 Smooth Animations**

- [ ] All animations run at 60fps
- [ ] No janky animations
- [ ] No dropped frames
- [ ] Animations use GPU acceleration

**35.2 Transition Performance**

- [ ] Transitions are smooth
- [ ] No layout thrashing
- [ ] No repaints during transitions
- [ ] Transitions use transform and opacity

**35.3 Animation Cleanup**

- [ ] Animations do not continue after element removal
- [ ] No memory leaks from animations
- [ ] Animations are properly cleaned up

#### How to Verify

1. Open Chrome DevTools (F12)
2. Go to Performance tab
3. Record page interactions
4. Analyze frames per second
5. Check for jank

---

### Test Case 36: Layout Stability

#### Verification Steps

**36.1 Cumulative Layout Shift (CLS)**

- [ ] CLS score is < 0.1
- [ ] No unexpected layout shifts
- [ ] Images have reserved space
- [ ] Dynamic content has reserved space

**36.2 Layout Shift Prevention**

- [ ] Images have aspect ratio
- [ ] Skeleton loaders reserve space
- [ ] No content jumps during loading
- [ ] No content jumps after loading

#### How to Verify

1. Open Chrome DevTools (F12)
2. Go to Lighthouse
3. Run performance audit
4. Check CLS score
5. Check for layout shift issues

---

### Test Case 37: CSS File Size

#### Verification Steps

**37.1 CSS File Size**

- [ ] WishlistPage.css file size is reasonable (< 50KB)
- [ ] CSS is minified in production
- [ ] No unused CSS
- [ ] CSS is optimized

**37.2 CSS Performance**

- [ ] CSS loads quickly
- [ ] CSS does not block rendering
- [ ] CSS is properly cached

#### How to Verify

1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Check CSS file size
4. Verify CSS is minified in production

---

### Test Case 38: Lighthouse Performance

#### Verification Steps

**38.1 Performance Score**

- [ ] Performance score is > 90
- [ ] First Contentful Paint (FCP) is < 1.8s
- [ ] Largest Contentful Paint (LCP) is < 2.5s
- [ ] Time to Interactive (TTI) is < 3.8s
- [ ] Total Blocking Time (TBT) is < 200ms
- [ ] Cumulative Layout Shift (CLS) is < 0.1
- [ ] Speed Index is < 3.4s

**38.2 Accessibility Score**

- [ ] Accessibility score is > 90
- [ ] No accessibility issues
- [ ] All ARIA attributes are correct
- [ ] All form elements have labels

**38.3 Best Practices Score**

- [ ] Best Practices score is > 90
- [ ] No console errors
- [ ] No security issues
- [ ] HTTPS is used

**38.4 SEO Score**

- [ ] SEO score is > 90
- [ ] Meta tags are present
- [ ] Heading hierarchy is correct
- [ ] Images have alt text

#### How to Verify

1. Open Chrome DevTools (F12)
2. Go to Lighthouse
3. Run comprehensive audit
4. Check all scores
5. Address any issues

---

### Test Case 39: Bundle Size

#### Verification Steps

**39.1 JavaScript Bundle**

- [ ] Wishlist page bundle size is reasonable
- [ ] No unnecessary dependencies
- [ ] Code is properly split
- [ ] Bundle is tree-shaken

**39.2 CSS Bundle**

- [ ] CSS bundle size is reasonable
- [ ] No duplicate CSS
- [ ] CSS is properly scoped

#### How to Verify

1. Run `npm run build`
2. Check build output
3. Analyze bundle sizes
4. Use webpack-bundle-analyzer if needed

---

### Test Case 40: Runtime Performance

#### Verification Steps

**40.1 Initial Load**

- [ ] Page loads quickly
- [ ] No blocking scripts
- [ ] No blocking styles
- [ ] Content renders progressively

**40.2 Interactions**

- [ ] Clicks respond quickly
- [ ] Hover effects are smooth
- [ ] Dropdowns open quickly
- [ ] No lag in interactions

**40.3 Data Fetching**

- [ ] API requests are fast
- [ ] Data loads efficiently
- [ ] No unnecessary requests
- [ ] Requests are properly cached

#### How to Verify

1. Open Chrome DevTools (F12)
2. Go to Performance tab
3. Record page interactions
4. Analyze performance metrics
5. Check for bottlenecks

---

## Common Issues and Solutions

### Issue 1: Grid Layout Breaks on Mobile

**Symptoms:**

- Cards overflow viewport
- Horizontal scrolling appears
- Cards are not aligned

**Possible Causes:**

- Grid gap too large
- Card width not constrained
- Padding/margin issues

**Solutions:**

1. Check grid gap value (should be 16px on mobile)
2. Verify card width is 100%
3. Check padding on main content
4. Ensure no fixed widths on cards

**Verification:**

```css
/* Expected CSS */
.wishlist-grid {
  grid-template-columns: 1fr;
  gap: var(--wishlist-spacing-md);
}
```

---

### Issue 2: Mobile Sticky CTA Overlaps Content

**Symptoms:**

- CTA covers bottom of content
- Content is not accessible
- Buttons cannot be clicked

**Possible Causes:**

- CTA z-index too low
- Content padding insufficient
- CTA height not accounted for

**Solutions:**

1. Add bottom padding to main content
2. Increase CTA z-index
3. Ensure content has enough space

**Verification:**

```css
/* Expected CSS */
.mobile-sticky-cta {
  z-index: var(--wishlist-z-fixed);
}

.wishlist-main-content {
  padding-bottom: 80px; /* Space for CTA */
}
```

---

### Issue 3: Focus Ring Not Visible

**Symptoms:**

- No focus ring when using keyboard
- Focus ring too thin
- Focus ring color blends with background

**Possible Causes:**

- Focus ring color matches background
- Focus ring width too small
- Focus ring offset too large

**Solutions:**

1. Increase focus ring width to 2px
2. Use high contrast color (#3B82F6)
3. Reduce offset to 2px

**Verification:**

```css
/* Expected CSS */
*:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
```

---

### Issue 4: Dropdown Closes Immediately

**Symptoms:**

- Dropdown opens then closes immediately
- Cannot select options
- Click outside triggers unexpectedly

**Possible Causes:**

- Event propagation issue
- Click handler on parent
- Z-index issue

**Solutions:**

1. Stop event propagation on dropdown click
2. Use proper event handlers
3. Check z-index hierarchy

**Verification:**

```javascript
// Expected behavior
const handleDropdownClick = (e) => {
  e.stopPropagation();
  // Toggle dropdown
};
```

---

### Issue 5: Images Load Slowly

**Symptoms:**

- Images take long to load
- Layout shifts during loading
- Poor Lighthouse score

**Possible Causes:**

- Images not optimized
- No lazy loading
- Large image file sizes

**Solutions:**

1. Use Next.js Image component
2. Enable lazy loading
3. Optimize image sizes
4. Use WebP format

**Verification:**

```jsx
// Expected code
<Image
  src={product.image}
  alt={product.name}
  width={400}
  height={500}
  loading="lazy"
/>
```

---

### Issue 6: Animations Janky

**Symptoms:**

- Animations not smooth
- Dropped frames
- Poor performance

**Possible Causes:**

- Animating non-composite properties
- Too many animations
- No GPU acceleration

**Solutions:**

1. Use transform and opacity only
2. Enable GPU acceleration
3. Reduce animation complexity
4. Use will-change property

**Verification:**

```css
/* Expected CSS */
.card {
  transition: transform 0.2s ease-in-out;
  will-change: transform;
}

.card:hover {
  transform: translateY(-4px);
}
```

---

### Issue 7: Toast Notifications Not Appearing

**Symptoms:**

- No toast notifications
- Toasts appear then disappear
- Toasts not positioned correctly

**Possible Causes:**

- Z-index too low
- Toast container missing
- Toast duration too short

**Solutions:**

1. Check z-index (should be 1000)
2. Ensure toast container exists
3. Increase toast duration
4. Check toast positioning

**Verification:**

```css
/* Expected CSS */
.toast {
  z-index: var(--wishlist-z-toast);
  position: fixed;
  top: var(--wishlist-spacing-lg);
  right: var(--wishlist-spacing-lg);
}
```

---

### Issue 8: Select All Not Working

**Symptoms:**

- Select all does not select items
- Partial selection not working
- Checkbox state incorrect

**Possible Causes:**

- State management issue
- Filtered items not handled
- Checkbox logic error

**Solutions:**

1. Check state management
2. Handle filtered items correctly
3. Verify checkbox logic
4. Check isAllSelected calculation

**Verification:**

```javascript
// Expected behavior
const isAllSelected =
  filteredItems.length > 0 &&
  filteredItems.every((item) => selectedItems.includes(item.id));
```

---

### Issue 9: Keyboard Navigation Broken

**Symptoms:**

- Tab key does not work
- Focus gets trapped
- Focus order incorrect

**Possible Causes:**

- Elements not focusable
- Tabindex incorrect
- Focus management issue

**Solutions:**

1. Ensure all interactive elements are focusable
2. Check tabindex values
3. Implement proper focus management
4. Verify focus order

**Verification:**

- All buttons have `type="button"`
- All inputs have proper labels
- No negative tabindex values
- Focus order is logical

---

### Issue 10: Contrast Issues

**Symptoms:**

- Text hard to read
- Low contrast score in Lighthouse
- Accessibility issues

**Possible Causes:**

- Color values too similar
- Background and text colors blend
- Disabled states not visible

**Solutions:**

1. Increase color contrast
2. Use darker text colors
3. Ensure disabled states are visible
4. Test with contrast checker

**Verification:**

```css
/* Expected colors */
--wishlist-text-primary: #111827; /* Dark enough */
--wishlist-text-secondary: #6b7280; /* Dark enough */
--wishlist-bg-primary: #f3f4f6; /* Light enough */
```

---

### Issue 11: Layout Shift on Load

**Symptoms:**

- Content jumps during loading
- CLS score high
- Poor user experience

**Possible Causes:**

- Images have no dimensions
- Dynamic content not reserved
- Loading state not implemented

**Solutions:**

1. Add image dimensions
2. Use skeleton loaders
3. Reserve space for dynamic content
4. Implement loading states

**Verification:**

```jsx
// Expected code
<Image
  src={product.image}
  alt={product.name}
  width={400}
  height={500}
  priority={index < 4}
/>
```

---

### Issue 12: Mobile CTA Not Visible

**Symptoms:**

- Mobile CTA does not appear
- CTA always visible on desktop
- CTA not responsive

**Possible Causes:**

- Media query incorrect
- Display property wrong
- Z-index issue

**Solutions:**

1. Check media query breakpoints
2. Verify display property
3. Ensure z-index is correct
4. Check visibility logic

**Verification:**

```css
/* Expected CSS */
@media (min-width: 768px) {
  .mobile-sticky-cta {
    display: none;
  }
}

.mobile-sticky-cta {
  display: block;
}
```

---

## Browser Compatibility Notes

### Chrome/Edge (Chromium)

**Supported Features:**

- All CSS custom properties
- All modern CSS features
- Next.js Image optimization
- All interactive states

**Known Issues:**

- None significant

**Testing Priority:**

- Primary testing browser
- Full feature support

---

### Firefox

**Supported Features:**

- All CSS custom properties
- Most modern CSS features
- Next.js Image optimization
- All interactive states

**Known Issues:**

- Focus ring may appear slightly different
- Some animation timing may vary

**Testing Priority:**

- Secondary testing browser
- Verify CSS compatibility

---

### Safari (macOS/iOS)

**Supported Features:**

- Most CSS custom properties
- Most modern CSS features
- Next.js Image optimization
- All interactive states

**Known Issues:**

- Flexbox gaps may have slight rendering differences
- Focus ring styling may differ
- Some border-radius rendering differences

**Testing Priority:**

- Important for Apple users
- Test on both macOS and iOS

**Specific Considerations:**

- Test on Safari 14+
- Test on iOS Safari
- Verify touch interactions
- Check scroll behavior

---

### Mobile Browsers

**Chrome Mobile (Android)**

- Full feature support
- Test on various Android versions
- Verify touch interactions
- Check scroll behavior

**Safari Mobile (iOS)**

- Most features supported
- Test on iOS 14+
- Verify touch interactions
- Check scroll behavior
- Note: Some CSS features may have limited support

---

### Legacy Browser Support

**Not Supported:**

- Internet Explorer 11
- Edge Legacy (non-Chromium)
- Safari < 14
- Firefox < 88

**Fallback Strategy:**

- Use progressive enhancement
- Provide basic functionality
- Graceful degradation

---

## Test Execution Checklist

### Pre-Testing Setup

- [ ] Development server is running
- [ ] Test data is available (wishlist items, multiple wishlists)
- [ ] Browser DevTools are open
- [ ] Testing tools are installed (axe DevTools, Lighthouse)
- [ ] Test environment is clean (no cache, no extensions)

---

### Responsive Design Tests

- [ ] Mobile layout (< 640px) - 1 column
- [ ] Tablet layout (640px-1023px) - 2 columns
- [ ] Desktop layout (1024px-1279px) - 3 columns
- [ ] Large Desktop layout (1280px+) - 4 columns
- [ ] Spacing and gaps at each breakpoint
- [ ] Header adaptation at each breakpoint
- [ ] Toolbar adaptation at each breakpoint
- [ ] Mobile sticky CTA visibility (visible on mobile, hidden on desktop)
- [ ] Orientation changes
- [ ] Touch target sizes

---

### Visual Design Tests

- [ ] CSS custom properties applied correctly
- [ ] Color palette verification
- [ ] Shadow system verification
- [ ] Border radius verification
- [ ] Typography scale verification
- [ ] Hover states on all interactive elements
- [ ] Active/pressed states on buttons
- [ ] Focus-visible states for keyboard navigation
- [ ] Transitions and animations
- [ ] Disabled states

---

### Functional Tests

- [ ] Wishlist selector dropdown (open/close, keyboard navigation, click outside, Escape)
- [ ] Search functionality (input, clear button)
- [ ] Sort dropdown (all options)
- [ ] Filter dropdown (all options)
- [ ] Select all/deselect all functionality
- [ ] Bulk move to cart (loading state, success/error)
- [ ] Bulk remove (loading state, success)
- [ ] Individual item add to cart
- [ ] Individual item remove
- [ ] Mobile sticky CTA close button
- [ ] Product navigation (Next.js router, no reload)
- [ ] Toast notifications (success, error, info)
- [ ] Loading states (page, bulk operations, skeleton)
- [ ] Empty state (empty wishlist, no search results)

---

### Accessibility Tests

- [ ] Keyboard navigation (Tab, Shift+Tab, Enter, Space, Arrow keys, Escape)
- [ ] Focus rings visible on all interactive elements
- [ ] Screen reader compatibility (ARIA labels, semantic HTML)
- [ ] Skip link functionality
- [ ] High contrast mode
- [ ] Reduced motion preference
- [ ] Focus management
- [ ] Color contrast (WCAG AA)
- [ ] Touch targets (minimum 44x44px)

---

### Performance Tests

- [ ] Image optimization (Next.js Image, lazy loading, WebP)
- [ ] Animation performance (60fps, no jank)
- [ ] Layout stability (CLS < 0.1)
- [ ] CSS file size (< 50KB)
- [ ] Lighthouse performance (> 90)
- [ ] Lighthouse accessibility (> 90)
- [ ] Lighthouse best practices (> 90)
- [ ] Lighthouse SEO (> 90)
- [ ] Bundle size verification
- [ ] Runtime performance (load time, interactions)

---

### Browser Compatibility Tests

- [ ] Chrome/Edge (full feature support)
- [ ] Firefox (CSS compatibility)
- [ ] Safari macOS (rendering differences)
- [ ] Safari iOS (touch interactions)
- [ ] Chrome Mobile (Android)
- [ ] Cross-browser consistency

---

### Regression Tests

- [ ] All previously working features still work
- [ ] No new console errors
- [ ] No new accessibility issues
- [ ] No performance degradation
- [ ] No visual regressions

---

## Test Results Template

### Test Execution Summary

| Category              | Total Tests | Passed | Failed | Blocked | Pass Rate |
| --------------------- | ----------- | ------ | ------ | ------- | --------- |
| Responsive Design     |             |        |        |         |           |
| Visual Design         |             |        |        |         |           |
| Functional            |             |        |        |         |           |
| Accessibility         |             |        |        |         |           |
| Performance           |             |        |        |         |           |
| Browser Compatibility |             |        |        |         |           |
| **TOTAL**             |             |        |        |         |           |

---

### Detailed Test Results

#### Responsive Design Tests

| Test ID | Test Name               | Status | Notes | Browser |
| ------- | ----------------------- | ------ | ----- | ------- |
| 1.1     | Header Layout (Mobile)  |        |       |         |
| 1.2     | Toolbar Layout (Mobile) |        |       |         |
| 1.3     | Grid Layout (Mobile)    |        |       |         |
| ...     | ...                     |        |       |         |

---

#### Visual Design Tests

| Test ID | Test Name         | Status | Notes | Browser |
| ------- | ----------------- | ------ | ----- | ------- |
| 7.1     | Color Palette     |        |       |         |
| 7.2     | Background Colors |        |       |         |
| 7.3     | Text Colors       |        |       |         |
| ...     | ...               |        |       |         |

---

#### Functional Tests

| Test ID | Test Name              | Status | Notes | Browser |
| ------- | ---------------------- | ------ | ----- | ------- |
| 13.1    | Dropdown Open/Close    |        |       |         |
| 13.2    | Keyboard Navigation    |        |       |         |
| 13.3    | Click Outside to Close |        |       |         |
| ...     | ...                    |        |       |         |

---

#### Accessibility Tests

| Test ID | Test Name        | Status | Notes | Browser |
| ------- | ---------------- | ------ | ----- | ------- |
| 26.1    | Tab Navigation   |        |       |         |
| 26.2    | Enter/Space Keys |        |       |         |
| 26.3    | Arrow Keys       |        |       |         |
| ...     | ...              |        |       |         |

---

#### Performance Tests

| Test ID | Test Name               | Status | Notes | Browser |
| ------- | ----------------------- | ------ | ----- | ------- |
| 34.1    | Next.js Image Component |        |       |         |
| 34.2    | Image Loading           |        |       |         |
| 34.3    | Image Formats           |        |       |         |
| ...     | ...                     |        |       |         |

---

## Conclusion

This comprehensive testing guide covers all aspects of the refactored wishlist page, including responsive design, visual design, functionality, accessibility, and performance. Follow this guide systematically to ensure the wishlist page meets all quality standards and provides an excellent user experience across all devices and browsers.

### Key Testing Principles

1. **Test Early, Test Often** - Start testing during development
2. **Test on Real Devices** - Emulators are good, real devices are better
3. **Test with Accessibility Tools** - Use screen readers and keyboard navigation
4. **Test Performance** - Monitor Lighthouse scores and runtime performance
5. **Test Cross-Browser** - Verify consistency across all supported browsers
6. **Document Results** - Keep detailed records of test results and issues

### Next Steps

1. Execute all test cases in this guide
2. Document any issues found
3. Fix issues and retest
4. Verify all tests pass
5. Sign off on testing completion

---

**Document Version:** 2.0  
**Last Updated:** 2026-02-15  
**Test Coverage:** Comprehensive  
**Status:** Ready for Execution
