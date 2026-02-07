# Smart Tech Header Redesign Specification
## Newegg.com Style 3-Row Layout

---

## Executive Summary

This document provides a comprehensive design specification for redesigning the Smart Tech header to match the Newegg.com 3-row layout while preserving all existing functionality. The new header will consist of three distinct rows:

1. **Utility Bar** (32px) - Top utility links and language toggle
2. **Main Header** (80px) - Logo, search bar, and user actions
3. **Navigation Bar** (44px) - Main navigation links

---

## 1. Component Hierarchy Diagram

```
Header (Main Container)
├── UtilityBar (Row 1 - 32px)
│   ├── UtilityLinks
│   │   ├── HelpCenterLink
│   │   ├── ContactUsLink
│   │   └── TrackOrderLink
│   └── LanguageToggle
│       ├── EnglishButton
│       └── BengaliButton
│
├── MainHeaderRow (Row 2 - 80px)
│   ├── LogoSection
│   │   ├── LogoBox (ST)
│   │   ├── BrandName (Smart Tech)
│   │   └── Tagline (Technologies Bangladesh)
│   ├── SearchSection
│   │   ├── SearchAutocomplete
│   │   └── SearchHint (Ctrl+K)
│   └── UserActionsSection
│       ├── UserMenuButton (if authenticated)
│       ├── CartButton (with badge)
│       └── LoginButton (if guest)
│
├── NavigationBar (Row 3 - 44px)
│   ├── DesktopNavLinks
│   │   ├── HomeLink
│   │   ├── ProductsLink
│   │   ├── AccountLink (protected)
│   │   ├── OrdersLink (protected)
│   │   ├── WishlistLink (protected)
│   │   └── CartLink (protected)
│   └── MobileMenuButton
│       ├── HamburgerIcon
│       └── MobileDrawer
│           └── MobileNavLinks
│
└── MobileDrawer (Overlay)
    ├── DrawerHeader
    │   ├── CloseButton
    │   └── MenuTitle
    └── DrawerContent
        ├── MobileNavLinks
        ├── UserSection (if authenticated)
        └── LogoutButton
```

---

## 2. Color Scheme

```css
/* Primary Colors */
--primary-blue: #0055a5;      /* Newegg primary blue */
--primary-dark: #003d75;      /* Darker blue for hover */
--dark-gray: #1a1a1a;         /* Dark gray for text */
--medium-gray: #666666;       /* Medium gray for secondary text */
--light-gray: #f5f5f5;        /* Light gray for backgrounds */
--white: #ffffff;             /* White background */
--border-color: #e5e5e5;      /* Border color */

/* Accent Colors */
--orange-accent: #ff6600;     /* Orange for CTAs and highlights */
--orange-hover: #e65c00;      /* Darker orange for hover */

/* Utility Colors */
--success: #28a745;           /* Success messages */
--error: #dc3545;             /* Error messages */
--warning: #ffc107;           /* Warning messages */
```

---

## 3. Complete HTML Structure with Tailwind Classes

### 3.1 Main Header Container

```tsx
<div className="sticky top-0 z-50 bg-white shadow-sm">
  {/* Row 1: Utility Bar */}
  <div className="h-8 bg-gray-100 border-b border-gray-200">
    {/* Utility Bar Content */}
  </div>

  {/* Row 2: Main Header */}
  <div className="h-20 bg-white border-b border-gray-200">
    {/* Main Header Content */}
  </div>

  {/* Row 3: Navigation Bar */}
  <div className="h-11 bg-primary-blue">
    {/* Navigation Bar Content */}
  </div>

  {/* Mobile Drawer */}
  {/* Mobile Drawer Content */}
</div>
```

---

### 3.2 Row 1: Utility Bar (32px)

```tsx
<div className="h-8 bg-gray-100 border-b border-gray-200">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
    <div className="flex items-center justify-between h-full">
      {/* Left: Utility Links */}
      <div className="flex items-center space-x-6">
        <a
          href="/help"
          className="text-xs text-gray-600 hover:text-primary-blue transition-colors"
        >
          Help Center
        </a>
        <a
          href="/contact"
          className="text-xs text-gray-600 hover:text-primary-blue transition-colors"
        >
          Contact Us
        </a>
        <a
          href="/track-order"
          className="text-xs text-gray-600 hover:text-primary-blue transition-colors"
        >
          Track Order
        </a>
      </div>

      {/* Right: Language Toggle */}
      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-600">
          {language === 'bn' ? 'ভাষা:' : 'Language:'}
        </span>
        <button
          onClick={() => handleLanguageChange('en')}
          className={cn(
            'px-2 py-0.5 rounded text-xs font-medium transition-colors',
            language === 'en'
              ? 'bg-primary-blue text-white'
              : 'bg-white text-gray-600 hover:bg-gray-200'
          )}
        >
          English
        </button>
        <button
          onClick={() => handleLanguageChange('bn')}
          className={cn(
            'px-2 py-0.5 rounded text-xs font-medium transition-colors',
            language === 'bn'
              ? 'bg-primary-blue text-white'
              : 'bg-white text-gray-600 hover:bg-gray-200'
          )}
        >
          বাংলা
        </button>
      </div>
    </div>
  </div>
</div>
```

---

### 3.3 Row 2: Main Header (80px)

```tsx
<div className="h-20 bg-white border-b border-gray-200">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
    <div className="flex items-center justify-between h-full">
      {/* Left: Logo Section */}
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-primary-blue rounded-lg flex items-center justify-center shadow-sm">
          <span className="text-white font-bold text-2xl">ST</span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-dark-gray leading-tight">
            {language === 'bn' ? 'স্মার্ট টেকনোব্স' : 'Smart Tech'}
          </h1>
          <p className="text-xs text-gray-600">
            {language === 'bn' ? 'বাংলাদেশ প্রক্ষর' : 'Technologies Bangladesh'}
          </p>
        </div>
      </div>

      {/* Center: Search Section */}
      <div className="hidden md:flex flex-1 max-w-2xl mx-8">
        <div className="relative w-full">
          <SearchAutocomplete
            placeholder={language === 'bn' ? 'পণ্য খুঁজুন...' : 'Search products...'}
            className="w-full"
          />
          <div className="mt-1 flex items-center">
            <span className="text-xs text-gray-400">
              Press{' '}
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-gray-600 text-xs">
                Ctrl
              </kbd>{' '}
              +{' '}
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-gray-600 text-xs">
                K
              </kbd>{' '}
              to search
            </span>
          </div>
        </div>
      </div>

      {/* Right: User Actions Section */}
      <div className="flex items-center space-x-4">
        {/* Authenticated User Menu */}
        {user ? (
          <div className="flex items-center space-x-4">
            {/* User Dropdown */}
            <div className="relative group">
              <button
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <UserIcon className="h-5 w-5" />
                <span className="text-sm font-medium hidden sm:inline">
                  {user.firstName}
                </span>
                <ChevronDown className="h-4 w-4" />
              </button>
              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <a
                  href="/account"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {language === 'bn' ? 'অ্যাকাউন্ট' : 'Account'}
                </a>
                <a
                  href="/orders"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {language === 'bn' ? 'অর্ডার' : 'Orders'}
                </a>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  {language === 'bn' ? 'লগ আউট' : 'Logout'}
                </button>
              </div>
            </div>

            {/* Cart Button */}
            <a
              href="/cart"
              className="relative flex items-center space-x-2 px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="text-sm font-medium hidden sm:inline">
                {language === 'bn' ? 'কার্ট' : 'Cart'}
              </span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-accent text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </a>
          </div>
        ) : (
          /* Guest User */
          <div className="flex items-center space-x-4">
            <a
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-primary-blue transition-colors"
            >
              {language === 'bn' ? 'লগ ইন' : 'Sign In'}
            </a>
            <a
              href="/register"
              className="px-4 py-2 bg-orange-accent text-white text-sm font-medium rounded-md hover:bg-orange-hover transition-colors"
            >
              {language === 'bn' ? 'নিবন্ধন' : 'Register'}
            </a>
            <a
              href="/cart"
              className="relative flex items-center space-x-2 px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-accent text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </a>
          </div>
        )}
      </div>
    </div>
  </div>
</div>
```

---

### 3.4 Row 3: Navigation Bar (44px)

```tsx
<div className="h-11 bg-primary-blue">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
    <div className="flex items-center justify-between h-full">
      {/* Left: Desktop Navigation Links */}
      <nav className="hidden md:flex items-center space-x-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          // Skip protected routes for non-authenticated users
          if (item.protected && !user) {
            return null;
          }

          return (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-colors rounded-md',
                {
                  'text-white hover:bg-primary-dark': !isActive(item.href),
                  'bg-orange-accent text-white': isActive(item.href)
                }
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>

      {/* Right: Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden flex items-center space-x-2 px-3 py-2 rounded-md text-white hover:bg-primary-dark transition-colors"
      >
        <Menu className="h-5 w-5" />
        <span className="text-sm font-medium">
          {language === 'bn' ? 'মেনু' : 'Menu'}
        </span>
      </button>
    </div>
  </div>
</div>
```

---

### 3.5 Mobile Drawer (Overlay)

```tsx
{/* Mobile Menu Overlay */}
{isMobileMenuOpen && (
  <>
    {/* Backdrop */}
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden"
      onClick={() => setIsMobileMenuOpen(false)}
    />

    {/* Drawer */}
    <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50 md:hidden transform transition-transform duration-300 ease-in-out">
      {/* Drawer Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-dark-gray">
          {language === 'bn' ? 'মেনু' : 'Menu'}
        </h2>
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Drawer Content */}
      <div className="p-4 overflow-y-auto h-full pb-20">
        {/* User Section (if authenticated) */}
        {user && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-blue rounded-full flex items-center justify-center">
                <UserIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-dark-gray">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-600">{user.email || user.phone}</p>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Search */}
        <div className="mb-6">
          <SearchAutocomplete
            placeholder={language === 'bn' ? 'পণ্য খুঁজুন...' : 'Search products...'}
            className="w-full"
          />
        </div>

        {/* Navigation Links */}
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            // Skip protected routes for non-authenticated users
            if (item.protected && !user) {
              return null;
            }

            return (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  'flex items-center space-x-3 px-4 py-3 text-sm font-medium transition-colors rounded-md',
                  {
                    'text-gray-700 hover:bg-gray-100': !isActive(item.href),
                    'bg-primary-blue text-white': isActive(item.href)
                  }
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </a>
            );
          })}
        </div>

        {/* Utility Links */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="space-y-1">
            <a
              href="/help"
              className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
            >
              {language === 'bn' ? 'সাহায্য কেন্দ্র' : 'Help Center'}
            </a>
            <a
              href="/contact"
              className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
            >
              {language === 'bn' ? 'যোগাযোগ করুন' : 'Contact Us'}
            </a>
            <a
              href="/track-order"
              className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
            >
              {language === 'bn' ? 'অর্ডার ট্র্যাক করুন' : 'Track Order'}
            </a>
          </div>
        </div>

        {/* Logout Button (if authenticated) */}
        {user && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
            >
              <X className="h-5 w-5" />
              <span>{language === 'bn' ? 'লগ আউট' : 'Logout'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  </>
)}
```

---

## 4. Component Props Interfaces

### 4.1 Header Component

```typescript
interface HeaderProps {
  className?: string;
}
```

### 4.2 UtilityBar Component

```typescript
interface UtilityBarProps {
  language: 'en' | 'bn';
  onLanguageChange: (lang: 'en' | 'bn') => void;
  className?: string;
}
```

### 4.3 MainHeaderRow Component

```typescript
interface MainHeaderRowProps {
  user: User | null;
  language: 'en' | 'bn';
  cartCount: number;
  onLogout: () => Promise<void>;
  className?: string;
}
```

### 4.4 NavigationBar Component

```typescript
interface NavigationBarProps {
  user: User | null;
  language: 'en' | 'bn';
  pathname: string;
  onMobileMenuToggle: () => void;
  isMobileMenuOpen: boolean;
  className?: string;
}
```

### 4.5 MobileDrawer Component

```typescript
interface MobileDrawerProps {
  isOpen: boolean;
  user: User | null;
  language: 'en' | 'bn';
  pathname: string;
  onClose: () => void;
  onLogout: () => Promise<void>;
  cartCount: number;
}
```

---

## 5. State Management Approach

### 5.1 Local State (in Header component)

```typescript
const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
const [language, setLanguage] = useState<'en' | 'bn'>('en');
const [cartCount, setCartCount] = useState<number>(0);
```

### 5.2 Global State (from Contexts)

```typescript
// From AuthContext
const { user, logout } = useAuth();

// From CartContext (to be implemented)
const { cart } = useCart();

// From Router
const router = useRouter();
const pathname = usePathname();
```

### 5.3 State Persistence

```typescript
// Language preference
useEffect(() => {
  const savedLanguage = localStorage.getItem('preferredLanguage');
  if (savedLanguage && ['en', 'bn'].includes(savedLanguage)) {
    setLanguage(savedLanguage as 'en' | 'bn');
  }
}, []);

// Cart count (from localStorage or API)
useEffect(() => {
  const savedCart = localStorage.getItem('smart_tech_cart');
  if (savedCart) {
    try {
      const cartData = JSON.parse(savedCart);
      setCartCount(cartData.items?.length || 0);
    } catch (e) {
      console.error('Error loading cart:', e);
    }
  }
}, []);
```

---

## 6. Responsive Design Specifications

### 6.1 Breakpoints

```css
/* Mobile */
@media (max-width: 767px) {
  /* Hide desktop elements */
  .desktop-only { display: none; }

  /* Show mobile elements */
  .mobile-only { display: block; }

  /* Adjust spacing */
  .container { padding: 0 16px; }

  /* Adjust font sizes */
  h1 { font-size: 18px; }
  .text-sm { font-size: 13px; }
}

/* Tablet */
@media (min-width: 768px) and (max-width: 1199px) {
  /* Hide mobile elements */
  .mobile-only { display: none; }

  /* Show desktop elements */
  .desktop-only { display: block; }

  /* Adjust spacing */
  .container { padding: 0 24px; }

  /* Adjust font sizes */
  h1 { font-size: 20px; }
}

/* Desktop */
@media (min-width: 1200px) {
  /* Full desktop experience */
  .container { padding: 0 32px; }

  /* Adjust font sizes */
  h1 { font-size: 20px; }
}
```

### 6.2 Responsive Behavior Table

| Element | Mobile (<768px) | Tablet (768-1199px) | Desktop (1200px+) |
|---------|----------------|---------------------|-------------------|
| **Utility Bar** | Full width | Full width | Full width |
| **Utility Links** | Hidden | Visible | Visible |
| **Language Toggle** | Visible | Visible | Visible |
| **Logo** | Small (40px) | Medium (48px) | Medium (48px) |
| **Search Bar** | Hidden (in drawer) | Visible | Visible |
| **Search Hint** | Hidden | Visible | Visible |
| **User Menu** | Hidden (in drawer) | Visible | Visible |
| **Cart Button** | Visible (icon only) | Visible (icon + text) | Visible (icon + text) |
| **Login/Register** | Hidden (in drawer) | Visible | Visible |
| **Navigation Links** | Hidden (in drawer) | Visible | Visible |
| **Mobile Menu Button** | Visible | Hidden | Hidden |

### 6.3 Responsive Tailwind Classes

```tsx
// Utility Bar - Always visible
<div className="h-8 bg-gray-100 border-b border-gray-200 block md:flex">

// Utility Links - Hidden on mobile, visible on tablet+
<div className="hidden md:flex items-center space-x-6">

// Language Toggle - Always visible
<div className="flex items-center space-x-2">

// Logo - Responsive size
<div className="w-10 h-10 md:w-12 md:h-12 bg-primary-blue rounded-lg">

// Search Bar - Hidden on mobile, visible on tablet+
<div className="hidden md:flex flex-1 max-w-xl lg:max-w-2xl mx-4 lg:mx-8">

// Search Hint - Hidden on mobile, visible on desktop
<div className="hidden sm:block mt-1">

// User Menu - Hidden on mobile, visible on tablet+
<div className="hidden md:flex items-center space-x-4">

// Cart Text - Hidden on mobile, visible on tablet+
<span className="text-sm font-medium hidden sm:inline">

// Navigation Links - Hidden on mobile, visible on tablet+
<nav className="hidden md:flex items-center space-x-1">

// Mobile Menu Button - Visible on mobile, hidden on tablet+
<button className="md:hidden">

// Mobile Drawer - Visible on mobile only
<div className="fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50 md:hidden">
```

---

## 7. Existing Functionality Mapping

### 7.1 Logo Section

| Existing Element | New Location | Notes |
|-----------------|--------------|-------|
| ST Box | MainHeaderRow → LogoSection | Same design, adjusted size |
| "Smart Tech" text | MainHeaderRow → LogoSection | Same design |
| "Technologies Bangladesh" tagline | MainHeaderRow → LogoSection | Same design |

### 7.2 Search Functionality

| Existing Element | New Location | Notes |
|-----------------|--------------|-------|
| SearchAutocomplete component | MainHeaderRow → SearchSection | Same component, new styling |
| Search hint (Ctrl+K) | MainHeaderRow → SearchSection | Same functionality |
| Keyboard shortcut | Preserved | Same event listeners |

### 7.3 Language Toggle

| Existing Element | New Location | Notes |
|-----------------|--------------|-------|
| Language buttons | UtilityBar → LanguageToggle | Moved to utility bar, Newegg style |
| English/Bengali toggle | Preserved | Same functionality |
| localStorage persistence | Preserved | Same implementation |

### 7.4 Navigation Links

| Existing Element | New Location | Notes |
|-----------------|--------------|-------|
| Home link | NavigationBar → DesktopNavLinks | Same href |
| Products link | NavigationBar → DesktopNavLinks | Same href |
| Account link | NavigationBar → DesktopNavLinks | Protected route |
| Orders link | NavigationBar → DesktopNavLinks | Protected route |
| Wishlist link | NavigationBar → DesktopNavLinks | Protected route |
| Cart link | NavigationBar → DesktopNavLinks | Protected route |
| Active state styling | Preserved | Same isActive logic |
| Protected route filtering | Preserved | Same conditional rendering |

### 7.5 User Authentication

| Existing Element | New Location | Notes |
|-----------------|--------------|-------|
| User context (useAuth) | MainHeaderRow → UserActionsSection | Same context usage |
| User object | Preserved | Same User type |
| Logout function | Preserved | Same handleLogout logic |
| Guest state handling | Preserved | Same conditional rendering |

### 7.6 Cart Functionality

| Existing Element | New Location | Notes |
|-----------------|--------------|-------|
| Cart icon | MainHeaderRow → UserActionsSection | Same icon |
| Cart badge | Preserved | Same badge logic |
| Cart link | Preserved | Same href |
| Cart count | To be implemented | Need cart context |

### 7.7 Mobile Menu

| Existing Element | New Location | Notes |
|-----------------|--------------|-------|
| Hamburger icon | NavigationBar → MobileMenuButton | Same icon |
| Mobile drawer | MobileDrawer (overlay) | Enhanced design |
| Drawer close button | MobileDrawer → DrawerHeader | Same functionality |
| Mobile nav links | MobileDrawer → DrawerContent | Same hrefs |
| Mobile search | MobileDrawer → DrawerContent | SearchAutocomplete component |

### 7.8 Event Handlers

| Existing Handler | New Location | Notes |
|-----------------|--------------|-------|
| handleLanguageChange | UtilityBar | Same logic |
| handleLogout | MainHeaderRow & MobileDrawer | Same logic |
| isActive | NavigationBar & MobileDrawer | Same logic |
| setIsMenuOpen | NavigationBar & MobileDrawer | Renamed to setIsMobileMenuOpen |

---

## 8. Navigation Items Configuration

```typescript
const navigationItems = [
  {
    href: '/',
    label: language === 'bn' ? 'হোম' : 'Home',
    icon: HomeIcon,
    protected: false,
  },
  {
    href: '/products',
    label: language === 'bn' ? 'পণ্য়ার' : 'Products',
    icon: SearchIcon,
    protected: false,
  },
  {
    href: '/account',
    label: language === 'bn' ? 'অ্যাকাউন্ট' : 'Account',
    icon: UserIcon,
    protected: true,
  },
  {
    href: '/orders',
    label: language === 'bn' ? 'অর্ডার' : 'Orders',
    icon: PackageIcon,
    protected: true,
  },
  {
    href: '/wishlist',
    label: language === 'bn' ? 'ইচ্ছা' : 'Wishlist',
    icon: HeartIcon,
    protected: true,
  },
  {
    href: '/cart',
    label: language === 'bn' ? 'কার্ট' : 'Cart',
    icon: ShoppingCart,
    protected: true,
  },
];
```

---

## 9. Utility Links Configuration

```typescript
const utilityLinks = [
  {
    href: '/help',
    label: language === 'bn' ? 'সাহায্য কেন্দ্র' : 'Help Center',
  },
  {
    href: '/contact',
    label: language === 'bn' ? 'যোগাযোগ করুন' : 'Contact Us',
  },
  {
    href: '/track-order',
    label: language === 'bn' ? 'অর্ডার ট্র্যাক করুন' : 'Track Order',
  },
];
```

---

## 10. Icon Requirements

```typescript
import {
  ShoppingCart,
  Search as SearchIcon,
  Menu,
  X,
  ChevronDown,
  User as UserIcon,
  Home as HomeIcon,
  Package as PackageIcon,
  Heart as HeartIcon,
  HelpCircle as HelpIcon,
  Phone as PhoneIcon,
  MapPin as LocationIcon,
} from 'lucide-react';
```

---

## 11. Accessibility Considerations

### 11.1 ARIA Labels

```tsx
// Language toggle buttons
<button
  aria-label="Switch to English"
  onClick={() => handleLanguageChange('en')}
>
  English
</button>

// Search input
<input
  aria-label="Search products"
  aria-autocomplete="list"
  aria-expanded={isOpen}
  aria-controls="search-suggestions"
/>

// Mobile menu button
<button
  aria-label="Open menu"
  aria-expanded={isMobileMenuOpen}
  onClick={() => setIsMobileMenuOpen(true)}
>
  <Menu />
</button>

// Navigation links
<a
  href="/cart"
  aria-label={`Cart with ${cartCount} items`}
>
  <ShoppingCart />
</a>
```

### 11.2 Keyboard Navigation

```tsx
// Tab order
// 1. Utility links
// 2. Language toggle
// 3. Logo
// 4. Search input
// 5. User menu
// 6. Cart button
// 7. Navigation links

// Escape key to close mobile menu
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };
  document.addEventListener('keydown', handleEscape);
  return () => document.removeEventListener('keydown', handleEscape);
}, [isMobileMenuOpen]);
```

### 11.3 Focus Management

```tsx
// Trap focus in mobile drawer
useEffect(() => {
  if (isMobileMenuOpen) {
    const focusableElements = drawerRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements?.[0] as HTMLElement;
    const lastElement = focusableElements?.[focusableElements.length - 1] as HTMLElement;

    firstElement?.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }
}, [isMobileMenuOpen]);
```

---

## 12. Performance Considerations

### 12.1 Lazy Loading

```tsx
// Lazy load SearchAutocomplete
const SearchAutocomplete = dynamic(
  () => import('@/components/product/SearchAutocomplete'),
  { ssr: false }
);
```

### 12.2 Memoization

```tsx
// Memoize navigation items
const navigationItems = useMemo(() => [
  {
    href: '/',
    label: language === 'bn' ? 'হোম' : 'Home',
    icon: HomeIcon,
    protected: false,
  },
  // ... other items
], [language]);

// Memoize utility links
const utilityLinks = useMemo(() => [
  {
    href: '/help',
    label: language === 'bn' ? 'সাহায্য কেন্দ্র' : 'Help Center',
  },
  // ... other links
], [language]);
```

### 12.3 Debouncing

```tsx
// Debounce search input (already in SearchAutocomplete)
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  setQuery(value);

  if (debounceRef.current) {
    clearTimeout(debounceRef.current);
  }

  if (value.length >= minQueryLength) {
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value);
      setIsOpen(true);
    }, 200);
  }
};
```

---

## 13. Testing Considerations

### 13.1 Unit Tests

```typescript
// Test language toggle
test('should change language when button is clicked', () => {
  render(<Header />);
  const englishButton = screen.getByText('English');
  fireEvent.click(englishButton);
  expect(localStorage.setItem).toHaveBeenCalledWith('preferredLanguage', 'en');
});

// Test mobile menu toggle
test('should open mobile menu when hamburger is clicked', () => {
  render(<Header />);
  const menuButton = screen.getByLabelText('Open menu');
  fireEvent.click(menuButton);
  expect(screen.getByText('Menu')).toBeInTheDocument();
});

// Test protected routes
test('should not show protected routes for guest users', () => {
  render(<Header />);
  expect(screen.queryByText('Account')).not.toBeInTheDocument();
});
```

### 13.2 Integration Tests

```typescript
// Test navigation
test('should navigate to products page when products link is clicked', () => {
  render(<Header />);
  const productsLink = screen.getByText('Products');
  fireEvent.click(productsLink);
  expect(window.location.pathname).toBe('/products');
});

// Test logout
test('should logout user when logout button is clicked', async () => {
  render(<Header />, { wrapper: AuthProvider });
  const logoutButton = screen.getByText('Logout');
  fireEvent.click(logoutButton);
  await waitFor(() => {
    expect(mockLogout).toHaveBeenCalled();
  });
});
```

### 13.3 Visual Regression Tests

```typescript
// Test header appearance at different breakpoints
test('should match snapshot at mobile breakpoint', () => {
  window.innerWidth = 375;
  render(<Header />);
  expect(container).toMatchSnapshot();
});

test('should match snapshot at desktop breakpoint', () => {
  window.innerWidth = 1200;
  render(<Header />);
  expect(container).toMatchSnapshot();
});
```

---

## 14. Migration Checklist

### 14.1 Pre-Implementation

- [ ] Review existing Header component functionality
- [ ] Confirm Newegg.com header design requirements
- [ ] Validate color scheme matches specifications
- [ ] Confirm responsive breakpoints
- [ ] Verify all existing functionality is documented

### 14.2 Implementation Steps

- [ ] Create UtilityBar component
- [ ] Create MainHeaderRow component
- [ ] Create NavigationBar component
- [ ] Create MobileDrawer component
- [ ] Update Header component to use new subcomponents
- [ ] Implement responsive behavior
- [ ] Add accessibility features
- [ ] Add performance optimizations

### 14.3 Post-Implementation

- [ ] Test all existing functionality
- [ ] Test responsive behavior at all breakpoints
- [ ] Test keyboard navigation
- [ ] Test screen reader compatibility
- [ ] Test language toggle
- [ ] Test authentication state changes
- [ ] Test mobile menu
- [ ] Test search functionality
- [ ] Test cart functionality
- [ ] Perform visual regression testing

---

## 15. Implementation Notes

### 15.1 Component File Structure

```
frontend/src/components/layout/
├── Header.tsx (main container)
├── UtilityBar.tsx (row 1)
├── MainHeaderRow.tsx (row 2)
├── NavigationBar.tsx (row 3)
└── MobileDrawer.tsx (mobile menu)
```

### 15.2 Import Dependencies

```typescript
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types/auth';
import { SearchAutocomplete } from '@/components/product/SearchAutocomplete';
import {
  ShoppingCart,
  Search as SearchIcon,
  Menu,
  X,
  ChevronDown,
  User as UserIcon,
  Home as HomeIcon,
  Package as PackageIcon,
  Heart as HeartIcon,
  HelpCircle as HelpIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
```

### 15.3 Tailwind Configuration

Ensure the following colors are configured in `tailwind.config.ts`:

```typescript
theme: {
  extend: {
    colors: {
      'primary-blue': '#0055a5',
      'primary-dark': '#003d75',
      'dark-gray': '#1a1a1a',
      'medium-gray': '#666666',
      'light-gray': '#f5f5f5',
      'orange-accent': '#ff6600',
      'orange-hover': '#e65c00',
    },
  },
}
```

---

## 16. Summary

This specification provides a complete design for the new Smart Tech header that:

1. **Matches Newegg.com 3-row layout** - Utility Bar (32px), Main Header (80px), Navigation Bar (44px)
2. **Preserves all existing functionality** - Search, language toggle, auth state, mobile menu, navigation links, cart
3. **Uses specified color scheme** - Primary Blue (#0055a5), Dark Gray (#1a1a1a), Orange Accent (#ff6600)
4. **Provides responsive design** - Mobile (<768px), Tablet (768-1199px), Desktop (1200px+)
5. **Includes accessibility features** - ARIA labels, keyboard navigation, focus management
6. **Optimizes performance** - Lazy loading, memoization, debouncing
7. **Documents component structure** - Clear hierarchy, props interfaces, state management

The next step is to implement this design by creating the new component files and updating the Header.tsx component accordingly.
