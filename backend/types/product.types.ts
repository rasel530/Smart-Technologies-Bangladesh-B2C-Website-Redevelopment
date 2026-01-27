/**
 * Product Entity Type Definitions
 * 
 * This file contains all TypeScript interfaces and types related to Product entities
 * including Product, ProductImage, ProductSpecification, and ProductVariant.
 */

/**
 * Product Image Interface
 */
export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  alt: string | null;
  sortOrder: number;
}

/**
 * Product Specification Interface
 */
export interface ProductSpecification {
  id: string;
  productId: string;
  name: string;
  value: string;
  sortOrder: number;
}

/**
 * Product Variant Interface
 */
export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  price: any;
  comparePrice: any | null;
  stock: number;
  isActive: boolean;
}

/**
 * Product Interface
 */
export interface Product {
  id: string;
  sku: string;
  name: string;
  nameEn: string;
  nameBn: string | null;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  categoryId: string;
  brandId: string;
  regularPrice: any;
  salePrice: any | null;
  costPrice: any;
  taxRate: any;
  stockQuantity: number;
  lowStockThreshold: number;
  status: 'active' | 'inactive' | 'out_of_stock' | 'discontinued';
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  warrantyPeriod: number | null;
  warrantyType: string | null;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
}

/**
 * Product with Relations Interface
 */
export interface ProductWithRelations {
  category: {
    id: string;
    name: string;
    slug: string;
  };
  brand: {
    id: string;
    name: string;
    slug: string;
  };
  images: Array<{
    id: string;
    url: string;
    alt: string | null;
    sortOrder: number;
  }>;
  specifications: ProductSpecification[];
  variants: ProductVariant[];
  reviews?: ProductReview[];
  _count?: {
    reviews: number;
  };
  avgRating?: number;
}

/**
 * Product Review Interface
 */
export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title: string;
  comment?: string;
  isVerified: boolean;
  isApproved: boolean;
  createdAt: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

/**
 * Create Product Request Interface
 */
export interface CreateProductRequest {
  sku: string;
  name: string;
  nameEn: string;
  nameBn?: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  categoryId: string;
  brandId: string;
  regularPrice: number;
  salePrice?: number;
  costPrice: number;
  stockQuantity: number;
  lowStockThreshold?: number;
  taxRate?: number;
  status?: 'active' | 'inactive' | 'out_of_stock' | 'discontinued';
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  warrantyPeriod?: number;
  warrantyType?: string;
  images?: CreateProductImageRequest[];
  specifications?: CreateProductSpecificationRequest[];
  variants?: CreateProductVariantRequest[];
}

/**
 * Update Product Request Interface
 */
export interface UpdateProductRequest {
  sku?: string;
  name?: string;
  nameEn?: string;
  nameBn?: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  categoryId?: string;
  brandId?: string;
  regularPrice?: number;
  salePrice?: number;
  costPrice?: number;
  stockQuantity?: number;
  lowStockThreshold?: number;
  taxRate?: number;
  status?: 'active' | 'inactive' | 'out_of_stock' | 'discontinued';
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  warrantyPeriod?: number;
  warrantyType?: string;
  publishedAt?: Date;
}

/**
 * Create Product Image Request Interface
 */
export interface CreateProductImageRequest {
  url: string;
  alt?: string | null;
  sortOrder?: number;
}

/**
 * Update Product Image Request Interface
 */
export interface UpdateProductImageRequest {
  url?: string;
  alt?: string | null;
  sortOrder?: number;
}

/**
 * Create Product Specification Request Interface
 */
export interface CreateProductSpecificationRequest {
  name: string;
  value: string;
  sortOrder?: number;
}

/**
 * Update Product Specification Request Interface
 */
export interface UpdateProductSpecificationRequest {
  name?: string;
  value?: string;
  sortOrder?: number;
}

/**
 * Create Product Variant Request Interface
 */
export interface CreateProductVariantRequest {
  name: string;
  sku: string;
  price: number;
  comparePrice?: number;
  stock?: number;
  isActive?: boolean;
}

/**
 * Update Product Variant Request Interface
 */
export interface UpdateProductVariantRequest {
  name?: string;
  sku?: string;
  price?: number;
  comparePrice?: number;
  stock?: number;
  isActive?: boolean;
}

/**
 * Product Search Filter Interface
 */
export interface ProductSearchFilter {
  page?: number;
  limit?: number;
  category?: string;
  brand?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: 'active' | 'inactive' | 'out_of_stock' | 'discontinued';
  sortBy?: 'price' | 'name' | 'createdAt' | 'stockQuantity';
  sortOrder?: 'asc' | 'desc';
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
}

/**
 * Product Search Response Interface
 */
export interface ProductSearchResponse {
  products: ProductWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Product Validation Error Interface
 */
export interface ProductValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * Product Inventory Status Interface
 */
export interface ProductInventoryStatus {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  lowStockThreshold: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  needsRestock: boolean;
}

/**
 * Product Price Calculation Interface
 */
export interface ProductPriceCalculation {
  productId: string;
  regularPrice: number;
  salePrice: number | null;
  finalPrice: number;
  discountAmount: number;
  discountPercentage: number;
  taxRate: number;
  taxAmount: number;
  totalPrice: number;
}

/**
 * Product SEO Data Interface
 */
export interface ProductSEOData {
  productId: string;
  productName: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  slug: string;
  canonicalUrl: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

/**
 * Bulk Product Update Interface
 */
export interface BulkProductUpdate {
  productIds: string[];
  updates: Partial<UpdateProductRequest>;
}

/**
 * Bulk Product Update Result Interface
 */
export interface BulkProductUpdateResult {
  success: number;
  failed: number;
  errors: Array<{
    productId: string;
    error: string;
  }>;
}

/**
 * Product Duplicate Check Result Interface
 */
export interface ProductDuplicateCheckResult {
  hasDuplicateSku: boolean;
  hasDuplicateSlug: boolean;
  duplicateSkuProduct?: Product;
  duplicateSlugProduct?: Product;
}
