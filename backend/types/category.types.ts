/**
 * Category Entity Type Definitions
 * 
 * This file contains all TypeScript interfaces and types related to Category entities.
 */

/**
 * Category Interface
 */
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  parentId: string | null;
  bannerImage: string | null;
  icon: string | null;
  sortOrder: number;
}

/**
 * Category with Relations Interface
 */
export interface CategoryWithRelations extends Category {
  parentCategory?: {
    id: string;
    name: string;
    slug: string;
  };
  subcategories?: CategoryWithRelations[];
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
      _all: number;
    };
  }>;
  _count?: {
    products: number;
    subcategories: number;
  };
}

/**
 * Category Tree Node Interface
 */
export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[];
  level: number;
  path: string[];
}

/**
 * Create Category Request Interface
 */
export interface CreateCategoryRequest {
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
  sortOrder?: number;
  bannerImage?: string | null;
  icon?: string | null;
  isActive?: boolean;
}

/**
 * Update Category Request Interface
 */
export interface UpdateCategoryRequest {
  name?: string;
  slug?: string;
  description?: string | null;
  parentId?: string | null;
  sortOrder?: number;
  bannerImage?: string | null;
  icon?: string | null;
  isActive?: boolean;
}

/**
 * Category Search Filter Interface
 */
export interface CategorySearchFilter {
  includeInactive?: boolean;
  parentOnly?: boolean;
  search?: string;
  sortBy?: 'name' | 'sortOrder' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Category Validation Error Interface
 */
export interface CategoryValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * Category Duplicate Check Result Interface
 */
export interface CategoryDuplicateCheckResult {
  hasDuplicateSlug: boolean;
  duplicateSlugCategory?: Category;
}

/**
 * Category Hierarchy Validation Result Interface
 */
export interface CategoryHierarchyValidationResult {
  isValid: boolean;
  hasCircularReference: boolean;
  circularPath?: string[];
  error?: string;
}

/**
 * Category Product Count Interface
 */
export interface CategoryProductCount {
  categoryId: string;
  categoryName: string;
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  subcategoryCount: number;
}

/**
 * Bulk Category Update Interface
 */
export interface BulkCategoryUpdate {
  categoryIds: string[];
  updates: Partial<UpdateCategoryRequest>;
}

/**
 * Bulk Category Update Result Interface
 */
export interface BulkCategoryUpdateResult {
  success: number;
  failed: number;
  errors: Array<{
    categoryId: string;
    error: string;
  }>;
}

/**
 * Category Move Operation Interface
 */
export interface CategoryMoveOperation {
  categoryId: string;
  newParentId: string | null;
  newSortOrder?: number;
}

/**
 * Category Move Result Interface
 */
export interface CategoryMoveResult {
  success: boolean;
  category?: CategoryWithRelations;
  error?: string;
}

/**
 * Category Path Interface
 */
export interface CategoryPath {
  categoryId: string;
  categoryName: string;
  path: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  level: number;
}
