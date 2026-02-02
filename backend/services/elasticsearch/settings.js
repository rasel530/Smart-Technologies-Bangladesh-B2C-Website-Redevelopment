/**
 * Elasticsearch Index Settings
 * 
 * This module defines index settings for the Smart Tech B2C e-commerce platform,
 * optimized for performance and scalability in the Bangladesh market.
 */

const { loggerService } = require('../logger');
const { analysisConfiguration } = require('./analyzers');

/**
 * Base index settings
 * Common settings applicable to all indices
 */
const baseIndexSettings = {
  // Number of primary shards for horizontal scaling
  number_of_shards: 3,
  
  // Number of replica shards for high availability
  number_of_replicas: 1,
  
  // Refresh interval for balancing near real-time search and indexing performance
  // 1 second provides near real-time search while maintaining good indexing throughput
  refresh_interval: '1s',
  
  // Enable best compression for stored fields
  index: {
    codec: 'best_compression',
    
    // Query cache size
    queries: {
      cache: {
        enabled: true
      }
    },
    
    // Request cache for aggregations and search requests
    requests: {
      cache: {
        enable: true
      }
    },
    
    // Translog settings for durability
    translog: {
      durability: 'request',
      sync_interval: '5s'
    },
    
    // Slow log thresholds
    search: {
      slowlog: {
        threshold: {
          query: {
            warn: '10s',
            info: '5s',
            debug: '2s',
            trace: '500ms'
          },
          fetch: {
            warn: '1s',
            info: '500ms',
            debug: '200ms',
            trace: '50ms'
          }
        }
      }
    },
    
    // Indexing slow log thresholds
    indexing: {
      slowlog: {
        threshold: {
          index: {
            warn: '10s',
            info: '5s',
            debug: '2s',
            trace: '500ms'
          }
        }
      }
    },
    
    // Max result window for pagination
    max_result_window: 10000,
    
    // Max inner result window for inner hits
    max_inner_result_window: 100,
    
    // Max rescore window
    max_rescore_window: 10000,
    
    // Max docvalue fields search
    max_docvalue_fields_search: 200,
    
    // Max script fields
    max_script_fields: 32,
    
    // Max terms count
    max_terms_count: 65536,
    
    // Max regex length
    max_regex_length: 1000
  }
};

/**
 * Product index settings
 * Optimized for product search with high query volume
 */
const productIndexSettings = {
  ...baseIndexSettings,
  
  // Product-specific settings
  index: {
    ...baseIndexSettings.index,
    
    // More shards for product index due to higher query volume
    number_of_shards: 5,
    number_of_replicas: 1,
    
    // Faster refresh for near real-time product updates
    refresh_interval: '1s',
    
    // Enable compound file format for better performance
    compound_format: true,
    
    // Enable compound file for segments
    compound_on_flush: true
  }
};

/**
 * Category index settings
 * Optimized for category browsing and navigation
 */
const categoryIndexSettings = {
  ...baseIndexSettings,
  
  index: {
    ...baseIndexSettings.index,
    
    // Fewer shards for category index (lower volume)
    number_of_shards: 3,
    number_of_replicas: 1,
    
    // Slower refresh for categories (less frequent updates)
    refresh_interval: '5s'
  }
};

/**
 * Brand index settings
 * Optimized for brand filtering and browsing
 */
const brandIndexSettings = {
  ...baseIndexSettings,
  
  index: {
    ...baseIndexSettings.index,
    
    // Fewer shards for brand index (lower volume)
    number_of_shards: 3,
    number_of_replicas: 1,
    
    // Slower refresh for brands (less frequent updates)
    refresh_interval: '5s'
  }
};

/**
 * Complete index settings with analysis configuration
 * Combines settings with analyzer configurations
 */
const getIndexSettingsWithAnalysis = (baseSettings) => {
  return {
    ...baseSettings,
    ...analysisConfiguration
  };
};

/**
 * Get settings for a specific index type
 * @param {string} indexType - The type of index (product, category, brand)
 * @returns {Object} The index settings
 */
function getSettings(indexType) {
  switch (indexType) {
    case 'product':
      return productIndexSettings;
    case 'category':
      return categoryIndexSettings;
    case 'brand':
      return brandIndexSettings;
    default:
      loggerService.error(`Unknown index type requested: ${indexType}`);
      throw new Error(`Unknown index type: ${indexType}`);
  }
}

/**
 * Get settings with analysis configuration for a specific index type
 * @param {string} indexType - The type of index (product, category, brand)
 * @returns {Object} The index settings with analysis configuration
 */
function getSettingsWithAnalysis(indexType) {
  const settings = getSettings(indexType);
  return getIndexSettingsWithAnalysis(settings);
}

/**
 * Get all index settings
 * @returns {Object} All index settings
 */
function getAllSettings() {
  return {
    product: productIndexSettings,
    category: categoryIndexSettings,
    brand: brandIndexSettings
  };
}

/**
 * Get all index settings with analysis configuration
 * @returns {Object} All index settings with analysis configuration
 */
function getAllSettingsWithAnalysis() {
  return {
    product: getSettingsWithAnalysis('product'),
    category: getSettingsWithAnalysis('category'),
    brand: getSettingsWithAnalysis('brand')
  };
}

/**
 * Validate index settings
 * @param {Object} settings - The settings to validate
 * @returns {boolean} True if valid, false otherwise
 */
function validateSettings(settings) {
  if (!settings || typeof settings !== 'object') {
    loggerService.error('Settings is not an object');
    return false;
  }

  // Check for required numeric fields
  const numericFields = ['number_of_shards', 'number_of_replicas'];
  for (const field of numericFields) {
    if (settings[field] !== undefined && (typeof settings[field] !== 'number' || settings[field] < 0)) {
      loggerService.error(`Invalid value for ${field}: ${settings[field]}`);
      return false;
    }
  }

  // Check refresh_interval format
  if (settings.refresh_interval !== undefined) {
    const refreshIntervalRegex = /^\d+[smhd]?$/;
    if (!refreshIntervalRegex.test(settings.refresh_interval)) {
      loggerService.error(`Invalid refresh_interval format: ${settings.refresh_interval}`);
      return false;
    }
  }

  return true;
}

/**
 * Update index settings
 * @param {Object} currentSettings - Current settings
 * @param {Object} updates - Settings to update
 * @returns {Object} Updated settings
 */
function updateSettings(currentSettings, updates) {
  const updatedSettings = {
    ...currentSettings,
    ...updates
  };

  // Merge nested index settings
  if (currentSettings.index && updates.index) {
    updatedSettings.index = {
      ...currentSettings.index,
      ...updates.index
    };
  }

  if (!validateSettings(updatedSettings)) {
    loggerService.error('Invalid settings update');
    throw new Error('Invalid settings update');
  }

  return updatedSettings;
}

/**
 * Get settings description
 * @param {string} indexType - The type of index
 * @returns {Object} Settings description
 */
function getSettingsDescription(indexType) {
  const settings = getSettings(indexType);
  
  return {
    indexType,
    numberOfShards: settings.number_of_shards,
    numberOfReplicas: settings.number_of_replicas,
    refreshInterval: settings.refresh_interval,
    compression: settings.index.codec,
    queryCacheEnabled: settings.index.queries.cache.enabled,
    requestCacheEnabled: settings.index.requests.cache.enable,
    durability: settings.index.translog.durability,
    maxResultWindow: settings.index.max_result_window
  };
}

/**
 * Get all settings descriptions
 * @returns {Object} All settings descriptions
 */
function getAllSettingsDescriptions() {
  return {
    product: getSettingsDescription('product'),
    category: getSettingsDescription('category'),
    brand: getSettingsDescription('brand')
  };
}

/**
 * Performance tuning recommendations based on index type
 * @param {string} indexType - The type of index
 * @returns {Object} Performance tuning recommendations
 */
function getPerformanceRecommendations(indexType) {
  const recommendations = {
    product: {
      description: 'Product index has high query volume and frequent updates',
      recommendations: [
        'Use 5 primary shards for horizontal scaling',
        'Keep 1 replica for high availability',
        'Use 1s refresh interval for near real-time updates',
        'Enable query cache for frequent searches',
        'Monitor slow query logs for optimization'
      ],
      scaling: 'Add more shards if query performance degrades'
    },
    category: {
      description: 'Category index has moderate query volume and infrequent updates',
      recommendations: [
        'Use 3 primary shards (sufficient for most use cases)',
        'Keep 1 replica for high availability',
        'Use 5s refresh interval (categories update rarely)',
        'Enable query cache for category navigation',
        'Consider caching category trees in application layer'
      ],
      scaling: 'Increase replicas if read performance becomes bottleneck'
    },
    brand: {
      description: 'Brand index has moderate query volume and infrequent updates',
      recommendations: [
        'Use 3 primary shards (sufficient for most use cases)',
        'Keep 1 replica for high availability',
        'Use 5s refresh interval (brands update rarely)',
        'Enable query cache for brand filtering',
        'Consider caching brand list in application layer'
      ],
      scaling: 'Increase replicas if read performance becomes bottleneck'
    }
  };

  return recommendations[indexType] || {};
}

module.exports = {
  // Settings objects
  baseIndexSettings,
  productIndexSettings,
  categoryIndexSettings,
  brandIndexSettings,
  
  // Functions
  getSettings,
  getSettingsWithAnalysis,
  getAllSettings,
  getAllSettingsWithAnalysis,
  getIndexSettingsWithAnalysis,
  validateSettings,
  updateSettings,
  getSettingsDescription,
  getAllSettingsDescriptions,
  getPerformanceRecommendations
};
