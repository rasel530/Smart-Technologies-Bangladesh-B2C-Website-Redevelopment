/**
 * Brand Entity Type Definitions
 * 
 * This file contains all TypeScript interfaces and types related to Brand entities.
 */

/**
 * Brand Interface
 */
export interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  website: string | null;
  isActive: boolean;
}

/**
 * Brand with Relations Interface
 */
export interface BrandWithRelations extends Brand {
  _count?: {
    products: number;
  };
  products?: Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    images: Array<{
      id: string;
      url: string;
      alt?: string;
    }>;
    _count?: {
      reviews: number;
    };
  }>;
}

/**
 * Create Brand Request Interface
 */
export interface CreateBrandRequest {
  name: string;
  slug: string;
  description?: string | null;
  website?: string | null;
  isActive?: boolean;
}

/**
 * Update Brand Request Interface
 */
export interface UpdateBrandRequest {
  name?: string;
  slug?: string;
  description?: string | null;
  website?: string | null;
  isActive?: boolean;
}

/**
 * Brand Search Filter Interface
 */
export interface BrandSearchFilter {
  includeInactive?: boolean;
  search?: string;
  sortBy?: 'name' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
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

/**
 * Brand Product Count Interface
 */
export interface BrandProductCount {
  brandId: string;
  brandName: string;
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
}

/**
 * Bulk Brand Update Interface
 */
export interface BulkBrandUpdate {
  brandIds: string[];
  updates: Partial<UpdateBrandRequest>;
}

/**
 * Bulk Brand Update Result Interface
 */
export interface BulkBrandUpdateResult {
  success: number;
  failed: number;
  errors: Array<{
    brandId: string;
    error: string;
  }>;
}
