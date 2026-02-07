# Smart Tech Header CSS Styling Specification
## Tailwind CSS Implementation Guide for Newegg.com Style Header

---

## 1. CSS Custom Properties (Variables)

### 1.1 Color Palette

```css
:root {
  /* Primary Colors */
  --color-primary-blue: #0055a5;
  --color-primary-dark: #003d75;
  --color-primary-light: #0066cc;

  /* Text Colors */
  --color-text-primary: #1a1a1a;
  --color-text-secondary: #666666;
  --color-text-muted: #999999;
  --color-text-inverse: #ffffff;

  /* Background Colors */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f5f5f5;
  --color-bg-tertiary: #e5e5e5;
  --color-bg-hover: #f0f0f0;

  /* Accent Colors */
  --color-accent-orange: #ff6600;
  --color-accent-orange-hover: #e65c00;
  --color-accent-orange-light: #fff0e6;

  /* Status Colors */
  --color-success: #28a745;
  --color-error: #dc3545;
  --color-warning: #ffc107;
  --color-info: #17a2b8;

  /* Border Colors */
  --color-border-light: #e5e5e5;
  --color-border-medium: #cccccc;
  --color-border-dark: #1a1a1a;

  /* Shadow Colors */
  --shadow-sm: rgba(0, 0, 0, 0.05);
  --shadow-md: rgba(0, 0, 0, 0.1);
  --shadow-lg: rgba(0, 0, 0, 0.15);
  --shadow-xl: rgba(0, 0, 0, 0.2);

  /* Overlay Colors */
  --overlay-dark: rgba(0, 0, 0, 0.5);
  --overlay-light: rgba(255, 255, 255, 0.9);
}
```

### 1.2 Spacing Variables

```css
:root {
  /* Header Row Heights */
  --header-utility-height: 32px;
  --header-main-height: 80px;
  --header-nav-height: 44px;
  --header-total-height: 156px;

  /* Spacing Scale */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;

  /* Container Padding */
  --container-padding-mobile: 16px;
  --container-padding-tablet: 24px;
  --container-padding-desktop: 32px;

  /* Component Spacing */
  --nav-item-spacing: 4px;
  --button-padding-x: 12px;
  --button-padding-y: 8px;
  --link-spacing: 24px;
}
```

### 1.3 Typography Variables

```css
:root {
  /* Font Families */
  --font-family-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-family-monospace: 'SF Mono', 'Fira Code', 'Consolas', monospace;

  /* Font Sizes */
  --text-xs: 12px;
  --text-sm: 14px;
  --text-base: 16px;
  --text-lg: 18px;
  --text-xl: 20px;
  --text-2xl: 24px;
  --text-3xl: 30px;

  /* Font Weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;

  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;

  /* Letter Spacing */
  --tracking-tight: -0.02em;
  --tracking-normal: 0;
  --tracking-wide: 0.02em;
}
```

### 1.4 Transition & Animation Variables

```css
:root {
  /* Transition Durations */
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --duration-slower: 400ms;

  /* Transition Easings */
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);

  /* Animation Keyframes */
  --animate-fade-in: fadeIn 200ms ease-out;
  --animate-slide-in: slideIn 300ms ease-out;
  --animate-scale-in: scaleIn 200ms ease-out;
}
```

---

## 2. Tailwind Configuration

### 2.1 tailwind.config.ts Extension

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/components/layout/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          blue: '#0055a5',
          dark: '#003d75',
          light: '#0066cc',
        },
        dark: {
          gray: '#1a1a1a',
        },
        medium: {
          gray: '#666666',
        },
        light: {
          gray: '#f5f5f5',
        },
        orange: {
          accent: '#ff6600',
          hover: '#e65c00',
          light: '#fff0e6',
        },
      },
      fontSize: {
        xs: ['12px', { lineHeight: '1.5' }],
        sm: ['14px', { lineHeight: '1.5' }],
        base: ['16px', { lineHeight: '1.5' }],
        lg: ['18px', { lineHeight: '1.4' }],
        xl: ['20px', { lineHeight: '1.3' }],
        '2xl': ['24px', { lineHeight: '1.25' }],
        '3xl': ['30px', { lineHeight: '1.2' }],
      },
      height: {
        '8': '32px',
        '11': '44px',
        '20': '80px',
        'header-utility': '32px',
        'header-main': '80px',
        'header-nav': '44px',
      },
      minHeight: {
        '8': '32px',
        '11': '44px',
        '20': '80px',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '400': '400ms',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
      zIndex: {
        '40': '40',
        '50': '50',
        '60': '60',
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## 3. Component Styling Specifications

### 3.1 Main Header Container

| Property | Mobile (<768px) | Tablet (768-1199px) | Desktop (1200px+) |
|----------|----------------|---------------------|-------------------|
| Position | sticky | sticky | sticky |
| Top | 0 | 0 | 0 |
| Z-index | 50 | 50 | 50 |
| Background | white | white | white |
| Shadow | shadow-sm | shadow-sm | shadow-sm |

**Tailwind Classes:**
```tsx
// Main container
className="sticky top-0 z-50 bg-white shadow-sm"

// Row containers
<h-8> for utility bar (32px)
<h-20> for main header (80px)
<h-11> for navigation bar (44px)
```

### 3.2 Utility Bar (Row 1 - 32px)

**Container Styling:**
```tsx
<div className="h-8 bg-gray-100 border-b border-gray-200">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
    <div className="flex items-center justify-between h-full">
```

**Responsive Container:**
```tsx
// Mobile
className="px-4"

// Tablet
className="sm:px-6"

// Desktop
className="lg:px-8"
```

### 3.3 Utility Links

| State | Text Color | Background | Transition |
|-------|-----------|------------|------------|
| Default | `--color-text-secondary` (#666666) | transparent | 150ms |
| Hover | `--color-primary-blue` (#0055a5) | transparent | 150ms |
| Focus | `--color-primary-blue` (#0055a5) | transparent | 150ms |

**Tailwind Classes:**
```tsx
// Container
<div className="flex items-center space-x-6">

// Link base
<a 
  className="text-xs text-gray-600 hover:text-primary-blue transition-colors"
  href="/help"
>
  Help Center
</a>

// Focus state (accessible)
<a 
  className="text-xs text-gray-600 hover:text-primary-blue transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2"
  href="/help"
>
```

### 3.4 Language Toggle

| State | Text Color | Background | Border | Border Radius |
|-------|-----------|------------|--------|---------------|
| Default (unselected) | `--color-text-secondary` (#666666) | white | none | 4px |
| Hover (unselected) | `--color-text-primary` (#1a1a1a) | gray-200 | none | 4px |
| Selected | `--color-text-inverse` (#ffffff) | `--color-primary-blue` (#0055a5) | none | 4px |

**Tailwind Classes:**
```tsx
// Container
<div className="flex items-center space-x-2">

// Label
<span className="text-xs text-gray-600">
  {language === 'bn' ? 'ভাষা:' : 'Language:'}
</span>

// Unselected button
<button
  className={cn(
    'px-2 py-0.5 rounded text-xs font-medium transition-colors',
    'bg-white text-gray-600 hover:bg-gray-200',
    'focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2'
  )}
>
  English
</button>

// Selected button
<button
  className={cn(
    'px-2 py-0.5 rounded text-xs font-medium transition-colors',
    'bg-primary-blue text-white',
    'focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2'
  )}
>
  বাংলা
</button>
```

### 3.5 Logo Section

| Element | Mobile (<768px) | Tablet (768px+) | Desktop (1200px+) |
|---------|----------------|-----------------|-------------------|
| Logo Box | 40x40px | 48x48px | 48x48px |
| Brand Name | text-lg (18px) | text-xl (20px) | text-xl (20px) |
| Tagline | text-xs (12px) | text-xs (12px) | text-xs (12px) |

**Tailwind Classes:**
```tsx
// Logo container
<div className="flex items-center space-x-3">

// Logo box - mobile
<div className="w-10 h-10 md:w-12 md:h-12 bg-primary-blue rounded-lg flex items-center justify-center shadow-sm">
  <span className="text-white font-bold text-xl md:text-2xl">ST</span>
</div>

// Brand name
<h1 className="text-lg md:text-xl font-bold text-dark-gray leading-tight">
  {language === 'bn' ? 'স্মার্ট টেকনোব্ল' : 'Smart Tech'}
</h1>

// Tagline
<p className="text-xs text-gray-600">
  {language === 'bn' ? 'বাংলাদেশ প্রযুক্তি' : 'Technologies Bangladesh'}
</p>
```

### 3.6 Search Section

| Element | Mobile (<768px) | Tablet (768-1199px) | Desktop (1200px+) |
|---------|----------------|---------------------|-------------------|
| Visibility | Hidden (in drawer) | Visible | Visible |
| Max Width | N/A | 100% (512px) | 100% (512px) |
| Margin | N/A | mx-4 | mx-8 |
| Search Hint | Hidden | Hidden | Visible |

**Tailwind Classes:**
```tsx
// Search container - hidden on mobile
<div className="hidden md:flex flex-1 max-w-xl lg:max-w-2xl mx-4 lg:mx-8">

// Search hint - visible on tablet+
<div className="hidden sm:block mt-1">
  <span className="text-xs text-gray-400">
    Press{' '}
    <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-gray-600 text-xs font-mono">
      Ctrl
    </kbd>{' '}
    +{' '}
    <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-gray-600 text-xs font-mono">
      K
    </kbd>{' '}
    to search
  </span>
</div>
```

### 3.7 User Actions Section

| Element | Mobile (<768px) | Tablet (768px+) | Desktop (1200px+) |
|---------|----------------|-----------------|-------------------|
| User Name | Hidden | Visible | Visible |
| Cart Text | Hidden | Visible | Visible |
| Login/Register | Hidden (in drawer) | Visible | Visible |

**Tailwind Classes:**
```tsx
// User actions container
<div className="flex items-center space-x-4">

// User name text
<span className="text-sm font-medium hidden sm:inline">
  {user.firstName}
</span>

// Cart text
<span className="text-sm font-medium hidden sm:inline">
  {language === 'bn' ? 'কার্ট' : 'Cart'}
</span>
```

### 3.8 Cart Badge

| Property | Value |
|----------|-------|
| Position | absolute -top-1 -right-1 |
| Background | `--color-accent-orange` (#ff6600) |
| Text Color | white |
| Size | 20px (h-5 w-5) |
| Border Radius | full (50%) |
| Font Size | text-xs |
| Font Weight | bold |

**Tailwind Classes:**
```tsx
// Cart badge
<span className="absolute -top-1 -right-1 bg-orange-accent text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
  {cartCount}
</span>
```

### 3.9 Navigation Bar (Row 3 - 44px)

**Background:**
```tsx
<div className="h-11 bg-primary-blue">
```

**Nav Items:**
| State | Text Color | Background | Padding |
|-------|-----------|------------|---------|
| Default | white | transparent | px-4 py-2 |
| Hover | white | `--color-primary-dark` (#003d75) | px-4 py-2 |
| Active | white | `--color-accent-orange` (#ff6600) | px-4 py-2 |

**Tailwind Classes:**
```tsx
// Navigation container - hidden on mobile
<nav className="hidden md:flex items-center space-x-1">

// Nav item base
<a
  className={cn(
    'flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-colors rounded-md',
    {
      'text-white hover:bg-primary-dark': !isActive(item.href),
      'bg-orange-accent text-white': isActive(item.href),
    }
  )}
>
  <Icon className="h-4 w-4" />
  <span>{item.label}</span>
</a>

// Focus state
<a
  className={cn(
    'flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-colors rounded-md',
    'focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-blue',
    {
      'text-white hover:bg-primary-dark': !isActive(item.href),
      'bg-orange-accent text-white': isActive(item.href),
    }
  )}
>
```

### 3.10 Mobile Menu Button

| State | Text Color | Background | Icon |
|-------|-----------|------------|------|
| Default | white | transparent | Menu icon |
| Hover | white | `--color-primary-dark` (#003d75) | Menu icon |

**Tailwind Classes:**
```tsx
// Mobile menu button - visible only on mobile
<button
  className="md:hidden flex items-center space-x-2 px-3 py-2 rounded-md text-white hover:bg-primary-dark transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-blue"
  aria-label={language === 'bn' ? 'মেনু খুলুন' : 'Open menu'}
  aria-expanded={isMobileMenuOpen}
>
  <Menu className="h-5 w-5" />
  <span className="text-sm font-medium">
    {language === 'bn' ? 'মেনু' : 'Menu'}
  </span>
</button>
```

### 3.11 Mobile Drawer

**Backdrop:**
```tsx
// Fixed overlay
<div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden" />
```

**Drawer Panel:**
| Property | Value |
|----------|-------|
| Position | fixed top-0 right-0 |
| Width | 320px (w-80) |
| Height | full (100vh) |
| Background | white |
| Shadow | shadow-xl |
| Z-index | 50 |

**Tailwind Classes:**
```tsx
// Drawer container
<div className="fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50 md:hidden transform transition-transform duration-300 ease-in-out">
```

**Drawer Header:**
```tsx
<div className="flex items-center justify-between p-4 border-b border-gray-200">
  <h2 className="text-lg font-bold text-dark-gray">
    {language === 'bn' ? 'মেনু' : 'Menu'}
  </h2>
  <button
    className="p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2"
    aria-label={language === 'bn' ? 'মেনু বন্ধ করুন' : 'Close menu'}
  >
    <X className="h-5 w-5" />
  </button>
</div>
```

**Drawer Content:**
```tsx
<div className="p-4 overflow-y-auto h-full pb-20">
```

**User Section (Authenticated):**
```tsx
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
```

**Mobile Navigation Links:**
```tsx
// Mobile nav links container
<div className="space-y-1">

// Mobile nav item
<a
  className={cn(
    'flex items-center space-x-3 px-4 py-3 text-sm font-medium transition-colors rounded-md',
    {
      'text-gray-700 hover:bg-gray-100': !isActive(item.href),
      'bg-primary-blue text-white': isActive(item.href),
    }
  )}
>
  <Icon className="h-5 w-5" />
  <span>{item.label}</span>
</a>
```

**Mobile Utility Links:**
```tsx
<div className="mt-6 pt-6 border-t border-gray-200">
  <div className="space-y-1">
    <a
      href="/help"
      className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2"
    >
      {language === 'bn' ? 'সাহায্য কেন্দ্র' : 'Help Center'}
    </a>
  </div>
</div>
```

**Logout Button:**
```tsx
<button
  className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
  onClick={handleLogout}
>
  <X className="h-5 w-5" />
  <span>{language === 'bn' ? 'লগ আউট' : 'Logout'}</span>
</button>
```

---

## 4. User Dropdown Menu

| State | Opacity | Visibility | Transform |
|-------|---------|------------|-----------|
| Default | 0 | invisible | translate-y-2 |
| Hover | 100 | visible | translate-y-0 |

**Tailwind Classes:**
```tsx
// Dropdown container
<div className="relative group">

// Dropdown trigger button
<button
  className="flex items-center space-x-2 px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2"
>
  <UserIcon className="h-5 w-5" />
  <span className="text-sm font-medium hidden sm:inline">{user.firstName}</span>
  <ChevronDown className="h-4 w-4" />
</button>

// Dropdown menu
<div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right">
  <a
    href="/account"
    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors rounded-t-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2"
  >
    {language === 'bn' ? 'অ্যাকাউন্ট' : 'Account'}
  </a>
  <a
    href="/orders"
    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2"
  >
    {language === 'bn' ? 'অর্ডার' : 'Orders'}
  </a>
  <button
    onClick={handleLogout}
    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition-colors rounded-b-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
  >
    {language === 'bn' ? 'লগ আউট' : 'Logout'}
  </button>
</div>
</div>
```

---

## 5. Authentication Buttons

### 5.1 Sign In Button

```tsx
<a
  href="/login"
  className="text-sm font-medium text-gray-600 hover:text-primary-blue transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2"
>
  {language === 'bn' ? 'লগ ইন' : 'Sign In'}
</a>
```

### 5.2 Register Button

| State | Background | Text Color | Transition |
|-------|-----------|------------|------------|
| Default | `--color-accent-orange` (#ff6600) | white | 150ms |
| Hover | `--color-accent-orange-hover` (#e65c00) | white | 150ms |
| Focus | `--color-accent-orange-hover` (#e65c00) | white | 150ms |

```tsx
<a
  href="/register"
  className="px-4 py-2 bg-orange-accent text-white text-sm font-medium rounded-md hover:bg-orange-hover transition-colors focus:outline-none focus:ring-2 focus:ring-orange-accent focus:ring-offset-2"
>
  {language === 'bn' ? 'নিবন্ধন' : 'Register'}
</a>
```

---

## 6. Responsive Breakpoints

### 6.1 Tailwind Breakpoints

| Breakpoint | Prefix | Min Width | Target Devices |
|------------|--------|-----------|----------------|
| Mobile | Default | 0px | Smartphones (< 768px) |
| Tablet | sm | 640px | Small tablets |
| Tablet | md | 768px | Large tablets |
| Desktop | lg | 1024px | Small laptops |
| Desktop | xl | 1280px | Standard desktops |
| Desktop | 2xl | 1536px | Large screens |

### 6.2 Custom Breakpoints for Header

```css
/* Mobile specific styles (< 768px) */
@media (max-width: 767px) {
  .header-utility-links {
    display: none;
  }
  
  .header-search {
    display: none;
  }
  
  .header-user-menu {
    display: none;
  }
  
  .header-mobile-menu {
    display: flex;
  }
}

/* Tablet specific styles (768px - 1199px) */
@media (min-width: 768px) and (max-width: 1199px) {
  .header-utility-links {
    display: flex;
  }
  
  .header-search {
    display: flex;
    max-width: 100%;
  }
  
  .header-user-menu {
    display: flex;
  }
  
  .header-mobile-menu {
    display: none;
  }
}

/* Desktop specific styles (1200px+) */
@media (min-width: 1200px) {
  .header-utility-links {
    display: flex;
  }
  
  .header-search {
    display: flex;
    max-width: 512px;
  }
  
  .header-user-menu {
    display: flex;
  }
  
  .header-mobile-menu {
    display: none;
  }
}
```

---

## 7. Hover, Focus, and Active States

### 7.1 Link Hover States

```css
/* Utility links */
.utility-link {
  color: #666666;
  font-size: 12px;
  transition: color 150ms ease-out;
}

.utility-link:hover {
  color: #0055a5;
}

.utility-link:focus {
  outline: none;
  box-shadow: 0 0 0 2px #0055a5;
  border-radius: 2px;
}

/* Navigation links */
.nav-link {
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 150ms ease-out;
}

.nav-link:hover {
  background-color: #003d75;
}

.nav-link.active {
  background-color: #ff6600;
}

.nav-link:focus {
  outline: none;
  box-shadow: 0 0 0 2px #ffffff;
  border-radius: 4px;
}
```

### 7.2 Button Hover States

```css
/* Primary buttons */
.btn-primary {
  background-color: #ff6600;
  color: #ffffff;
  transition: background-color 150ms ease-out;
}

.btn-primary:hover {
  background-color: #e65c00;
}

.btn-primary:focus {
  outline: none;
  box-shadow: 0 0 0 2px #ff6600;
}

/* Secondary buttons */
.btn-secondary {
  background-color: #ffffff;
  color: #666666;
  transition: background-color 150ms ease-out;
}

.btn-secondary:hover {
  background-color: #f0f0f0;
}

.btn-secondary:focus {
  outline: none;
  box-shadow: 0 0 0 2px #0055a5;
}
```

### 7.3 Dropdown Menu States

```css
.dropdown-menu {
  opacity: 0;
  visibility: hidden;
  transform: translateY(8px);
  transition: opacity 200ms ease-out, visibility 200ms ease-out, transform 200ms ease-out;
}

.dropdown-menu.open {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.dropdown-item {
  color: #1a1a1a;
  font-size: 14px;
  transition: background-color 150ms ease-out;
}

.dropdown-item:hover {
  background-color: #f5f5f5;
}

.dropdown-item:focus {
  outline: none;
  background-color: #f5f5f5;
}
```

---

## 8. Animation & Transition Effects

### 8.1 Keyframe Animations

```css
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOutRight {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

@keyframes scaleIn {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes slideDown {
  from {
    transform: translateY(-10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
```

### 8.2 Tailwind Animation Classes

```css
@layer utilities {
  .animate-fade-in {
    animation: fadeIn 200ms ease-out;
  }
  
  .animate-slide-in-right {
    animation: slideInRight 300ms ease-out;
  }
  
  .animate-slide-out-right {
    animation: slideOutRight 300ms ease-out;
  }
  
  .animate-scale-in {
    animation: scaleIn 200ms ease-out;
  }
  
  .animate-slide-down {
    animation: slideDown 200ms ease-out;
  }
  
  .animate-pulse-subtle {
    animation: pulse 2s ease-in-out infinite;
  }
}
```

### 8.3 Transition Classes

```css
/* Color transitions */
.transition-colors {
  transition-property: background-color, border-color, color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

/* Opacity and visibility transitions */
.transition-opacity {
  transition-property: opacity;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}

/* Transform transitions */
.transition-transform {
  transition-property: transform;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}

/* All transitions */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}

/* Spring-like transition */
.transition-spring {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1.275);
  transition-duration: 400ms;
}
```

### 8.4 Drawer Animation

```tsx
// Drawer animation classes
<div 
  className={cn(
    'fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50 md:hidden',
    'transform transition-transform duration-300 ease-in-out',
    isOpen ? 'translate-x-0' : 'translate-x-full'
  )}
>
```

### 8.5 Dropdown Animation

```tsx
// Dropdown animation classes
<div className={cn(
  'absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200',
  'opacity-0 invisible',
  'transition-all duration-200 transform origin-top-right',
  isOpen ? 'opacity-100 visible translate-y-0' : 'translate-y-2'
)}>
```

---

## 9. Accessibility Styling Requirements

### 9.1 Focus Indicators

```css
/* Visible focus indicator for all interactive elements */
*:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #0055a5;
}

/* High contrast focus indicator */
.focus-indicator {
  outline: none;
  box-shadow: 0 0 0 2px currentColor;
}

/* Skip link styling */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #0055a5;
  color: #ffffff;
  padding: 8px 16px;
  z-index: 100;
  transition: top 150ms ease-out;
}

.skip-link:focus {
  top: 0;
}
```

### 9.2 Screen Reader Only Content

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.sr-only-focusable:focus {
  position: static;
  width: auto;
  height: auto;
  padding: inherit;
  margin: inherit;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

### 9.3 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

@media (prefers-reduced-motion: no-preference) {
  .animate-fade-in {
    animation: fadeIn 200ms ease-out;
  }
  
  .animate-slide-in-right {
    animation: slideInRight 300ms ease-out;
  }
  
  .transition-all {
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 200ms;
  }
}
```

### 9.4 High Contrast Mode

```css
@media (prefers-contrast: high) {
  .header-utility-bar {
    background-color: #ffffff;
    border-bottom: 2px solid #000000;
  }
  
  .header-main {
    border-bottom: 2px solid #000000;
  }
  
  .nav-link {
    border: 1px solid transparent;
  }
  
  .nav-link:hover {
    border: 1px solid #ffffff;
  }
  
  .btn-primary {
    border: 2px solid #000000;
  }
}
```

### 9.5 ARIA Attribute Styling

```tsx
// Language toggle with ARIA
<button
  aria-label="Switch to English"
  aria-pressed={language === 'en'}
  className={cn(
    'px-2 py-0.5 rounded text-xs font-medium transition-colors',
    language === 'en'
      ? 'bg-primary-blue text-white'
      : 'bg-white text-gray-600 hover:bg-gray-200'
  )}
>
  English
</button>

// Mobile menu button with ARIA
<button
  aria-label="Open menu"
  aria-expanded={isMobileMenuOpen}
  aria-controls="mobile-menu"
  className="md:hidden flex items-center space-x-2 px-3 py-2 rounded-md text-white hover:bg-primary-dark transition-colors"
>
  <Menu className="h-5 w-5" />
  <span className="text-sm font-medium">Menu</span>
</button>

// Cart button with ARIA
<a
  href="/cart"
  aria-label={`Shopping cart with ${cartCount} items`}
  className="relative flex items-center space-x-2 px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
>
  <ShoppingCart className="h-5 w-5" />
  {cartCount > 0 && (
    <span className="absolute -top-1 -right-1 bg-orange-accent text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
      {cartCount}
    </span>
  )}
</a>
```

---

## 10. Custom CSS Utilities

### 10.1 Header-specific Utilities

```css
@layer utilities {
  /* Header container utilities */
  .header-sticky {
    position: sticky;
    top: 0;
    z-index: 50;
  }
  
  .header-shadow {
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  }
  
  /* Row height utilities */
  .h-header-utility {
    height: 32px;
  }
  
  .h-header-main {
    height: 80px;
  }
  
  .h-header-nav {
    height: 44px;
  }
  
  /* Logo utilities */
  .logo-box {
    @apply bg-primary-blue rounded-lg flex items-center justify-center shadow-sm;
  }
  
  .logo-text {
    @apply text-white font-bold;
  }
  
  /* Nav utilities */
  .nav-item {
    @apply flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors;
  }
  
  .nav-item-default {
    @apply text-white hover:bg-primary-dark;
  }
  
  .nav-item-active {
    @apply bg-orange-accent text-white;
  }
  
  /* Drawer utilities */
  .drawer-backdrop {
    @apply fixed inset-0 bg-black bg-opacity-50 z-50;
  }
  
  .drawer-panel {
    @apply fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50;
  }
  
  /* Badge utilities */
  .cart-badge {
    @apply absolute -top-1 -right-1 bg-orange-accent text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center;
  }
  
  /* Language toggle utilities */
  .lang-btn {
    @apply px-2 py-0.5 rounded text-xs font-medium transition-colors;
  }
  
  .lang-btn-selected {
    @apply bg-primary-blue text-white;
  }
  
  .lang-btn-unselected {
    @apply bg-white text-gray-600 hover:bg-gray-200;
  }
}
```

### 10.2 Animation Utilities

```css
@layer utilities {
  /* Fade utilities */
  .fade-in {
    opacity: 0;
    animation: fadeIn 200ms ease-out forwards;
  }
  
  .fade-out {
    opacity: 1;
    animation: fadeOut 200ms ease-out forwards;
  }
  
  /* Slide utilities */
  .slide-in-right {
    transform: translateX(100%);
    animation: slideInRight 300ms ease-out forwards;
  }
  
  .slide-out-right {
    transform: translateX(0);
    animation: slideOutRight 300ms ease-out forwards;
  }
  
  .slide-in-down {
    transform: translateY(-10px);
    animation: slideDown 200ms ease-out forwards;
  }
  
  .slide-out-up {
    transform: translateY(0);
    animation: slideUp 200ms ease-out forwards;
  }
  
  /* Scale utilities */
  .scale-in {
    transform: scale(0.95);
    animation: scaleIn 200ms ease-out forwards;
  }
  
  /* Hover lift effect */
  .hover-lift {
    transition: transform 200ms ease-out;
  }
  
  .hover-lift:hover {
    transform: translateY(-2px);
  }
  
  /* Focus ring utilities */
  .focus-ring {
    @apply focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2;
  }
  
  .focus-ring-white {
    @apply focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-blue;
  }
}
```

### 10.3 Responsive Utilities

```css
@layer utilities {
  /* Hide/show utilities */
  .hide-mobile {
    @apply md:block;
  }
  
  .show-mobile-only {
    @apply md:hidden;
  }
  
  .hide-tablet {
    @apply lg:block;
  }
  
  .show-tablet-only {
    @apply hidden lg:hidden;
  }
  
  /* Responsive text utilities */
  .text-responsive {
    @apply text-sm md:text-base;
  }
  
  .text-title-responsive {
    @apply text-lg md:text-xl lg:text-2xl;
  }
  
  /* Responsive spacing utilities */
  .container-responsive {
    @apply px-4 md:px-6 lg:px-8;
  }
  
  .space-responsive {
    @apply space-y-2 md:space-y-4;
  }
}
```

---

## 11. Complete Component Class Reference

### 11.1 UtilityBar Component

```tsx
<UtilityBar
  className="h-8 bg-gray-100 border-b border-gray-200"
  containerClassName="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
  innerClassName="flex items-center justify-between h-full"
  linksClassName="flex items-center space-x-6"
  linkClassName="text-xs text-gray-600 hover:text-primary-blue transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2 rounded"
  languageSectionClassName="flex items-center space-x-2"
  labelClassName="text-xs text-gray-600"
  buttonClassName="px-2 py-0.5 rounded text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2"
  selectedButtonClassName="bg-primary-blue text-white"
  unselectedButtonClassName="bg-white text-gray-600 hover:bg-gray-200"
/>
```

### 11.2 MainHeaderRow Component

```tsx
<MainHeaderRow
  className="h-20 bg-white border-b border-gray-200"
  containerClassName="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
  innerClassName="flex items-center justify-between h-full"
  logoSectionClassName="flex items-center space-x-3"
  logoBoxClassName="w-10 h-10 md:w-12 md:h-12 bg-primary-blue rounded-lg flex items-center justify-center shadow-sm"
  logoTextClassName="text-white font-bold text-xl md:text-2xl"
  brandNameClassName="text-lg md:text-xl font-bold text-dark-gray leading-tight"
  taglineClassName="text-xs text-gray-600"
  searchSectionClassName="hidden md:flex flex-1 max-w-xl lg:max-w-2xl mx-4 lg:mx-8"
  searchHintClassName="hidden sm:block mt-1"
  kbdClassName="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-gray-600 text-xs font-mono"
  userActionsClassName="flex items-center space-x-4"
  userMenuClassName="relative group"
  userMenuButtonClassName="flex items-center space-x-2 px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2"
  dropdownMenuClassName="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200"
  dropdownItemClassName="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors rounded-lg"
  logoutButtonClassName="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition-colors rounded-lg"
  cartButtonClassName="relative flex items-center space-x-2 px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2"
  cartBadgeClassName="absolute -top-1 -right-1 bg-orange-accent text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
  loginLinkClassName="text-sm font-medium text-gray-600 hover:text-primary-blue transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2"
  registerButtonClassName="px-4 py-2 bg-orange-accent text-white text-sm font-medium rounded-md hover:bg-orange-hover transition-colors focus:outline-none focus:ring-2 focus:ring-orange-accent focus:ring-offset-2"
/>
```

### 11.3 NavigationBar Component

```tsx
<NavigationBar
  className="h-11 bg-primary-blue"
  containerClassName="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
  innerClassName="flex items-center justify-between h-full"
  navClassName="hidden md:flex items-center space-x-1"
  navItemClassName="flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-blue"
  navItemDefaultClassName="text-white hover:bg-primary-dark"
  navItemActiveClassName="bg-orange-accent text-white"
  mobileMenuButtonClassName="md:hidden flex items-center space-x-2 px-3 py-2 rounded-md text-white hover:bg-primary-dark transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-blue"
  mobileMenuIconClassName="h-5 w-5"
  mobileMenuTextClassName="text-sm font-medium"
/>
```

### 11.4 MobileDrawer Component

```tsx
<MobileDrawer
  isOpen={isMobileMenuOpen}
  backdropClassName="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden"
  drawerClassName="fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50 md:hidden transform transition-transform duration-300 ease-in-out"
  drawerHeaderClassName="flex items-center justify-between p-4 border-b border-gray-200"
  titleClassName="text-lg font-bold text-dark-gray"
  closeButtonClassName="p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2"
  contentClassName="p-4 overflow-y-auto h-full pb-20"
  userSectionClassName="mb-6 p-4 bg-gray-50 rounded-lg"
  userAvatarClassName="w-10 h-10 bg-primary-blue rounded-full flex items-center justify-center"
  userNameClassName="text-sm font-medium text-dark-gray"
  userEmailClassName="text-xs text-gray-600"
  searchSectionClassName="mb-6"
  navLinksClassName="space-y-1"
  navLinkClassName="flex items-center space-x-3 px-4 py-3 text-sm font-medium transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2"
  navLinkDefaultClassName="text-gray-700 hover:bg-gray-100"
  navLinkActiveClassName="bg-primary-blue text-white"
  utilitySectionClassName="mt-6 pt-6 border-t border-gray-200"
  utilityLinksClassName="space-y-1"
  utilityLinkClassName="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2"
  logoutSectionClassName="mt-6 pt-6 border-t border-gray-200"
  logoutButtonClassName="w-full flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
/>
```

---

## 12. Browser Support

### 12.1 Supported Browsers

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome | 90+ | Full support |
| Firefox | 88+ | Full support |
| Safari | 14+ | Full support |
| Edge | 90+ | Full support |
| iOS Safari | 14+ | Full support |
| Chrome Android | 90+ | Full support |

### 12.2 CSS Features Used

- CSS Custom Properties (Variables)
- CSS Grid
- CSS Flexbox
- CSS Transforms
- CSS Transitions
- CSS Animations
- CSS Media Queries (Level 4)
- CSS :focus-visible
- CSS @supports

### 12.3 Fallback Styles

```css
/* Flexbox fallback for older browsers */
.header-inner {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;
  -webkit-box-pack: justify;
  -ms-flex-pack: justify;
  justify-content: space-between;
}

/* Sticky header fallback */
.header-sticky {
  position: -webkit-sticky;
  position: sticky;
  top: 0;
}

/* Transition fallback */
.transition-colors {
  -webkit-transition: background-color 150ms ease-out, border-color 150ms ease-out, color 150ms ease-out;
  transition: background-color 150ms ease-out, border-color 150ms ease-out, color 150ms ease-out;
}

/* Transform fallback */
.transform {
  -webkit-transform: translateX(0);
  transform: translateX(0);
}
```

---

## 13. Print Styles

```css
@media print {
  .header-utility-bar {
    display: none;
  }
  
  .header-nav {
    display: none;
  }
  
  .mobile-drawer {
    display: none !important;
  }
  
  .header-main {
    height: auto;
    padding: 16px 0;
    border-bottom: 1px solid #000;
  }
  
  .logo-text {
    color: #000;
  }
  
  .brand-name {
    color: #000;
  }
  
  .tagline {
    color: #666;
  }
}
```

---

## 14. Summary

This CSS styling specification provides comprehensive Tailwind CSS classes and custom CSS utilities for implementing the Smart Tech header with a Newegg.com-inspired 3-row layout. The specification includes:

1. **CSS Custom Properties** for colors, spacing, typography, and animations
2. **Tailwind Configuration** with custom theme extensions
3. **Component Styling** for all header elements with responsive variants
4. **State Specifications** for hover, focus, and active states
5. **Animation & Transition** definitions with keyframes and utility classes
6. **Accessibility Requirements** including focus indicators, ARIA styling, and motion preferences
7. **Custom CSS Utilities** for header-specific functionality
8. **Complete Class References** for all components
9. **Browser Support** and print styles

All styling follows React best practices, uses semantic HTML, and prioritizes accessibility, responsive design, and performance.
