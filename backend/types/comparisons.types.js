/**
 * @typedef {Object} SpecComparisonResult
 * @property {string} productId - Product ID
 * @property {string} productName - Product name
 * @property {Array<Specification>} specifications - Array of specifications
 * @property {number} score - Overall score for the product
 */

/**
 * @typedef {Object} Specification
 * @property {string} name - Normalized specification name
 * @property {string} value - Specification value
 * @property {string} originalName - Original specification name
 * @property {string} category - Specification category
 * @property {boolean} isDifferent - Whether this spec differs from other products
 * @property {boolean} isBetter - Whether this product has better value for this spec
 */

/**
 * @typedef {Object} PriceComparison
 * @property {string} productId - Product ID
 * @property {string} productName - Product name
 * @property {number} regularPrice - Regular price
 * @property {number|null} salePrice - Sale price
 * @property {boolean} isCheapest - Whether this is the cheapest product
 * @property {boolean} isMostExpensive - Whether this is the most expensive product
 * @property {number} priceDifference - Price difference from cheapest
 */

/**
 * @typedef {Object} ImageComparison
 * @property {string} productId - Product ID
 * @property {string} productName - Product name
 * @property {string|null} primaryImage - Primary image URL
 * @property {Array<string>} allImages - All image URLs
 */

/**
 * @typedef {Object} ComparisonSummary
 * @property {number} totalProducts - Total number of products in comparison
 * @property {Object} priceRange - Price range object
 * @property {number} priceRange.min - Minimum price
 * @property {number} priceRange.max - Maximum price
 * @property {Array<string>} commonSpecs - List of common specifications
 * @property {Array<string>} differentSpecs - List of different specifications
 * @property {string|null} bestValueProduct - ID of best value product
 */

/**
 * @typedef {Object} ComparisonData
 * @property {string} comparisonId - Comparison ID
 * @property {Array<Product>} products - Array of products
 * @property {Array<SpecComparisonResult>} specifications - Specification comparison results
 * @property {Array<PriceComparison>} priceComparison - Price comparison results
 * @property {Array<ImageComparison>} imageComparison - Image comparison results
 * @property {ComparisonSummary} summary - Comparison summary
 */

/**
 * @typedef {Object} Product
 * @property {string} id - Product ID
 * @property {string} name - Product name
 * @property {string} nameEn - Product name in English
 * @property {string} slug - Product slug
 * @property {number} regularPrice - Regular price
 * @property {number|null} salePrice - Sale price
 * @property {string|null} notes - Comparison notes
 * @property {Array<ProductImage>} images - Product images
 * @property {Array<ProductSpecification>} specifications - Product specifications
 * @property {Object} brand - Brand information
 * @property {Array<Object>} categories - Product categories
 */

/**
 * @typedef {Object} ProductImage
 * @property {string} id - Image ID
 * @property {string} originalUrl - Original image URL
 * @property {boolean} isPrimary - Whether this is primary image
 */

/**
 * @typedef {Object} ProductSpecification
 * @property {string} id - Specification ID
 * @property {string} name - Specification name
 * @property {string} value - Specification value
 * @property {number} sortOrder - Sort order
 */

/**
 * @typedef {Object} DifferenceHighlight
 * @property {string} comparisonId - Comparison ID
 * @property {Array<Difference>} differences - Array of differences
 * @property {ComparisonSummary} summary - Comparison summary
 */

/**
 * @typedef {Object} Difference
 * @property {string} productId - Product ID
 * @property {string} productName - Product name
 * @property {number} score - Product score
 * @property {Array<Specification>} betterSpecs - Specs where this product is better
 * @property {Array<Specification>} worseSpecs - Specs where this product is worse
 */

/**
 * @typedef {Object} CreateComparisonRequest
 * @property {string} [name] - Comparison name
 * @property {Array<string>} productIds - Array of product IDs
 * @property {string} [sessionId] - Session ID for guest comparisons
 */

/**
 * @typedef {Object} UpdateComparisonRequest
 * @property {string} [name] - Comparison name
 */

/**
 * @typedef {Object} AddProductToComparisonRequest
 * @property {string} productId - Product ID to add
 * @property {string} [notes] - Notes for the product
 */

/**
 * @typedef {Object} ShareComparisonResponse
 * @property {string} message - Success message
 * @property {string} shareUrl - Share URL
 * @property {string} shareToken - Share token
 * @property {Date} expiresAt - Expiration date
 */

/**
 * @typedef {Object} ComparisonStats
 * @property {string} period - Time period
 * @property {Object} stats - Statistics object
 * @property {number} stats.totalComparisons - Total comparisons
 * @property {number} stats.activeComparisons - Active comparisons
 * @property {number} stats.expiredComparisons - Expired comparisons
 * @property {number} stats.userComparisons - User comparisons
 * @property {number} stats.guestComparisons - Guest comparisons
 * @property {number} stats.totalItems - Total comparison items
 * @property {number} stats.avgItemsPerComparison - Average items per comparison
 * @property {Array<Object>} stats.topComparedProducts - Top compared products
 */

/**
 * @typedef {Object} ComparisonAnalytics
 * @property {string} period - Time period
 * @property {string} groupBy - Grouping method
 * @property {Array<Object>} timeline - Timeline data
 * @property {Array<Object>} topUsers - Top users by activity
 * @property {Array<Object>} actionDistribution - Action distribution
 */

/**
 * @typedef {Object} ComparisonListResponse
 * @property {Array<Object>} comparisons - Array of comparisons
 * @property {Object} pagination - Pagination info
 * @property {number} pagination.page - Current page
 * @property {number} pagination.limit - Items per page
 * @property {number} pagination.total - Total items
 * @property {number} pagination.pages - Total pages
 */

/**
 * @typedef {Object} ComparisonResponse
 * @property {string} message - Success message
 * @property {Object} comparison - Comparison object
 */

/**
 * @typedef {Object} ErrorResponse
 * @property {string} error - Error type
 * @property {string} [message] - Error message
 * @property {Array<Object>} [details] - Validation error details
 */

/**
 * @typedef {Object} SpecComparisonResult
 * @property {string} comparisonId - Comparison ID
 * @property {Array<SpecComparisonResult>} specifications - Specification comparison results
 */

/**
 * @typedef {Object} PriceComparisonResult
 * @property {string} comparisonId - Comparison ID
 * @property {Array<PriceComparison>} priceComparison - Price comparison results
 * @property {Object} priceRange - Price range object
 * @property {number} priceRange.min - Minimum price
 * @property {number} priceRange.max - Maximum price
 */

/**
 * @typedef {Object} ImageComparisonResult
 * @property {string} comparisonId - Comparison ID
 * @property {Array<ImageComparison>} imageComparison - Image comparison results
 */

/**
 * @typedef {Object} GuestComparisonRequest
 * @property {string} [name] - Comparison name
 * @property {Array<string>} productIds - Array of product IDs
 */

/**
 * @typedef {Object} GuestComparisonResponse
 * @property {string} message - Success message
 * @property {Object} comparison - Comparison object
 * @property {string} sessionId - Session ID
 */

/**
 * @typedef {Object} MergeGuestComparisonRequest
 * @property {string} sessionId - Session ID to merge
 */

/**
 * @typedef {Object} MergeGuestComparisonResponse
 * @property {string} message - Success message
 * @property {Object} comparison - Merged comparison object
 */

/**
 * @typedef {Object} AdminComparisonListQuery
 * @property {number} [page] - Page number
 * @property {number} [limit] - Items per page
 * @property {string} [userId] - Filter by user ID
 * @property {string} [sessionId] - Filter by session ID
 * @property {string} [status] - Filter by status (active, expired, all)
 * @property {string} [sortBy] - Sort field
 * @property {string} [sortOrder] - Sort order (asc, desc)
 */

/**
 * @typedef {Object} AdminComparisonStatsQuery
 * @property {string} [period] - Time period (today, week, month, year, all)
 */

/**
 * @typedef {Object} AdminComparisonAnalyticsQuery
 * @property {string} [period] - Time period (today, week, month, year, all)
 * @property {string} [groupBy] - Group by (day, week, month)
 */

/**
 * @typedef {Object} ExportComparisonRequest
 * @property {string} [format] - Export format (pdf, excel, csv)
 * @property {boolean} [includeImages] - Include images in export
 * @property {boolean} [includeSpecs] - Include specifications in export
 * @property {boolean} [includePrices] - Include prices in export
 */

/**
 * @typedef {Object} ComparisonHistoryEntry
 * @property {string} id - History entry ID
 * @property {string} userId - User ID
 * @property {string} comparisonId - Comparison ID
 * @property {string} action - Action performed
 * @property {Object} [metadata] - Additional metadata
 * @property {Date} createdAt - Creation timestamp
 */

/**
 * @typedef {Object} ComparisonItem
 * @property {string} id - Item ID
 * @property {string} comparisonId - Comparison ID
 * @property {string} productId - Product ID
 * @property {Date} addedAt - Addition timestamp
 * @property {string} [notes] - Item notes
 * @property {Product} product - Product object
 */

/**
 * @typedef {Object} ProductComparison
 * @property {string} id - Comparison ID
 * @property {string} [userId] - User ID (null for guests)
 * @property {string} [sessionId] - Session ID (for guests)
 * @property {string} [name] - Comparison name
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Update timestamp
 * @property {Date} [expiresAt] - Expiration timestamp
 * @property {Array<ComparisonItem>} items - Comparison items
 * @property {Object} [user] - User object
 */

module.exports = {
  // Export type names for documentation
  SpecComparisonResult: 'SpecComparisonResult',
  Specification: 'Specification',
  PriceComparison: 'PriceComparison',
  ImageComparison: 'ImageComparison',
  ComparisonSummary: 'ComparisonSummary',
  ComparisonData: 'ComparisonData',
  Product: 'Product',
  ProductImage: 'ProductImage',
  ProductSpecification: 'ProductSpecification',
  DifferenceHighlight: 'DifferenceHighlight',
  Difference: 'Difference',
  CreateComparisonRequest: 'CreateComparisonRequest',
  UpdateComparisonRequest: 'UpdateComparisonRequest',
  AddProductToComparisonRequest: 'AddProductToComparisonRequest',
  ShareComparisonResponse: 'ShareComparisonResponse',
  ComparisonStats: 'ComparisonStats',
  ComparisonAnalytics: 'ComparisonAnalytics',
  ComparisonListResponse: 'ComparisonListResponse',
  ComparisonResponse: 'ComparisonResponse',
  ErrorResponse: 'ErrorResponse',
  SpecComparisonResult: 'SpecComparisonResult',
  PriceComparisonResult: 'PriceComparisonResult',
  ImageComparisonResult: 'ImageComparisonResult',
  GuestComparisonRequest: 'GuestComparisonRequest',
  GuestComparisonResponse: 'GuestComparisonResponse',
  MergeGuestComparisonRequest: 'MergeGuestComparisonRequest',
  MergeGuestComparisonResponse: 'MergeGuestComparisonResponse',
  AdminComparisonListQuery: 'AdminComparisonListQuery',
  AdminComparisonStatsQuery: 'AdminComparisonStatsQuery',
  AdminComparisonAnalyticsQuery: 'AdminComparisonAnalyticsQuery',
  ExportComparisonRequest: 'ExportComparisonRequest',
  ComparisonHistoryEntry: 'ComparisonHistoryEntry',
  ComparisonItem: 'ComparisonItem',
  ProductComparison: 'ProductComparison'
};
