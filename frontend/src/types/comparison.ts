/**
 * Comparison Entity Type Definitions
 *
 * This file contains all TypeScript interfaces and types related to Comparison entities
 */

import type { ProductWithRelations } from './product';
import type { ProductImage } from './product-image';

/**
 * Comparison Status Type
 */
export type ComparisonStatus = 'active' | 'archived' | 'deleted';

/**
 * Comparison Item Interface
 */
export interface ComparisonItem {
  id: string;
  comparisonId: string;
  productId: string;
  displayOrder: number;
  addedAt: Date;
  product: ProductWithRelations;
}

/**
 * Comparison Interface
 */
export interface Comparison {
  id: string;
  userId: string | null;
  sessionId: string | null;
  name: string;
  status: ComparisonStatus;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
  items?: ComparisonItem[];
}

/**
 * Comparison with Products Interface
 */
export interface ComparisonWithProducts extends Comparison {
  items: ComparisonItem[];
}

/**
 * Create Comparison Request Interface
 */
export interface CreateComparisonRequest {
  name: string;
  productIds?: string[];
}

/**
 * Update Comparison Request Interface
 */
export interface UpdateComparisonRequest {
  name?: string;
  status?: ComparisonStatus;
}

/**
 * Add Product to Comparison Request Interface
 */
export interface AddProductToComparisonRequest {
  productId: string;
  displayOrder?: number;
}

/**
 * Comparison Data Interface
 */
export interface ComparisonData {
  comparison: Comparison;
  products: ProductWithRelations[];
  specifications: ComparisonSpecificationData;
  prices: ComparisonPriceData;
  images: ComparisonImageData;
  differences: ComparisonDifferenceData;
}

/**
 * Comparison Specification Data Interface
 */
export interface ComparisonSpecificationData {
  grouped: {
    [groupName: string]: ComparisonSpecItem[];
  };
  common: ComparisonSpecItem[];
  differences: ComparisonSpecDifference[];
}

/**
 * Comparison Spec Item Interface
 */
export interface ComparisonSpecItem {
  name: string;
  values: {
    productId: string;
    value: string;
  }[];
}

/**
 * Comparison Spec Difference Interface
 */
export interface ComparisonSpecDifference {
  name: string;
  values: {
    productId: string;
    value: string;
    better?: boolean;
  }[];
  hasDifference: boolean;
}

/**
 * Comparison Price Data Interface
 */
export interface ComparisonPriceData {
  products: {
    productId: string;
    productName: string;
    regularPrice: number;
    salePrice: number | null;
    finalPrice: number;
    discountPercentage: number | null;
    isCheapest: boolean;
    isMostExpensive: boolean;
  }[];
  priceRange: {
    min: number;
    max: number;
    average: number;
  };
  savings: {
    cheapestProductId: string;
    amount: number;
    percentage: number;
  } | null;
}

/**
 * Comparison Image Data Interface
 */
export interface ComparisonImageData {
  products: {
    productId: string;
    productName: string;
    primaryImage: ProductImage | null;
    images: ProductImage[];
  }[];
}

/**
 * Comparison Difference Data Interface
 */
export interface ComparisonDifferenceData {
  summary: {
    totalProducts: number;
    commonSpecs: number;
    differentSpecs: number;
    uniqueSpecs: number;
  };
  keyDifferences: ComparisonKeyDifference[];
  bestValueRecommendation: {
    productId: string;
    productName: string;
    reasons: string[];
  } | null;
}

/**
 * Comparison Key Difference Interface
 */
export interface ComparisonKeyDifference {
  category: string;
  name: string;
  description: string;
  products: {
    productId: string;
    productName: string;
    value: string;
    isBetter: boolean;
  }[];
}

/**
 * Share Comparison Request Interface
 */
export interface ShareComparisonRequest {
  expiresIn?: number; // Expiration time in seconds
}

/**
 * Share Comparison Response Interface
 */
export interface ShareComparisonResponse {
  shareUrl: string;
  shareCode: string;
  expiresAt: Date;
}

/**
 * Export Comparison Request Interface
 */
export interface ExportComparisonRequest {
  format: 'pdf' | 'excel' | 'csv';
  includeImages?: boolean;
  includeSpecs?: boolean;
  includePrices?: boolean;
}

/**
 * Export Comparison Response Interface
 */
export interface ExportComparisonResponse {
  downloadUrl: string;
  format: string;
  expiresAt: Date;
}

/**
 * Guest Comparison Request Interface
 */
export interface GuestComparisonRequest {
  sessionId: string;
  name: string;
  productIds?: string[];
}

/**
 * Guest Comparison Interface
 */
export interface GuestComparison {
  id: string;
  sessionId: string;
  name: string;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
  items?: ComparisonItem[];
}

/**
 * Merge Guest Comparison Request Interface
 */
export interface MergeGuestComparisonRequest {
  sessionId: string;
  comparisonId?: string; // Optional: merge into existing comparison
  name?: string; // Optional: create new comparison with this name
}

/**
 * Comparison List Response Interface
 */
export interface ComparisonListResponse {
  comparisons: Comparison[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Comparison Filters Interface
 */
export interface ComparisonFilters {
  page?: number;
  limit?: number;
  status?: ComparisonStatus;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'itemCount';
  sortOrder?: 'asc' | 'desc';
}
