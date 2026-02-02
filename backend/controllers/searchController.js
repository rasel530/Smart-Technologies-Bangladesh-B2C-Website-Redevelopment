/**
 * Search Controller
 * 
 * This module provides controller functions for search functionality including
 * advanced product search, autocomplete, suggestions, and popular searches.
 */

const { loggerService } = require('../services/logger');

/**
 * Search Controller class
 */
class SearchController {
  constructor(searchService) {
    this.searchService = searchService;
  }

  /**
   * Handle advanced product search with all filters
   * GET /api/search/products
   */
  advancedSearch = async (req, res, next) => {
    const startTime = Date.now();

    try {
      // Extract query parameters
      const {
        query,
        categories,
        brands,
        priceRange,
        specifications,
        inStock,
        featured,
        newArrivals,
        bestSellers,
        sort,
        page,
        perPage,
        facets
      } = req.query;

      // Build search query object
      const searchQuery = {
        query: query || '',
        categoryIds: categories ? (Array.isArray(categories) ? categories : [categories]) : undefined,
        brandIds: brands ? (Array.isArray(brands) ? brands : [brands]) : undefined,
        priceRange: priceRange ? {
          min: typeof priceRange === 'object' ? priceRange.min : undefined,
          max: typeof priceRange === 'object' ? priceRange.max : undefined
        } : undefined,
        specifications: specifications ? JSON.parse(specifications) : undefined,
        inStockOnly: inStock === 'true',
        featuredOnly: featured === 'true',
        newArrivalsOnly: newArrivals === 'true',
        bestSellersOnly: bestSellers === 'true',
        sort: this.parseSortOption(sort),
        page: page ? parseInt(page) : undefined,
        pageSize: perPage ? Math.min(parseInt(perPage), 100) : undefined
      };

      // Get user ID and analytics data from request
      const userId = req.user?.id;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      // Log request
      loggerService.info('Advanced search request', {
        query: searchQuery.query,
        userId,
        ipAddress,
        userAgent: userAgent?.substring(0, 100)
      });

      // Execute search
      const result = await this.searchService.advancedSearch(
        searchQuery,
        userId,
        ipAddress,
        userAgent
      );

      // Send response
      res.json({
        products: result.results,
        total: result.total,
        page: result.page,
        perPage: result.pageSize,
        totalPages: result.totalPages,
        facets: result.facets,
        suggestions: result.results.slice(0, 5).map(p => ({
          id: p.id,
          nameEn: p.nameEn,
          nameBn: p.nameBn
        })),
        executionTime: result.executionTime,
        cached: result.cached,
        maxScore: result.maxScore
      });

      loggerService.info('Advanced search completed', {
        query: searchQuery.query,
        total: result.total,
        executionTime: result.executionTime,
        cached: result.cached
      });

    } catch (error) {
      const executionTime = Date.now() - startTime;

      loggerService.error('Advanced search failed', {
        error: error.message || 'Unknown error',
        query: req.query.query,
        executionTime
      });

      // Send error response
      res.status(500).json({
        error: 'Search failed',
        message: error.message || 'Internal server error',
        executionTime
      });

      next(error);
    }
  };

  /**
   * Handle search autocomplete requests
   * GET /api/search/autocomplete
   */
  autocomplete = async (req, res, next) => {
    const startTime = Date.now();

    try {
      // Extract query parameters
      const { query, limit } = req.query;

      // Validate query
      if (!query || query.trim().length === 0) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Query parameter is required'
        });
      }

      // Parse limit (default: 10, max: 20)
      const parsedLimit = limit ? Math.min(parseInt(limit), 20) : 10;

      // Get language preference from query or accept-language header
      const language = req.query.language || 
        (req.get('Accept-Language')?.startsWith('bn') ? 'bn' : 'en');

      // Log request
      loggerService.info('Autocomplete request', {
        query,
        limit: parsedLimit,
        language,
        userId: req.user?.id
      });

      // Execute autocomplete
      const result = await this.searchService.autocomplete(
        query,
        language
      );

      // Send response
      res.json({
        suggestions: {
          products: result.products?.slice(0, parsedLimit) || [],
          categories: result.categories?.slice(0, 5) || [],
          brands: result.brands?.slice(0, 5) || [],
          popularSearches: result.popularSearches?.slice(0, 5) || []
        },
        query: result.query,
        executionTime: result.executionTime,
        count: (result.products?.length || 0) + 
                (result.categories?.length || 0) + 
                (result.brands?.length || 0) + 
                (result.popularSearches?.length || 0)
      });

      loggerService.info('Autocomplete completed', {
        query,
        productsCount: result.products?.length || 0,
        executionTime: result.executionTime
      });

    } catch (error) {
      const executionTime = Date.now() - startTime;

      loggerService.error('Autocomplete failed', {
        error: error.message || 'Unknown error',
        query: req.query.query,
        executionTime
      });

      // Send error response
      res.status(500).json({
        error: 'Autocomplete failed',
        message: error.message || 'Internal server error',
        executionTime
      });

      next(error);
    }
  };

  /**
   * Handle search suggestions with "did you mean"
   * GET /api/search/suggestions
   */
  getSuggestions = async (req, res, next) => {
    const startTime = Date.now();

    try {
      // Extract query parameter
      const { query } = req.query;

      // Validate query
      if (!query || query.trim().length === 0) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Query parameter is required'
        });
      }

      // Log request
      loggerService.info('Suggestions request', {
        query,
        userId: req.user?.id
      });

      // Execute suggestions
      const result = await this.searchService.getSuggestions(query);

      // Send response
      res.json({
        didYouMean: result.didYouMean || [],
        relatedQueries: result.relatedSearches || [],
        trendingProducts: result.suggestions.slice(0, 5) || [],
        query: result.query,
        executionTime: result.executionTime
      });

      loggerService.info('Suggestions completed', {
        query,
        suggestionsCount: result.suggestions.length,
        didYouMeanCount: result.didYouMean?.length || 0,
        relatedSearchesCount: result.relatedSearches?.length || 0,
        executionTime: result.executionTime
      });

    } catch (error) {
      const executionTime = Date.now() - startTime;

      loggerService.error('Suggestions failed', {
        error: error.message || 'Unknown error',
        query: req.query.query,
        executionTime
      });

      // Send error response
      res.status(500).json({
        error: 'Suggestions failed',
        message: error.message || 'Internal server error',
        executionTime
      });

      next(error);
    }
  };

  /**
   * Handle popular searches from analytics
   * GET /api/search/popular
   */
  getPopularSearches = async (req, res, next) => {
    const startTime = Date.now();

    try {
      // Extract query parameters
      const { limit, period } = req.query;

      // Parse limit (default: 10, max: 50)
      const parsedLimit = limit ? Math.min(parseInt(limit), 50) : 10;

      // Parse period
      const parsedPeriod = period || 'all';

      // Log request
      loggerService.info('Popular searches request', {
        limit: parsedLimit,
        period: parsedPeriod,
        userId: req.user?.id
      });

      // Execute popular searches
      const queries = await this.searchService.getPopularSearches(parsedLimit);

      // Send response
      res.json({
        queries: queries.slice(0, parsedLimit),
        count: queries.length,
        period: parsedPeriod,
        executionTime: Date.now() - startTime
      });

      loggerService.info('Popular searches completed', {
        count: queries.length,
        period: parsedPeriod,
        executionTime: Date.now() - startTime
      });

    } catch (error) {
      const executionTime = Date.now() - startTime;

      loggerService.error('Popular searches failed', {
        error: error.message || 'Unknown error',
        executionTime
      });

      // Send error response
      res.status(500).json({
        error: 'Failed to get popular searches',
        message: error.message || 'Internal server error',
        executionTime
      });

      next(error);
    }
  };

  /**
   * Parse sort option from query string
   * @param sort - Sort string from query
   * @returns Sort option
   */
  parseSortOption(sort) {
    if (!sort) {
      return 'relevance';
    }

    // Parse sort field and order
    const [field, order] = sort.split('-');

    switch (field) {
      case 'price':
        return order === 'asc' ? 'price_asc' : 'price_desc';
      case 'rating':
        return 'rating';
      case 'newest':
        return 'newest';
      case 'name':
        return order === 'asc' ? 'name_asc' : 'name_desc';
      case 'relevance':
      default:
        return 'relevance';
    }
  }
}

module.exports = SearchController;
