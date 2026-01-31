/**
 * Product Indexing Service
 * 
 * This service handles indexing, updating, and deleting products in Elasticsearch.
 * It provides bulk operations for efficient indexing and includes error handling
 * and retry logic for reliability.
 */

const { PrismaClient } = require('@prisma/client');
const { elasticsearchConfig } = require('../../config/elasticsearch');
const { productIndex } = require('./productIndex');
const { loggerService } = require('../logger');

class ProductIndexingService {
  constructor() {
    this.prisma = new PrismaClient();
    this.client = elasticsearchConfig.getClient();
    this.indexName = productIndex.getIndexName();
    this.bulkSize = 100; // Number of documents to bulk index at once
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
  }

  /**
   * Transform product data from Prisma to Elasticsearch format
   * @param {Object} product - Product from Prisma
   * @returns {Object} Transformed product for Elasticsearch
   */
  transformProduct(product) {
    // Get primary category
    const primaryCategory = product.categories.find(cat => cat.isPrimary) || product.categories[0];
    
    // Build category path
    const categoryPath = primaryCategory ? this.buildCategoryPath(primaryCategory.category) : [];

    // Get thumbnail image
    const thumbnail = product.images.length > 0 
      ? product.images.find(img => img.sortOrder === 0)?.url || product.images[0].url 
      : null;

    // Calculate average rating
    const avgRating = product.reviews.length > 0
      ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
      : 0;

    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      nameEn: product.nameEn,
      nameBn: product.nameBn,
      slug: product.slug,
      shortDescription: product.shortDescription,
      description: product.description,
      descriptionEn: product.description,
      descriptionBn: product.description,
      basePrice: parseFloat(product.regularPrice),
      discountPrice: product.salePrice ? parseFloat(product.salePrice) : null,
      specialPrice: product.salePrice ? parseFloat(product.salePrice) : null,
      salePrice: product.salePrice ? parseFloat(product.salePrice) : null,
      costPrice: parseFloat(product.costPrice),
      taxRate: parseFloat(product.taxRate),
      categoryId: primaryCategory?.categoryId || null,
      categoryName: primaryCategory?.category?.name || null,
      categoryNameEn: primaryCategory?.category?.nameEn || null,
      categoryNameBn: primaryCategory?.category?.nameBn || null,
      categoryPath: categoryPath,
      categories: product.categories.map(pc => ({
        id: pc.categoryId,
        name: pc.category?.name,
        nameEn: pc.category?.nameEn,
        nameBn: pc.category?.nameBn,
        slug: pc.category?.slug,
        isPrimary: pc.isPrimary
      })),
      brandId: product.brandId,
      brandName: product.brand?.name,
      brandNameEn: product.brand?.nameEn,
      brandNameBn: product.brand?.nameBn,
      brandSlug: product.brand?.slug,
      status: product.status,
      visibility: product.visibility,
      isFeatured: product.isFeatured,
      isNewArrival: product.isNewArrival,
      isBestSeller: product.isBestSeller,
      rating: parseFloat(avgRating.toFixed(2)),
      reviewCount: product.reviews.length,
      popularity: 0, // Can be calculated from view counts, sales, etc.
      soldCount: 0, // Can be calculated from order items
      stockQuantity: product.stockQuantity,
      lowStockThreshold: product.lowStockThreshold,
      inStock: product.stockQuantity > 0,
      thumbnail: thumbnail,
      images: product.images.map(img => img.url),
      warrantyPeriod: product.warrantyPeriod,
      warrantyType: product.warrantyType,
      metaTitle: product.metaTitle,
      metaDescription: product.metaDescription,
      metaKeywords: product.metaKeywords,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      publishedAt: product.publishedAt
    };
  }

  /**
   * Build category path for hierarchical navigation
   * @param {Object} category - Category object
   * @returns {Array<string>} Category path
   */
  async buildCategoryPath(category) {
    const path = [];
    let currentCategory = category;

    while (currentCategory) {
      path.unshift(currentCategory.name || currentCategory.nameEn);
      if (currentCategory.parentId) {
        currentCategory = await this.prisma.category.findUnique({
          where: { id: currentCategory.parentId }
        });
      } else {
        currentCategory = null;
      }
    }

    return path;
  }

  /**
   * Index a single product
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} Indexing result
   */
  async indexProduct(productId) {
    try {
      // Fetch product with all required relations
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        include: {
          categories: {
            include: {
              category: true
            }
          },
          brand: true,
          images: {
            orderBy: { sortOrder: 'asc' }
          },
          reviews: {
            where: { isApproved: true }
          }
        }
      });

      if (!product) {
        loggerService.warn('Product not found for indexing', { productId });
        return {
          success: false,
          error: 'Product not found',
          productId
        };
      }

      // Transform product data
      const transformedProduct = this.transformProduct(product);

      // Index in Elasticsearch
      const response = await this.client.index({
        index: this.indexName,
        id: product.id,
        body: transformedProduct,
        refresh: true
      });

      loggerService.info('Product indexed successfully', {
        productId: product.id,
        sku: product.sku,
        name: product.name
      });

      return {
        success: true,
        message: 'Product indexed successfully',
        productId: product.id,
        result: response.result
      };

    } catch (error) {
      loggerService.error('Failed to index product', {
        error: error.message,
        productId
      });

      return {
        success: false,
        error: error.message,
        productId
      };
    }
  }

  /**
   * Index multiple products
   * @param {Array<string>} productIds - Array of product IDs
   * @returns {Promise<Object>} Bulk indexing result
   */
  async indexProducts(productIds) {
    try {
      if (!productIds || productIds.length === 0) {
        return {
          success: true,
          message: 'No products to index',
          indexed: 0,
          failed: 0
        };
      }

      loggerService.info('Starting bulk product indexing', {
        count: productIds.length
      });

      let indexed = 0;
      let failed = 0;
      const errors = [];

      // Process in batches
      for (let i = 0; i < productIds.length; i += this.bulkSize) {
        const batch = productIds.slice(i, i + this.bulkSize);
        const batchResult = await this.indexBatch(batch);
        
        indexed += batchResult.indexed;
        failed += batchResult.failed;
        errors.push(...batchResult.errors);

        loggerService.info(`Batch ${Math.floor(i / this.bulkSize) + 1} completed`, {
          indexed: batchResult.indexed,
          failed: batchResult.failed
        });
      }

      loggerService.info('Bulk product indexing completed', {
        total: productIds.length,
        indexed,
        failed
      });

      return {
        success: failed === 0,
        message: 'Bulk indexing completed',
        total: productIds.length,
        indexed,
        failed,
        errors
      };

    } catch (error) {
      loggerService.error('Failed to index products in bulk', {
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Index a batch of products
   * @param {Array<string>} productIds - Array of product IDs
   * @returns {Promise<Object>} Batch indexing result
   */
  async indexBatch(productIds) {
    try {
      // Fetch products with all required relations
      const products = await this.prisma.product.findMany({
        where: {
          id: { in: productIds }
        },
        include: {
          categories: {
            include: {
              category: true
            }
          },
          brand: true,
          images: {
            orderBy: { sortOrder: 'asc' }
          },
          reviews: {
            where: { isApproved: true }
          }
        }
      });

      // Build bulk operations
      const bulkOperations = [];
      for (const product of products) {
        const transformedProduct = this.transformProduct(product);
        bulkOperations.push(
          { index: { _index: this.indexName, _id: product.id } },
          transformedProduct
        );
      }

      // Execute bulk operation
      const response = await this.client.bulk({
        body: bulkOperations,
        refresh: true
      });

      // Process results
      const indexed = [];
      const failed = [];
      const errors = [];

      response.body.items.forEach((item, index) => {
        if (item.index && item.index.result === 'created' || item.index.result === 'updated') {
          indexed.push(products[index].id);
        } else {
          failed.push(products[index].id);
          errors.push({
            productId: products[index].id,
            error: item.index.error
          });
        }
      });

      return {
        indexed: indexed.length,
        failed: failed.length,
        errors
      };

    } catch (error) {
      loggerService.error('Failed to index batch', {
        error: error.message,
        batchSize: productIds.length
      });

      return {
        indexed: 0,
        failed: productIds.length,
        errors: [{ error: error.message }]
      };
    }
  }

  /**
   * Index all products in the database
   * @returns {Promise<Object>} Full reindex result
   */
  async indexAllProducts() {
    try {
      loggerService.info('Starting full product reindex');

      // Get all product IDs
      const products = await this.prisma.product.findMany({
        select: { id: true }
      });

      const productIds = products.map(p => p.id);

      loggerService.info('Found products for reindexing', {
        count: productIds.length
      });

      // Rebuild index first
      const rebuildResult = await productIndex.rebuildIndex();
      if (!rebuildResult.success) {
        throw new Error(`Failed to rebuild index: ${rebuildResult.error}`);
      }

      // Index all products
      const result = await this.indexProducts(productIds);

      loggerService.info('Full product reindex completed', {
        total: result.total,
        indexed: result.indexed,
        failed: result.failed
      });

      return result;

    } catch (error) {
      loggerService.error('Failed to index all products', {
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete a product from the index
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteProduct(productId) {
    try {
      const response = await this.client.delete({
        index: this.indexName,
        id: productId,
        refresh: true
      });

      loggerService.info('Product deleted from index', {
        productId
      });

      return {
        success: true,
        message: 'Product deleted from index successfully',
        productId,
        result: response.result
      };

    } catch (error) {
      if (error.meta?.statusCode === 404) {
        loggerService.warn('Product not found in index', { productId });
        return {
          success: true,
          message: 'Product not in index',
          productId
        };
      }

      loggerService.error('Failed to delete product from index', {
        error: error.message,
        productId
      });

      return {
        success: false,
        error: error.message,
        productId
      };
    }
  }

  /**
   * Update a product in the index
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} Update result
   */
  async updateProduct(productId) {
    try {
      // Fetch product with all required relations
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        include: {
          categories: {
            include: {
              category: true
            }
          },
          brand: true,
          images: {
            orderBy: { sortOrder: 'asc' }
          },
          reviews: {
            where: { isApproved: true }
          }
        }
      });

      if (!product) {
        loggerService.warn('Product not found for update', { productId });
        return {
          success: false,
          error: 'Product not found',
          productId
        };
      }

      // Transform product data
      const transformedProduct = this.transformProduct(product);

      // Update in Elasticsearch
      const response = await this.client.index({
        index: this.indexName,
        id: product.id,
        body: transformedProduct,
        refresh: true
      });

      loggerService.info('Product updated in index', {
        productId: product.id,
        sku: product.sku,
        name: product.name
      });

      return {
        success: true,
        message: 'Product updated in index successfully',
        productId: product.id,
        result: response.result
      };

    } catch (error) {
      loggerService.error('Failed to update product in index', {
        error: error.message,
        productId
      });

      return {
        success: false,
        error: error.message,
        productId
      };
    }
  }

  /**
   * Delete multiple products from the index
   * @param {Array<string>} productIds - Array of product IDs
   * @returns {Promise<Object>} Bulk deletion result
   */
  async deleteProducts(productIds) {
    try {
      if (!productIds || productIds.length === 0) {
        return {
          success: true,
          message: 'No products to delete',
          deleted: 0
        };
      }

      // Build bulk operations
      const bulkOperations = [];
      for (const productId of productIds) {
        bulkOperations.push(
          { delete: { _index: this.indexName, _id: productId } }
        );
      }

      // Execute bulk operation
      const response = await this.client.bulk({
        body: bulkOperations,
        refresh: true
      });

      // Process results
      const deleted = [];
      const failed = [];
      const errors = [];

      response.body.items.forEach((item, index) => {
        if (item.delete && item.delete.result === 'deleted') {
          deleted.push(productIds[index]);
        } else if (item.delete && item.delete.result === 'not_found') {
          deleted.push(productIds[index]); // Consider not_found as success
        } else {
          failed.push(productIds[index]);
          errors.push({
            productId: productIds[index],
            error: item.delete.error
          });
        }
      });

      loggerService.info('Bulk product deletion completed', {
        total: productIds.length,
        deleted: deleted.length,
        failed: failed.length
      });

      return {
        success: failed.length === 0,
        message: 'Bulk deletion completed',
        total: productIds.length,
        deleted: deleted.length,
        failed: failed.length,
        errors
      };

    } catch (error) {
      loggerService.error('Failed to delete products in bulk', {
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get indexing statistics
   * @returns {Promise<Object>} Indexing statistics
   */
  async getIndexingStats() {
    try {
      const indexStats = await productIndex.getIndexStats();
      const dbStats = await this.prisma.product.count();

      return {
        success: true,
        elasticsearch: {
          totalDocs: indexStats.totalDocs,
          indexSize: indexStats.totalStoreSize
        },
        database: {
          totalProducts: dbStats
        },
        syncStatus: indexStats.totalDocs === dbStats ? 'synced' : 'out_of_sync',
        difference: Math.abs(indexStats.totalDocs - dbStats)
      };

    } catch (error) {
      loggerService.error('Failed to get indexing stats', {
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Retry operation with exponential backoff
   * @param {Function} operation - Operation to retry
   * @param {number} maxRetries - Maximum number of retries
   * @returns {Promise<any>} Operation result
   */
  async retryWithBackoff(operation, maxRetries = this.maxRetries) {
    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries - 1) {
          const delay = this.retryDelay * Math.pow(2, attempt);
          loggerService.warn(`Operation failed, retrying in ${delay}ms`, {
            attempt: attempt + 1,
            maxRetries,
            error: error.message
          });
          
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }
}

// Singleton instance
const productIndexingService = new ProductIndexingService();

module.exports = {
  ProductIndexingService,
  productIndexingService
};
