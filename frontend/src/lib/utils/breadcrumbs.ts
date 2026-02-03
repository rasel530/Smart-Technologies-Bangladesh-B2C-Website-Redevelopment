/**
 * Breadcrumb Utilities
 * 
 * Helper functions for generating breadcrumb navigation items.
 * These functions are safe to use in both server and client components.
 */

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

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
