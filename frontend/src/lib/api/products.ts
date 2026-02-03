/**
 * Product API Client
 * 
 * This file contains all API client functions for product-related operations.
 * All functions are type-safe with proper error handling.
 */

import apiClient from './client';
import {
  Product,
  ProductWithRelations,
  CreateProductRequest,
  UpdateProductRequest,
  SearchFilters,
  SearchResult,
  ProductSpecification,
  ProductVariant
} from '@/types/product';
import { ProductImage } from '@/types/product-image';

// API Response Types
interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface ProductResponse {
  message: string;
  product: Product;
}

interface ProductWithRelationsResponse {
  message: string;
  product: ProductWithRelations;
}

interface ProductsResponse {
  products: ProductWithRelations[];
  total: number;
}

interface SpecificationResponse {
  specification: ProductSpecification;
}

interface VariantResponse {
  variant: ProductVariant;
}

interface ImageResponse {
  image: ProductImage;
}

interface CategoryAssociation {
  productId: string;
  categoryId: string;
  isPrimary: boolean;
  createdAt: Date;
}

interface CategoryAssociationResponse {
  association: CategoryAssociation;
}

interface CategoryAssociationsResponse {
  associations: CategoryAssociation[];
}

interface BrandAssignmentResponse {
  message: string;
  product: Product;
}

interface VariantParentResponse {
  variantId: string;
  parentId?: string;
}

interface CrossSellProduct {
  productId: string;
  relatedProductId: string;
  displayOrder: number;
  createdAt: Date;
}

interface CrossSellResponse {
  crossSell: CrossSellProduct;
}

interface CrossSellProductsResponse {
  crossSellProducts: CrossSellProduct[];
}

interface UpSellProduct {
  productId: string;
  relatedProductId: string;
  displayOrder: number;
  createdAt: Date;
}

interface UpSellResponse {
  upSell: UpSellProduct;
}

interface UpSellProductsResponse {
  upSellProducts: UpSellProduct[];
}

interface RelatedProduct {
  productId: string;
  relatedProductId: string;
  displayOrder: number;
  createdAt: Date;
}

interface RelatedProductResponse {
  related: RelatedProduct;
}

interface RelatedProductsResponse {
  relatedProducts: RelatedProduct[];
}

/**
 * Build query string from filters object
 */
const buildQueryString = (filters: SearchFilters): string => {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  
  return params.toString();
};

/**
 * Get all products with pagination, filtering, and sorting
 * 
 * @param filters - Search filters including pagination, sorting, and filtering options
 * @returns Promise with search result containing products and pagination info
 */
export const getAll = async (filters: SearchFilters = {}): Promise<SearchResult> => {
  try {
    const queryString = buildQueryString(filters);
    const endpoint = `/products${queryString ? `?${queryString}` : ''}`;
    
    console.log('[Products API] Fetching products:', {
      endpoint,
      filters,
      queryString,
    });
    
    const response = await apiClient.get<{ products: ProductWithRelations[]; pagination: PaginationInfo }>(endpoint);
    
    console.log('[Products API] Products fetched successfully:', {
      productsCount: response?.products?.length || 0,
      pagination: response?.pagination,
    });
    
    return {
      products: response?.products || [],
      pagination: response?.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
      }
    };
  } catch (error: unknown) {
    console.error('[Products API] Error fetching products:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      status: error instanceof Error && 'status' in error ? (error as any).status : undefined,
      data: error instanceof Error && 'data' in error ? (error as any).data : undefined,
    });
    throw error;
  }
};

/**
 * Get products by category ID with pagination, filtering, and sorting
 * 
 * This function uses the dedicated category products endpoint which is optimized
 * for fetching products within a specific category.
 * 
 * @param categoryId - Category ID to fetch products for
 * @param filters - Search filters including pagination, sorting, and filtering options
 * @returns Promise with search result containing products and pagination info
 */
export const getByCategory = async (
  categoryId: string,
  filters: Omit<SearchFilters, 'categoryId' | 'category'> = {}
): Promise<SearchResult> => {
  try {
    const queryString = buildQueryString(filters);
    const endpoint = `/categories/${categoryId}/products${queryString ? `?${queryString}` : ''}`;
    
    console.log('[Products API] Fetching products by category:', {
      endpoint,
      categoryId,
      filters,
      queryString,
    });
    
    const response = await apiClient.get<{ 
      category: { id: string; name: string; slug: string; imageUrl?: string };
      products: ProductWithRelations[]; 
      pagination: PaginationInfo 
    }>(endpoint);
    
    console.log('[Products API] Products fetched successfully by category:', {
      categoryId,
      productsCount: response?.products?.length || 0,
      pagination: response?.pagination,
    });
    
    return {
      products: response?.products || [],
      pagination: response?.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
      }
    };
  } catch (error: unknown) {
    console.error('[Products API] Error fetching products by category:', {
      categoryId,
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      status: error instanceof Error && 'status' in error ? (error as any).status : undefined,
      data: error instanceof Error && 'data' in error ? (error as any).data : undefined,
    });
    throw error;
  }
};

/**
 * Get product by ID with full details
 * 
 * @param id - Product ID
 * @returns Promise with product details including relations
 */
export const getById = async (id: string): Promise<ProductWithRelations> => {
  try {
    const response = await apiClient.get<ProductWithRelationsResponse>(`/products/${id}`);
    // @ts-ignore - response may not have all required properties in fallback case
    return response?.product || response as unknown;
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    throw error;
  }
};

/**
 * Get product by slug
 * 
 * @param slug - Product slug
 * @returns Promise with product details including relations
 */
export const getBySlug = async (slug: string): Promise<ProductWithRelations> => {
  try {
    const response = await apiClient.get<ProductWithRelationsResponse>(`/products/slug/${slug}`);
    return response?.product || null;
  } catch (error) {
    console.error(`Error fetching product with slug ${slug}:`, error);
    throw error;
  }
};

/**
 * Get featured products
 * 
 * @returns Promise with array of featured products
 */
export const getFeatured = async (): Promise<ProductWithRelations[]> => {
  try {
    const response = await apiClient.get<{ products: ProductWithRelations[] }>('/products/featured');
    return response?.products || [];
  } catch (error) {
    console.error('Error fetching featured products:', error);
    throw error;
  }
};

/**
 * Get new arrival products
 * 
 * @returns Promise with array of new arrival products
 */
export const getNewArrivals = async (): Promise<ProductWithRelations[]> => {
  try {
    const response = await apiClient.get<{ products: ProductWithRelations[] }>('/products/new-arrivals');
    return response?.products || [];
  } catch (error) {
    console.error('Error fetching new arrivals:', error);
    throw error;
  }
};

/**
 * Get best seller products
 * 
 * @returns Promise with array of best seller products
 */
export const getBestSellers = async (): Promise<ProductWithRelations[]> => {
  try {
    const response = await apiClient.get<{ products: ProductWithRelations[] }>('/products/best-sellers');
    return response?.products || [];
  } catch (error) {
    console.error('Error fetching best sellers:', error);
    throw error;
  }
};

/**
 * Get low stock products
 * 
 * @returns Promise with array of low stock products
 */
export const getLowStock = async (): Promise<ProductWithRelations[]> => {
  try {
    const filters: SearchFilters = {
      status: 'active',
      sortBy: 'stockQuantity',
      sortOrder: 'asc',
      limit: 50
    };
    const result = await getAll(filters);
    // Filter products with low stock
    return result.products.filter(
      product => product.stockQuantity <= product.lowStockThreshold
    );
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    throw error;
  }
};

/**
 * Get out of stock products
 * 
 * @returns Promise with array of out of stock products
 */
export const getOutOfStock = async (): Promise<ProductWithRelations[]> => {
  try {
    const filters: SearchFilters = {
      status: 'out_of_stock',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      limit: 50
    };
    const result = await getAll(filters);
    return result.products;
  } catch (error) {
    console.error('Error fetching out of stock products:', error);
    throw error;
  }
};

/**
 * Create a new product (admin only)
 * 
 * @param data - Product creation data
 * @returns Promise with created product
 */
export const create = async (data: CreateProductRequest): Promise<Product> => {
  try {
    const response = await apiClient.post<ProductResponse>(
      '/products',
      data
    );
    return response?.product || response as unknown;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

/**
 * Update an existing product (admin only)
 * 
 * @param id - Product ID
 * @param data - Partial product update data
 * @returns Promise with updated product
 */
export const update = async (
  id: string,
  data: Partial<UpdateProductRequest>
): Promise<Product> => {
  try {
    const response = await apiClient.put<ProductResponse>(
      `/products/${id}`,
      data
    );
    return response?.product || response as unknown;
  } catch (error) {
    console.error(`Error updating product ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a product (admin only)
 * 
 * @param id - Product ID
 * @returns Promise with success message
 */
export const deleteProduct = async (id: string): Promise<void> => {
  try {
    await apiClient.delete<{ message: string }>(`/products/${id}`);
  } catch (error) {
    console.error(`Error deleting product ${id}:`, error);
    throw error;
  }
};

/**
 * Update product stock quantity
 * 
 * @param id - Product ID
 * @param quantity - New stock quantity
 * @returns Promise with updated product
 */
export const updateStock = async (
  id: string,
  quantity: number
): Promise<Product> => {
  try {
    return await update(id, { stockQuantity: quantity });
  } catch (error) {
    console.error(`Error updating stock for product ${id}:`, error);
    throw error;
  }
};

/**
 * Update product status
 * 
 * @param id - Product ID
 * @param status - New status
 * @returns Promise with updated product
 */
export const updateStatus = async (
  id: string,
  status: 'active' | 'inactive' | 'out_of_stock' | 'discontinued'
): Promise<Product> => {
  try {
    return await update(id, { status });
  } catch (error) {
    console.error(`Error updating status for product ${id}:`, error);
    throw error;
  }
};

/**
 * Toggle product featured status
 * 
 * @param id - Product ID
 * @param isFeatured - Featured status
 * @returns Promise with updated product
 */
export const toggleFeatured = async (id: string, isFeatured: boolean): Promise<Product> => {
  try {
    return await update(id, { isFeatured });
  } catch (error) {
    console.error(`Error toggling featured status for product ${id}:`, error);
    throw error;
  }
};

/**
 * Toggle product new arrival status
 * 
 * @param id - Product ID
 * @param isNewArrival - New arrival status
 * @returns Promise with updated product
 */
export const toggleNewArrival = async (id: string, isNewArrival: boolean): Promise<Product> => {
  try {
    return await update(id, { isNewArrival });
  } catch (error) {
    console.error(`Error toggling new arrival status for product ${id}:`, error);
    throw error;
  }
};

/**
 * Toggle product best seller status
 * 
 * @param id - Product ID
 * @param isBestSeller - Best seller status
 * @returns Promise with updated product
 */
export const toggleBestSeller = async (id: string, isBestSeller: boolean): Promise<Product> => {
  try {
    return await update(id, { isBestSeller });
  } catch (error) {
    console.error(`Error toggling best seller status for product ${id}:`, error);
    throw error;
  }
};

// ============================================
// PHASE 4: Product Entity Enhancement API Functions
// ============================================

// Specification CRUD Functions

/**
 * Create product specification
 * 
 * @param productId - Product ID
 * @param data - Specification data
 * @returns Promise with created specification
 */
export const createSpecification = async (
  productId: string,
  data: { name: string; value: string; sortOrder?: number }
): Promise<ProductSpecification> => {
  try {
    const response = await apiClient.post<{ specification: ProductSpecification }>(
      `/products/${productId}/specifications`,
      data
    );
    return response?.specification;
  } catch (error) {
    console.error(`Error creating specification for product ${productId}:`, error);
    throw error;
  }
};

/**
 * Update product specification
 * 
 * @param productId - Product ID
 * @param specId - Specification ID
 * @param data - Partial specification data
 * @returns Promise with updated specification
 */
export const updateSpecification = async (
  productId: string,
  specId: string,
  data: { name?: string; value?: string; sortOrder?: number }
): Promise<ProductSpecification> => {
  try {
    const response = await apiClient.put<{ specification: ProductSpecification }>(
      `/products/${productId}/specifications/${specId}`,
      data
    );
    return response?.specification;
  } catch (error) {
    console.error(`Error updating specification ${specId}:`, error);
    throw error;
  }
};

/**
 * Delete product specification
 * 
 * @param productId - Product ID
 * @param specId - Specification ID
 * @returns Promise with success message
 */
export const deleteSpecification = async (
  productId: string,
  specId: string
): Promise<void> => {
  try {
    await apiClient.delete<{ message: string }>(
      `/products/${productId}/specifications/${specId}`
    );
  } catch (error) {
    console.error(`Error deleting specification ${specId}:`, error);
    throw error;
  }
};

// Variant CRUD Functions

/**
 * Create product variant
 * 
 * @param productId - Product ID
 * @param data - Variant data
 * @returns Promise with created variant
 */
export const createVariant = async (
  productId: string,
  data: {
    name: string;
    sku: string;
    price: number;
    comparePrice?: number;
    stock?: number;
    isActive?: boolean;
  }
): Promise<ProductVariant> => {
  try {
    const response = await apiClient.post<{ variant: ProductVariant }>(
      `/products/${productId}/variants`,
      data
    );
    return response?.variant;
  } catch (error) {
    console.error(`Error creating variant for product ${productId}:`, error);
    throw error;
  }
};

/**
 * Update product variant
 * 
 * @param productId - Product ID
 * @param variantId - Variant ID
 * @param data - Partial variant data
 * @returns Promise with updated variant
 */
export const updateVariant = async (
  productId: string,
  variantId: string,
  data: {
    name?: string;
    sku?: string;
    price?: number;
    comparePrice?: number;
    stock?: number;
    isActive?: boolean;
  }
): Promise<ProductVariant> => {
  try {
    const response = await apiClient.put<{ variant: ProductVariant }>(
      `/products/${productId}/variants/${variantId}`,
      data
    );
    return response?.variant;
  } catch (error) {
    console.error(`Error updating variant ${variantId}:`, error);
    throw error;
  }
};

/**
 * Delete product variant
 * 
 * @param productId - Product ID
 * @param variantId - Variant ID
 * @returns Promise with success message
 */
export const deleteVariant = async (
  productId: string,
  variantId: string
): Promise<void> => {
  try {
    await apiClient.delete<{ message: string }>(
      `/products/${productId}/variants/${variantId}`
    );
  } catch (error) {
    console.error(`Error deleting variant ${variantId}:`, error);
    throw error;
  }
};

// Image Upload/Management Functions

/**
 * Upload product image
 * 
 * @param productId - Product ID
 * @param file - Image file
 * @param data - Optional alt text and sort order
 * @returns Promise with uploaded image
 */
export const uploadImage = async (
  productId: string,
  file: File,
  data?: { alt?: string; sortOrder?: number }
): Promise<ProductImage> => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    if (data?.alt) formData.append('alt', data.alt);
    if (data?.sortOrder !== undefined) formData.append('sortOrder', String(data.sortOrder));

    const response = await apiClient.post<{ image: ProductImage }>(
      `/products/${productId}/images`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000 // 60 second timeout for product image upload
      }
    );
    return response?.image;
  } catch (error) {
    console.error(`Error uploading image for product ${productId}:`, error);
    throw error;
  }
};

/**
 * Update product image
 * 
 * @param productId - Product ID
 * @param imageId - Image ID
 * @param data - Optional file, alt text, and sort order
 * @returns Promise with updated image
 */
export const updateImage = async (
  productId: string,
  imageId: string,
  data?: { file?: File; alt?: string; sortOrder?: number }
): Promise<ProductImage> => {
  try {
    const formData = new FormData();
    if (data?.file) formData.append('image', data.file);
    if (data?.alt !== undefined) formData.append('alt', data.alt);
    if (data?.sortOrder !== undefined) formData.append('sortOrder', String(data.sortOrder));

    const response = await apiClient.put<{ image: ProductImage }>(
      `/products/${productId}/images/${imageId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000 // 60 second timeout for product image update
      }
    );
    return response?.image;
  } catch (error) {
    console.error(`Error updating image ${imageId}:`, error);
    throw error;
  }
};

/**
 * Delete product image
 * 
 * @param productId - Product ID
 * @param imageId - Image ID
 * @returns Promise with success message
 */
export const deleteImage = async (
  productId: string,
  imageId: string
): Promise<void> => {
  try {
    await apiClient.delete<{ message: string }>(
      `/products/${productId}/images/${imageId}`
    );
  } catch (error) {
    console.error(`Error deleting image ${imageId}:`, error);
    throw error;
  }
};

// Status/Visibility Update Functions

/**
 * Update product status
 * 
 * @param id - Product ID
 * @param status - New status
 * @returns Promise with updated product
 */
export const updateProductStatus = async (
  id: string,
  status: 'draft' | 'published' | 'archived' | 'active' | 'inactive' | 'out_of_stock' | 'discontinued'
): Promise<Product> => {
  try {
    const response = await apiClient.patch<ProductResponse>(
      `/products/${id}/status`,
      { status }
    );
    return response?.product || response as unknown;
  } catch (error) {
    console.error(`Error updating status for product ${id}:`, error);
    throw error;
  }
};

/**
 * Update product visibility
 * 
 * @param id - Product ID
 * @param visibility - New visibility
 * @returns Promise with updated product
 */
export const updateVisibility = async (
  id: string,
  visibility: 'public' | 'private' | 'restricted'
): Promise<Product> => {
  try {
    const response = await apiClient.patch<ProductResponse>(
      `/products/${id}/visibility`,
      { visibility }
    );
    return response?.product || response as unknown;
  } catch (error) {
    console.error(`Error updating visibility for product ${id}:`, error);
    throw error;
  }
};

// SEO Update Function

/**
 * Update product SEO fields
 *
 * @param id - Product ID
 * @param data - SEO data
 * @returns Promise with updated product
 */
export const updateSEO = async (
  id: string,
  data: { metaTitle?: string; metaDescription?: string; metaKeywords?: string }
): Promise<Product> => {
  try {
    const response = await apiClient.patch<ProductResponse>(
      `/products/${id}/seo`,
      data
    );
    return response?.product || response as unknown;
  } catch (error) {
    console.error(`Error updating SEO for product ${id}:`, error);
    throw error;
  }
};

// ============================================
// PHASE 4: Product Relationship API Functions
// ============================================

// Product-Category Relationship Functions

/**
 * Assign categories to product
 *
 * @param productId - Product ID
 * @param categoryIds - Array of category IDs to assign
 * @param primaryCategoryId - Optional primary category ID
 * @returns Promise with created associations
 */
export const assignProductCategories = async (
  productId: string,
  categoryIds: string[],
  primaryCategoryId?: string
): Promise<CategoryAssociation[]> => {
  try {
    const response = await apiClient.post<CategoryAssociationsResponse>(
      `/products/${productId}/categories`,
      { categoryIds, primaryCategoryId }
    );
    return response?.associations;
  } catch (error) {
    console.error(`Error assigning categories to product ${productId}:`, error);
    throw error;
  }
};

/**
 * Remove category from product
 *
 * @param productId - Product ID
 * @param categoryId - Category ID to remove
 * @returns Promise with success message
 */
export const removeProductCategory = async (
  productId: string,
  categoryId: string
): Promise<void> => {
  try {
    await apiClient.delete<{ message: string }>(
      `/products/${productId}/categories/${categoryId}`
    );
  } catch (error) {
    console.error(`Error removing category ${categoryId} from product ${productId}:`, error);
    throw error;
  }
};

/**
 * Set primary category for product
 *
 * @param productId - Product ID
 * @param categoryId - Category ID to set as primary
 * @returns Promise with updated association
 */
export const setPrimaryCategory = async (
  productId: string,
  categoryId: string
): Promise<CategoryAssociation> => {
  try {
    const response = await apiClient.patch<CategoryAssociationResponse>(
      `/products/${productId}/categories/${categoryId}/primary`,
      {}
    );
    return response?.association;
  } catch (error) {
    console.error(`Error setting primary category ${categoryId} for product ${productId}:`, error);
    throw error;
  }
};

// Product-Brand Relationship Functions

/**
 * Assign brand to product
 *
 * @param productId - Product ID
 * @param brandId - Brand ID to assign
 * @returns Promise with updated product
 */
export const assignProductBrand = async (
  productId: string,
  brandId: string
): Promise<Product> => {
  try {
    const response = await apiClient.patch<BrandAssignmentResponse>(
      `/products/${productId}/brand`,
      { brandId }
    );
    return response?.product || response as unknown;
  } catch (error) {
    console.error(`Error assigning brand ${brandId} to product ${productId}:`, error);
    throw error;
  }
};

// Product Variant Relationship Functions

/**
 * Set parent variant for product variant
 *
 * @param productId - Product ID
 * @param variantId - Variant ID
 * @param parentId - Optional parent variant ID
 * @returns Promise with success message
 */
export const setVariantParent = async (
  productId: string,
  variantId: string,
  parentId?: string
): Promise<VariantParentResponse> => {
  try {
    const response = await apiClient.patch<{ variantId: string; parentId?: string }>(
      `/products/${productId}/variants/${variantId}/parent`,
      { parentId }
    );
    return response;
  } catch (error) {
    console.error(`Error setting parent for variant ${variantId}:`, error);
    throw error;
  }
};

// Cross-Sell Product Relationship Functions

/**
 * Add cross-sell product
 *
 * @param productId - Product ID
 * @param relatedProductId - Related product ID
 * @param displayOrder - Optional display order
 * @returns Promise with created cross-sell relationship
 */
export const addCrossSellProduct = async (
  productId: string,
  relatedProductId: string,
  displayOrder?: number
): Promise<CrossSellProduct> => {
  try {
    const response = await apiClient.post<CrossSellResponse>(
      `/products/${productId}/cross-sell`,
      { relatedProductId, displayOrder }
    );
    return response?.crossSell;
  } catch (error) {
    console.error(`Error adding cross-sell product ${relatedProductId} to product ${productId}:`, error);
    throw error;
  }
};

/**
 * Remove cross-sell product
 *
 * @param productId - Product ID
 * @param relatedId - Related product ID to remove
 * @returns Promise with success message
 */
export const removeCrossSellProduct = async (
  productId: string,
  relatedId: string
): Promise<void> => {
  try {
    await apiClient.delete<{ message: string }>(
      `/products/${productId}/cross-sell/${relatedId}`
    );
  } catch (error) {
    console.error(`Error removing cross-sell product ${relatedId} from product ${productId}:`, error);
    throw error;
  }
};

/**
 * Reorder cross-sell products
 *
 * @param productId - Product ID
 * @param orders - Array of { relatedProductId, displayOrder }
 * @returns Promise with reordered cross-sell products
 */
export const reorderCrossSellProducts = async (
  productId: string,
  orders: Array<{ relatedProductId: string; displayOrder: number }>
): Promise<CrossSellProduct[]> => {
  try {
    const response = await apiClient.patch<CrossSellProductsResponse>(
      `/products/${productId}/cross-sell/reorder`,
      { orders }
    );
    return response?.crossSellProducts;
  } catch (error) {
    console.error(`Error reordering cross-sell products for product ${productId}:`, error);
    throw error;
  }
};

// Up-Sell Product Relationship Functions

/**
 * Add up-sell product
 *
 * @param productId - Product ID
 * @param relatedProductId - Related product ID
 * @param displayOrder - Optional display order
 * @returns Promise with created up-sell relationship
 */
export const addUpSellProduct = async (
  productId: string,
  relatedProductId: string,
  displayOrder?: number
): Promise<UpSellProduct> => {
  try {
    const response = await apiClient.post<UpSellResponse>(
      `/products/${productId}/up-sell`,
      { relatedProductId, displayOrder }
    );
    return response?.upSell;
  } catch (error) {
    console.error(`Error adding up-sell product ${relatedProductId} to product ${productId}:`, error);
    throw error;
  }
};

/**
 * Remove up-sell product
 *
 * @param productId - Product ID
 * @param relatedId - Related product ID to remove
 * @returns Promise with success message
 */
export const removeUpSellProduct = async (
  productId: string,
  relatedId: string
): Promise<void> => {
  try {
    await apiClient.delete<{ message: string }>(
      `/products/${productId}/up-sell/${relatedId}`
    );
  } catch (error) {
    console.error(`Error removing up-sell product ${relatedId} from product ${productId}:`, error);
    throw error;
  }
};

/**
 * Reorder up-sell products
 *
 * @param productId - Product ID
 * @param orders - Array of { relatedProductId, displayOrder }
 * @returns Promise with reordered up-sell products
 */
export const reorderUpSellProducts = async (
  productId: string,
  orders: Array<{ relatedProductId: string; displayOrder: number }>
): Promise<UpSellProduct[]> => {
  try {
    const response = await apiClient.patch<{ upSellProducts: any[] }>(
      `/products/${productId}/up-sell/reorder`,
      { orders }
    );
    return response?.upSellProducts;
  } catch (error) {
    console.error(`Error reordering up-sell products for product ${productId}:`, error);
    throw error;
  }
};

// Related Products Relationship Functions

/**
 * Add related product
 *
 * @param productId - Product ID
 * @param relatedProductId - Related product ID
 * @param displayOrder - Optional display order
 * @returns Promise with created related product relationship
 */
export const addRelatedProduct = async (
  productId: string,
  relatedProductId: string,
  displayOrder?: number
): Promise<RelatedProduct> => {
  try {
    const response = await apiClient.post<RelatedProductResponse>(
      `/products/${productId}/related`,
      { relatedProductId, displayOrder }
    );
    return response?.related;
  } catch (error) {
    console.error(`Error adding related product ${relatedProductId} to product ${productId}:`, error);
    throw error;
  }
};

/**
 * Remove related product
 *
 * @param productId - Product ID
 * @param relatedId - Related product ID to remove
 * @returns Promise with success message
 */
export const removeRelatedProduct = async (
  productId: string,
  relatedId: string
): Promise<void> => {
  try {
    await apiClient.delete<{ message: string }>(
      `/products/${productId}/related/${relatedId}`
    );
  } catch (error) {
    console.error(`Error removing related product ${relatedId} from product ${productId}:`, error);
    throw error;
  }
};

/**
 * Reorder related products
 *
 * @param productId - Product ID
 * @param orders - Array of { relatedProductId, displayOrder }
 * @returns Promise with reordered related products
 */
export const reorderRelatedProducts = async (
  productId: string,
  orders: Array<{ relatedProductId: string; displayOrder: number }>
): Promise<RelatedProduct[]> => {
  try {
    const response = await apiClient.patch<RelatedProductsResponse>(
      `/products/${productId}/related/reorder`,
      { orders }
    );
    return response?.relatedProducts;
  } catch (error) {
    console.error(`Error reordering related products for product ${productId}:`, error);
    throw error;
  }
};

// Export all functions as a named object for convenience
const productsApi = {
  getAll,
  getByCategory,
  getById,
  getBySlug,
  getFeatured,
  getNewArrivals,
  getBestSellers,
  getLowStock,
  getOutOfStock,
  create,
  update,
  delete: deleteProduct,
  updateStock,
  updateStatus,
  toggleFeatured,
  toggleNewArrival,
  toggleBestSeller,
  // Phase 4 functions
  createSpecification,
  updateSpecification,
  deleteSpecification,
  createVariant,
  updateVariant,
  deleteVariant,
  uploadImage,
  updateImage,
  deleteImage,
  updateProductStatus,
  updateVisibility,
  updateSEO,
  // Phase 4 relationship functions
  assignProductCategories,
  removeProductCategory,
  setPrimaryCategory,
  assignProductBrand,
  setVariantParent,
  addCrossSellProduct,
  removeCrossSellProduct,
  reorderCrossSellProducts,
  addUpSellProduct,
  removeUpSellProduct,
  reorderUpSellProducts,
  addRelatedProduct,
  removeRelatedProduct,
  reorderRelatedProducts
};

export default productsApi;
