/**
 * Product Entity Type Definitions
 *
 * This file contains all TypeScript interfaces and types related to Product entities
 * including Product, ProductSpecification, and ProductVariant.
 */

import type { ProductImage } from './product-image';

/**
 * Product Status Type
 */
export type ProductStatus = 'draft' | 'published' | 'archived' | 'active' | 'inactive' | 'out_of_stock' | 'discontinued';

/**
 * Product Visibility Type
 */
export type ProductVisibility = 'public' | 'private' | 'restricted';

/**
 * Inventory Status Type
 */
export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

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
  price: number;
  comparePrice: number | null;
  stock: number;
  isActive: boolean;
}

/**
 * Variant Type Interface
 */
export interface VariantType {
  id: string;
  name: string;
  productId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Variant Value Interface
 */
export interface VariantValue {
  id: string;
  value: string;
  variantTypeId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Product Category Relationship Interface
 */
export interface ProductCategory {
  id: string;
  productId: string;
  categoryId: string;
  product: Product;
  category: {
    id: string;
    name: string;
    nameEn?: string;
    nameBn?: string;
    slug: string;
    imageUrl?: string;
    iconUrl?: string;
  };
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Cross Sell Product Relationship Interface
 */
export interface CrossSellProduct {
  id: string;
  productId: string;
  relatedProductId: string;
  product: Product;
  relatedProduct: {
    id: string;
    name: string;
    nameEn: string;
    nameBn?: string;
    slug: string;
    sku: string;
    regularPrice: number;
    salePrice: number | null;
    images?: ProductImage[];
  };
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Up Sell Product Relationship Interface
 */
export interface UpSellProduct {
  id: string;
  productId: string;
  relatedProductId: string;
  product: Product;
  relatedProduct: {
    id: string;
    name: string;
    nameEn: string;
    nameBn?: string;
    slug: string;
    sku: string;
    regularPrice: number;
    salePrice: number | null;
    images?: ProductImage[];
  };
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Related Product Relationship Interface
 */
export interface RelatedProduct {
  id: string;
  productId: string;
  relatedProductId: string;
  product: Product;
  relatedProduct: {
    id: string;
    name: string;
    nameEn: string;
    nameBn?: string;
    slug: string;
    sku: string;
    regularPrice: number;
    salePrice: number | null;
    images?: ProductImage[];
  };
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
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
  brandId: string;
  regularPrice: number;
  salePrice: number | null;
  costPrice: number;
  taxRate: number;
  stockQuantity: number;
  lowStockThreshold: number;
  status: ProductStatus;
  visibility: ProductVisibility;
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
export interface ProductWithRelations extends Product {
  brand: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string;
  };
  categories?: ProductCategory[];
  images: ProductImage[];
  specifications: ProductSpecification[];
  variants: ProductVariant[];
  crossSellProducts?: CrossSellProduct[];
  upSellProducts?: UpSellProduct[];
  relatedProducts?: RelatedProduct[];
  reviews?: ProductReview[];
  _count?: {
    reviews: number;
    cartItems?: number;
    orderItems?: number;
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
  categories: string[];
  brandId: string;
  regularPrice: number;
  salePrice?: number;
  costPrice: number;
  stockQuantity: number;
  lowStockThreshold?: number;
  taxRate?: number;
  status?: ProductStatus;
  visibility?: ProductVisibility;
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
  categories?: string[];
  brandId?: string;
  regularPrice?: number;
  salePrice?: number;
  costPrice?: number;
  stockQuantity?: number;
  lowStockThreshold?: number;
  taxRate?: number;
  status?: ProductStatus;
  visibility?: ProductVisibility;
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
export interface SearchFilters {
  page?: number;
  limit?: number;
  category?: string;
  categoryId?: string;
  brand?: string;
  brandId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: ProductStatus;
  visibility?: ProductVisibility;
  sortBy?: 'price' | 'name' | 'createdAt' | 'stockQuantity';
  sortOrder?: 'asc' | 'desc';
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
}

/**
 * Product Search Response Interface
 */
export interface SearchResult {
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
  status: InventoryStatus;
  needsRestock: boolean;
}

/**
 * Product Price Calculation Interface
 */
export interface PriceData {
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
export interface SEOData {
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
