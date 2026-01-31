/**
 * BreadcrumbNavigation Component
 * 
 * A component for displaying breadcrumb navigation.
 * Features include:
 * - Dynamic breadcrumbs based on current page
 * - Home > Category > Subcategory > Product
 * - Clickable links
 * - SEO-friendly markup (Schema.org)
 * - Mobile-friendly truncation
 * - Integration with routing
 * - SSR-safe JSON-LD generation
 * 
 * @component
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbNavigationProps {
  items: BreadcrumbItem[];
  className?: string;
  separator?: React.ReactNode;
}

/**
 * BreadcrumbNavigation Component
 * 
 * @param {BreadcrumbNavigationProps} props - Component props
 * @returns {JSX.Element} Breadcrumb navigation component
 */
export const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
  items,
  className = '',
  separator = (
    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}) => {
  const [mounted, setMounted] = useState(false);
  const [jsonLd, setJsonLd] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    // Generate JSON-LD only on client side to avoid SSR issues
    const generateJsonLd = () => {
      const itemListElement = items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.label,
        item: item.href || (typeof window !== 'undefined' ? window.location.href : ''),
      }));

      return JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement,
      });
    };

    setJsonLd(generateJsonLd());
  }, [items]);

  return (
    <>
      {/* JSON-LD for SEO - only render after mount to avoid SSR hydration mismatch */}
      {mounted && jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
      )}

      {/* Breadcrumb Navigation */}
      <nav
        className={`flex items-center gap-2 text-sm ${className}`}
        aria-label="Breadcrumb"
      >
        <ol className="flex items-center gap-2 flex-wrap" itemScope itemType="https://schema.org/BreadcrumbList">
          {items.map((item, index) => (
            <React.Fragment key={index}>
              {/* Breadcrumb Item */}
              <li
                className="flex items-center"
                itemProp="itemListElement"
                itemScope
                itemType="https://schema.org/ListItem"
              >
                <meta itemProp="position" content={String(index + 1)} />
                {item.href && !item.current ? (
                  <Link
                    href={item.href}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                    itemProp="item"
                  >
                    <span itemProp="name" className="max-w-[150px] sm:max-w-[200px] truncate">
                      {item.label}
                    </span>
                  </Link>
                ) : (
                  <span
                    className={`font-medium ${
                      item.current ? 'text-gray-900' : 'text-gray-500'
                    }`}
                    itemProp="name"
                    aria-current={item.current ? 'page' : undefined}
                  >
                    <span className="max-w-[150px] sm:max-w-[200px] truncate">
                      {item.label}
                    </span>
                  </span>
                )}
              </li>

              {/* Separator (not after last item) */}
              {index < items.length - 1 && (
                <li className="flex items-center text-gray-400" aria-hidden="true">
                  {separator}
                </li>
              )}
            </React.Fragment>
          ))}
        </ol>
      </nav>
    </>
  );
};

/**
 * Helper function to generate breadcrumbs for product pages
 */
export const generateProductBreadcrumbs = (
  category?: { name: string; slug: string } | null,
  subcategory?: { name: string; slug: string } | null,
  productName?: string
): BreadcrumbItem[] => {
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
  ];

  // Defensive check for category
  if (category && category.name && category.slug) {
    breadcrumbs.push({
      label: category.name,
      href: `/categories/${category.slug}`,
    });
  }

  // Defensive check for subcategory
  if (subcategory && subcategory.name && subcategory.slug) {
    breadcrumbs.push({
      label: subcategory.name,
      href: `/categories/${subcategory.slug}`,
    });
  }

  if (productName) {
    breadcrumbs.push({
      label: productName,
      current: true,
    });
  }

  return breadcrumbs;
};

/**
 * Helper function to generate breadcrumbs for category pages
 */
export const generateCategoryBreadcrumbs = (
  category?: { name: string; slug: string } | null,
  subcategory?: { name: string; slug: string } | null
): BreadcrumbItem[] => {
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Categories', href: '/categories' },
  ];

  // Defensive check for category
  if (category && category.name && category.slug) {
    breadcrumbs.push({
      label: category.name,
      href: `/categories/${category.slug}`,
    });
  }

  // Defensive check for subcategory
  if (subcategory && subcategory.name && subcategory.slug) {
    breadcrumbs.push({
      label: subcategory.name,
      current: true,
    });
  } else if (category && category.name && category.slug) {
    breadcrumbs[breadcrumbs.length - 1].current = true;
  }

  return breadcrumbs;
};

/**
 * Helper function to generate breadcrumbs for search results
 */
export const generateSearchBreadcrumbs = (query: string): BreadcrumbItem[] => [
  { label: 'Home', href: '/' },
  { label: 'Search', href: '/search' },
  { label: `"${query}"`, current: true },
];

/**
 * Helper function to generate breadcrumbs for brand pages
 */
export const generateBrandBreadcrumbs = (brandName: string, brandSlug: string): BreadcrumbItem[] => {
  // Defensive check for empty values
  const safeName = brandName || 'Unknown Brand';
  const safeSlug = brandSlug || 'unknown-brand';
  
  return [
    { label: 'Home', href: '/' },
    { label: 'Brands', href: '/brands' },
    { label: safeName, href: `/brands/${safeSlug}`, current: !brandSlug },
  ];
};

export default BreadcrumbNavigation;
