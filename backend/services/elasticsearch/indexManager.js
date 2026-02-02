/**
 * Elasticsearch Index Manager Service
 * 
 * This module provides comprehensive index management for the Smart Tech B2C e-commerce platform,
 * including index creation, deletion, updates, existence checking, and statistics retrieval.
 */

const { loggerService } = require('../logger');
const { getMapping, getAllMappings } = require('./mappings');
const { getSettingsWithAnalysis, getAllSettingsWithAnalysis } = require('./settings');
const { getILMPolicyName, ILMService } = require('./ilm');

/**
 * Index names configuration
 */
const INDEX_NAMES = {
  products: 'smarttech-products',
  categories: 'smarttech-categories',
  brands: 'smarttech-brands',
  productsAlias: 'smarttech-products-alias',
  categoriesAlias: 'smarttech-categories-alias',
  brandsAlias: 'smarttech-brands-alias'
};

/**
 * Get index name for a specific type
 * @param {string} indexType - The type of index
 * @returns {string} The index name
 */
function getIndexName(indexType) {
  const indexNames = {
    product: INDEX_NAMES.products,
    category: INDEX_NAMES.categories,
    brand: INDEX_NAMES.brands
  };

  const indexName = indexNames[indexType];
  
  if (!indexName) {
    loggerService.error(`Unknown index type requested: ${indexType}`);
    throw new Error(`Unknown index type: ${indexType}`);
  }

  return indexName;
}

/**
 * Get alias name for a specific type
 * @param {string} indexType - The type of index
 * @returns {string} The alias name
 */
function getAliasName(indexType) {
  const aliasNames = {
    product: INDEX_NAMES.productsAlias,
    category: INDEX_NAMES.categoriesAlias,
    brand: INDEX_NAMES.brandsAlias
  };

  const aliasName = aliasNames[indexType];
  
  if (!aliasName) {
    loggerService.error(`Unknown index type requested: ${indexType}`);
    throw new Error(`Unknown index type: ${indexType}`);
  }

  return aliasName;
}

/**
 * Index Manager Service class
 */
class IndexManagerService {
  constructor(elasticsearchClient) {
    this.client = elasticsearchClient;
    this.ilmService = new ILMService(elasticsearchClient);
  }

  /**
   * Initialize product index
   * Creates index with mappings, settings, and ILM policy
   * @returns {Promise<Object>} Result of the operation
   */
  async initializeProductIndex() {
    try {
      const indexName = getIndexName('product');
      const aliasName = getAliasName('product');
      
      loggerService.info('Initializing product index', {
        indexName,
        aliasName
      });

      // Check if index already exists
      const existsResult = await this.checkIndexExists(indexName);
      
      if (existsResult.success && existsResult.exists) {
        loggerService.info('Product index already exists', { indexName });
        return {
          success: true,
          message: 'Product index already exists',
          indexName,
          exists: true
        };
      }

      // Get mapping and settings
      const mapping = getMapping('product');
      const settings = getSettingsWithAnalysis('product');

      // Create index
      const createResult = await this.createIndex(indexName, mapping, settings);
      
      if (!createResult.success) {
        return createResult;
      }

      // Create ILM policy
      const ilmResult = await this.ilmService.createPolicy('product');
      
      if (!ilmResult.success) {
        loggerService.warn('Failed to create ILM policy for product index', {
          error: ilmResult.error
        });
      }

      // Create alias
      const aliasResult = await this.createAlias(indexName, aliasName);
      
      if (!aliasResult.success) {
        loggerService.warn('Failed to create alias for product index', {
          error: aliasResult.error
        });
      }

      loggerService.info('Product index initialized successfully', {
        indexName,
        aliasName
      });

      return {
        success: true,
        message: 'Product index initialized successfully',
        indexName,
        aliasName,
        ilmPolicy: ilmResult.policyName
      };

    } catch (error) {
      loggerService.error('Failed to initialize product index', {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Initialize all indices
   * Creates product, category, and brand indices
   * @returns {Promise<Object>} Result of the operation
   */
  async initializeAllIndices() {
    try {
      loggerService.info('Initializing all indices');

      const results = {
        product: await this.initializeProductIndex(),
        category: await this.initializeCategoryIndex(),
        brand: await this.initializeBrandIndex()
      };

      const allSuccessful = Object.values(results).every(r => r.success);

      if (allSuccessful) {
        loggerService.info('All indices initialized successfully');
      } else {
        loggerService.warn('Some indices failed to initialize', results);
      }

      return {
        success: allSuccessful,
        results
      };

    } catch (error) {
      loggerService.error('Failed to initialize all indices', {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Initialize category index
   * @returns {Promise<Object>} Result of the operation
   */
  async initializeCategoryIndex() {
    try {
      const indexName = getIndexName('category');
      const aliasName = getAliasName('category');
      
      loggerService.info('Initializing category index', {
        indexName,
        aliasName
      });

      // Check if index already exists
      const existsResult = await this.checkIndexExists(indexName);
      
      if (existsResult.success && existsResult.exists) {
        loggerService.info('Category index already exists', { indexName });
        return {
          success: true,
          message: 'Category index already exists',
          indexName,
          exists: true
        };
      }

      // Get mapping and settings
      const mapping = getMapping('category');
      const settings = getSettingsWithAnalysis('category');

      // Create index
      const createResult = await this.createIndex(indexName, mapping, settings);
      
      if (!createResult.success) {
        return createResult;
      }

      // Create ILM policy
      const ilmResult = await this.ilmService.createPolicy('category');
      
      if (!ilmResult.success) {
        loggerService.warn('Failed to create ILM policy for category index', {
          error: ilmResult.error
        });
      }

      // Create alias
      const aliasResult = await this.createAlias(indexName, aliasName);
      
      if (!aliasResult.success) {
        loggerService.warn('Failed to create alias for category index', {
          error: aliasResult.error
        });
      }

      loggerService.info('Category index initialized successfully', {
        indexName,
        aliasName
      });

      return {
        success: true,
        message: 'Category index initialized successfully',
        indexName,
        aliasName,
        ilmPolicy: ilmResult.policyName
      };

    } catch (error) {
      loggerService.error('Failed to initialize category index', {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Initialize brand index
   * @returns {Promise<Object>} Result of the operation
   */
  async initializeBrandIndex() {
    try {
      const indexName = getIndexName('brand');
      const aliasName = getAliasName('brand');
      
      loggerService.info('Initializing brand index', {
        indexName,
        aliasName
      });

      // Check if index already exists
      const existsResult = await this.checkIndexExists(indexName);
      
      if (existsResult.success && existsResult.exists) {
        loggerService.info('Brand index already exists', { indexName });
        return {
          success: true,
          message: 'Brand index already exists',
          indexName,
          exists: true
        };
      }

      // Get mapping and settings
      const mapping = getMapping('brand');
      const settings = getSettingsWithAnalysis('brand');

      // Create index
      const createResult = await this.createIndex(indexName, mapping, settings);
      
      if (!createResult.success) {
        return createResult;
      }

      // Create ILM policy
      const ilmResult = await this.ilmService.createPolicy('brand');
      
      if (!ilmResult.success) {
        loggerService.warn('Failed to create ILM policy for brand index', {
          error: ilmResult.error
        });
      }

      // Create alias
      const aliasResult = await this.createAlias(indexName, aliasName);
      
      if (!aliasResult.success) {
        loggerService.warn('Failed to create alias for brand index', {
          error: aliasResult.error
        });
      }

      loggerService.info('Brand index initialized successfully', {
        indexName,
        aliasName
      });

      return {
        success: true,
        message: 'Brand index initialized successfully',
        indexName,
        aliasName,
        ilmPolicy: ilmResult.policyName
      };

    } catch (error) {
      loggerService.error('Failed to initialize brand index', {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create index with mappings and settings
   * @param {string} indexName - The index name
   * @param {Object} mapping - The index mapping
   * @param {Object} settings - The index settings
   * @returns {Promise<Object>} Result of the operation
   */
  async createIndex(indexName, mapping, settings) {
    try {
      loggerService.info(`Creating index: ${indexName}`);

      const indexBody = {
        ...settings,
        ...mapping
      };

      const result = await this.client.indices.create({
        index: indexName,
        body: indexBody
      });

      loggerService.info(`Index created successfully: ${indexName}`, {
        acknowledged: result.acknowledged,
        shardsAcknowledged: result.shards_acknowledged
      });

      return {
        success: true,
        indexName,
        acknowledged: result.acknowledged,
        shardsAcknowledged: result.shards_acknowledged
      };

    } catch (error) {
      loggerService.error(`Failed to create index: ${indexName}`, {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message,
        indexName
      };
    }
  }

  /**
   * Delete index
   * @param {string} indexName - The index name
   * @returns {Promise<Object>} Result of the operation
   */
  async deleteIndex(indexName) {
    try {
      loggerService.info(`Deleting index: ${indexName}`);

      const result = await this.client.indices.delete({
        index: indexName
      });

      loggerService.info(`Index deleted successfully: ${indexName}`, {
        acknowledged: result.acknowledged
      });

      return {
        success: true,
        indexName,
        acknowledged: result.acknowledged
      };

    } catch (error) {
      loggerService.error(`Failed to delete index: ${indexName}`, {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message,
        indexName
      };
    }
  }

  /**
   * Check if index exists
   * @param {string} indexName - The index name
   * @returns {Promise<Object>} Result of the operation
   */
  async checkIndexExists(indexName) {
    try {
      const exists = await this.client.indices.exists({
        index: indexName
      });

      loggerService.debug(`Index existence check: ${indexName}`, {
        exists
      });

      return {
        success: true,
        indexName,
        exists: Boolean(exists)
      };

    } catch (error) {
      loggerService.error(`Failed to check index existence: ${indexName}`, {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message,
        indexName,
        exists: false
      };
    }
  }

  /**
   * Get index statistics
   * @param {string} indexName - The index name
   * @returns {Promise<Object>} Result of the operation
   */
  async getIndexStats(indexName) {
    try {
      loggerService.info(`Getting index statistics: ${indexName}`);

      const result = await this.client.indices.stats({
        index: indexName
      });

      const stats = result.indices[indexName];

      loggerService.info(`Index statistics retrieved: ${indexName}`);

      return {
        success: true,
        indexName,
        stats: {
          primaries: stats.primaries,
          total: stats.total,
          docs: stats.primaries.docs,
          store: stats.primaries.store,
          indexing: stats.primaries.indexing,
          search: stats.primaries.search,
          merges: stats.primaries.merges,
          refresh: stats.primaries.refresh,
          flush: stats.primaries.flush,
          warms: stats.primaries.warms,
          queryCache: stats.primaries.query_cache,
          fielddata: stats.primaries.fielddata,
          completion: stats.primaries.completion,
          segments: stats.primaries.segments,
          translog: stats.primaries.translog,
          requestCache: stats.primaries.request_cache,
          recovery: stats.primaries.recovery
        }
      };

    } catch (error) {
      loggerService.error(`Failed to get index statistics: ${indexName}`, {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message,
        indexName
      };
    }
  }

  /**
   * Get index settings
   * @param {string} indexName - The index name
   * @returns {Promise<Object>} Result of the operation
   */
  async getIndexSettings(indexName) {
    try {
      loggerService.info(`Getting index settings: ${indexName}`);

      const result = await this.client.indices.getSettings({
        index: indexName
      });

      loggerService.info(`Index settings retrieved: ${indexName}`);

      return {
        success: true,
        indexName,
        settings: result[indexName].settings
      };

    } catch (error) {
      loggerService.error(`Failed to get index settings: ${indexName}`, {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message,
        indexName
      };
    }
  }

  /**
   * Get index mapping
   * @param {string} indexName - The index name
   * @returns {Promise<Object>} Result of the operation
   */
  async getIndexMapping(indexName) {
    try {
      loggerService.info(`Getting index mapping: ${indexName}`);

      const result = await this.client.indices.getMapping({
        index: indexName
      });

      loggerService.info(`Index mapping retrieved: ${indexName}`);

      return {
        success: true,
        indexName,
        mapping: result[indexName].mappings
      };

    } catch (error) {
      loggerService.error(`Failed to get index mapping: ${indexName}`, {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message,
        indexName
      };
    }
  }

  /**
   * Update index settings
   * @param {string} indexName - The index name
   * @param {Object} settings - Settings to update
   * @returns {Promise<Object>} Result of the operation
   */
  async updateIndexSettings(indexName, settings) {
    try {
      loggerService.info(`Updating index settings: ${indexName}`, {
        settings
      });

      const result = await this.client.indices.putSettings({
        index: indexName,
        body: settings
      });

      loggerService.info(`Index settings updated successfully: ${indexName}`, {
        acknowledged: result.acknowledged
      });

      return {
        success: true,
        indexName,
        acknowledged: result.acknowledged
      };

    } catch (error) {
      loggerService.error(`Failed to update index settings: ${indexName}`, {
        error: error.message,
        stack: error.stack,
        settings
      });

      return {
        success: false,
        error: error.message,
        indexName
      };
    }
  }

  /**
   * Create alias for index
   * @param {string} indexName - The index name
   * @param {string} aliasName - The alias name
   * @returns {Promise<Object>} Result of the operation
   */
  async createAlias(indexName, aliasName) {
    try {
      loggerService.info(`Creating alias: ${aliasName} -> ${indexName}`);

      const result = await this.client.indices.putAlias({
        index: indexName,
        name: aliasName
      });

      loggerService.info(`Alias created successfully: ${aliasName}`, {
        acknowledged: result.acknowledged
      });

      return {
        success: true,
        indexName,
        aliasName,
        acknowledged: result.acknowledged
      };

    } catch (error) {
      loggerService.error(`Failed to create alias: ${aliasName}`, {
        error: error.message,
        stack: error.stack,
        indexName
      });

      return {
        success: false,
        error: error.message,
        indexName,
        aliasName
      };
    }
  }

  /**
   * Delete alias
   * @param {string} indexName - The index name
   * @param {string} aliasName - The alias name
   * @returns {Promise<Object>} Result of the operation
   */
  async deleteAlias(indexName, aliasName) {
    try {
      loggerService.info(`Deleting alias: ${aliasName} -> ${indexName}`);

      const result = await this.client.indices.deleteAlias({
        index: indexName,
        name: aliasName
      });

      loggerService.info(`Alias deleted successfully: ${aliasName}`, {
        acknowledged: result.acknowledged
      });

      return {
        success: true,
        indexName,
        aliasName,
        acknowledged: result.acknowledged
      };

    } catch (error) {
      loggerService.error(`Failed to delete alias: ${aliasName}`, {
        error: error.message,
        stack: error.stack,
        indexName
      });

      return {
        success: false,
        error: error.message,
        indexName,
        aliasName
      };
    }
  }

  /**
   * Get all indices
   * @returns {Promise<Object>} Result of the operation
   */
  async getAllIndices() {
    try {
      loggerService.info('Getting all indices');

      const result = await this.client.indices.get({
        index: '*'
      });

      const indices = Object.keys(result);

      loggerService.info(`Retrieved ${indices.length} indices`);

      return {
        success: true,
        indices,
        count: indices.length
      };

    } catch (error) {
      loggerService.error('Failed to get all indices', {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Reindex data from source index to destination index
   * @param {string} sourceIndex - Source index name
   * @param {string} destIndex - Destination index name
   * @returns {Promise<Object>} Result of the operation
   */
  async reindex(sourceIndex, destIndex) {
    try {
      loggerService.info(`Reindexing from ${sourceIndex} to ${destIndex}`);

      const result = await this.client.reindex({
        body: {
          source: {
            index: sourceIndex
          },
          dest: {
            index: destIndex
          }
        },
        waitForCompletion: true
      });

      loggerService.info(`Reindex completed successfully`, {
        sourceIndex,
        destIndex,
        total: result.total,
        created: result.created,
        updated: result.updated,
        deleted: result.deleted,
        batches: result.batches
      });

      return {
        success: true,
        sourceIndex,
        destIndex,
        total: result.total,
        created: result.created,
        updated: result.updated,
        deleted: result.deleted,
        batches: result.batches
      };

    } catch (error) {
      loggerService.error(`Failed to reindex from ${sourceIndex} to ${destIndex}`, {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message,
        sourceIndex,
        destIndex
      };
    }
  }

  /**
   * Refresh index
   * @param {string} indexName - The index name
   * @returns {Promise<Object>} Result of the operation
   */
  async refreshIndex(indexName) {
    try {
      loggerService.info(`Refreshing index: ${indexName}`);

      const result = await this.client.indices.refresh({
        index: indexName
      });

      loggerService.info(`Index refreshed successfully: ${indexName}`, {
        shardsAcknowledged: result.shards_acknowledged
      });

      return {
        success: true,
        indexName,
        shardsAcknowledged: result.shards_acknowledged
      };

    } catch (error) {
      loggerService.error(`Failed to refresh index: ${indexName}`, {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message,
        indexName
      };
    }
  }

  /**
   * Force merge index
   * @param {string} indexName - The index name
   * @param {number} maxNumSegments - Maximum number of segments
   * @returns {Promise<Object>} Result of the operation
   */
  async forceMergeIndex(indexName, maxNumSegments = 1) {
    try {
      loggerService.info(`Force merging index: ${indexName}`, {
        maxNumSegments
      });

      const result = await this.client.indices.forcemerge({
        index: indexName,
        max_num_segments: maxNumSegments
      });

      loggerService.info(`Index force merged successfully: ${indexName}`, {
        shardsAcknowledged: result.shards_acknowledged
      });

      return {
        success: true,
        indexName,
        maxNumSegments,
        shardsAcknowledged: result.shards_acknowledged
      };

    } catch (error) {
      loggerService.error(`Failed to force merge index: ${indexName}`, {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message,
        indexName
      };
    }
  }

  /**
   * Clone index
   * @param {string} sourceIndex - Source index name
   * @param {string} targetIndex - Target index name
   * @returns {Promise<Object>} Result of the operation
   */
  async cloneIndex(sourceIndex, targetIndex) {
    try {
      loggerService.info(`Cloning index from ${sourceIndex} to ${targetIndex}`);

      // First, put source index in read-only mode
      await this.client.indices.putSettings({
        index: sourceIndex,
        body: {
          'index.blocks.write': true
        }
      });

      // Clone the index
      const result = await this.client.indices.clone({
        index: sourceIndex,
        target: targetIndex
      });

      // Remove read-only mode from source index
      await this.client.indices.putSettings({
        index: sourceIndex,
        body: {
          'index.blocks.write': null
        }
      });

      loggerService.info(`Index cloned successfully: ${targetIndex}`, {
        sourceIndex,
        acknowledged: result.acknowledged
      });

      return {
        success: true,
        sourceIndex,
        targetIndex,
        acknowledged: result.acknowledged
      };

    } catch (error) {
      loggerService.error(`Failed to clone index from ${sourceIndex} to ${targetIndex}`, {
        error: error.message,
        stack: error.stack
      });

      // Try to remove read-only mode even if clone failed
      try {
        await this.client.indices.putSettings({
          index: sourceIndex,
          body: {
            'index.blocks.write': null
          }
        });
      } catch (e) {
        loggerService.error('Failed to remove read-only mode from source index', {
          error: e.message
        });
      }

      return {
        success: false,
        error: error.message,
        sourceIndex,
        targetIndex
      };
    }
  }
}

module.exports = {
  // Constants
  INDEX_NAMES,
  
  // Functions
  getIndexName,
  getAliasName,
  
  // Service class
  IndexManagerService
};
