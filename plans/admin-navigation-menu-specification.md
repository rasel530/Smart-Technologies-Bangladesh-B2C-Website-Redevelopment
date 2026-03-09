# Admin Navigation Menu System - Comprehensive Specification

## Executive Summary

This specification defines a comprehensive navigation menu system for the admin dashboard that integrates 14 completed admin pages into a unified, user-friendly interface. The design focuses on logical grouping, intuitive navigation, and scalability for future enhancements.

---

## 1. Current State Analysis

### 1.1 Admin Home Page Structure
**Location:** [`frontend/src/app/admin/page.tsx`](../frontend/src/app/admin/page.tsx)

**Current Features:**
- Quick Stats Grid (Total Users, Products, Orders, Revenue)
- Admin Features Grid with 6 feature cards
- Quick Actions section
- Simple card-based layout with emoji icons

**Current Navigation Items:**
- RBAC Management (Active)
- User Management (Disabled - Coming Soon)
- Product Management (Active)
- Order Management (Active - links to `/admin/orders`)
- Analytics (Disabled - Coming Soon)
- System Settings (Disabled - Coming Soon)

**Limitations:**
- Only 3 active navigation links
- No hierarchical menu structure
- Missing 11 completed admin pages
- No sidebar or persistent navigation
- Limited to single-level navigation

### 1.2 Existing Admin Pages Overview

| # | Page | Route | Functionality | Current Status |
|---|------|-------|---------------|----------------|
| 1 | Orders Management | `/admin/orders` | View, filter, search, and manage all orders | ✅ Complete |
| 2 | Order Modifications | `/admin/orders/modifications` | Approve/reject order modification requests | ✅ Complete |
| 3 | Order Cancellations | `/admin/orders/cancellations` | Manage cancellation requests with refunds | ✅ Complete |
| 4 | Order Fulfillments | `/admin/orders/fulfillments` | Create and manage shipping fulfillments | ✅ Complete |
| 5 | Courier Services | `/admin/courier-services` | Manage courier service providers | ✅ Complete |
| 6 | Notifications | `/admin/notifications` | Manage all notifications with bulk actions | ✅ Complete |
| 7 | Notification Stats | `/admin/notifications/stats` | Notification analytics and statistics | ✅ Complete |
| 8 | Invoices | `/admin/invoices` | Manage invoices with download/email | ✅ Complete |
| 9 | Order Sharing | `/admin/orders/sharing` | Manage shared order links | ✅ Complete |
| 10 | Tracking Analytics | `/admin/tracking/analytics` | Tracking performance metrics | ✅ Complete |
| 11 | Tracking Issues | `/admin/tracking/issues` | Monitor and resolve tracking problems | ✅ Complete |
| 12 | Delivery Performance | `/admin/delivery/performance` | Delivery metrics and analytics | ✅ Complete |
| 13 | Tracking Sync | `/admin/tracking/sync` | Bulk sync tracking from couriers | ✅ Complete |
| 14 | Delivery Confirmations | `/admin/delivery/confirmations` | Manage delivery confirmations | ✅ Complete |

---

## 2. Proposed Menu Hierarchy

### 2.1 Primary Navigation Structure

The proposed navigation uses a **sidebar-based hierarchical menu** with 5 main categories:

```
Admin Dashboard
├── Dashboard (Home)
├── Orders
│   ├── All Orders
│   ├── Order Modifications
│   ├── Order Cancellations
│   ├── Order Fulfillments
│   └── Order Sharing
├── Tracking & Delivery
│   ├── Tracking Analytics
│   ├── Tracking Issues
│   ├── Tracking Sync
│   ├── Delivery Performance
│   └── Delivery Confirmations
├── Courier Services
│   └── Manage Couriers
├── Notifications
│   ├── All Notifications
│   └── Notification Statistics
├── Invoices
│   └── Invoice Management
└── System
    ├── RBAC Management
    ├── Product Management
    ├── User Management
    └── Settings
```

### 2.2 Detailed Menu Specification

#### Category 1: Dashboard (Home)
| Menu Item | User-Friendly Name | Route | Icon | Description |
|-----------|-------------------|-------|------|-------------|
| Dashboard | Dashboard Overview | `/admin` | `LayoutDashboard` | Main dashboard with quick stats and overview |

#### Category 2: Orders
| Menu Item | User-Friendly Name | Route | Icon | Description |
|-----------|-------------------|-------|------|-------------|
| All Orders | All Orders | `/admin/orders` | `ShoppingCart` | View and manage all orders with filters and actions |
| Order Modifications | Order Modifications | `/admin/orders/modifications` | `FileEdit` | Approve or reject order modification requests |
| Order Cancellations | Order Cancellations | `/admin/orders/cancellations` | `XCircle` | Manage cancellation requests and process refunds |
| Order Fulfillments | Order Fulfillments | `/admin/orders/fulfillments` | `Package` | Create and manage shipping fulfillments |
| Order Sharing | Order Sharing | `/admin/orders/sharing` | `Share2` | Manage shared order links and access control |

#### Category 3: Tracking & Delivery
| Menu Item | User-Friendly Name | Route | Icon | Description |
|-----------|-------------------|-------|------|-------------|
| Tracking Analytics | Tracking Analytics | `/admin/tracking/analytics` | `BarChart3` | View tracking performance metrics and analytics |
| Tracking Issues | Tracking Issues | `/admin/tracking/issues` | `AlertTriangle` | Monitor and resolve tracking problems |
| Tracking Sync | Tracking Sync | `/admin/tracking/sync` | `RefreshCw` | Bulk sync tracking information from couriers |
| Delivery Performance | Delivery Performance | `/admin/delivery/performance` | `TrendingUp` | Monitor delivery metrics and performance |
| Delivery Confirmations | Delivery Confirmations | `/admin/delivery/confirmations` | `CheckCircle` | View and manage delivery confirmations |

#### Category 4: Courier Services
| Menu Item | User-Friendly Name | Route | Icon | Description |
|-----------|-------------------|-------|------|-------------|
| Manage Couriers | Courier Services | `/admin/courier-services` | `Truck` | Add, edit, and manage courier service providers |

#### Category 5: Notifications
| Menu Item | User-Friendly Name | Route | Icon | Description |
|-----------|-------------------|-------|------|-------------|
| All Notifications | Notifications | `/admin/notifications` | `Bell` | Manage all notifications with bulk actions |
| Notification Statistics | Notification Stats | `/admin/notifications/stats` | `PieChart` | View notification analytics and statistics |

#### Category 6: Invoices
| Menu Item | User-Friendly Name | Route | Icon | Description |
|-----------|-------------------|-------|------|-------------|
| Invoice Management | Invoices | `/admin/invoices` | `FileText` | Manage invoices with download and email options |

#### Category 7: System
| Menu Item | User-Friendly Name | Route | Icon | Description |
|-----------|-------------------|-------|------|-------------|
| RBAC Management | RBAC Management | `/admin/rbac` | `Shield` | Manage roles, permissions, and access control |
| Product Management | Products | `/admin/products` | `Package` | Manage products and inventory |
| User Management | Users | `#` | `Users` | View and manage user accounts (Coming Soon) |
| Settings | Settings | `#` | `Settings` | Configure system settings (Coming Soon) |

---

## 3. Icon Recommendations

### 3.1 Icon Library
**Recommended:** Lucide React Icons (already in use in the project)

### 3.2 Icon Mapping Table

| Category | Menu Item | Icon Name | Lucide Import |
|----------|-----------|-----------|---------------|
| Dashboard | Dashboard Overview | `LayoutDashboard` | `import { LayoutDashboard } from 'lucide-react'` |
| Orders | All Orders | `ShoppingCart` | `import { ShoppingCart } from 'lucide-react'` |
| Orders | Order Modifications | `FileEdit` | `import { FileEdit } from 'lucide-react'` |
| Orders | Order Cancellations | `XCircle` | `import { XCircle } from 'lucide-react'` |
| Orders | Order Fulfillments | `Package` | `import { Package } from 'lucide-react'` |
| Orders | Order Sharing | `Share2` | `import { Share2 } from 'lucide-react'` |
| Tracking & Delivery | Tracking Analytics | `BarChart3` | `import { BarChart3 } from 'lucide-react'` |
| Tracking & Delivery | Tracking Issues | `AlertTriangle` | `import { AlertTriangle } from 'lucide-react'` |
| Tracking & Delivery | Tracking Sync | `RefreshCw` | `import { RefreshCw } from 'lucide-react'` |
| Tracking & Delivery | Delivery Performance | `TrendingUp` | `import { TrendingUp } from 'lucide-react'` |
| Tracking & Delivery | Delivery Confirmations | `CheckCircle` | `import { CheckCircle } from 'lucide-react'` |
| Courier Services | Manage Couriers | `Truck` | `import { Truck } from 'lucide-react'` |
| Notifications | All Notifications | `Bell` | `import { Bell } from 'lucide-react'` |
| Notifications | Notification Statistics | `PieChart` | `import { PieChart } from 'lucide-react'` |
| Invoices | Invoice Management | `FileText` | `import { FileText } from 'lucide-react'` |
| System | RBAC Management | `Shield` | `import { Shield } from 'lucide-react'` |
| System | Product Management | `Package` | `import { Package } from 'lucide-react'` |
| System | User Management | `Users` | `import { Users } from 'lucide-react'` |
| System | Settings | `Settings` | `import { Settings } from 'lucide-react'` |

---

## 4. Dashboard Layout Recommendations

### 4.1 Recommended Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Header (Fixed)                                          │
│  Logo | Breadcrumbs | User Profile | Notifications     │
├──────────┬──────────────────────────────────────────────────┤
│          │                                                  │
│ Sidebar  │  Main Content Area                              │
│ (Fixed   │                                                  │
│ 250px)   │  ┌────────────────────────────────────────────┐  │
│          │  │ Page Title & Description                 │  │
│          │  ├────────────────────────────────────────────┤  │
│          │  │ Filters & Search Bar                   │  │
│          │  ├────────────────────────────────────────────┤  │
│          │  │ Content Area (Table/Grid/Cards)        │  │
│          │  │                                        │  │
│          │  │                                        │  │
│          │  ├────────────────────────────────────────────┤  │
│          │  │ Pagination                              │  │
│          │  └────────────────────────────────────────────┘  │
│          │                                                  │
└──────────┴──────────────────────────────────────────────────┘
```

### 4.2 Layout Components

#### 4.2.1 Sidebar Navigation
- **Width:** 250px (expandable to 280px on hover)
- **Position:** Fixed left side
- **Behavior:** Collapsible on mobile (hamburger menu)
- **Features:**
  - Category headers with expand/collapse functionality
  - Active state highlighting
  - Hover effects with smooth transitions
  - Badge indicators for pending items (e.g., pending modifications, issues)
  - Search/filter functionality for menu items

#### 4.2.2 Header
- **Height:** 64px
- **Position:** Fixed top
- **Components:**
  - Logo/Brand on left
  - Breadcrumb navigation
  - Global search bar
  - Notification bell with badge
  - User profile dropdown (avatar, logout)

#### 4.2.3 Main Content Area
- **Padding:** 24px
- **Max Width:** 1600px (centered)
- **Background:** Light gray (`bg-gray-50`)
- **Components:**
  - Page title and description
  - Filter bar (collapsible)
  - Content cards/tables
  - Pagination controls

### 4.3 Responsive Design

#### Desktop (≥ 1024px)
- Full sidebar visible
- All menu categories expanded by default
- 3-column grid for stats cards

#### Tablet (768px - 1023px)
- Sidebar collapsible (icon-only mode)
- 2-column grid for stats cards
- Horizontal scrolling for filters

#### Mobile (< 768px)
- Sidebar hidden by default (hamburger menu)
- 1-column grid for stats cards
- Filters in drawer/modal
- Bottom navigation bar for quick access

---

## 5. Navigation Flow Recommendations

### 5.1 User Journey Flows

#### Flow 1: Order Management Workflow
```
Dashboard
  ↓
All Orders
  ↓ (click order details)
Order Details Modal
  ↓ (click modifications)
Order Modifications
  ↓ (approve/reject)
Back to Orders
```

#### Flow 2: Tracking Issue Resolution
```
Dashboard
  ↓
Tracking Issues
  ↓ (view issue)
Issue Details Modal
  ↓ (investigate)
Mark as Investigated
  ↓ (resolve)
Mark as Resolved
  ↓
Tracking Issues (refreshed)
```

#### Flow 3: Bulk Operations
```
Dashboard
  ↓
Notifications
  ↓ (select multiple)
Bulk Actions Bar Appears
  ↓ (choose action)
Execute Bulk Action
  ↓
Confirmation Dialog
  ↓
Results Summary
```

### 5.2 Navigation Best Practices

1. **Breadcrumb Navigation**
   - Always show full path: Dashboard > Orders > All Orders
   - Clickable breadcrumbs for quick navigation
   - Auto-generated based on current route

2. **Active State Indicators**
   - Highlight current page in sidebar
   - Use color accent (blue-600)
   - Show left border indicator for active item

3. **Quick Actions**
   - Add floating action button (FAB) for common tasks
   - Context-sensitive based on current page
   - Examples: "Create Order", "Add Courier", "Send Notification"

4. **Keyboard Navigation**
   - Support arrow keys for menu navigation
   - `Ctrl/Cmd + K` for global search
   - `Esc` to close modals/drawers

5. **Loading States**
   - Show skeleton loaders during page transitions
   - Maintain sidebar navigation visible
   - Display progress indicators for long operations

---

## 6. Menu Grouping Rationale

### 6.1 Orders Category
**Rationale:** Groups all order-related operations together for logical workflow.

**Pages Included:**
- All Orders: Central hub for order management
- Order Modifications: Sub-task of order management
- Order Cancellations: Sub-task of order management
- Order Fulfillments: Sub-task of order management
- Order Sharing: Sub-task of order management

**User Benefit:** Single location for all order operations, reducing navigation time.

### 6.2 Tracking & Delivery Category
**Rationale:** Combines tracking analytics, issues, and delivery management.

**Pages Included:**
- Tracking Analytics: Performance metrics
- Tracking Issues: Problem resolution
- Tracking Sync: Bulk operations
- Delivery Performance: Delivery metrics
- Delivery Confirmations: Delivery verification

**User Benefit:** Complete visibility into the delivery lifecycle from tracking to confirmation.

### 6.3 Courier Services Category
**Rationale:** Dedicated section for courier provider management.

**Pages Included:**
- Manage Couriers: Courier service CRUD operations

**User Benefit:** Easy access to courier configuration and management.

### 6.4 Notifications Category
**Rationale:** Groups notification management and analytics.

**Pages Included:**
- All Notifications: Notification management
- Notification Statistics: Analytics and reporting

**User Benefit:** Complete notification system oversight in one place.

### 6.5 Invoices Category
**Rationale:** Financial document management.

**Pages Included:**
- Invoice Management: Invoice operations

**User Benefit:** Quick access to financial documents.

### 6.6 System Category
**Rationale:** Administrative and configuration settings.

**Pages Included:**
- RBAC Management: Access control
- Product Management: Product catalog
- User Management: User accounts
- Settings: System configuration

**User Benefit:** Administrative functions separated from operational tasks.

---

## 7. Implementation Considerations

### 7.1 State Management
- Use React Context or Zustand for navigation state
- Store: active menu item, expanded categories, sidebar state
- Persist sidebar state in localStorage

### 7.2 Route Structure
- Maintain existing route structure
- No changes required to existing routes
- Navigation component should be route-agnostic

### 7.3 Performance Optimization
- Lazy load menu categories
- Code splitting for heavy pages
- Memoize navigation components
- Use virtual scrolling for long lists

### 7.4 Accessibility
- ARIA labels for all navigation elements
- Keyboard navigation support
- Screen reader compatibility
- Focus management for modals/drawers
- Color contrast ratios (WCAG AA)

### 7.5 Internationalization
- Support for English and Bengali (as seen in existing pages)
- Use translation keys for all menu items
- RTL language support consideration

---

## 8. Visual Design Specifications

### 8.1 Color Palette
```css
/* Primary Colors */
--primary-50: #eff6ff;
--primary-500: #3b82f6;
--primary-600: #2563eb;
--primary-700: #1d4ed8;

/* Neutral Colors */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-300: #d1d5db;
--gray-700: #374151;
--gray-800: #1f2937;
--gray-900: #111827;

/* Status Colors */
--success: #10b981;
--warning: #f59e0b;
--danger: #ef4444;
--info: #3b82f6;
```

### 8.2 Typography
```css
/* Font Family */
--font-sans: 'Inter', system-ui, -apple-system, sans-serif;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg: 1.125rem;    /* 18px */
--text-xl: 1.25rem;     /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
```

### 8.3 Spacing
```css
--spacing-1: 0.25rem;  /* 4px */
--spacing-2: 0.5rem;   /* 8px */
--spacing-3: 0.75rem;  /* 12px */
--spacing-4: 1rem;     /* 16px */
--spacing-6: 1.5rem;   /* 24px */
--spacing-8: 2rem;     /* 32px */
```

### 8.4 Border Radius
```css
--radius-sm: 0.375rem;  /* 6px */
--radius-md: 0.5rem;    /* 8px */
--radius-lg: 0.75rem;   /* 12px */
--radius-xl: 1rem;      /* 16px */
```

### 8.5 Shadows
```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

---

## 9. Component Architecture

### 9.1 Navigation Component Structure
```
AdminLayout
├── AdminSidebar
│   ├── SidebarHeader
│   ├── SidebarCategory
│   │   ├── CategoryHeader
│   │   └── MenuItem
│   │       ├── MenuIcon
│   │       ├── MenuLabel
│   │       ├── MenuBadge
│   │       └── SubMenu (if applicable)
│   └── SidebarFooter
├── AdminHeader
│   ├── Logo
│   ├── Breadcrumbs
│   ├── GlobalSearch
│   ├── NotificationBell
│   └── UserProfile
└── MainContent
    ├── PageHeader
    ├── FilterBar
    ├── ContentArea
    └── Pagination
```

### 9.2 Component Props Interface

```typescript
// AdminLayout Props
interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

// Sidebar Props
interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activePath: string;
}

// MenuItem Props
interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: number;
  isActive: boolean;
  onClick?: () => void;
}

// Category Props
interface CategoryProps {
  title: string;
  icon: React.ReactNode;
  items: MenuItemProps[];
  isExpanded: boolean;
  onToggle: () => void;
}
```

---

## 10. Future Enhancements

### 10.1 Phase 2 Enhancements
1. **Advanced Search**
   - Global search across all admin pages
   - Search filters and saved searches
   - Recent searches history

2. **Customizable Dashboard**
   - Drag-and-drop widgets
   - User-defined layouts
   - Personalized quick actions

3. **Real-time Notifications**
   - WebSocket integration
   - Live updates for orders, tracking, etc.
   - Notification preferences

4. **Advanced Analytics**
   - Custom date range picker
   - Export to multiple formats (PDF, Excel, CSV)
   - Scheduled reports

### 10.2 Phase 3 Enhancements
1. **Mobile App Integration**
   - Push notifications
   - Mobile admin dashboard
   - Offline mode support

2. **AI-Powered Insights**
   - Predictive analytics
   - Anomaly detection
   - Smart recommendations

3. **Multi-tenant Support**
   - Tenant-specific dashboards
   - Role-based customization
   - White-label options

---

## 11. Migration Strategy

### 11.1 Implementation Phases

#### Phase 1: Core Navigation (Week 1)
- Create AdminLayout component
- Implement sidebar navigation
- Add header with breadcrumbs
- Update admin home page to use new layout

#### Phase 2: Menu Integration (Week 2)
- Integrate all 14 pages into navigation
- Add active state highlighting
- Implement category expand/collapse
- Add badge indicators

#### Phase 3: Responsive Design (Week 3)
- Implement mobile hamburger menu
- Add responsive breakpoints
- Test on various screen sizes
- Optimize touch interactions

#### Phase 4: Polish & Testing (Week 4)
- Add animations and transitions
- Implement keyboard navigation
- Accessibility audit and fixes
- Performance optimization
- User acceptance testing

### 11.2 Backward Compatibility
- Maintain existing routes
- No breaking changes to page functionality
- Gradual rollout with feature flags
- Fallback to old layout if needed

---

## 12. Success Metrics

### 12.1 User Experience Metrics
- **Navigation Time:** Average time to reach any page < 3 clicks
- **Task Completion:** Time to complete common tasks reduced by 30%
- **User Satisfaction:** Survey score > 4.5/5
- **Error Rate:** Navigation-related errors < 1%

### 12.2 Performance Metrics
- **Initial Load:** < 2 seconds on 3G
- **Navigation Speed:** < 100ms for page transitions
- **Bundle Size:** Navigation bundle < 50KB gzipped
- **Lighthouse Score:** > 90 for Performance and Accessibility

---

## 13. Conclusion

This specification provides a comprehensive blueprint for implementing a unified navigation menu system for the admin dashboard. The design prioritizes:

1. **Logical Grouping:** Related pages grouped into intuitive categories
2. **User-Friendly Navigation:** Clear hierarchy with minimal clicks
3. **Scalability:** Easy to add new pages and features
4. **Accessibility:** WCAG AA compliant with keyboard navigation
5. **Performance:** Optimized for fast load times and smooth transitions
6. **Responsiveness:** Works seamlessly on all device sizes

The proposed structure integrates all 14 completed admin pages while maintaining room for future growth and enhancements.

---

## Appendix A: Menu Data Structure

```typescript
interface MenuItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  badge?: number;
  disabled?: boolean;
  children?: MenuItem[];
}

interface MenuCategory {
  id: string;
  title: string;
  icon: string;
  items: MenuItem[];
}

const navigationMenu: MenuCategory[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: 'LayoutDashboard',
    items: [
      {
        id: 'dashboard-overview',
        label: 'Dashboard Overview',
        href: '/admin',
        icon: 'LayoutDashboard',
      },
    ],
  },
  {
    id: 'orders',
    title: 'Orders',
    icon: 'ShoppingCart',
    items: [
      {
        id: 'all-orders',
        label: 'All Orders',
        href: '/admin/orders',
        icon: 'ShoppingCart',
      },
      {
        id: 'order-modifications',
        label: 'Order Modifications',
        href: '/admin/orders/modifications',
        icon: 'FileEdit',
      },
      {
        id: 'order-cancellations',
        label: 'Order Cancellations',
        href: '/admin/orders/cancellations',
        icon: 'XCircle',
      },
      {
        id: 'order-fulfillments',
        label: 'Order Fulfillments',
        href: '/admin/orders/fulfillments',
        icon: 'Package',
      },
      {
        id: 'order-sharing',
        label: 'Order Sharing',
        href: '/admin/orders/sharing',
        icon: 'Share2',
      },
    ],
  },
  // ... other categories
];
```

---

## Appendix B: Sample Navigation Component Code

```typescript
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  FileEdit, 
  XCircle, 
  Package, 
  Share2,
  BarChart3,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  CheckCircle,
  Truck,
  Bell,
  PieChart,
  FileText,
  Shield,
  Users,
  Settings,
  ChevronDown,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  href: string;
  icon: any;
  badge?: number;
}

interface MenuCategory {
  id: string;
  title: string;
  icon: any;
  items: MenuItem[];
}

const menuCategories: MenuCategory[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: LayoutDashboard,
    items: [
      { id: 'dashboard', label: 'Dashboard Overview', href: '/admin', icon: LayoutDashboard },
    ],
  },
  {
    id: 'orders',
    title: 'Orders',
    icon: ShoppingCart,
    items: [
      { id: 'all-orders', label: 'All Orders', href: '/admin/orders', icon: ShoppingCart },
      { id: 'modifications', label: 'Order Modifications', href: '/admin/orders/modifications', icon: FileEdit },
      { id: 'cancellations', label: 'Order Cancellations', href: '/admin/orders/cancellations', icon: XCircle },
      { id: 'fulfillments', label: 'Order Fulfillments', href: '/admin/orders/fulfillments', icon: Package },
      { id: 'sharing', label: 'Order Sharing', href: '/admin/orders/sharing', icon: Share2 },
    ],
  },
  {
    id: 'tracking',
    title: 'Tracking & Delivery',
    icon: BarChart3,
    items: [
      { id: 'tracking-analytics', label: 'Tracking Analytics', href: '/admin/tracking/analytics', icon: BarChart3 },
      { id: 'tracking-issues', label: 'Tracking Issues', href: '/admin/tracking/issues', icon: AlertTriangle },
      { id: 'tracking-sync', label: 'Tracking Sync', href: '/admin/tracking/sync', icon: RefreshCw },
      { id: 'delivery-performance', label: 'Delivery Performance', href: '/admin/delivery/performance', icon: TrendingUp },
      { id: 'delivery-confirmations', label: 'Delivery Confirmations', href: '/admin/delivery/confirmations', icon: CheckCircle },
    ],
  },
  {
    id: 'couriers',
    title: 'Courier Services',
    icon: Truck,
    items: [
      { id: 'courier-services', label: 'Manage Couriers', href: '/admin/courier-services', icon: Truck },
    ],
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: Bell,
    items: [
      { id: 'notifications', label: 'All Notifications', href: '/admin/notifications', icon: Bell },
      { id: 'notification-stats', label: 'Notification Statistics', href: '/admin/notifications/stats', icon: PieChart },
    ],
  },
  {
    id: 'invoices',
    title: 'Invoices',
    icon: FileText,
    items: [
      { id: 'invoices', label: 'Invoice Management', href: '/admin/invoices', icon: FileText },
    ],
  },
  {
    id: 'system',
    title: 'System',
    icon: Settings,
    items: [
      { id: 'rbac', label: 'RBAC Management', href: '/admin/rbac', icon: Shield },
      { id: 'products', label: 'Product Management', href: '/admin/products', icon: Package },
      { id: 'users', label: 'User Management', href: '#', icon: Users, disabled: true },
      { id: 'settings', label: 'Settings', href: '#', icon: Settings, disabled: true },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['orders', 'tracking']));
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Sidebar Overlay for Mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200
          transform transition-transform duration-300 ease-in-out z-50
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Admin Panel</h2>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto p-4">
          {menuCategories.map((category) => (
            <div key={category.id} className="mb-4">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between p-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2">
                  <category.icon className="w-4 h-4" />
                  <span>{category.title}</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    expandedCategories.has(category.id) ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Category Items */}
              {expandedCategories.has(category.id) && (
                <div className="mt-2 ml-4 space-y-1">
                  {category.items.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={`
                        flex items-center gap-2 p-2 text-sm rounded-lg transition-colors
                        ${isActive(item.href)
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-100'
                        }
                        ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                      {item.disabled && (
                        <span className="text-xs text-gray-400">Coming Soon</span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200">
          <Link
            href="/"
            className="flex items-center gap-2 p-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
            <span>Back to Website</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-03-03  
**Status:** Ready for Implementation  
