# Admin Panel UI/UX Refactoring Technical Specification

**Document Version:** 1.0  
**Date:** February 1, 2026  
**Status:** Draft - Ready for Implementation  
**Priority:** Critical - 47 UI/UX Issues Identified

---

## Executive Summary

This technical specification outlines the comprehensive refactoring plan for the Smart Technologies Admin Panel. The analysis identified 47 UI/UX issues across the admin panel, categorized as:

- **Critical Issues (8):** Broken functionality, severe accessibility issues, duplicate wrapper divs
- **High Issues (15):** Major usability problems, visual inconsistencies, color theme conflicts
- **Medium Issues (18):** Minor issues affecting user experience, spacing inconsistencies
- **Low Issues (6):** Cosmetic or minor improvements

The refactoring will be implemented in three phases over the course of the project, with Phase 1 addressing critical layout and theme issues, Phase 2 establishing the component library, and Phase 3 polishing visual hierarchy and spacing.

---

## 1. Design System Specifications

### 1.1 Color Palette

The admin panel will adopt a unified color system based on the existing blue primary palette, eliminating the indigo/blue conflict between the sidebar and components.

#### Primary Color Scale (Blue)

The primary color scale will serve as the main brand color for all interactive elements, buttons, and accents throughout the admin panel.

| Token         | Value     | Usage                               |
| ------------- | --------- | ----------------------------------- |
| `primary-50`  | `#eff6ff` | Background tints, subtle highlights |
| `primary-100` | `#dbeafe` | Hover states, light backgrounds     |
| `primary-200` | `#bfdbfe` | Secondary hover, focus rings        |
| `primary-300` | `#93c5fd` | Active states, selection            |
| `primary-400` | `#60a5fa` | Medium emphasis, links              |
| `primary-500` | `#3b82f6` | Primary brand color, icons          |
| `primary-600` | `#2563eb` | Primary buttons, active states      |
| `primary-700` | `#1d4ed8` | Primary hover, emphasis text        |
| `primary-800` | `#1e40af` | Dark emphasis, headings             |
| `primary-900` | `#1e3a8a` | Darkest, navigation active          |
| `primary-950` | `#172554` | Very dark, footer backgrounds       |

#### Semantic Colors

Semantic colors provide consistent visual language for status indicators and feedback across the admin panel.

| Token         | Value     | Usage                             |
| ------------- | --------- | --------------------------------- |
| `success-50`  | `#f0fdf4` | Success backgrounds               |
| `success-100` | `#dcfce7` | Success light backgrounds         |
| `success-500` | `#22c55e` | Success icons, badges             |
| `success-600` | `#16a34a` | Success buttons, active states    |
| `success-700` | `#15803d` | Success hover, emphasis           |
| `danger-50`   | `#fef2f2` | Error backgrounds                 |
| `danger-100`  | `#fee2e2` | Error light backgrounds           |
| `danger-500`  | `#ef4444` | Error icons, destructive actions  |
| `danger-600`  | `#dc2626` | Danger buttons, error states      |
| `danger-700`  | `#b91c1c` | Danger hover, critical errors     |
| `warning-50`  | `#fffbeb` | Warning backgrounds               |
| `warning-100` | `#fef3c7` | Warning light backgrounds         |
| `warning-500` | `#f59e0b` | Warning icons, pending states     |
| `warning-600` | `#d97706` | Warning buttons, attention states |
| `warning-700` | `#b45309` | Warning hover                     |

#### Neutral Color Scale

The neutral scale provides a cohesive foundation for backgrounds, text, borders, and interface elements throughout the admin panel.

| Token         | Value     | Usage                              |
| ------------- | --------- | ---------------------------------- |
| `neutral-50`  | `#fafafa` | Page backgrounds, card backgrounds |
| `neutral-100` | `#f5f5f5` | Secondary backgrounds, borders     |
| `neutral-200` | `#e5e5e5` | Dividers, subtle borders           |
| `neutral-300` | `#d4d4d4` | Disabled states, secondary borders |
| `neutral-400` | `#a3a3a3` | Placeholders, hints                |
| `neutral-500` | `#737373` | Secondary text, icons              |
| `neutral-600` | `#525252` | Body text, labels                  |
| `neutral-700` | `#404040` | Emphasis text, headings            |
| `neutral-800` | `#262626` | Dark text, headings                |
| `neutral-900` | `#171717` | Primary text, headings             |
| `neutral-950` | `#0a0a0a` | Darkest, black surfaces            |

#### Sidebar Colors

The sidebar will use a dedicated color scale to maintain visual hierarchy while remaining consistent with the overall design system.

| Token                 | Value     | Usage                          |
| --------------------- | --------- | ------------------------------ |
| `sidebar-bg`          | `#ffffff` | Sidebar background             |
| `sidebar-border`      | `#e5e5e5` | Sidebar border                 |
| `sidebar-text`        | `#404040` | Sidebar text                   |
| `sidebar-text-muted`  | `#737373` | Sidebar muted text             |
| `sidebar-hover`       | `#f5f5f5` | Sidebar item hover             |
| `sidebar-active`      | `#eff6ff` | Sidebar active item background |
| `sidebar-active-text` | `#1d4ed8` | Sidebar active item text       |

### 1.2 Typography Scale

Typography will follow a consistent scale to establish clear visual hierarchy throughout the admin panel. All headings will use the Inter font family with tight tracking for a professional appearance.

| Token       | Size     | Line Height | Weight | Usage                              |
| ----------- | -------- | ----------- | ------ | ---------------------------------- |
| `text-xs`   | 0.75rem  | 1rem        | 400    | Captions, metadata, timestamps     |
| `text-sm`   | 0.875rem | 1.25rem     | 400    | Body text, labels, form elements   |
| `text-base` | 1rem     | 1.5rem      | 400    | Default body text, paragraphs      |
| `text-lg`   | 1.125rem | 1.625rem    | 500    | Card titles, section headers       |
| `text-xl`   | 1.25rem  | 1.75rem     | 600    | Page section titles, modal headers |
| `text-2xl`  | 1.5rem   | 2rem        | 600    | Page headers, major sections       |
| `text-3xl`  | 1.875rem | 2.25rem     | 700    | Page titles, hero sections         |
| `text-4xl`  | 2.25rem  | 2.5rem      | 700    | Dashboard metrics, large displays  |

#### Font Family Configuration

```javascript
// tailwind.config.js
fontFamily: {
  sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
  mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'monospace'],
}
```

#### Typography Usage Guidelines

Page titles should consistently use `text-3xl font-bold text-neutral-900` to establish clear visual hierarchy. Section headers within pages should use `text-xl font-semibold text-neutral-800` with appropriate margin bottom. Card titles should use `text-lg font-medium text-neutral-900` to differentiate from body text. Form labels should use `text-sm font-medium text-neutral-700` with `block` display. Secondary text and metadata should use `text-sm text-neutral-500` for reduced visual emphasis.

### 1.3 Spacing Scale

A consistent spacing scale will ensure rhythm and alignment across all admin panel interfaces. The scale follows an 8px base unit with multipliers for larger spacing needs.

| Token      | Value   | Pixels | Usage                                 |
| ---------- | ------- | ------ | ------------------------------------- |
| `space-1`  | 0.25rem | 4px    | Icon spacing, tight layouts           |
| `space-2`  | 0.5rem  | 8px    | Default inline spacing, form elements |
| `space-3`  | 0.75rem | 12px   | Form group spacing, button groups     |
| `space-4`  | 1rem    | 16px   | Card padding, section gaps            |
| `space-5`  | 1.25rem | 20px   | Component spacing, modal padding      |
| `space-6`  | 1.5rem  | 24px   | Section padding, grid gaps            |
| `space-8`  | 2rem    | 32px   | Major section spacing, page margins   |
| `space-10` | 2.5rem  | 40px   | Hero sections, feature blocks         |
| `space-12` | 3rem    | 48px   | Large section spacing                 |
| `space-16` | 4rem    | 64px   | Page sections, layout blocks          |

#### Standard Spacing Patterns

Content padding for cards should be `p-6` (24px) on all sides. Page content padding should be `px-4 sm:px-6 lg:px-8 py-8` for responsive margins. Section spacing between major content blocks should be `mb-8` (32px). Grid gaps for card layouts should be `gap-6` (24px). Form field spacing should be `space-y-4` (16px) between fields. Button groups should have `space-x-3` (12px) between buttons.

### 1.4 Border Radius Scale

Border radius values will create a consistent visual language for buttons, cards, inputs, and other interactive elements.

| Token         | Value    | Pixels | Usage                                |
| ------------- | -------- | ------ | ------------------------------------ |
| `radius-sm`   | 0.125rem | 2px    | Small badges, tags, compact elements |
| `radius-md`   | 0.375rem | 6px    | Buttons, form inputs, small cards    |
| `radius-lg`   | 0.5rem   | 8px    | Default cards, dropdowns, modals     |
| `radius-xl`   | 0.75rem  | 12px   | Large cards, feature blocks          |
| `radius-2xl`  | 1rem     | 16px   | Hero sections, prominent containers  |
| `radius-full` | 9999px   | Full   | Avatars, badges, circular buttons    |

#### Border Radius Usage Guidelines

Buttons and interactive elements should use `rounded-lg` (8px) for consistency with form inputs. Cards and containers should use `rounded-xl` (12px) for a modern appearance. Small badges and tags should use `rounded-full` for pill shapes or `rounded-sm` for subtle tags. Input fields and form controls should use `rounded-lg` to match button styling.

### 1.5 Shadow Scale

Shadows will create depth and hierarchy while maintaining a clean, professional appearance suitable for an admin interface.

| Token          | Value                               | Usage                                 |
| -------------- | ----------------------------------- | ------------------------------------- |
| `shadow-sm`    | 0 1px 2px 0 rgb(0 0 0 / 0.05)       | Subtle elevation, flat surfaces       |
| `shadow-md`    | 0 4px 6px -1px rgb(0 0 0 / 0.1)     | Cards, dropdowns, floating elements   |
| `shadow-lg`    | 0 10px 15px -3px rgb(0 0 0 / 0.1)   | Modals, popovers, tooltips            |
| `shadow-xl`    | 0 20px 25px -5px rgb(0 0 0 / 0.1)   | Dialogs, overlays, prominent elements |
| `shadow-inner` | inset 0 2px 4px 0 rgb(0 0 0 / 0.05) | Input fields, pressed states          |
| `shadow-focus` | 0 0 0 3px rgb(59 130 246 / 0.4)     | Focus rings for accessibility         |

#### Shadow Usage Guidelines

Cards and content containers should use `shadow-md` for subtle elevation. Dropdown menus and floating elements should use `shadow-lg`. Modals and dialogs should use `shadow-xl`. Interactive hover states on cards should use `hover:shadow-lg`. Focus states should use the dedicated `shadow-focus` ring for accessibility compliance.

### 1.6 Component Sizing Standards

Consistent sizing standards will ensure all components maintain visual harmony and usability.

#### Button Sizes

| Size | Height | Padding       | Font Size   | Usage                            |
| ---- | ------ | ------------- | ----------- | -------------------------------- |
| `xs` | 32px   | `px-3 py-1.5` | `text-xs`   | Compact buttons, table actions   |
| `sm` | 36px   | `px-4 py-2`   | `text-sm`   | Small buttons, toolbar actions   |
| `md` | 40px   | `px-4 py-2`   | `text-sm`   | Default button size              |
| `lg` | 48px   | `px-6 py-3`   | `text-base` | Primary actions, hero buttons    |
| `xl` | 56px   | `px-8 py-4`   | `text-lg`   | Prominent actions, landing pages |

#### Input Sizes

| Size | Height | Padding       | Usage                              |
| ---- | ------ | ------------- | ---------------------------------- |
| `sm` | 32px   | `px-3 py-1.5` | Compact forms, inline inputs       |
| `md` | 40px   | `px-4 py-2`   | Standard form inputs               |
| `lg` | 48px   | `px-4 py-3`   | Accessible inputs, mobile-friendly |

#### Icon Sizes

| Size  | Value | Usage                         |
| ----- | ----- | ----------------------------- |
| `xs`  | 14px  | Inline text icons, badges     |
| `sm`  | 16px  | Form icons, small buttons     |
| `md`  | 20px  | Default icon size, navigation |
| `lg`  | 24px  | Featured icons, cards         |
| `xl`  | 32px  | Hero icons, section headers   |
| `2xl` | 48px  | Large displays, empty states  |

---

## 2. Component Architecture

### 2.1 Design System Component Directory Structure

The component library will be organized in a dedicated directory structure to ensure maintainability and discoverability.

```
frontend/src/components/design-system/
├── index.ts                    # Barrel export file
├── Button/
│   ├── Button.tsx             # Primary button component
│   ├── ButtonPrimary.tsx      # Primary variant
│   ├── ButtonSecondary.tsx    # Secondary variant
│   ├── ButtonDanger.tsx       # Danger/destructive variant
│   ├── ButtonGhost.tsx        # Ghost/tertiary variant
│   ├── ButtonGroup.tsx        # Button group wrapper
│   └── Button.styles.ts       # Shared styles and types
├── Card/
│   ├── Card.tsx               # Base card component
│   ├── CardHeader.tsx         # Card header with title/actions
│   ├── CardBody.tsx           # Card content area
│   ├── CardFooter.tsx         # Card footer with actions
│   └── Card.styles.ts         # Card styles and variants
├── Form/
│   ├── Input/
│   │   ├── Input.tsx          # Text input component
│   │   ├── InputGroup.tsx     # Input with label/helper
│   │   └── Input.styles.ts    # Input styles and types
│   ├── Select/
│   │   ├── Select.tsx         # Select dropdown
│   │   └── Select.styles.ts   # Select styles
│   ├── Checkbox/
│   │   ├── Checkbox.tsx       # Checkbox component
│   │   └── Checkbox.styles.ts # Checkbox styles
│   ├── Radio/
│   │   ├── Radio.tsx          # Radio button
│   │   └── Radio.styles.ts    # Radio styles
│   ├── Textarea/
│   │   ├── Textarea.tsx       # Multi-line textarea
│   │   └── Textarea.styles.ts # Textarea styles
│   ├── Label/
│   │   ├── Label.tsx          # Form label
│   │   └── Label.styles.ts    # Label styles
│   └── FieldError/
│       ├── FieldError.tsx     # Error message display
│       └── FieldError.styles.ts
├── Layout/
│   ├── PageWrapper.tsx        # Page container with margins
│   ├── SectionHeader.tsx      # Section title with description
│   ├── StatsGrid.tsx          # Statistics cards grid
│   ├── CardGrid.tsx           # Responsive card grid
│   └── Layout.styles.ts       # Layout styles
├── Badge/
│   ├── Badge.tsx              # Status badge component
│   ├── Badge.styles.ts        # Badge variants
│   └── Badge.utils.ts         # Badge color helpers
├── Table/
│   ├── Table.tsx              # Data table wrapper
│   ├── TableHeader.tsx        # Table header cell
│   ├── TableBody.tsx          # Table body wrapper
│   ├── TableRow.tsx           # Table row component
│   ├── TableCell.tsx          # Table cell component
│   └── Table.styles.ts        # Table styles
├── Modal/
│   ├── Modal.tsx              # Modal dialog
│   ├── ModalHeader.tsx        # Modal header
│   ├── ModalBody.tsx          # Modal content
│   ├── ModalFooter.tsx        # Modal actions
│   ├── ModalOverlay.tsx       # Modal backdrop
│   └── Modal.styles.ts        # Modal styles and animations
├── Pagination/
│   ├── Pagination.tsx         # Pagination controls
│   ├── PaginationButton.tsx   # Individual page button
│   └── Pagination.styles.ts   # Pagination styles
├── EmptyState/
│   ├── EmptyState.tsx         # Empty state display
│   ├── EmptyState.styles.ts   # Empty state styles
│   └── EmptyState.icons.ts    # Empty state icons
├── Loading/
│   ├── Spinner.tsx            # Loading spinner
│   ├── Skeleton.tsx           # Skeleton loader
│   ├── SkeletonCard.tsx       # Card skeleton
│   ├── SkeletonTable.tsx      # Table skeleton
│   └── Loading.styles.ts      # Loading animations
└── utilities/
    ├── cn.ts                  # ClassName utility (clsx + tailwind-merge)
    └── colors.ts              # Color utility functions
```

### 2.2 Button Components

The button components will provide consistent styling and behavior across all interactive elements.

#### Button Props Interface

```typescript
// Button.styles.ts
import { ButtonHTMLAttributes } from "react";

export type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";
export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  isDisabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}
```

#### Button Component Implementation

```typescript
// Button/Button.tsx
import React from 'react';
import { cn } from '@/components/design-system/utilities/cn';
import { ButtonProps, ButtonSize, ButtonVariant } from './Button.styles';

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'h-8 px-3 text-xs',
  sm: 'h-9 px-4 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
  xl: 'h-14 px-8 text-lg',
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
  secondary: 'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
  ghost: 'bg-transparent text-primary-600 hover:bg-primary-50 focus:ring-2 focus:ring-primary-500',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      isDisabled = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isDisabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          sizeClasses[size],
          variantClasses[variant],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : leftIcon ? (
          <span className="mr-2">{leftIcon}</span>
        ) : null}
        {children}
        {rightIcon && !isLoading && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

#### Button Usage Examples

```tsx
// Primary button
<Button variant="primary" size="md">
  Save Changes
</Button>

// Secondary button with icon
<Button variant="secondary" size="md" leftIcon={<PlusIcon />}>
  Add New Item
</Button>

// Danger button for destructive actions
<Button variant="danger" size="md" onClick={handleDelete}>
  Delete
</Button>

// Ghost button for tertiary actions
<Button variant="ghost" size="sm">
  Cancel
</Button>

// Loading state
<Button variant="primary" isLoading>
  Processing...
</Button>
```

### 2.3 Card Components

The card components will provide consistent container styling for content sections.

#### Card Props Interface

```typescript
// Card.styles.ts
import { HTMLAttributes, ReactNode } from "react";

export type CardPadding = "none" | "sm" | "md" | "lg" | "xl";
export type CardVariant = "default" | "bordered" | "elevated";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  children: ReactNode;
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  action?: ReactNode;
}

export interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  align?: "left" | "center" | "right" | "between";
}
```

#### Card Component Implementation

```typescript
// Card/Card.tsx
import React from 'react';
import { cn } from '@/components/design-system/utilities/cn';
import { CardProps, CardPadding, CardVariant } from './Card.styles';

const paddingClasses: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
  xl: 'p-8',
};

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-white border border-neutral-200',
  bordered: 'bg-white border-2 border-neutral-300',
  elevated: 'bg-white shadow-md',
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, variant = 'default', padding = 'lg', className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl',
          variantClasses[variant],
          paddingClasses[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = ({
  title,
  description,
  action,
  className,
  ...props
}: CardHeaderProps) => {
  return (
    <div className={cn('px-6 py-4 border-b border-neutral-200', className)} {...props}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
          {description && (
            <p className="mt-1 text-sm text-neutral-500">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
};

export const CardBody = ({ children, className, ...props }: CardBodyProps) => {
  return (
    <div className={cn('p-6', className)} {...props}>
      {children}
    </div>
  );
};

export const CardFooter = ({
  children,
  align = 'right',
  className,
  ...props
}: CardFooterProps) => {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between',
  };

  return (
    <div
      className={cn(
        'px-6 py-4 border-t border-neutral-200 flex gap-3',
        alignClasses[align],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
```

#### Card Usage Examples

```tsx
// Basic card
<Card>
  <CardHeader title="Product Details" description="Manage product information" />
  <CardBody>
    {/* Card content */}
  </CardBody>
  <CardFooter>
    <Button variant="secondary">Cancel</Button>
    <Button variant="primary">Save</Button>
  </CardFooter>
</Card>

// Elevated card for statistics
<Card variant="elevated" padding="md">
  <div className="flex items-center">
    <div className="bg-primary-100 p-3 rounded-full">
      <PackageIcon className="w-6 h-6 text-primary-600" />
    </div>
    <div className="ml-4">
      <p className="text-sm text-neutral-600">Total Products</p>
      <p className="text-2xl font-bold text-neutral-900">156</p>
    </div>
  </div>
</Card>

// Bordered card for forms
<Card variant="bordered">
  <CardHeader title="Category Information" />
  <CardBody>
    <form>
      {/* Form fields */}
    </form>
  </CardBody>
</Card>
```

### 2.4 Form Components

Form components will ensure consistent styling and accessibility across all form elements.

#### Input Component

```typescript
// Form/Input/Input.tsx
import React, { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/components/design-system/utilities/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  inputSize?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-4 text-base',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, inputSize = 'md', className, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-neutral-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-lg border bg-white text-neutral-900',
            'placeholder:text-neutral-400',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'disabled:bg-neutral-50 disabled:text-neutral-500 disabled:cursor-not-allowed',
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-neutral-300',
            sizeClasses[inputSize],
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-neutral-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
```

#### Select Component

```typescript
// Form/Select/Select.tsx
import React, { SelectHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/components/design-system/utilities/cn';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  inputSize?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-4 text-base',
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, placeholder, inputSize = 'md', className, id, ...props }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-neutral-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'w-full rounded-lg border bg-white text-neutral-900',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'disabled:bg-neutral-50 disabled:text-neutral-500 disabled:cursor-not-allowed',
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-neutral-300',
            sizeClasses[inputSize],
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1.5 text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-neutral-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
```

### 2.5 Badge Component

The badge component will provide consistent status indicators throughout the admin panel.

```typescript
// Badge/Badge.tsx
import React from 'react';
import { cn } from '@/components/design-system/utilities/cn';

export type BadgeColor =
  | 'gray'
  | 'blue'
  | 'green'
  | 'yellow'
  | 'red'
  | 'purple'
  | 'indigo'
  | 'pink';

export interface BadgeProps {
  children: React.ReactNode;
  color?: BadgeColor;
  variant?: 'filled' | 'subtle' | 'outlined';
  size?: 'sm' | 'md';
}

const colorClasses = {
  gray: {
    filled: 'bg-neutral-900 text-white',
    subtle: 'bg-neutral-100 text-neutral-700',
    outlined: 'border border-neutral-300 text-neutral-700',
  },
  blue: {
    filled: 'bg-primary-600 text-white',
    subtle: 'bg-primary-50 text-primary-700',
    outlined: 'border border-primary-300 text-primary-700',
  },
  green: {
    filled: 'bg-green-600 text-white',
    subtle: 'bg-green-50 text-green-700',
    outlined: 'border border-green-300 text-green-700',
  },
  yellow: {
    filled: 'bg-yellow-500 text-white',
    subtle: 'bg-yellow-50 text-yellow-700',
    outlined: 'border border-yellow-300 text-yellow-700',
  },
  red: {
    filled: 'bg-red-600 text-white',
    subtle: 'bg-red-50 text-red-700',
    outlined: 'border border-red-300 text-red-700',
  },
  purple: {
    filled: 'bg-purple-600 text-white',
    subtle: 'bg-purple-50 text-purple-700',
    outlined: 'border border-purple-300 text-purple-700',
  },
  indigo: {
    filled: 'bg-indigo-600 text-white',
    subtle: 'bg-indigo-50 text-indigo-700',
    outlined: 'border border-indigo-300 text-indigo-700',
  },
  pink: {
    filled: 'bg-pink-600 text-white',
    subtle: 'bg-pink-50 text-pink-700',
    outlined: 'border border-pink-300 text-pink-700',
  },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

export const Badge = ({
  children,
  color = 'gray',
  variant = 'subtle',
  size = 'md',
}: BadgeProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        colorClasses[color][variant],
        sizeClasses[size]
      )}
    >
      {children}
    </span>
  );
};

// Helper function for status badges
export const getStatusBadge = (status: string): { color: BadgeColor; label: string } => {
  const statusMap: Record<string, { color: BadgeColor; label: string }> = {
    active: { color: 'green', label: 'Active' },
    published: { color: 'green', label: 'Published' },
    inactive: { color: 'gray', label: 'Inactive' },
    draft: { color: 'yellow', label: 'Draft' },
    archived: { color: 'gray', label: 'Archived' },
    pending: { color: 'yellow', label: 'Pending' },
    rejected: { color: 'red', label: 'Rejected' },
    approved: { color: 'green', label: 'Approved' },
    out_of_stock: { color: 'yellow', label: 'Out of Stock' },
    discontinued: { color: 'red', label: 'Discontinued' },
  };

  return statusMap[status] || { color: 'gray', label: status };
};
```

### 2.6 Layout Components

Layout components will ensure consistent page structure and spacing.

#### PageWrapper Component

```typescript
// Layout/PageWrapper.tsx
import React, { HTMLAttributes } from 'react';
import { cn } from '@/components/design-system/utilities/cn';

export interface PageWrapperProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  showBackButton?: boolean;
  onBackClick?: () => void;
}

export const PageWrapper = ({
  title,
  description,
  children,
  actions,
  showBackButton = false,
  onBackClick,
  className,
  ...props
}: PageWrapperProps) => {
  return (
    <div className={cn('space-y-6', className)} {...props}>
      {/* Page Header */}
      {(title || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            {title && (
              <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
            )}
            {description && (
              <p className="mt-1 text-sm text-neutral-500">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-3">{actions}</div>
          )}
        </div>
      )}

      {/* Page Content */}
      <div>{children}</div>
    </div>
  );
};
```

#### SectionHeader Component

```typescript
// Layout/SectionHeader.tsx
import React, { HTMLAttributes } from 'react';
import { cn } from '@/components/design-system/utilities/cn';

export interface SectionHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const SectionHeader = ({
  title,
  description,
  action,
  className,
  ...props
}: SectionHeaderProps) => {
  return (
    <div className={cn('flex items-center justify-between mb-6', className)} {...props}>
      <div>
        <h2 className="text-xl font-semibold text-neutral-900">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-neutral-500">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};
```

#### StatsGrid Component

```typescript
// Layout/StatsGrid.tsx
import React, { HTMLAttributes } from 'react';
import { cn } from '@/components/design-system/utilities/cn';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

export interface StatsGridProps extends HTMLAttributes<HTMLDivElement> {
  stats: StatCardProps[];
  columns?: 2 | 3 | 4 | 5;
}

const colorVariants = {
  default: 'bg-white border border-neutral-200',
  primary: 'bg-white border border-primary-200',
  success: 'bg-white border border-green-200',
  warning: 'bg-white border border-yellow-200',
  danger: 'bg-white border border-red-200',
};

const iconColorVariants = {
  default: 'bg-neutral-100 text-neutral-600',
  primary: 'bg-primary-100 text-primary-600',
  success: 'bg-green-100 text-green-600',
  warning: 'bg-yellow-100 text-yellow-600',
  danger: 'bg-red-100 text-red-600',
};

const gridCols = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5',
};

export const StatsGrid = ({ stats, columns = 4, className, ...props }: StatsGridProps) => {
  return (
    <div className={cn('grid gap-6', gridCols[columns], className)} {...props}>
      {stats.map((stat, index) => (
        <div
          key={index}
          className={cn(
            'rounded-xl p-6 shadow-sm',
            colorVariants[stat.color || 'default']
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500">{stat.title}</p>
              <p className="mt-2 text-3xl font-bold text-neutral-900">{stat.value}</p>
              {stat.trend && (
                <p
                  className={cn(
                    'mt-2 text-sm font-medium',
                    stat.trend.isPositive ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {stat.trend.isPositive ? '↑' : '↓'} {Math.abs(stat.trend.value)}%
                </p>
              )}
            </div>
            {stat.icon && (
              <div
                className={cn(
                  'p-3 rounded-full',
                  iconColorVariants[stat.color || 'default']
                )}
              >
                {stat.icon}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
```

### 2.7 Utility Functions

```typescript
// utilities/cn.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// utilities/colors.ts
export const colorMap = {
  primary: {
    bg: "bg-primary-50",
    text: "text-primary-600",
    border: "border-primary-200",
  },
  success: {
    bg: "bg-green-50",
    text: "text-green-600",
    border: "border-green-200",
  },
  warning: {
    bg: "bg-yellow-50",
    text: "text-yellow-600",
    border: "border-yellow-200",
  },
  danger: {
    bg: "bg-red-50",
    text: "text-red-600",
    border: "border-red-200",
  },
};
```

---

## 3. Responsive Design Strategy

### 3.1 Breakpoint Strategy

The admin panel will use a mobile-first responsive design approach with Tailwind CSS breakpoints.

| Breakpoint | Prefix | Min Width | Max Width | Target Devices         |
| ---------- | ------ | --------- | --------- | ---------------------- |
| `xs`       | None   | 0         | 639px     | Small mobile phones    |
| `sm`       | `sm:`  | 640px     | 767px     | Large mobile phones    |
| `md`       | `md:`  | 768px     | 1023px    | Tablets, small laptops |
| `lg`       | `lg:`  | 1024px    | 1279px    | Desktop monitors       |
| `xl`       | `xl:`  | 1280px    | 1535px    | Large desktop monitors |
| `2xl`      | `2xl:` | 1536px    | -         | Extra large displays   |

### 3.2 Grid System Specifications

The grid system will use a 12-column layout with consistent gutters and responsive behavior.

```css
/* Grid Configuration */
.grid-cols-1 {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}
.grid-cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.grid-cols-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.grid-cols-4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.grid-cols-5 {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}
.grid-cols-6 {
  grid-template-columns: repeat(6, minmax(0, 1fr));
}
.grid-cols-12 {
  grid-template-columns: repeat(12, minmax(0, 1fr));
}

/* Gutter sizes */
.gap-1 {
  gap: 4px;
}
.gap-2 {
  gap: 8px;
}
.gap-3 {
  gap: 12px;
}
.gap-4 {
  gap: 16px;
}
.gap-5 {
  gap: 20px;
}
.gap-6 {
  gap: 24px;
}
.gap-8 {
  gap: 32px;
}
.gap-10 {
  gap: 40px;
}
```

#### Responsive Grid Patterns

Single column layout should use `grid-cols-1` for mobile, tablet, and desktop. Two column layout should use `grid-cols-1 lg:grid-cols-2` for mobile-first responsive behavior. Three column layout should use `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`. Four column layout should use `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`. Dashboard statistics should use `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`.

### 3.3 Flexbox Usage Patterns

Flexbox will be used for one-dimensional layouts, component alignment, and responsive behavior.

```typescript
// Common flex patterns
const flexPatterns = {
  // Horizontal button groups
  "flex gap-3": "flex items-center gap-3",

  // Centered content
  "flex-center": "flex items-center justify-center",

  // Space between (header actions)
  "flex-between": "flex items-center justify-between",

  // Vertical stacking
  "flex-col": "flex flex-col",

  // Responsive flex wrap
  "flex-wrap": "flex flex-wrap items-center gap-4",

  // Form fields in a row
  "flex-row gap-4": "flex flex-col sm:flex-row gap-4",
};
```

### 3.4 Mobile-First Approach Details

#### Default Styles (Mobile)

All components will be designed for mobile devices first, then enhanced for larger screens using responsive prefixes.

```tsx
// Example: Mobile-first component
<div
  className="
  /* Mobile styles (default) */
  w-full
  p-4
  flex flex-col
  space-y-4
  
  /* Tablet and up */
  sm:p-6
  sm:flex-row
  sm:space-y-0
  
  /* Desktop and up */
  lg:p-8
  lg:gap-6
"
>
  {/* Content */}
</div>
```

#### Navigation Behavior

Mobile navigation will use a hamburger menu with slide-out drawer. Tablet navigation will show a condensed sidebar with icons only. Desktop navigation will show a full sidebar with text labels.

#### Table Behavior

Mobile tables will scroll horizontally with sticky first column. Tablet tables will show all columns with responsive text truncation. Desktop tables will show full content with comfortable spacing.

### 3.5 Specific Responsive Behaviors

#### Card Layouts

On mobile, cards should span full width with single column. On tablet, cards should be two columns for grid layouts. On desktop, cards should be three or four columns based on content density. On large screens, cards should maintain max-width for readability.

#### Page Headers

On mobile, page headers should have title, description, and actions stacked vertically. On tablet and desktop, page headers should have title and description on left, actions on right.

#### Forms

On mobile, forms should use full-width inputs with stacked labels. On tablet and desktop, forms can use side-by-side fields in two-column layouts.

#### Sidebar

On mobile, sidebar should be hidden by default with toggle button. On tablet and desktop, sidebar should be visible with width of 256px (16rem).

---

## 4. Accessibility Standards

### 4.1 ARIA Labels and Roles

All interactive elements will include appropriate ARIA attributes for screen reader compatibility.

```tsx
// Button with ARIA
<Button
  aria-label="Add new product"
  aria-describedby="add-product-help"
>
  <PlusIcon />
</Button>

// Input with ARIA
<Input
  aria-label="Product name"
  aria-required="true"
  aria-invalid={hasError}
  aria-describedby="product-name-error"
  aria-describedby="product-name-hint"
/>

// Navigation with ARIA
<nav aria-label="Main navigation">
  <ul role="menubar">
    <li role="menuitem" aria-current="page">Dashboard</li>
    <li role="menuitem">Products</li>
  </ul>
</nav>

// Modal with ARIA
<Modal
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Confirm Deletion</h2>
  <p id="modal-description">Are you sure you want to delete this item?</p>
</Modal>
```

#### Required ARIA Roles by Component Type

Navigation components should use `role="navigation"` or `role="menubar"`. Buttons should use `role="button"` for non-button elements. Links should use `role="link"` for anchor elements. Form inputs should use `role="textbox"`, `role="checkbox"`, `role="radio"`, or `role="combobox"`. Tables should use `role="table"` with `role="row"`, `role="columnheader"`, and `role="rowheader"`, `role="cell"`. Dialogs should use `role="dialog"` or `role="alertdialog"`.

### 4.2 Keyboard Navigation Patterns

All interactive elements will be keyboard accessible following WCAG 2.1 guidelines.

```tsx
// Tab navigation order
<div tabIndex={0}>
  <Button>First</Button>
  <Button tabIndex={-1}>Second</Button>
  <Button tabIndex={-1}>Third</Button>
</div>

// Focus trap for modals
<Modal>
  <FocusTrap>
    <Button onKeyDown={handleEscape}>Close</Button>
    <form>{/* form fields */}</form>
  </FocusTrap>
</Modal>

// Skip link for main content
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

#### Keyboard Shortcuts

Tab key should move focus forward through interactive elements. Shift+Tab should move focus backward. Enter and Space should activate buttons and links. Escape should close modals and dropdowns. Arrow keys should navigate within menus and lists.

### 4.3 Focus States and Indicators

All focusable elements will have visible focus indicators meeting WCAG 2.1 AA requirements.

```typescript
// Focus ring styles in tailwind.config.js
const focusStyles = {
  focus: 'focus:outline-none',
  focusRing: 'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
  focusRingError: 'focus-visible:ring-red-500 focus-visible:ring-offset-2',
};

// Global focus styles
* {
  outline: none;
}

*:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}
```

#### Focus State Requirements

Focus indicators must have a minimum 3:1 contrast ratio against adjacent colors. Focus indicators must have a minimum 2px stroke width. Focus indicators must not be obscured. Custom focus indicators can be used but must meet WCAG requirements.

### 4.4 Color Contrast Requirements

All text and interactive elements will meet WCAG 2.1 AA contrast requirements.

| Text Size      | Normal Text | Large Text |
| -------------- | ----------- | ---------- |
| Minimum Ratio  | 4.5:1       | 3:1        |
| Enhanced Ratio | 7:1         | 4.5:1      |

#### Contrast Verification

Normal text (under 18pt or 24px) requires 4.5:1 minimum contrast ratio. Large text (18pt and above or 14pt bold) requires 3:1 minimum contrast ratio. User interface components require 3:1 minimum contrast ratio. Graphical objects and user interface components require 3:1 minimum contrast ratio.

### 4.5 Screen Reader Considerations

All content will be accessible to screen reader users with appropriate semantics and descriptions.

```tsx
// Decorative images should be hidden
<img src="/icon.svg" alt="" role="presentation" />

// Informative images should have descriptions
<img src="/product.jpg" alt="Blue cotton t-shirt size medium" />

// Complex data should be summarized
<div role="img" aria-label="Chart showing 75% increase in sales">
  {/* Chart content */}
</div>

// Live regions for dynamic content
<div aria-live="polite" aria-atomic="true">
  {message && <p role="alert">{message}</p>}
</div>

// Tables should have captions
<table>
  <caption>Product inventory by category</caption>
  {/* Table content */}
</table>
```

---

## 5. Cross-Browser Compatibility

### 5.1 Browser Support Matrix

The admin panel will support the following browsers based on current usage statistics and market share.

| Browser        | Version           | Support Level |
| -------------- | ----------------- | ------------- |
| Chrome         | Latest 2 versions | Full Support  |
| Firefox        | Latest 2 versions | Full Support  |
| Safari         | Latest 2 versions | Full Support  |
| Edge           | Latest 2 versions | Full Support  |
| Safari iOS     | Latest 2 versions | Full Support  |
| Chrome Android | Latest 2 versions | Full Support  |

### 5.2 CSS Fallback Strategies

Modern CSS features will include appropriate fallbacks for older browsers.

```css
/* Grid fallback */
.grid {
  display: flex;
  flex-wrap: wrap;
}

.grid > * {
  width: 100%;
  max-width: 100%;
}

/* Modern grid */
@supports (display: grid) {
  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }
}

/* Flex gap fallback */
.flex-gap {
  display: flex;
  flex-wrap: wrap;
  margin: -0.5rem;
}

.flex-gap > * {
  margin: 0.5rem;
}

/* Modern flex gap */
@supports (gap: 1rem) {
  .flex-gap {
    gap: 1rem;
    margin: 0;
  }
}

/* Color-mix fallback */
.button {
  background: #3b82f6;
}

@supports (color: color-mix(in srgb, blue 50%, red 50%)) {
  .button {
    background: color-mix(in srgb, var(--primary) 50%, var(--secondary) 50%);
  }
}
```

### 5.3 Feature Detection Requirements

JavaScript feature detection will ensure graceful degradation.

```typescript
// Feature detection utilities
const supportsGrid = CSS.supports("display", "grid");
const supportsFlexGap = CSS.supports("gap", "1rem");
const supportsCustomProperties = CSS.supports("--custom-property", "value");

// Usage
if (!supportsGrid) {
  // Apply grid fallback
  document.body.classList.add("no-grid");
}

if (!supportsFlexGap) {
  // Apply flex gap fallback
  document.body.classList.add("no-flex-gap");
}
```

### 5.4 Polyfill Considerations

Lightweight polyfills will be included for critical functionality.

```bash
# Required polyfills (if needed)
npm install core-js @babel/polyfill
```

#### Polyfill Strategy

Modern browsers cover 95% of needed features. Only essential polyfills should be included. Polyfills should be loaded conditionally based on feature detection. Bundle size impact should be monitored and minimized.

---

## 6. Implementation Plan

### 6.1 Phase 1: Foundation (Critical Issues)

**Duration:** Week 1-2  
**Goals:** Fix layout structure, establish color theme, implement typography scale

#### Task 1.1: Layout Structure Fix

**Issue:** Duplicate wrapper divs causing layout conflicts

**Files to modify:**

- `frontend/src/app/admin/layout.tsx` - Review and clean wrapper structure
- `frontend/src/app/admin/page.tsx` - Remove duplicate `min-h-screen bg-gray-50`
- `frontend/src/app/admin/products/page.tsx` - Remove duplicate wrapper
- `frontend/src/app/admin/categories/page.tsx` - Remove duplicate wrapper
- `frontend/src/app/admin/brands/page.tsx` - Remove duplicate wrapper

**Changes required:**

```tsx
// BEFORE: Duplicate wrapper in page.tsx
function ProductsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {" "}
      // REMOVE
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {" "}
        // REMOVE
        <ProductList />
      </div>
    </div>
  );
}

// AFTER: Clean page.tsx
function ProductsPage() {
  return <ProductList />;
}
```

#### Task 1.2: Color Theme Unification

**Issue:** Indigo in sidebar, blue in components causing inconsistency

**Files to modify:**

- `frontend/src/app/admin/layout.tsx` - Replace indigo with blue theme
- `frontend/tailwind.config.js` - Update color configuration
- `frontend/src/app/admin/page.tsx` - Update button colors
- `frontend/src/components/admin/ProductList.tsx` - Update button colors
- `frontend/src/components/admin/CategoryList.tsx` - Update button colors
- `frontend/src/components/admin/BrandList.tsx` - Update button colors

**Changes required:**

```tsx
// BEFORE: Inconsistent indigo sidebar
<aside className="bg-indigo-600 ...">
  <Link className="bg-indigo-50 text-indigo-700 ...">
</aside>

// AFTER: Consistent blue theme
<aside className="bg-white border-r border-neutral-200 ...">
  <Link className="hover:bg-neutral-50 text-neutral-700 ...">
</aside>
```

#### Task 1.3: Typography Scale Implementation

**Issue:** text-3xl, text-2xl, text-xl used without hierarchy

**Files to modify:**

- All page.tsx files in `frontend/src/app/admin/**/`
- Component files with hardcoded text sizes

**Typography standards:**

- Page titles: `text-2xl font-bold text-neutral-900`
- Section headers: `text-xl font-semibold text-neutral-800`
- Card titles: `text-lg font-medium text-neutral-900`
- Body text: `text-sm text-neutral-600`
- Captions: `text-xs text-neutral-500`

### 6.2 Phase 2: Component Standardization (High Issues)

**Duration:** Week 3-5  
**Goals:** Create shared component library, replace inline styles

#### Task 2.1: Create Design System Directory

**Files to create:**

- `frontend/src/components/design-system/` - New directory structure
- All component files listed in Section 2.1

#### Task 2.2: Update ProductList Component

**Files to modify:**

- `frontend/src/components/admin/ProductList.tsx`

**After refactoring:**

```tsx
import { Button } from "@/components/design-system/Button";
import { Card } from "@/components/design-system/Card";
import { CardHeader } from "@/components/design-system/Card";
import { CardBody } from "@/components/design-system/Card";
import { Input } from "@/components/design-system/Input";
import { Select } from "@/components/design-system/Select";
import { Badge } from "@/components/design-system/Badge";

function ProductList() {
  return (
    <PageWrapper
      title="Products"
      description="Manage your product catalog"
      actions={
        <Button variant="primary" leftIcon={<PlusIcon />}>
          Add New Product
        </Button>
      }
    >
      {/* Filters */}
      <Card padding="md">
        <div className="flex gap-4 flex-wrap">
          <Input
            placeholder="Search products..."
            className="flex-1 min-w-[200px]"
          />
          <Select options={statusOptions} placeholder="All Statuses" />
          <Select options={visibilityOptions} placeholder="All Visibility" />
          <Button variant="primary">Search</Button>
        </div>
      </Card>

      {/* Product Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.sku}</TableCell>
                <TableCell>${product.price}</TableCell>
                <TableCell>
                  <Badge color={getStatusColor(product.status)}>
                    {product.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="xs">
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </PageWrapper>
  );
}
```

#### Task 2.3: Update CategoryList Component

**Files to modify:**

- `frontend/src/components/admin/CategoryList.tsx`

#### Task 2.4: Update BrandList Component

**Files to modify:**

- `frontend/src/components/admin/BrandList.tsx`

#### Task 2.5: Update Remaining Admin Pages

**Files to modify:**

- `frontend/src/app/admin/categories/new/page.tsx`
- `frontend/src/app/admin/categories/[id]/edit/page.tsx`
- `frontend/src/app/admin/brands/new/page.tsx`
- `frontend/src/app/admin/brands/[id]/edit/page.tsx`
- `frontend/src/app/admin/products/new/page.tsx`
- `frontend/src/app/admin/products/[id]/edit/page.tsx`

### 6.3 Phase 3: Polish (Medium/Low Issues)

**Duration:** Week 6-8  
**Goals:** Fix spacing, implement icons consistently, improve visual hierarchy

#### Task 3.1: Spacing Consistency

**Files to modify:**

- All page.tsx files
- All component files

**Spacing standards:**

- Page content padding: `px-4 sm:px-6 lg:px-8 py-8`
- Card padding: `p-6` (24px)
- Section spacing: `mb-8` (32px)
- Form field spacing: `space-y-4` (16px)

#### Task 3.2: Icon Standardization

**Files to modify:**

- `frontend/src/app/admin/layout.tsx` - Use Lucide icons consistently
- All component files - Replace inline SVG with Lucide icons

```tsx
// BEFORE: Inline SVG
<button onClick={handleDelete}>
  <svg className="w-5 h-5" fill="none" stroke="currentColor" ...>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 011.138 2H6.862a2 2 0 01-1.995-1.858L5 7m5 4v6m0 0l4-4m-4 4l-4-4" />
  </svg>
</button>

// AFTER: Lucide icon
<Button variant="ghost" size="sm" onClick={handleDelete} leftIcon={<Trash2 className="w-4 h-4" />}>
  Delete
</Button>
```

#### Task 3.3: Visual Hierarchy Improvements

**Files to modify:**

- All dashboard pages - Improve stats card hierarchy
- All list pages - Improve table header hierarchy
- All form pages - Improve form section hierarchy

#### Task 3.4: Loading States Standardization

**Files to modify:**

- `frontend/src/components/admin/ProductList.tsx` - Use Skeleton loader
- `frontend/src/components/admin/CategoryList.tsx` - Use Skeleton loader
- `frontend/src/components/admin/BrandList.tsx` - Use Skeleton loader

```tsx
// Loading state example
{
  isLoading ? (
    <Card>
      <CardBody>
        <Skeleton height={48} className="mb-4" />
        <Skeleton height={200} />
      </CardBody>
    </Card>
  ) : (
    <Card>...</Card>
  );
}
```

---

## 7. Technical Implementation Details

### 7.1 Tailwind CSS Configuration Updates

**File:** `frontend/tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        secondary: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
        success: {
          50: "#f0fdf4",
          100: "#dcfce7",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
        },
        danger: {
          50: "#fef2f2",
          100: "#fee2e2",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
        },
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
        },
        neutral: {
          50: "#fafafa",
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
          950: "#0a0a0a",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "Menlo", "Monaco", "monospace"],
      },
      spacing: {
        1: "0.25rem",
        2: "0.5rem",
        3: "0.75rem",
        4: "1rem",
        5: "1.25rem",
        6: "1.5rem",
        8: "2rem",
        10: "2.5rem",
        12: "3rem",
        16: "4rem",
      },
      borderRadius: {
        sm: "0.125rem",
        md: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        full: "9999px",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        md: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
        lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
        xl: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
        inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
        focus: "0 0 0 3px rgb(59 130 246 / 0.4)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        spin: "spin 1s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
```

### 7.2 CSS Custom Properties

Optional CSS custom properties for runtime theming capability.

```css
/* frontend/src/app/globals.css */
:root {
  /* Colors */
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;

  --color-neutral-50: #fafafa;
  --color-neutral-100: #f5f5f5;
  --color-neutral-500: #737373;
  --color-neutral-900: #171717;

  --color-success-500: #22c55e;
  --color-danger-500: #ef4444;
  --color-warning-500: #f59e0b;

  /* Spacing */
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;

  /* Border radius */
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;

  /* Shadows */
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}
```

### 7.3 Component File Structure

Each component will follow a consistent file structure pattern.

```
frontend/src/components/design-system/
├── index.ts                    # Barrel export
├── Button/
│   ├── index.ts               # Component exports
│   ├── Button.tsx             # Main component
│   ├── Button.styles.ts       # Types and styles
│   ├── Button.test.tsx        # Unit tests
│   └── Button.stories.tsx     # Storybook stories
├── Card/
│   ├── index.ts
│   ├── Card.tsx
│   ├── Card.styles.ts
│   ├── Card.test.tsx
│   └── Card.stories.tsx
└── [Other components...]
```

### 7.4 Import/Export Patterns

```typescript
// Barrel export - frontend/src/components/design-system/index.ts
export { Button } from "./Button";
export { ButtonPrimary } from "./Button/ButtonPrimary";
export { ButtonSecondary } from "./Button/ButtonSecondary";
export { ButtonDanger } from "./Button/ButtonDanger";
export { ButtonGhost } from "./Button/ButtonGhost";
export { Card, CardHeader, CardBody, CardFooter } from "./Card";
export { Input } from "./Form/Input/Input";
export { Select } from "./Form/Select/Select";
export { Checkbox } from "./Form/Checkbox/Checkbox";
export { Radio } from "./Form/Radio/Radio";
export { Textarea } from "./Form/Textarea/Textarea";
export { Label } from "./Form/Label/Label";
export { PageWrapper } from "./Layout/PageWrapper";
export { SectionHeader } from "./Layout/SectionHeader";
export { StatsGrid } from "./Layout/StatsGrid";
export { Badge, getStatusBadge } from "./Badge";
export { Table, TableHeader, TableBody, TableRow, TableCell } from "./Table";
export { Modal, ModalHeader, ModalBody, ModalFooter } from "./Modal";
export { Pagination } from "./Pagination";
export { EmptyState } from "./EmptyState";
export { Spinner, Skeleton, SkeletonCard, SkeletonTable } from "./Loading";
export { cn } from "./utilities/cn";
```

### 7.5 TypeScript Interfaces

```typescript
// Shared types for design system components
// frontend/src/components/design-system/types/index.ts

export interface BaseComponentProps {
  className?: string;
  testId?: string;
}

export interface ColorVariant {
  color: "primary" | "secondary" | "success" | "danger" | "warning";
}

export interface SizeVariant {
  size: "xs" | "sm" | "md" | "lg" | "xl";
}

export interface LoadingState {
  isLoading?: boolean;
  loadingText?: string;
}
```

---

## 8. Testing Strategy

### 8.1 Component Testing

All design system components will have comprehensive unit tests using Jest and React Testing Library.

```typescript
// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('applies variant classes correctly', () => {
    const { container } = render(<Button variant="primary">Primary</Button>);
    expect(container.firstChild).toHaveClass('bg-primary-600');
  });

  it('applies size classes correctly', () => {
    const { container } = render(<Button size="lg">Large</Button>);
    expect(container.firstChild).toHaveClass('h-12');
  });

  it('is disabled when isLoading', () => {
    const { container } = render(<Button isLoading>Loading...</Button>);
    expect(container.firstChild).toBeDisabled();
  });

  it('shows spinner when isLoading', () => {
    render(<Button isLoading>Loading...</Button>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
```

### 8.2 Visual Regression Testing

Visual regression tests will ensure design consistency across changes.

```bash
# Install visual regression tools
npm install --save-dev @percy/cli @percy/react

# Run visual tests
npm run test:visual
```

### 8.3 Accessibility Testing

Automated accessibility tests will verify WCAG 2.1 AA compliance.

```bash
# Install accessibility testing tools
npm install --save-dev jest-axe react-axe

# Run accessibility tests
npm run test:a11y
```

```typescript
// Accessibility test example
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';

describe('Button Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(<Button>Accessible Button</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

---

## 9. Migration Strategy

### 9.1 Incremental Migration Approach

The refactoring will use an incremental migration strategy to minimize disruption.

#### Migration Order

1. **Foundation First** - Update layout.tsx and tailwind.config.js
2. **Component Library** - Create design system components
3. **Page-by-Page** - Migrate one page at a time
4. **Testing** - Test each migrated page thoroughly
5. **Cleanup** - Remove old code and unused imports

### 9.2 Backward Compatibility

During migration, both old and new components will coexist temporarily.

```typescript
// Temporary migration wrapper
export const MigratedButton = ({ useNew = false, ...props }) => {
  if (useNew) {
    return <Button {...props} />;
  }
  return <OldButton {...props} />;
};
```

### 9.3 Rollback Plan

If critical issues arise during migration, a rollback plan will be available.

- Maintain feature branch for each phase
- Tag releases before major changes
- Document all changes in commit messages
- Keep old components until migration is complete

---

## 10. Success Criteria

### 10.1 Phase 1 Success Criteria

- [ ] All duplicate wrapper divs removed from page.tsx files
- [ ] Color theme unified to blue across all admin pages
- [ ] Typography scale applied consistently
- [ ] Layout.tsx provides consistent wrapper structure
- [ ] No layout conflicts between sidebar and content
- [ ] All pages render correctly on mobile, tablet, and desktop

### 10.2 Phase 2 Success Criteria

- [ ] Design system directory created with all components
- [ ] Button component used across all admin pages
- [ ] Card component used across all admin pages
- [ ] Form components (Input, Select) used consistently
- [ ] Badge component used for all status indicators
- [ ] PageWrapper component used for all pages
- [ ] No inline styles or hardcoded colors in components
- [ ] All components have TypeScript interfaces

### 10.3 Phase 3 Success Criteria

- [ ] Spacing consistent across all pages
- [ ] All icons use Lucide icon library
- [ ] Loading states use Skeleton components
- [ ] Visual hierarchy clear and consistent
- [ ] All 47 UI/UX issues resolved
- [ ] Accessibility audit passes with zero critical issues
- [ ] Visual regression tests passing

---

## 11. Documentation Requirements

### 11.1 Component Documentation

Each component will have comprehensive documentation.

````typescript
/**
 * Button Component
 *
 * A versatile button component with multiple variants and sizes.
 * Supports loading states, icons, and full-width mode.
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Save Changes
 * </Button>
 * ```
 *
 * @param {ButtonProps} props - Component props
 * @returns {JSX.Element} Rendered button
 */
export const Button: React.FC<ButtonProps> = (props) => {
  // Implementation
};
````

### 11.2 Storybook Stories

All components will have Storybook stories for visual documentation.

```typescript
// Button.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  title: "Design System/Button",
  component: Button,
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "danger", "ghost"],
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
    },
    isLoading: {
      control: "boolean",
    },
  },
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: "primary",
    children: "Primary Button",
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Secondary Button",
  },
};

export const Loading: Story = {
  args: {
    variant: "primary",
    isLoading: true,
    children: "Loading...",
  },
};
```

### 11.3 Usage Examples

Each component will have real-world usage examples.

```tsx
// Example: Product form with design system components
import { PageWrapper } from "@/components/design-system/PageWrapper";
import { Card } from "@/components/design-system/Card";
import { CardHeader } from "@/components/design-system/Card";
import { CardBody } from "@/components/design-system/Card";
import { CardFooter } from "@/components/design-system/Card";
import { Input } from "@/components/design-system/Input";
import { Select } from "@/components/design-system/Select";
import { Button } from "@/components/design-system/Button";

function ProductForm() {
  return (
    <PageWrapper
      title="New Product"
      description="Create a new product in your catalog"
      actions={<Button variant="secondary">Cancel</Button>}
    >
      <Card>
        <CardHeader title="Product Information" />
        <CardBody>
          <div className="space-y-4">
            <Input
              label="Product Name"
              placeholder="Enter product name"
              required
            />
            <Select
              label="Category"
              options={categoryOptions}
              placeholder="Select a category"
            />
            <Input
              label="SKU"
              placeholder="Enter SKU"
              helperText="Unique identifier for this product"
            />
          </div>
        </CardBody>
        <CardFooter align="right">
          <Button variant="secondary">Cancel</Button>
          <Button variant="primary">Create Product</Button>
        </CardFooter>
      </Card>
    </PageWrapper>
  );
}
```

---

## 12. Risk Assessment

### 12.1 Technical Risks

| Risk                                  | Probability | Impact | Mitigation                                             |
| ------------------------------------- | ----------- | ------ | ------------------------------------------------------ |
| Breaking changes during migration     | Medium      | High   | Incremental migration, thorough testing                |
| Performance regression                | Low         | Medium | Bundle size monitoring, performance testing            |
| Browser compatibility issues          | Low         | Medium | Cross-browser testing, polyfills                       |
| Accessibility regressions             | Low         | High   | Automated a11y testing, manual review                  |
| Design inconsistency during migration | Medium      | High   | Design review at each phase, visual regression testing |

### 12.2 Timeline Risks

| Risk                                        | Probability | Impact | Mitigation                                              |
| ------------------------------------------- | ----------- | ------ | ------------------------------------------------------- |
| Phase 1 takes longer than expected          | Medium      | Medium | Prioritize critical issues, defer non-critical          |
| Phase 2 component complexity underestimated | Medium      | High   | Start with core components, add advanced features later |
| Phase 3 polish scope creep                  | High        | Low    | Clear scope definition, stakeholder sign-off            |

### 12.3 Resource Risks

| Risk                                | Probability | Impact | Mitigation                                   |
| ----------------------------------- | ----------- | ------ | -------------------------------------------- |
| Insufficient developer resources    | Low         | High   | Prioritize phases, consider external support |
| Stakeholder availability for review | Medium      | Medium | Schedule review windows in advance           |
| Testing environment issues          | Low         | Medium | Dedicated testing environment, CI/CD setup   |

---

## 13. Maintenance Plan

### 13.1 Component Maintenance

Design system components will have a defined maintenance process.

- Monthly review of component usage and issues
- Quarterly updates to address new requirements
- Annual major version updates with deprecation notices
- Component deprecation policy: 6 months notice before removal

### 13.2 Documentation Updates

Documentation will be kept current with component changes.

- Update component docs with each change
- Maintain changelog for design system releases
- Update Storybook stories with new variants
- Review and update usage examples quarterly

### 13.3 Design System Governance

A governance process will ensure design system consistency.

- Design system owner role defined
- Change request process for new components
- Review process for design system updates
- Versioning strategy for breaking changes

---

## 14. Appendix

### 14.1 File Structure Reference

Complete reference of all files to be created or modified during refactoring.

#### New Files to Create

```
frontend/src/components/design-system/
├── index.ts
├── Button/
│   ├── Button.tsx
│   ├── Button.styles.ts
│   ├── Button.test.tsx
│   └── Button.stories.tsx
├── Card/
│   ├── Card.tsx
│   ├── Card.styles.ts
│   ├── Card.test.tsx
│   └── Card.stories.tsx
├── Form/
│   ├── Input/
│   │   ├── Input.tsx
│   │   ├── Input.styles.ts
│   │   ├── Input.test.tsx
│   │   └── Input.stories.tsx
│   ├── Select/
│   │   ├── Select.tsx
│   │   ├── Select.styles.ts
│   │   ├── Select.test.tsx
│   │   └── Select.stories.tsx
│   ├── Checkbox/
│   │   ├── Checkbox.tsx
│   │   ├── Checkbox.styles.ts
│   │   ├── Checkbox.test.tsx
│   │   └── Checkbox.stories.tsx
│   ├── Radio/
│   │   ├── Radio.tsx
│   │   ├── Radio.styles.ts
│   │   ├── Radio.test.tsx
│   │   └── Radio.stories.tsx
│   ├── Textarea/
│   │   ├── Textarea.tsx
│   │   ├── Textarea.styles.ts
│   │   ├── Textarea.test.tsx
│   │   └── Textarea.stories.tsx
│   ├── Label/
│   │   ├── Label.tsx
│   │   ├── Label.styles.ts
│   │   ├── Label.test.tsx
│   │   └── Label.stories.tsx
│   └── FieldError/
│       ├── FieldError.tsx
│       ├── FieldError.styles.ts
│       ├── FieldError.test.tsx
│       └── FieldError.stories.tsx
├── Layout/
│   ├── PageWrapper.tsx
│   ├── PageWrapper.test.tsx
│   ├── PageWrapper.stories.tsx
│   ├── SectionHeader.tsx
│   ├── SectionHeader.test.tsx
│   ├── SectionHeader.stories.tsx
│   ├── StatsGrid.tsx
│   ├── StatsGrid.test.tsx
│   └── StatsGrid.stories.tsx
├── Badge/
│   ├── Badge.tsx
│   ├── Badge.styles.ts
│   ├── Badge.utils.ts
│   ├── Badge.test.tsx
│   └── Badge.stories.tsx
├── Table/
│   ├── Table.tsx
│   ├── TableHeader.tsx
│   ├── TableBody.tsx
│   ├── TableRow.tsx
│   ├── TableCell.tsx
│   ├── Table.styles.ts
│   ├── Table.test.tsx
│   └── Table.stories.tsx
├── Modal/
│   ├── Modal.tsx
│   ├── ModalHeader.tsx
│   ├── ModalBody.tsx
│   ├── ModalFooter.tsx
│   ├── ModalOverlay.tsx
│   ├── Modal.styles.ts
│   ├── Modal.test.tsx
│   └── Modal.stories.tsx
├── Pagination/
│   ├── Pagination.tsx
│   ├── PaginationButton.tsx
│   ├── Pagination.styles.ts
│   ├── Pagination.test.tsx
│   └── Pagination.stories.tsx
├── EmptyState/
│   ├── EmptyState.tsx
│   ├── EmptyState.styles.ts
│   ├── EmptyState.icons.ts
│   ├── EmptyState.test.tsx
│   └── EmptyState.stories.tsx
├── Loading/
│   ├── Spinner.tsx
│   ├── Skeleton.tsx
│   ├── SkeletonCard.tsx
│   ├── SkeletonTable.tsx
│   ├── Loading.styles.ts
│   ├── Spinner.test.tsx
│   ├── Skeleton.test.tsx
│   ├── SkeletonCard.test.tsx
│   └── SkeletonTable.test.tsx
└── utilities/
    ├── cn.ts
    ├── cn.test.ts
    └── colors.ts
```

#### Files to Modify

```
frontend/src/app/admin/
├── layout.tsx                    # Phase 1: Color theme, structure
├── page.tsx                      # Phase 1: Remove wrappers
├── products/
│   ├── page.tsx                  # Phase 1: Remove wrappers
│   ├── [id]/
│   │   └── edit/
│   │       └── page.tsx          # Phase 2: Use design system
│   ├── new/
│   │   └── page.tsx              # Phase 2: Use design system
│   └── images/
│       └── page.tsx              # Phase 2: Use design system
├── categories/
│   ├── page.tsx                  # Phase 1: Remove wrappers
│   ├── [id]/
│   │   └── edit/
│   │       └── page.tsx          # Phase 2: Use design system
│   ├── new/
│   │   └── page.tsx              # Phase 2: Use design system
│   └── tree/
│       └── page.tsx              # Phase 2: Use design system
├── brands/
│   ├── page.tsx                  # Phase 1: Remove wrappers
│   ├── [id]/
│   │   └── edit/
│   │       └── page.tsx          # Phase 2: Use design system
│   └── new/
│       └── page.tsx              # Phase 2: Use design system
└── [Other admin pages...]          # Phase 2-3: Use design system

frontend/src/components/admin/
├── ProductList.tsx               # Phase 2: Use design system
├── CategoryList.tsx               # Phase 2: Use design system
├── BrandList.tsx                 # Phase 2: Use design system
├── ProductForm.tsx                # Phase 2: Use design system
├── CategoryForm.tsx              # Phase 2: Use design system
├── BrandForm.tsx                 # Phase 2: Use design system
└── [Other admin components...]      # Phase 2-3: Use design system

frontend/tailwind.config.js             # Phase 1: Update colors, spacing, shadows
frontend/src/app/globals.css            # Phase 1: Add CSS custom properties
```

### 14.2 Glossary

| Term              | Definition                                                                                           |
| ----------------- | ---------------------------------------------------------------------------------------------------- |
| Design System     | A collection of reusable components, styles, and guidelines that ensure consistency across a product |
| Component Library | A set of pre-built, tested UI components that can be used throughout an application                  |
| Typography Scale  | A predefined set of font sizes and weights that establish visual hierarchy                           |
| Spacing Scale     | A predefined set of spacing values based on a consistent unit (8px)                                  |
| Color Palette     | A defined set of colors used throughout the application for consistency                              |
| Responsive Design | Design approach that ensures interfaces work well on all device sizes                                |
| Mobile-First      | Design strategy that starts with mobile layout and progressively enhances for larger screens         |
| Accessibility     | Practice of making web content usable by people with disabilities                                    |
| WCAG              | Web Content Accessibility Guidelines - international standard for web accessibility                  |
| ARIA              | Accessible Rich Internet Applications - attributes that make web content more accessible             |
| Focus Ring        | Visual indicator that shows which element currently has keyboard focus                               |
| Skeleton Loader   | Loading state that shows a gray placeholder instead of actual content                                |
| Visual Regression | Testing method that detects unintended visual changes in UI                                          |
| Barrel Export     | TypeScript pattern that exports all components from a single index file                              |

### 14.3 References

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [React Accessibility Guide](https://react.dev/learn/accessibility)
- [Lucide Icons](https://lucide.dev/)
- [Storybook Documentation](https://storybook.js.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## 15. Conclusion

This technical specification provides a comprehensive blueprint for refactoring the Smart Technologies Admin Panel UI/UX. By following this three-phase implementation plan, the team will:

1. **Resolve Critical Issues** - Fix layout conflicts, unify color theme, establish typography hierarchy
2. **Build Component Library** - Create reusable, accessible components that ensure consistency
3. **Polish User Experience** - Improve spacing, standardize icons, enhance visual hierarchy

The specification includes detailed code examples, file-by-file modification requirements, and success criteria to ensure successful implementation. All design decisions are grounded in modern best practices for React, TypeScript, and Tailwind CSS.

Following this specification will result in a professional, accessible, and maintainable admin panel that provides an excellent user experience for administrators managing the Smart Technologies platform.

---

**Document Status:** Complete - Ready for Implementation  
**Next Steps:** Begin Phase 1 implementation starting with layout.tsx modifications
