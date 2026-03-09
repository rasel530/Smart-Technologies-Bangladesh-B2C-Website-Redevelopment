/**
 * Search API Routes
 * 
 * This module provides search endpoints using Elasticsearch with support for
 * full-text search, faceted search, autocomplete, and search analytics.
 */

const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { elasticsearchConfig } = require('../config/elasticsearch');
const { searchAnalyticsService } = require('../services/elasticsearch/searchAnalytics');
const { authMiddleware } = require('../middleware/auth');
const { loggerService } = require('../services/logger');

const router = express.Router();
const prisma = new PrismaClient();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// ============================================
// SEARCH ENDPOINTS
// ============================================

// GET /api/v1/search - Main search endpoint
router.get('/', [
  query('q').optional().isString().trim(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('sortBy').optional().isIn(['price', 'name', 'rating', 'popularity', 'createdAt']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('categoryId').optional().isUUID(),
  query('brandId').optional().isUUID(),
  query('priceMin').optional().isFloat({ min: 0 }),
  query('priceMax').optional().isFloat({ min: 0 }),
  query('status').optional().isIn(['active', 'inactive', 'draft', 'published', 'archived', 'out_of_stock', 'discontinued']),
  query('visibility').optional().isIn(['public', 'private', 'restricted']),
  query('isFeatured').optional().isBoolean(),
  query('isNewArrival').optional().isBoolean(),
  query('isBestSeller').optional().isBoolean()
], handleValidationErrors, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const {
      q,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      categoryId,
      brandId,
      priceMin,
      priceMax,
      status,
      visibility,
      isFeatured,
      isNewArrival,
      isBestSeller
    } = req.query;

    // Build Elasticsearch query with graceful degradation
    const searchResult = await elasticsearchConfig.withGracefulDegradation(
      // Elasticsearch operation
      async () => {
        return await performElasticsearchSearch({
          query: q,
          page,
          limit,
          sortBy,
          sortOrder,
          filters: {
            categoryId,
            brandId,
            priceMin,
            priceMax,
            status,
            visibility,
            isFeatured,
            isNewArrival,
            isBestSeller
          }
        });
      },
      // Fallback to PostgreSQL search
      async () => {
        return await performPostgreSQLSearch({
          query: q,
          page,
          limit,
          sortBy,
          sortOrder,
          filters: {
            categoryId,
            brandId,
            priceMin,
            priceMax,
            status,
            visibility,
            isFeatured,
            isNewArrival,
            isBestSeller
          }
        });
      }
    );

    // Calculate execution time
    const executionTime = Date.now() - startTime;

    // Log search analytics
    await searchAnalyticsService.logSearch(
      q || '',
      req.user?.id || null,
      searchResult.total,
      executionTime,
      {
        categoryId,
        brandId,
        priceMin,
        priceMax,
        status,
        visibility,
        isFeatured,
        isNewArrival,
        isBestSeller
      }
    );

    // Return paginated results
    res.json({
      products: searchResult.products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: searchResult.total,
        pages: Math.ceil(searchResult.total / limit)
      },
      metadata: {
        query: q,
        executionTime,
        searchEngine: searchResult.searchEngine
      }
    });

  } catch (error) {
    loggerService.error('Search error', {
      error: error.message,
      query: req.query.q
    });

    res.status(500).json({
      error: 'Search failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/search/suggestions - Autocomplete/search suggestions
router.get('/suggestions', [
  query('q').trim().notEmpty().withMessage('Query is required'),
  query('limit').optional().isInt({ min: 1, max: 20 })
], handleValidationErrors, async (req, res) => {
  try {
    const {
      q,
      limit = 10
    } = req.query;

    // Get suggestions with graceful degradation
    const suggestionsResult = await elasticsearchConfig.withGracefulDegradation(
      // Elasticsearch operation
      async () => {
        return await getElasticsearchSuggestions(q, limit);
      },
      // Fallback to PostgreSQL
      async () => {
        return await getPostgreSQLSuggestions(q, limit);
      }
    );

    res.json({
      suggestions: suggestionsResult.suggestions,
      count: suggestionsResult.suggestions.length,
      query: q
    });

  } catch (error) {
    loggerService.error('Search suggestions error', {
      error: error.message,
      query: req.query.q
    });

    res.status(500).json({
      error: 'Failed to get suggestions',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/search/facets - Faceted search
router.get('/facets', [
  query('q').optional().isString().trim()
], handleValidationErrors, async (req, res) => {
  try {
    const { q } = req.query;

    // Get facets with graceful degradation
    const facetsResult = await elasticsearchConfig.withGracefulDegradation(
      // Elasticsearch operation
      async () => {
        return await getElasticsearchFacets(q);
      },
      // Fallback to PostgreSQL
      async () => {
        return await getPostgreSQLFacets(q);
      }
    );

    res.json({
      facets: facetsResult.facets,
      query: q
    });

  } catch (error) {
    loggerService.error('Search facets error', {
      error: error.message,
      query: req.query.q
    });

    res.status(500).json({
      error: 'Failed to get facets',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/search/analytics - Search analytics (admin only)
router.get('/analytics', [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('limit').optional().isInt({ min: 1, max: 100 })
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      limit = 10
    } = req.query;

    // Default to last 30 days if not provided
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);

    const searchStartDate = startDate ? new Date(startDate) : defaultStartDate;
    const searchEndDate = endDate ? new Date(endDate) : new Date();

    // Get analytics summary
    const analytics = await searchAnalyticsService.getAnalyticsSummary(
      searchStartDate,
      searchEndDate
    );

    res.json({
      analytics: analytics.summary,
      period: {
        startDate: searchStartDate,
        endDate: searchEndDate
      }
    });

  } catch (error) {
    loggerService.error('Search analytics error', {
      error: error.message
    });

    res.status(500).json({
      error: 'Failed to get analytics',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================
// ELASTICSEARCH SEARCH FUNCTIONS
// ============================================

/**
 * Perform search using Elasticsearch
 * @param {Object} params - Search parameters
 * @returns {Promise<Object>} Search results
 */
async function performElasticsearchSearch(params) {
  const {
    query,
    page,
    limit,
    sortBy,
    sortOrder,
    filters
  } = params;

  const client = elasticsearchConfig.getClient();
  const indexName = elasticsearchConfig.buildIndexName('products');

  // Build Elasticsearch query
  const esQuery = {
    bool: {
      must: [],
      filter: []
    }
  };

  // Add text search if query is provided
  if (query && query.trim()) {
    esQuery.bool.must.push({
      multi_match: {
        query: query,
        fields: [
          'nameEn^3',
          'nameBn^2.5',
          'descriptionEn^1.5',
          'descriptionBn^1.5',
          'shortDescription^1',
          'sku^2'
        ],
        type: 'best_fields',
        fuzziness: 'AUTO',
        operator: 'or'
      }
    });
  }

  // Add filters
  if (filters.status) {
    esQuery.bool.filter.push({
      term: { status: filters.status }
    });
  }

  if (filters.visibility) {
    esQuery.bool.filter.push({
      term: { visibility: filters.visibility }
    });
  }

  if (filters.categoryId) {
    esQuery.bool.filter.push({
      term: { categoryId: filters.categoryId }
    });
  }

  if (filters.brandId) {
    esQuery.bool.filter.push({
      term: { brandId: filters.brandId }
    });
  }

  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    const rangeFilter = {};
    if (filters.priceMin !== undefined) {
      rangeFilter.gte = parseFloat(filters.priceMin);
    }
    if (filters.priceMax !== undefined) {
      rangeFilter.lte = parseFloat(filters.priceMax);
    }
    esQuery.bool.filter.push({
      range: { basePrice: rangeFilter }
    });
  }

  if (filters.isFeatured !== undefined) {
    esQuery.bool.filter.push({
      term: { isFeatured: filters.isFeatured === 'true' }
    });
  }

  if (filters.isNewArrival !== undefined) {
    esQuery.bool.filter.push({
      term: { isNewArrival: filters.isNewArrival === 'true' }
    });
  }

  if (filters.isBestSeller !== undefined) {
    esQuery.bool.filter.push({
      term: { isBestSeller: filters.isBestSeller === 'true' }
    });
  }

  // Build sort
  const sort = [];
  switch (sortBy) {
    case 'price':
      sort.push({ basePrice: { order: sortOrder } });
      break;
    case 'name':
      sort.push({ nameEn: { order: sortOrder } });
      break;
    case 'rating':
      sort.push({ rating: { order: sortOrder } });
      break;
    case 'popularity':
      sort.push({ popularity: { order: sortOrder } });
      break;
    case 'createdAt':
    default:
      sort.push({ createdAt: { order: sortOrder } });
      break;
  }

  // Execute search
  const response = await client.search({
    index: indexName,
    body: {
      query: esQuery,
      sort,
      from: (page - 1) * limit,
      size: limit,
      _source: [
        'id', 'sku', 'name', 'nameEn', 'nameBn', 'slug', 'shortDescription',
        'basePrice', 'discountPrice', 'salePrice', 'thumbnail', 'rating',
        'reviewCount', 'inStock', 'isFeatured', 'isNewArrival', 'isBestSeller',
        'categoryId', 'categoryName', 'categoryNameEn', 'categoryNameBn',
        'brandId', 'brandName', 'brandNameEn', 'brandNameBn'
      ]
    }
  });

  // Transform results
  const products = response.body.hits.hits.map(hit => ({
    id: hit._source.id,
    sku: hit._source.sku,
    name: hit._source.name,
    nameEn: hit._source.nameEn,
    nameBn: hit._source.nameBn,
    slug: hit._source.slug,
    shortDescription: hit._source.shortDescription,
    basePrice: hit._source.basePrice,
    discountPrice: hit._source.discountPrice,
    salePrice: hit._source.salePrice,
    thumbnail: hit._source.thumbnail,
    rating: hit._source.rating,
    reviewCount: hit._source.reviewCount,
    inStock: hit._source.inStock,
    isFeatured: hit._source.isFeatured,
    isNewArrival: hit._source.isNewArrival,
    isBestSeller: hit._source.isBestSeller,
    categoryId: hit._source.categoryId,
    categoryName: hit._source.categoryName,
    categoryNameEn: hit._source.categoryNameEn,
    categoryNameBn: hit._source.categoryNameBn,
    brandId: hit._source.brandId,
    brandName: hit._source.brandName,
    brandNameEn: hit._source.brandNameEn,
    brandNameBn: hit._source.brandNameBn
  }));

  return {
    products,
    total: response.body.hits.total.value,
    searchEngine: 'elasticsearch'
  };
}

/**
 * Get search suggestions from Elasticsearch
 * @param {string} query - Search query
 * @param {number} limit - Maximum number of suggestions
 * @returns {Promise<Object>} Suggestions
 */
async function getElasticsearchSuggestions(query, limit) {
  const client = elasticsearchConfig.getClient();
  const indexName = elasticsearchConfig.buildIndexName('products');

  const response = await client.search({
    index: indexName,
    body: {
      query: {
        prefix: {
          nameEn: {
            value: query.toLowerCase()
          }
        }
      },
      size: limit,
      _source: [
        'id', 'nameEn', 'nameBn', 'slug', 'thumbnail',
        'categoryId', 'categoryNameEn', 'categoryNameBn'
      ]
    }
  });

  const suggestions = response.body.hits.hits.map(hit => ({
    id: hit._source.id,
    nameEn: hit._source.nameEn,
    nameBn: hit._source.nameBn,
    slug: hit._source.slug,
    thumbnail: hit._source.thumbnail,
    categoryId: hit._source.categoryId,
    categoryNameEn: hit._source.categoryNameEn,
    categoryNameBn: hit._source.categoryNameBn
  }));

  return {
    suggestions,
    searchEngine: 'elasticsearch'
  };
}

/**
 * Get search facets from Elasticsearch
 * @param {string} query - Search query
 * @returns {Promise<Object>} Facets
 */
async function getElasticsearchFacets(query) {
  const client = elasticsearchConfig.getClient();
  const indexName = elasticsearchConfig.buildIndexName('products');

  // Build base query
  const esQuery = {
    bool: {
      must: [],
      filter: [
        { term: { status: 'active' } },
        { term: { visibility: 'public' } }
      ]
    }
  };

  // Add text search if query is provided
  if (query && query.trim()) {
    esQuery.bool.must.push({
      multi_match: {
        query: query,
        fields: ['nameEn^3', 'nameBn^2.5', 'descriptionEn^1.5', 'descriptionBn^1.5']
      }
    });
  }

  // Execute search with aggregations
  const response = await client.search({
    index: indexName,
    body: {
      query: esQuery,
      size: 0, // Don't return documents, just aggregations
      aggs: {
        categories: {
          terms: {
            field: 'categoryId.keyword',
            size: 20
          },
          aggs: {
            categoryNames: {
                terms: {
                  field: 'categoryNameEn.keyword',
                  size: 1
                }
              }
          }
        },
        brands: {
          terms: {
            field: 'brandId.keyword',
            size: 20
          },
          aggs: {
            brandNames: {
              terms: {
                field: 'brandNameEn.keyword',
                size: 1
              }
            }
          }
        },
        priceRanges: {
          range: {
            field: 'basePrice',
            ranges: [
              { key: '0-500', to: 500 },
              { key: '500-1000', from: 500, to: 1000 },
              { key: '1000-2000', from: 1000, to: 2000 },
              { key: '2000-5000', from: 2000, to: 5000 },
              { key: '5000-10000', from: 5000, to: 10000 },
              { key: '10000+', from: 10000 }
            ]
          }
        },
        statusFlags: {
          filters: [
            { key: 'featured', term: { isFeatured: true } },
            { key: 'newArrival', term: { isNewArrival: true } },
            { key: 'bestSeller', term: { isBestSeller: true } }
          ]
        }
      }
    }
  });

  // Transform aggregations to facets
  const categories = response.body.aggregations.categories.buckets.map(bucket => ({
    id: bucket.key,
    count: bucket.doc_count,
    name: bucket.categoryNames.buckets[0]?.key
  }));

  const brands = response.body.aggregations.brands.buckets.map(bucket => ({
    id: bucket.key,
    count: bucket.doc_count,
    name: bucket.brandNames.buckets[0]?.key
  }));

  const priceRanges = response.body.aggregations.priceRanges.buckets.map(bucket => ({
    key: bucket.key,
    count: bucket.doc_count,
    from: bucket.from,
    to: bucket.to
  }));

  const statusFlags = response.body.aggregations.statusFlags.buckets.map(bucket => ({
    key: bucket.key,
    count: bucket.doc_count
  }));

  return {
    facets: {
      categories,
      brands,
      priceRanges,
      statusFlags
    },
    searchEngine: 'elasticsearch'
  };
}

// ============================================
// POSTGRESQL FALLBACK FUNCTIONS
// ============================================

/**
 * Perform search using PostgreSQL (fallback)
 * @param {Object} params - Search parameters
 * @returns {Promise<Object>} Search results
 */
async function performPostgreSQLSearch(params) {
  const {
    query,
    page,
    limit,
    sortBy,
    sortOrder,
    filters
  } = params;

  const where = {};

  // Add text search - split query into individual words for multi-word support
  if (query && query.trim()) {
    const searchTerms = query.trim().split(/\s+/);
    
    // Create OR conditions for each search term across all searchable fields
    where.OR = searchTerms.flatMap(term => [
      { name: { contains: term, mode: 'insensitive' } },
      { nameEn: { contains: term, mode: 'insensitive' } },
      { nameBn: { contains: term, mode: 'insensitive' } },
      { shortDescription: { contains: term, mode: 'insensitive' } },
      { sku: { contains: term, mode: 'insensitive' } }
    ]);
  }

  // Add filters
  if (filters.status) where.status = filters.status;
  if (filters.visibility) where.visibility = filters.visibility;
  if (filters.categoryId) {
    where.categories = {
      some: { categoryId: filters.categoryId }
    };
  }
  if (filters.brandId) where.brandId = filters.brandId;
  if (filters.isFeatured !== undefined) where.isFeatured = filters.isFeatured === 'true';
  if (filters.isNewArrival !== undefined) where.isNewArrival = filters.isNewArrival === 'true';
  if (filters.isBestSeller !== undefined) where.isBestSeller = filters.isBestSeller === 'true';

  // Add price range
  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    where.regularPrice = {};
    if (filters.priceMin !== undefined) where.regularPrice.gte = parseFloat(filters.priceMin);
    if (filters.priceMax !== undefined) where.regularPrice.lte = parseFloat(filters.priceMax);
  }

  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    prisma.products.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      include: {
        categories: {
          include: {
            category: {
              select: { id: true, name: true, slug: true }
            }
          }
        },
        brand: {
          select: { id: true, name: true, slug: true }
        },
        images: {
          orderBy: { displayOrder: 'asc' },
          take: 1
        },
        _count: {
          select: { reviews: true }
        }
      },
      orderBy: { [sortBy]: sortOrder }
    }),
    prisma.products.count({ where })
  ]);

  // Transform to match Elasticsearch format
  const transformedProducts = products.map(product => {
    const primaryCategory = product.categories.find(cat => cat.isPrimary) || product.categories[0];
    const thumbnail = product.images.length > 0 ? product.images[0].originalUrl : null;
    const avgRating = product._count.reviews > 0 
      ? (product.reviews.reduce((sum, r) => sum + r.rating, 0) / product._count.reviews)
      : 0;

    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      nameEn: product.nameEn,
      nameBn: product.nameBn,
      slug: product.slug,
      shortDescription: product.shortDescription,
      basePrice: parseFloat(product.regularPrice),
      discountPrice: product.salePrice ? parseFloat(product.salePrice) : null,
      salePrice: product.salePrice ? parseFloat(product.salePrice) : null,
      thumbnail: thumbnail,
      rating: parseFloat(avgRating.toFixed(2)),
      reviewCount: product._count.reviews,
      inStock: product.stockQuantity > 0,
      isFeatured: product.isFeatured,
      isNewArrival: product.isNewArrival,
      isBestSeller: product.isBestSeller,
      categoryId: primaryCategory?.categoryId || null,
      categoryName: primaryCategory?.category?.name || null,
      categoryNameEn: primaryCategory?.category?.nameEn || null,
      categoryNameBn: primaryCategory?.category?.nameBn || null,
      brandId: product.brandId,
      brandName: product.brand?.name,
      brandNameEn: product.brand?.nameEn,
      brandNameBn: product.brand?.nameBn
    };
  });

  return {
    products: transformedProducts,
    total,
    searchEngine: 'postgresql'
  };
}

/**
 * Get search suggestions from PostgreSQL (fallback)
 * @param {string} query - Search query
 * @param {number} limit - Maximum number of suggestions
 * @returns {Promise<Object>} Suggestions
 */
async function getPostgreSQLSuggestions(query, limit) {
  const products = await prisma.products.findMany({
    where: {
      OR: [
        { name: { startsWith: query, mode: 'insensitive' } },
        { nameEn: { startsWith: query, mode: 'insensitive' } },
        { nameBn: { startsWith: query, mode: 'insensitive' } },
        { sku: { startsWith: query, mode: 'insensitive' } }
      ],
      status: 'active',
      visibility: 'public'
    },
    take: parseInt(limit),
    include: {
      categories: {
        include: {
          category: {
            select: { id: true, name: true, nameEn: true }
          }
        }
      },
      images: {
        orderBy: { sortOrder: 'asc' },
        take: 1
      }
    }
  });

  const suggestions = products.map(product => {
    const primaryCategory = product.categories.find(cat => cat.isPrimary) || product.categories[0];
    const thumbnail = product.images.length > 0 ? product.images[0].originalUrl : null;

    return {
      id: product.id,
      nameEn: product.nameEn,
      nameBn: product.nameBn,
      slug: product.slug,
      thumbnail: thumbnail,
      categoryId: primaryCategory?.categoryId || null,
      categoryNameEn: primaryCategory?.category?.nameEn || null,
      categoryNameBn: primaryCategory?.category?.nameBn || null
    };
  });

  return {
    suggestions,
    searchEngine: 'postgresql'
  };
}

/**
 * Get search facets from PostgreSQL (fallback)
 * @param {string} query - Search query
 * @returns {Promise<Object>} Facets
 */
async function getPostgreSQLFacets(query) {
  const where = {
    status: 'active',
    visibility: 'public'
  };

  if (query && query.trim()) {
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { nameEn: { contains: query, mode: 'insensitive' } }
    ];
  }

  // Get categories with counts
  const categoryCounts = await prisma.product_categories.groupBy({
    by: ['categoryId'],
    where: {
      product: where
    },
    _count: {
      categoryId: true
    },
    orderBy: {
      _count: {
        categoryId: 'desc'
      }
    },
    take: 20
  });

  // Get brand counts
  const brandCounts = await prisma.products.groupBy({
    by: ['brandId'],
    where,
    _count: {
      id: true
    },
    orderBy: {
      _count: {
        id: 'desc'
      }
    },
    take: 20
  });

  // Get price ranges
  const products = await prisma.products.findMany({
    where,
    select: {
      regularPrice: true
    }
  });

  const priceRanges = [
    { key: '0-500', count: products.filter(p => p.regularPrice < 500).length },
    { key: '500-1000', count: products.filter(p => p.regularPrice >= 500 && p.regularPrice < 1000).length },
    { key: '1000-2000', count: products.filter(p => p.regularPrice >= 1000 && p.regularPrice < 2000).length },
    { key: '2000-5000', count: products.filter(p => p.regularPrice >= 2000 && p.regularPrice < 5000).length },
    { key: '5000-10000', count: products.filter(p => p.regularPrice >= 5000 && p.regularPrice < 10000).length },
    { key: '10000+', count: products.filter(p => p.regularPrice >= 10000).length }
  ];

  // Get status flags
  const statusFlags = [
    { key: 'featured', count: await prisma.products.count({ where: { ...where, isFeatured: true } }) },
    { key: 'newArrival', count: await prisma.products.count({ where: { ...where, isNewArrival: true } }) },
    { key: 'bestSeller', count: await prisma.products.count({ where: { ...where, isBestSeller: true } }) }
  ];

  // Fetch category and brand names
  const categories = await Promise.all(
    categoryCounts.map(async cc => {
      const category = await prisma.categories.findUnique({
        where: { id: cc.categoryId },
        select: { id: true, name: true, nameEn: true }
      });
      return {
        id: cc.categoryId,
        count: cc._count.categoryId,
        name: category?.name,
        nameEn: category?.nameEn
      };
    })
  );

  const brands = await Promise.all(
    brandCounts.map(async bc => {
      const brand = await prisma.brands.findUnique({
        where: { id: bc.brandId },
        select: { id: true, name: true, nameEn: true }
      });
      return {
        id: bc.brandId,
        count: bc._count.id,
        name: brand?.name,
        nameEn: brand?.nameEn
      };
    })
  );

  return {
    facets: {
      categories,
      brands,
      priceRanges,
      statusFlags
    },
    searchEngine: 'postgresql'
  };
}

module.exports = router;
