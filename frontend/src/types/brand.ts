/**
 * Brand Entity Type Definitions
 * 
 * This file contains all TypeScript interfaces and types related to Brand entities
 * including Brand, CreateBrandRequest, UpdateBrandRequest, and related types.
 */

/**
 * Brand Status Type
 */
export type BrandStatus = 'active' | 'inactive';

/**
 * Brand Interface
 */
export interface Brand {
  id: string;
  name: string;
  nameEn: string | null;
  nameBn: string | null;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  status: BrandStatus;
  isFeatured: boolean;
  featuredOrder: number;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Brand with Relations Interface
 */
export interface BrandWithRelations extends Brand {
  _count?: {
    products: number;
  };
  // Computed properties for convenience
  website?: string;
  isActive?: boolean;
}

/**
 * Create Brand Request Interface
 */
export interface CreateBrandRequest {
  name: string;
  nameEn?: string;
  nameBn?: string;
  slug: string;
  description?: string;
  websiteUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  status?: BrandStatus;
  isFeatured?: boolean;
  featuredOrder?: number;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
}

/**
 * Update Brand Request Interface
 */
export interface UpdateBrandRequest {
  name?: string;
  nameEn?: string;
  nameBn?: string;
  slug?: string;
  description?: string;
  websiteUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  status?: BrandStatus;
  isFeatured?: boolean;
  featuredOrder?: number;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
}

/**
 * Brand SEO Interface
 */
export interface BrandSEO {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
}

/**
 * Brand List Filter Interface
 */
export interface BrandListFilter {
  page?: number;
  limit?: number;
  status?: BrandStatus;
  isFeatured?: boolean;
  search?: string;
  includeProducts?: boolean;
}

/**
 * Brand List Response Interface
 */
export interface BrandListResponse {
  brands: BrandWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Featured Brands Response Interface
 */
export interface FeaturedBrandsResponse {
  brands: BrandWithRelations[];
  total: number;
}

/**
 * Brand Status Update Request Interface
 */
export interface BrandStatusUpdateRequest {
  status: BrandStatus;
}

/**
 * Brand Featured Update Request Interface
 */
export interface BrandFeaturedUpdateRequest {
  isFeatured: boolean;
  featuredOrder?: number;
}

/**
 * Featured Brand Reorder Request Interface
 */
export interface FeaturedBrandReorderRequest {
  orders: Array<{
    id: string;
    featuredOrder: number;
  }>;
}

/**
 * Brand Product List Filter Interface
 */
export interface BrandProductFilter {
  page?: number;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price' | 'name' | 'createdAt' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Brand Product List Response Interface
 */
export interface BrandProductListResponse {
  brand: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    website?: string | null;
  };
  products: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Brand Statistics Interface
 */
export interface BrandStatistics {
  totalBrands: number;
  activeBrands: number;
  featuredBrands: number;
  totalProducts: number;
}

/**
 * Brand Validation Error Interface
 */
export interface BrandValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * Brand Duplicate Check Result Interface
 */
export interface BrandDuplicateCheckResult {
  hasDuplicateSlug: boolean;
  duplicateSlugBrand?: Brand;
}
