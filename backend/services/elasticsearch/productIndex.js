/**
 * Product Index Management for Elasticsearch
 * 
 * This module handles the creation, management, and deletion of the product index
 * in Elasticsearch with appropriate mappings for efficient searching.
 */

const { elasticsearchConfig } = require('../../config/elasticsearch');
const { loggerService } = require('../logger');

class ProductIndex {
  constructor() {
    this.indexName = elasticsearchConfig.buildIndexName('products');
    this.client = elasticsearchConfig.getClient();
  }

  /**
   * Get the product index name
   * @returns {string} Index name
   */
  getIndexName() {
    return this.indexName;
  }

  /**
   * Define product index mapping
   * @returns {Object} Index mapping
   */
  getMapping() {
    return {
      mappings: {
        properties: {
          // Basic fields
          id: {
            type: 'keyword'
          },
          sku: {
            type: 'keyword'
          },
          name: {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256
              }
            }
          },
          nameEn: {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256
              }
            }
          },
          nameBn: {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256
              }
            }
          },
          slug: {
            type: 'keyword'
          },
          shortDescription: {
            type: 'text'
          },
          description: {
            type: 'text'
          },
          descriptionEn: {
            type: 'text'
          },
          descriptionBn: {
            type: 'text'
          },

          // Pricing fields
          basePrice: {
            type: 'double'
          },
          discountPrice: {
            type: 'double'
          },
          specialPrice: {
            type: 'double'
          },
          salePrice: {
            type: 'double'
          },
          costPrice: {
            type: 'double'
          },
          taxRate: {
            type: 'double'
          },

          // Category fields
          categoryId: {
            type: 'keyword'
          },
          categoryName: {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256
              }
            }
          },
          categoryNameEn: {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256
              }
            }
          },
          categoryNameBn: {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256
              }
            }
          },
          categoryPath: {
            type: 'keyword'
          },
          categories: {
            type: 'nested',
            properties: {
              id: { type: 'keyword' },
              name: { type: 'text' },
              nameEn: { type: 'text' },
              nameBn: { type: 'text' },
              slug: { type: 'keyword' },
              isPrimary: { type: 'boolean' }
            }
          },

          // Brand fields
          brandId: {
            type: 'keyword'
          },
          brandName: {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256
              }
            }
          },
          brandNameEn: {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256
              }
            }
          },
          brandNameBn: {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256
              }
            }
          },
          brandSlug: {
            type: 'keyword'
          },

          // Status fields
          status: {
            type: 'keyword'
          },
          visibility: {
            type: 'keyword'
          },
          isFeatured: {
            type: 'boolean'
          },
          isNewArrival: {
            type: 'boolean'
          },
          isBestSeller: {
            type: 'boolean'
          },

          // Metrics fields
          rating: {
            type: 'double'
          },
          reviewCount: {
            type: 'integer'
          },
          popularity: {
            type: 'integer'
          },
          soldCount: {
            type: 'integer'
          },

          // Stock fields
          stockQuantity: {
            type: 'integer'
          },
          lowStockThreshold: {
            type: 'integer'
          },
          inStock: {
            type: 'boolean'
          },

          // SEO fields
          metaTitle: {
            type: 'text'
          },
          metaDescription: {
            type: 'text'
          },
          metaKeywords: {
            type: 'text'
          },

          // Image fields
          thumbnail: {
            type: 'keyword'
          },
          images: {
            type: 'keyword'
          },

          // Warranty fields
          warrantyPeriod: {
            type: 'integer'
          },
          warrantyType: {
            type: 'keyword'
          },

          // Timestamps
          createdAt: {
            type: 'date'
          },
          updatedAt: {
            type: 'date'
          },
          publishedAt: {
            type: 'date'
          }
        }
      },
      settings: {
        analysis: {
          analyzer: {
            // Custom analyzer for Bangla text
            bangla_analyzer: {
              type: 'custom',
              tokenizer: 'standard',
              filter: ['lowercase', 'asciifolding']
            },
            // Custom analyzer for English text
            english_analyzer: {
              type: 'custom',
              tokenizer: 'standard',
              filter: ['lowercase', 'english_stop', 'english_stemmer']
            }
          },
          filter: {
            english_stop: {
              type: 'stop',
              stopwords: '_english_'
            },
            english_stemmer: {
              type: 'stemmer',
              language: 'english'
            }
          }
        },
        number_of_shards: 1,
        number_of_replicas: 1
      }
    };
  }

  /**
   * Initialize product index
   * Creates the index with appropriate mappings if it doesn't exist
   * @returns {Promise<Object>} Index creation result
   */
  async initializeIndex() {
    try {
      const indexExists = await this.client.indices.exists({
        index: this.indexName
      });

      if (indexExists) {
        loggerService.info('Product index already exists', {
          index: this.indexName
        });
        return {
          success: true,
          message: 'Index already exists',
          index: this.indexName
        };
      }

      // Create index with mapping
      const response = await this.client.indices.create({
        index: this.indexName,
        body: this.getMapping()
      });

      loggerService.info('Product index created successfully', {
        index: this.indexName,
        acknowledged: response.acknowledged
      });

      return {
        success: true,
        message: 'Index created successfully',
        index: this.indexName,
        acknowledged: response.acknowledged
      };

    } catch (error) {
      loggerService.error('Failed to initialize product index', {
        error: error.message,
        index: this.indexName
      });

      return {
        success: false,
        error: error.message,
        index: this.indexName
      };
    }
  }

  /**
   * Delete product index
   * Use with caution - this will delete all indexed products
   * @returns {Promise<Object>} Index deletion result
   */
  async deleteIndex() {
    try {
      const indexExists = await this.client.indices.exists({
        index: this.indexName
      });

      if (!indexExists) {
        loggerService.warn('Product index does not exist, nothing to delete', {
          index: this.indexName
        });
        return {
          success: true,
          message: 'Index does not exist',
          index: this.indexName
        };
      }

      const response = await this.client.indices.delete({
        index: this.indexName
      });

      loggerService.info('Product index deleted successfully', {
        index: this.indexName,
        acknowledged: response.acknowledged
      });

      return {
        success: true,
        message: 'Index deleted successfully',
        index: this.indexName,
        acknowledged: response.acknowledged
      };

    } catch (error) {
      loggerService.error('Failed to delete product index', {
        error: error.message,
        index: this.indexName
      });

      return {
        success: false,
        error: error.message,
        index: this.indexName
      };
    }
  }

  /**
   * Rebuild product index
   * Deletes and recreates the index with fresh mappings
   * @returns {Promise<Object>} Index rebuild result
   */
  async rebuildIndex() {
    try {
      loggerService.info('Rebuilding product index', {
        index: this.indexName
      });

      // Delete existing index
      const deleteResult = await this.deleteIndex();
      if (!deleteResult.success) {
        throw new Error(`Failed to delete index: ${deleteResult.error}`);
      }

      // Create new index
      const createResult = await this.initializeIndex();
      if (!createResult.success) {
        throw new Error(`Failed to create index: ${createResult.error}`);
      }

      loggerService.info('Product index rebuilt successfully', {
        index: this.indexName
      });

      return {
        success: true,
        message: 'Index rebuilt successfully',
        index: this.indexName
      };

    } catch (error) {
      loggerService.error('Failed to rebuild product index', {
        error: error.message,
        index: this.indexName
      });

      return {
        success: false,
        error: error.message,
        index: this.indexName
      };
    }
  }

  /**
   * Get index statistics
   * @returns {Promise<Object>} Index statistics
   */
  async getIndexStats() {
    try {
      const stats = await this.client.indices.stats({
        index: this.indexName
      });

      return {
        success: true,
        index: this.indexName,
        totalDocs: stats._all.total.docs.count,
        totalStoreSize: stats._all.total.store.size_in_bytes,
        primaryDocs: stats._all.primaries.docs.count,
        primaryStoreSize: stats._all.primaries.store.size_in_bytes
      };

    } catch (error) {
      loggerService.error('Failed to get index stats', {
        error: error.message,
        index: this.indexName
      });

      return {
        success: false,
        error: error.message,
        index: this.indexName
      };
    }
  }

  /**
   * Get index mapping
   * @returns {Promise<Object>} Index mapping
   */
  async getMapping() {
    try {
      const mapping = await this.client.indices.getMapping({
        index: this.indexName
      });

      return {
        success: true,
        index: this.indexName,
        mapping: mapping[this.indexName].mappings
      };

    } catch (error) {
      loggerService.error('Failed to get index mapping', {
        error: error.message,
        index: this.indexName
      });

      return {
        success: false,
        error: error.message,
        index: this.indexName
      };
    }
  }

  /**
   * Update index mapping
   * @param {Object} newMapping - New mapping to apply
   * @returns {Promise<Object>} Mapping update result
   */
  async updateMapping(newMapping) {
    try {
      const response = await this.client.indices.putMapping({
        index: this.indexName,
        body: newMapping
      });

      loggerService.info('Index mapping updated successfully', {
        index: this.indexName,
        acknowledged: response.acknowledged
      });

      return {
        success: true,
        message: 'Mapping updated successfully',
        index: this.indexName,
        acknowledged: response.acknowledged
      };

    } catch (error) {
      loggerService.error('Failed to update index mapping', {
        error: error.message,
        index: this.indexName
      });

      return {
        success: false,
        error: error.message,
        index: this.indexName
      };
    }
  }

  /**
   * Check if index exists
   * @returns {Promise<boolean>} Index existence status
   */
  async exists() {
    try {
      const exists = await this.client.indices.exists({
        index: this.indexName
      });
      return exists;
    } catch (error) {
      loggerService.error('Failed to check index existence', {
        error: error.message,
        index: this.indexName
      });
      return false;
    }
  }

  /**
   * Refresh index
   * Makes all operations performed on the index available to search
   * @returns {Promise<Object>} Refresh result
   */
  async refresh() {
    try {
      const response = await this.client.indices.refresh({
        index: this.indexName
      });

      return {
        success: true,
        message: 'Index refreshed successfully',
        index: this.indexName
      };

    } catch (error) {
      loggerService.error('Failed to refresh index', {
        error: error.message,
        index: this.indexName
      });

      return {
        success: false,
        error: error.message,
        index: this.indexName
      };
    }
  }
}

// Singleton instance
const productIndex = new ProductIndex();

module.exports = {
  ProductIndex,
  productIndex
};
