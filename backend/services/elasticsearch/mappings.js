/**
 * Elasticsearch Index Mappings
 * 
 * This module defines comprehensive index mappings for the Smart Tech B2C e-commerce platform,
 * optimized for the Bangladesh market with support for English and Bengali languages.
 */

const { loggerService } = require('../logger');

/**
 * Product index mapping
 * Defines the structure and field types for the products index
 */
const productIndexMapping = {
  mappings: {
    properties: {
      // Primary identifier - keyword type for exact matching
      id: {
        type: 'keyword'
      },
      
      // Stock Keeping Unit - keyword type for exact matching
      sku: {
        type: 'keyword'
      },
      
      // Product name with multi-field mappings for different search scenarios
      name: {
        type: 'text',
        fields: {
          // Keyword field for exact matches and aggregations
          keyword: {
            type: 'keyword',
            ignore_above: 256
          },
          // Autocomplete field with edge n-gram analysis
          autocomplete: {
            type: 'text',
            analyzer: 'autocomplete'
          },
          // English language specific analysis
          english: {
            type: 'text',
            analyzer: 'english'
          },
          // Bengali language specific analysis
          bengali: {
            type: 'text',
            analyzer: 'bengali'
          }
        }
      },
      
      // English product name with keyword subfield
      nameEn: {
        type: 'text',
        analyzer: 'english',
        fields: {
          keyword: {
            type: 'keyword',
            ignore_above: 256
          }
        }
      },
      
      // Bengali product name with keyword subfield
      nameBn: {
        type: 'text',
        analyzer: 'bengali',
        fields: {
          keyword: {
            type: 'keyword',
            ignore_above: 256
          }
        }
      },
      
      // Full product description with language-specific analysis
      description: {
        type: 'text',
        fields: {
          // English language analysis
          english: {
            type: 'text',
            analyzer: 'english'
          },
          // Bengali language analysis
          bengali: {
            type: 'text',
            analyzer: 'bengali'
          }
        }
      },
      
      // Short product description for quick previews
      shortDescription: {
        type: 'text'
      },
      
      // Product price - float type for range queries and sorting
      price: {
        type: 'float'
      },
      
      // Stock quantity - integer type for availability checks
      stockQuantity: {
        type: 'integer'
      },
      
      // Product status - keyword type for exact matching and aggregations
      status: {
        type: 'keyword'
      },
      
      // Category object with nested properties
      category: {
        properties: {
          id: {
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
          }
        }
      },
      
      // Brand object with nested properties
      brand: {
        properties: {
          id: {
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
          }
        }
      },
      
      // Specifications - disabled for performance, stored as raw data
      specifications: {
        type: 'object',
        enabled: false
      },
      
      // Product images - keyword type for exact matching
      images: {
        type: 'keyword'
      },
      
      // Creation timestamp - date type for time-based queries
      createdAt: {
        type: 'date',
        format: 'strict_date_optional_time||epoch_millis'
      },
      
      // Last update timestamp - date type for time-based queries
      updatedAt: {
        type: 'date',
        format: 'strict_date_optional_time||epoch_millis'
      }
    }
  }
};

/**
 * Category index mapping
 * Defines the structure for category documents
 */
const categoryIndexMapping = {
  mappings: {
    properties: {
      id: {
        type: 'keyword'
      },
      name: {
        type: 'text',
        fields: {
          keyword: {
            type: 'keyword',
            ignore_above: 256
          },
          autocomplete: {
            type: 'text',
            analyzer: 'autocomplete'
          },
          english: {
            type: 'text',
            analyzer: 'english'
          },
          bengali: {
            type: 'text',
            analyzer: 'bengali'
          }
        }
      },
      nameEn: {
        type: 'text',
        analyzer: 'english',
        fields: {
          keyword: {
            type: 'keyword',
            ignore_above: 256
          }
        }
      },
      nameBn: {
        type: 'text',
        analyzer: 'bengali',
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
      description: {
        type: 'text',
        fields: {
          english: {
            type: 'text',
            analyzer: 'english'
          },
          bengali: {
            type: 'text',
            analyzer: 'bengali'
          }
        }
      },
      parentId: {
        type: 'keyword'
      },
      level: {
        type: 'integer'
      },
      sortOrder: {
        type: 'integer'
      },
      imageUrl: {
        type: 'keyword'
      },
      isActive: {
        type: 'boolean'
      },
      createdAt: {
        type: 'date',
        format: 'strict_date_optional_time||epoch_millis'
      },
      updatedAt: {
        type: 'date',
        format: 'strict_date_optional_time||epoch_millis'
      }
    }
  }
};

/**
 * Brand index mapping
 * Defines the structure for brand documents
 */
const brandIndexMapping = {
  mappings: {
    properties: {
      id: {
        type: 'keyword'
      },
      name: {
        type: 'text',
        fields: {
          keyword: {
            type: 'keyword',
            ignore_above: 256
          },
          autocomplete: {
            type: 'text',
            analyzer: 'autocomplete'
          },
          english: {
            type: 'text',
            analyzer: 'english'
          },
          bengali: {
            type: 'text',
            analyzer: 'bengali'
          }
        }
      },
      nameEn: {
        type: 'text',
        analyzer: 'english',
        fields: {
          keyword: {
            type: 'keyword',
            ignore_above: 256
          }
        }
      },
      nameBn: {
        type: 'text',
        analyzer: 'bengali',
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
      description: {
        type: 'text',
        fields: {
          english: {
            type: 'text',
            analyzer: 'english'
          },
          bengali: {
            type: 'text',
            analyzer: 'bengali'
          }
        }
      },
      logoUrl: {
        type: 'keyword'
      },
      websiteUrl: {
        type: 'keyword'
      },
      isActive: {
        type: 'boolean'
      },
      sortOrder: {
        type: 'integer'
      },
      createdAt: {
        type: 'date',
        format: 'strict_date_optional_time||epoch_millis'
      },
      updatedAt: {
        type: 'date',
        format: 'strict_date_optional_time||epoch_millis'
      }
    }
  }
};

/**
 * Get mapping for a specific index type
 * @param {string} indexType - The type of index (product, category, brand)
 * @returns {Object} The mapping configuration
 */
function getMapping(indexType) {
  switch (indexType) {
    case 'product':
      return productIndexMapping;
    case 'category':
      return categoryIndexMapping;
    case 'brand':
      return brandIndexMapping;
    default:
      loggerService.error(`Unknown index type requested: ${indexType}`);
      throw new Error(`Unknown index type: ${indexType}`);
  }
}

/**
 * Get all available mappings
 * @returns {Object} All index mappings
 */
function getAllMappings() {
  return {
    product: productIndexMapping,
    category: categoryIndexMapping,
    brand: brandIndexMapping
  };
}

/**
 * Validate mapping structure
 * @param {Object} mapping - The mapping to validate
 * @returns {boolean} True if valid, false otherwise
 */
function validateMapping(mapping) {
  if (!mapping || typeof mapping !== 'object') {
    loggerService.error('Mapping is not an object');
    return false;
  }

  if (!mapping.mappings || !mapping.mappings.properties) {
    loggerService.error('Mapping does not have required structure');
    return false;
  }

  return true;
}

module.exports = {
  productIndexMapping,
  categoryIndexMapping,
  brandIndexMapping,
  getMapping,
  getAllMappings,
  validateMapping
};
