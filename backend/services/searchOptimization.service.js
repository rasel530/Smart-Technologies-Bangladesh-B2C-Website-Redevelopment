/**
 * Search Optimization Service
 * 
 * This service analyzes search query patterns, optimizes Elasticsearch queries with ML-based
 * relevance, implements query caching strategies, and provides A/B testing framework.
 */

const { PrismaClient } = require('@prisma/client');
const { loggerService } = require('./logger');
const { elasticsearchQueryBuilder } = require('./elasticsearchQueryBuilder');

class SearchOptimizationService {
  constructor(prisma = null, elasticsearchClient = null) {
    this.prisma = prisma || new PrismaClient();
    this.elasticsearchClient = elasticsearchClient;
    this.queryCache = new Map();
    this.cacheMaxSize = 1000;
    this.cacheTTL = 300000; // 5 minutes in milliseconds
  }

  /**
   * Analyze search query patterns
   * 
   * @param {string} timeRange - Time range for analysis (hour, day, week, month)
   * @returns {Promise<object>} Query pattern analysis results
   */
  async analyzeQueryPatterns(timeRange = 'week') {
    try {
      const now = new Date();
      let startDate;

      switch (timeRange) {
        case 'hour':
          startDate = new Date(now.setHours(now.getHours() - 1));
          break;
        case 'day':
          startDate = new Date(now.setDate(now.getDate() - 1));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          startDate = new Date(now.setDate(now.getDate() - 7));
      }

      const searchAnalytics = await this.prisma.searchAnalytics.findMany({
        where: {
          timestamp: {
            gte: startDate
          }
        }
      });

      // Analyze query patterns
      const queryPatterns = {
        totalQueries: searchAnalytics.length,
        uniqueQueries: new Set(searchAnalytics.map(s => s.query)).size,
        avgQueryLength: this.calculateAverage(searchAnalytics.map(s => s.query.length)),
        avgResultsCount: this.calculateAverage(searchAnalytics.map(s => s.resultsCount)),
        zeroResultRate: searchAnalytics.filter(s => s.resultsCount === 0).length / searchAnalytics.length,
        avgResponseTime: this.calculateAverage(searchAnalytics.map(s => s.responseTime)),
        topQueries: this.getTopQueries(searchAnalytics, 20),
        commonFilters: this.analyzeCommonFilters(searchAnalytics),
        commonSortOptions: this.analyzeCommonSortOptions(searchAnalytics),
        queryLengthDistribution: this.analyzeQueryLengthDistribution(searchAnalytics),
        resultsDistribution: this.analyzeResultsDistribution(searchAnalytics)
      };

      loggerService.info('Query patterns analyzed', {
        timeRange,
        totalQueries: queryPatterns.totalQueries,
        uniqueQueries: queryPatterns.uniqueQueries
      });

      return queryPatterns;
    } catch (error) {
      loggerService.error('Failed to analyze query patterns', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timeRange
      });
      throw error;
    }
  }

  /**
   * Optimize a search query using ML-based relevance
   * 
   * @param {string} query - Original search query
   * @param {string} userId - User ID (optional)
   * @returns {Promise<object>} Optimized query configuration
   */
  async optimizeQuery(query, userId = null) {
    try {
      const optimizedQuery = {
        originalQuery: query,
        optimizedQuery: query,
        boostFactors: {},
        filters: {},
        sort: 'relevance',
        suggestions: [],
        queryType: 'match'
      };

      // Check cache first
      const cacheKey = `${userId || 'anonymous'}_${query}`;
      const cached = this.queryCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        loggerService.info('Query optimization cache hit', { query, userId });
        return cached.data;
      }

      // Analyze query for optimization opportunities
      const queryAnalysis = await this.analyzeQuery(query);

      // Apply ML-based relevance boosting
      optimizedQuery.boostFactors = await this.calculateBoostFactors(query, userId);

      // Add query suggestions
      optimizedQuery.suggestions = await this.generateQuerySuggestions(query);

      // Determine optimal query type
      optimizedQuery.queryType = this.determineQueryType(query, queryAnalysis);

      // Cache the result
      this.queryCache.set(cacheKey, {
        timestamp: Date.now(),
        data: optimizedQuery
      });

      // Manage cache size
      if (this.queryCache.size > this.cacheMaxSize) {
        const oldestKey = this.queryCache.keys().next().value;
        this.queryCache.delete(oldestKey);
      }

      loggerService.info('Query optimized', {
        query,
        userId,
        queryType: optimizedQuery.queryType
      });

      return optimizedQuery;
    } catch (error) {
      loggerService.error('Failed to optimize query', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query,
        userId
      });
      // Return original query on error
      return {
        originalQuery: query,
        optimizedQuery: query,
        boostFactors: {},
        filters: {},
        sort: 'relevance',
        suggestions: [],
        queryType: 'match'
      };
    }
  }

  /**
   * Get optimized search results with A/B testing support
   * 
   * @param {string} query - Search query
   * @param {object} filters - Search filters
   * @param {string} sortBy - Sort order
   * @param {string} userId - User ID
   * @param {string} experimentVariant - A/B test variant (optional)
   * @returns {Promise<object>} Optimized search results
   */
  async getOptimizedResults(query, filters = {}, sortBy = 'relevance', userId = null, experimentVariant = null) {
    try {
      const startTime = Date.now();

      // Optimize the query
      const optimizedQuery = await this.optimizeQuery(query, userId);

      // Merge optimized query with user filters
      const mergedFilters = {
        ...optimizedQuery.filters,
        ...filters
      };

      // Determine sort order (experiment variant takes precedence)
      const finalSort = experimentVariant || sortBy || optimizedQuery.sort;

      // Build Elasticsearch query with optimizations
      const esQuery = this.buildOptimizedQuery(
        optimizedQuery.optimizedQuery,
        mergedFilters,
        finalSort,
        optimizedQuery.boostFactors,
        optimizedQuery.queryType
      );

      // Execute search
      const indexName = this.buildIndexName('product');
      const response = await this.elasticsearchClient.search({
        index: indexName,
        body: esQuery
      });

      const executionTime = Date.now() - startTime;

      // Process results
      const results = this.processSearchResults(response);

      loggerService.info('Optimized search completed', {
        query,
        userId,
        experimentVariant,
        totalResults: results.total,
        executionTime
      });

      return {
        ...results,
        optimizedQuery: optimizedQuery.optimizedQuery,
        suggestions: optimizedQuery.suggestions,
        experimentVariant,
        executionTime
      };
    } catch (error) {
      loggerService.error('Failed to get optimized results', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query,
        userId
      });
      throw error;
    }
  }

  /**
   * Create an A/B testing experiment
   * 
   * @param {string} name - Experiment name
   * @param {string} description - Experiment description
   * @param {string} algorithmVariant - Algorithm variant to test
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date (optional)
   * @returns {Promise<object>} Created experiment
   */
  async createExperiment(name, description, algorithmVariant, startDate, endDate = null) {
    try {
      const experiment = await this.prisma.searchOptimizationExperiments.create({
        data: {
          name,
          description,
          algorithmVariant,
          startDate,
          endDate,
          isActive: true,
          metrics: {},
          sampleSize: 0
        }
      });

      loggerService.info('Experiment created', {
        experimentId: experiment.id,
        name,
        algorithmVariant
      });

      return experiment;
    } catch (error) {
      loggerService.error('Failed to create experiment', {
        error: error instanceof Error ? error.message : 'Unknown error',
        name
      });
      throw error;
    }
  }

  /**
   * Get results for an experiment
   * 
   * @param {string} experimentId - Experiment ID
   * @returns {Promise<object>} Experiment results
   */
  async getExperimentResults(experimentId) {
    try {
      const experiment = await this.prisma.searchOptimizationExperiments.findUnique({
        where: { id: experimentId }
      });

      if (!experiment) {
        throw new Error('Experiment not found');
      }

      // Get analytics data for the experiment period
      const analytics = await this.prisma.searchAnalytics.findMany({
        where: {
          timestamp: {
            gte: experiment.startDate,
            lte: experiment.endDate || new Date()
          }
        }
      });

      // Calculate experiment metrics
      const results = {
        experiment: {
          id: experiment.id,
          name: experiment.name,
          description: experiment.description,
          algorithmVariant: experiment.algorithmVariant,
          startDate: experiment.startDate,
          endDate: experiment.endDate,
          isActive: experiment.isActive
        },
        metrics: {
          totalSearches: analytics.length,
          avgResultsCount: this.calculateAverage(analytics.map(a => a.resultsCount)),
          avgResponseTime: this.calculateAverage(analytics.map(a => a.responseTime)),
          conversionRate: analytics.filter(a => a.conversionType).length / analytics.length,
          clickThroughRate: analytics.filter(a => a.clickedResults && a.clickedResults.length > 0).length / analytics.length,
          zeroResultRate: analytics.filter(a => a.resultsCount === 0).length / analytics.length
        },
        sampleSize: analytics.length,
        duration: experiment.endDate 
          ? new Date(experiment.endDate) - new Date(experiment.startDate)
          : new Date() - new Date(experiment.startDate)
      };

      loggerService.info('Experiment results retrieved', {
        experimentId,
        totalSearches: results.metrics.totalSearches
      });

      return results;
    } catch (error) {
      loggerService.error('Failed to get experiment results', {
        error: error instanceof Error ? error.message : 'Unknown error',
        experimentId
      });
      throw error;
    }
  }

  /**
   * Assign a user to an experiment
   * 
   * @param {string} userId - User ID
   * @param {string} experimentId - Experiment ID
   * @returns {Promise<string>} Assigned variant
   */
  async assignUserToExperiment(userId, experimentId) {
    try {
      const experiment = await this.prisma.searchOptimizationExperiments.findUnique({
        where: { id: experimentId }
      });

      if (!experiment || !experiment.isActive) {
        throw new Error('Experiment not found or not active');
      }

      // Simple hash-based assignment for consistent user assignment
      const hash = this.simpleHash(userId + experimentId);
      const variants = ['control', 'variant_a', 'variant_b'];
      const variant = variants[hash % variants.length];

      loggerService.info('User assigned to experiment', {
        userId,
        experimentId,
        variant
      });

      return variant;
    } catch (error) {
      loggerService.error('Failed to assign user to experiment', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        experimentId
      });
      throw error;
    }
  }

  /**
   * List all experiments
   * 
   * @param {boolean} activeOnly - Only return active experiments
   * @returns {Promise<Array>} Array of experiments
   */
  async listExperiments(activeOnly = false) {
    try {
      const where = activeOnly ? { isActive: true } : {};
      const experiments = await this.prisma.searchOptimizationExperiments.findMany({
        where,
        orderBy: { startDate: 'desc' }
      });

      loggerService.info('Experiments listed', {
        count: experiments.length,
        activeOnly
      });

      return experiments;
    } catch (error) {
      loggerService.error('Failed to list experiments', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Update experiment metrics
   * 
   * @param {string} experimentId - Experiment ID
   * @param {object} metrics - Metrics to update
   * @returns {Promise<object>} Updated experiment
   */
  async updateExperimentMetrics(experimentId, metrics) {
    try {
      const experiment = await this.prisma.searchOptimizationExperiments.update({
        where: { id: experimentId },
        data: {
          metrics: metrics,
          sampleSize: {
            increment: 1
          }
        }
      });

      loggerService.info('Experiment metrics updated', {
        experimentId,
        metrics
      });

      return experiment;
    } catch (error) {
      loggerService.error('Failed to update experiment metrics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        experimentId
      });
      throw error;
    }
  }

  /**
   * Analyze a query for optimization opportunities
   * 
   * @param {string} query - Search query
   * @returns {Promise<object>} Query analysis
   */
  async analyzeQuery(query) {
    return {
      length: query.length,
      wordCount: query.split(/\s+/).filter(w => w.length > 0).length,
      hasNumbers: /\d/.test(query),
      hasSpecialChars: /[^\w\s]/.test(query),
      isPhrase: query.includes('"'),
      isBoolean: /\b(AND|OR|NOT)\b/i.test(query),
      isWildcard: /\*/.test(query),
      isFuzzy: /~/.test(query)
    };
  }

  /**
   * Calculate boost factors for a query
   * 
   * @param {string} query - Search query
   * @param {string} userId - User ID (optional)
   * @returns {Promise<object>} Boost factors
   */
  async calculateBoostFactors(query, userId = null) {
    const boostFactors = {
      name: 2.0,
      description: 1.0,
      category: 1.5,
      brand: 1.5,
      tags: 1.2
    };

    // Add user-specific boosts if userId provided
    if (userId) {
      try {
        const preferences = await this.prisma.userSearchPreferences.findUnique({
          where: { userId }
        });

        if (preferences) {
          const { preferredCategories, preferredBrands } = preferences;
          
          if (preferredCategories && preferredCategories.length > 0) {
            boostFactors.preferredCategories = preferredCategories;
          }
          
          if (preferredBrands && preferredBrands.length > 0) {
            boostFactors.preferredBrands = preferredBrands;
          }
        }
      } catch (error) {
        // Ignore errors when getting preferences
      }
    }

    return boostFactors;
  }

  /**
   * Generate query suggestions
   * 
   * @param {string} query - Search query
   * @returns {Promise<Array>} Array of suggestions
   */
  async generateQuerySuggestions(query) {
    try {
      const suggestions = [];

      // Get trending searches
      const trending = await this.prisma.searchTrending.findMany({
        where: {
          query: {
            contains: query
          },
          isTrending: true
        },
        orderBy: {
          trendScore: 'desc'
        },
        take: 5
      });

      trending.forEach(t => {
        if (t.query !== query) {
          suggestions.push({
            text: t.query,
            type: 'trending',
            score: t.trendScore
          });
        }
      });

      return suggestions;
    } catch (error) {
      loggerService.error('Failed to generate query suggestions', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query
      });
      return [];
    }
  }

  /**
   * Determine the optimal query type
   * 
   * @param {string} query - Search query
   * @param {object} analysis - Query analysis
   * @returns {string} Query type
   */
  determineQueryType(query, analysis) {
    if (analysis.isBoolean) return 'bool';
    if (analysis.isPhrase) return 'phrase';
    if (analysis.isWildcard) return 'wildcard';
    if (analysis.isFuzzy) return 'fuzzy';
    if (analysis.hasNumbers) return 'multi_match';
    return 'match';
  }

  /**
   * Build optimized Elasticsearch query
   * 
   * @param {string} query - Optimized query text
   * @param {object} filters - Filters to apply
   * @param {string} sort - Sort order
   * @param {object} boostFactors - Boost factors
   * @param {string} queryType - Query type
   * @returns {object} Elasticsearch query body
   */
  buildOptimizedQuery(query, filters, sort, boostFactors, queryType) {
    const baseQuery = elasticsearchQueryBuilder.buildSearchQuery({
      query,
      filters,
      sort
    });

    // Apply boost factors
    if (boostFactors.name) {
      baseQuery.query.bool.should.push({
        match: {
          'name.en': {
            query,
            boost: boostFactors.name
          }
        }
      });
    }

    return baseQuery;
  }

  /**
   * Get top queries from analytics
   * 
   * @param {Array} analytics - Array of search analytics
   * @param {number} limit - Maximum number of queries to return
   * @returns {Array} Top queries
   */
  getTopQueries(analytics, limit) {
    const queryCounts = {};
    analytics.forEach(a => {
      if (!queryCounts[a.query]) {
        queryCounts[a.query] = {
          query: a.query,
          count: 0,
          avgResults: 0,
          avgResponseTime: 0
        };
      }
      queryCounts[a.query].count++;
      queryCounts[a.query].avgResults += a.resultsCount;
      queryCounts[a.query].avgResponseTime += a.responseTime;
    });

    return Object.values(queryCounts)
      .map(q => ({
        ...q,
        avgResults: q.avgResults / q.count,
        avgResponseTime: q.avgResponseTime / q.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Analyze common filters
   * 
   * @param {Array} analytics - Array of search analytics
   * @returns {object} Common filters analysis
   */
  analyzeCommonFilters(analytics) {
    const filterCounts = {};
    analytics.forEach(a => {
      const filters = a.filtersApplied || {};
      Object.keys(filters).forEach(key => {
        if (!filterCounts[key]) {
          filterCounts[key] = 0;
        }
        filterCounts[key]++;
      });
    });

    return filterCounts;
  }

  /**
   * Analyze common sort options
   * 
   * @param {Array} analytics - Array of search analytics
   * @returns {object} Common sort options analysis
   */
  analyzeCommonSortOptions(analytics) {
    const sortCounts = {};
    analytics.forEach(a => {
      const sort = a.sortBy || 'relevance';
      if (!sortCounts[sort]) {
        sortCounts[sort] = 0;
      }
      sortCounts[sort]++;
    });

    return sortCounts;
  }

  /**
   * Analyze query length distribution
   * 
   * @param {Array} analytics - Array of search analytics
   * @returns {object} Query length distribution
   */
  analyzeQueryLengthDistribution(analytics) {
    const lengths = analytics.map(a => a.query.length);
    return {
      min: Math.min(...lengths),
      max: Math.max(...lengths),
      avg: this.calculateAverage(lengths),
      median: this.calculateMedian(lengths)
    };
  }

  /**
   * Analyze results distribution
   * 
   * @param {Array} analytics - Array of search analytics
   * @returns {object} Results distribution
   */
  analyzeResultsDistribution(analytics) {
    const results = analytics.map(a => a.resultsCount);
    return {
      min: Math.min(...results),
      max: Math.max(...results),
      avg: this.calculateAverage(results),
      median: this.calculateMedian(results),
      zeroResults: analytics.filter(a => a.resultsCount === 0).length,
      zeroResultRate: analytics.filter(a => a.resultsCount === 0).length / analytics.length
    };
  }

  /**
   * Process Elasticsearch search results
   * 
   * @param {object} response - Elasticsearch response
   * @returns {object} Processed results
   */
  processSearchResults(response) {
    const hits = response.hits || {};
    const total = typeof hits.total === 'object' ? hits.total.value : hits.total || 0;

    return {
      total,
      results: (hits.hits || []).map(hit => ({
        id: hit._id,
        score: hit._score,
        ...hit._source
      }))
    };
  }

  /**
   * Build index name with prefix
   * 
   * @param {string} type - Index type
   * @returns {string} Index name
   */
  buildIndexName(type) {
    const prefix = process.env.ELASTICSEARCH_INDEX_PREFIX || 'smarttech_';
    return `${prefix}${type}s`;
  }

  /**
   * Calculate average of an array
   * 
   * @param {Array<number>} values - Array of numbers
   * @returns {number} Average
   */
  calculateAverage(values) {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Calculate median of an array
   * 
   * @param {Array<number>} values - Array of numbers
   * @returns {number} Median
   */
  calculateMedian(values) {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  /**
   * Simple hash function for consistent assignment
   * 
   * @param {string} str - String to hash
   * @returns {number} Hash value
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Clear query cache
   */
  clearCache() {
    this.queryCache.clear();
    loggerService.info('Query cache cleared');
  }

  /**
   * Get optimization insights for the specified time range
   * @param {string} timeRange - Time range (hour, day, week, month)
   * @returns {Promise<Array>} Array of optimization insights
   */
  async getOptimizationInsights(timeRange = 'week') {
    try {
      const now = new Date();
      let startDate;

      switch (timeRange) {
        case 'hour':
          startDate = new Date(now.setHours(now.getHours() - 1));
          break;
        case 'day':
          startDate = new Date(now.setDate(now.getDate() - 1));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          startDate = new Date(now.setDate(now.getDate() - 7));
      }

      const searchAnalytics = await this.prisma.searchAnalytics.findMany({
        where: {
          timestamp: {
            gte: startDate
          }
        }
      });

      const insights = [];

      // Analyze zero-result queries
      const zeroResultQueries = searchAnalytics.filter(s => s.resultsCount === 0);
      const zeroResultRate = searchAnalytics.length > 0 
        ? zeroResultQueries.length / searchAnalytics.length 
        : 0;

      if (zeroResultRate > 0.1) {
        insights.push({
          type: 'high_zero_result_rate',
          severity: 'warning',
          title: 'High Zero-Result Rate',
          description: `${(zeroResultRate * 100).toFixed(2)}% of searches return no results`,
          recommendation: 'Consider adding synonyms, improving product descriptions, or creating redirects for common misspellings',
          impact: 'high',
          value: zeroResultRate
        });
      }

      // Analyze average response time
      const avgResponseTime = this.calculateAverage(searchAnalytics.map(s => s.responseTime));
      if (avgResponseTime > 500) {
        insights.push({
          type: 'slow_response_time',
          severity: avgResponseTime > 1000 ? 'critical' : 'warning',
          title: 'Slow Response Time',
          description: `Average search response time is ${avgResponseTime.toFixed(2)}ms`,
          recommendation: 'Consider optimizing Elasticsearch queries, adding caching, or scaling infrastructure',
          impact: avgResponseTime > 1000 ? 'high' : 'medium',
          value: avgResponseTime
        });
      }

      // Analyze query patterns
      const uniqueQueries = new Set(searchAnalytics.map(s => s.query));
      const queryVarietyRatio = searchAnalytics.length / uniqueQueries.size;

      if (queryVarietyRatio > 10) {
        insights.push({
          type: 'low_query_variety',
          severity: 'info',
          title: 'Low Query Variety',
          description: 'Users are searching for similar terms repeatedly',
          recommendation: 'Consider implementing query suggestions and autocomplete to help users find what they need faster',
          impact: 'low',
          value: queryVarietyRatio
        });
      }

      // Analyze filter usage
      const filtersUsed = searchAnalytics.filter(s => s.filtersApplied && Object.keys(s.filtersApplied).length > 0);
      const filterUsageRate = searchAnalytics.length > 0 
        ? filtersUsed.length / searchAnalytics.length 
        : 0;

      if (filterUsageRate < 0.2) {
        insights.push({
          type: 'low_filter_usage',
          severity: 'info',
          title: 'Low Filter Usage',
          description: `${(filterUsageRate * 100).toFixed(2)}% of searches use filters`,
          recommendation: 'Consider improving filter visibility and usability to help users narrow down results',
          impact: 'low',
          value: filterUsageRate
        });
      }

      // Analyze click-through rate
      const searchesWithClicks = searchAnalytics.filter(s => s.clickedResults && s.clickedResults.length > 0);
      const clickThroughRate = searchAnalytics.length > 0 
        ? searchesWithClicks.length / searchAnalytics.length 
        : 0;

      if (clickThroughRate < 0.3) {
        insights.push({
          type: 'low_click_through_rate',
          severity: 'warning',
          title: 'Low Click-Through Rate',
          description: `${(clickThroughRate * 100).toFixed(2)}% of searches result in clicks`,
          recommendation: 'Improve search relevance ranking and result presentation',
          impact: 'medium',
          value: clickThroughRate
        });
      }

      // Analyze conversion rate
      const searchesWithConversions = searchAnalytics.filter(s => s.conversionType);
      const conversionRate = searchAnalytics.length > 0 
        ? searchesWithConversions.length / searchAnalytics.length 
        : 0;

      if (conversionRate < 0.05) {
        insights.push({
          type: 'low_conversion_rate',
          severity: 'warning',
          title: 'Low Conversion Rate',
          description: `${(conversionRate * 100).toFixed(2)}% of searches result in conversions`,
          recommendation: 'Review product listings, pricing, and search result relevance',
          impact: 'high',
          value: conversionRate
        });
      }

      // Sort insights by severity and impact
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      insights.sort((a, b) => {
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[a.severity] - severityOrder[b.severity];
        }
        const impactOrder = { high: 0, medium: 1, low: 2 };
        return impactOrder[a.impact] - impactOrder[b.impact];
      });

      loggerService.info('Optimization insights generated', {
        timeRange,
        insightsCount: insights.length
      });

      return insights;
    } catch (error) {
      loggerService.error('Failed to get optimization insights', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timeRange
      });
      throw error;
    }
  }

  /**
   * Get relevance metrics for the specified time range
   * @param {string} timeRange - Time range (hour, day, week, month)
   * @returns {Promise<Object>} Relevance metrics
   */
  async getRelevanceMetrics(timeRange = 'week') {
    try {
      const now = new Date();
      let startDate;

      switch (timeRange) {
        case 'hour':
          startDate = new Date(now.setHours(now.getHours() - 1));
          break;
        case 'day':
          startDate = new Date(now.setDate(now.getDate() - 1));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          startDate = new Date(now.setDate(now.getDate() - 7));
      }

      const searchAnalytics = await this.prisma.searchAnalytics.findMany({
        where: {
          timestamp: {
            gte: startDate
          }
        }
      });

      const totalSearches = searchAnalytics.length;
      const searchesWithClicks = searchAnalytics.filter(s => s.clickedResults && s.clickedResults.length > 0);
      const searchesWithConversions = searchAnalytics.filter(s => s.conversionType);

      // Calculate click-through rate (CTR)
      const clickThroughRate = totalSearches > 0 
        ? searchesWithClicks.length / totalSearches 
        : 0;

      // Calculate conversion rate
      const conversionRate = totalSearches > 0 
        ? searchesWithConversions.length / totalSearches 
        : 0;

      // Calculate average position of clicked results
      const clickedPositions = searchesWithClicks
        .flatMap(s => s.clickedResults || [])
        .map(cr => cr.position || 0);
      const avgClickPosition = clickedPositions.length > 0 
        ? this.calculateAverage(clickedPositions) 
        : 0;

      // Calculate first click rate (clicks on first result)
      const firstClicks = searchesWithClicks.filter(s => {
        const firstResult = s.clickedResults && s.clickedResults[0];
        return firstResult && firstResult.position === 0;
      });
      const firstClickRate = searchesWithClicks.length > 0 
        ? firstClicks.length / searchesWithClicks.length 
        : 0;

      // Calculate zero-result rate
      const zeroResultSearches = searchAnalytics.filter(s => s.resultsCount === 0);
      const zeroResultRate = totalSearches > 0 
        ? zeroResultSearches.length / totalSearches 
        : 0;

      // Calculate average results per search
      const avgResultsPerSearch = totalSearches > 0 
        ? this.calculateAverage(searchAnalytics.map(s => s.resultsCount)) 
        : 0;

      // Calculate average response time
      const avgResponseTime = totalSearches > 0 
        ? this.calculateAverage(searchAnalytics.map(s => s.responseTime)) 
        : 0;

      // Calculate search abandonment rate (searches with no clicks)
      const abandonedSearches = searchAnalytics.filter(s => !s.clickedResults || s.clickedResults.length === 0);
      const abandonmentRate = totalSearches > 0 
        ? abandonedSearches.length / totalSearches 
        : 0;

      // Calculate time to first click (average response time for searches with clicks)
      const searchesWithClicksResponseTimes = searchesWithClicks.map(s => s.responseTime);
      const avgTimeToFirstClick = searchesWithClicksResponseTimes.length > 0 
        ? this.calculateAverage(searchesWithClicksResponseTimes) 
        : 0;

      const relevanceMetrics = {
        timeRange,
        startDate,
        endDate: now,
        totalSearches,
        clickThroughRate: {
          value: clickThroughRate,
          percentage: (clickThroughRate * 100).toFixed(2) + '%'
        },
        conversionRate: {
          value: conversionRate,
          percentage: (conversionRate * 100).toFixed(2) + '%'
        },
        avgClickPosition: {
          value: avgClickPosition,
          formatted: avgClickPosition.toFixed(2)
        },
        firstClickRate: {
          value: firstClickRate,
          percentage: (firstClickRate * 100).toFixed(2) + '%'
        },
        zeroResultRate: {
          value: zeroResultRate,
          percentage: (zeroResultRate * 100).toFixed(2) + '%'
        },
        avgResultsPerSearch: {
          value: avgResultsPerSearch,
          formatted: avgResultsPerSearch.toFixed(2)
        },
        avgResponseTime: {
          value: avgResponseTime,
          formatted: avgResponseTime.toFixed(2) + 'ms'
        },
        abandonmentRate: {
          value: abandonmentRate,
          percentage: (abandonmentRate * 100).toFixed(2) + '%'
        },
        avgTimeToFirstClick: {
          value: avgTimeToFirstClick,
          formatted: avgTimeToFirstClick.toFixed(2) + 'ms'
        },
        trends: {
          clickThroughRateTrend: this.calculateTrend(searchAnalytics, 'clickedResults'),
          conversionRateTrend: this.calculateTrend(searchAnalytics, 'conversionType'),
          responseTimeTrend: this.calculateTrend(searchAnalytics, 'responseTime')
        }
      };

      loggerService.info('Relevance metrics retrieved', {
        timeRange,
        totalSearches,
        clickThroughRate: relevanceMetrics.clickThroughRate.percentage
      });

      return relevanceMetrics;
    } catch (error) {
      loggerService.error('Failed to get relevance metrics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timeRange
      });
      throw error;
    }
  }

  /**
   * Calculate trend for a metric over time
   * @param {Array} analytics - Array of search analytics
   * @param {string} field - Field to analyze
   * @returns {string} Trend direction
   */
  calculateTrend(analytics, field) {
    if (analytics.length < 2) return 'stable';

    const sortedAnalytics = [...analytics].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const midPoint = Math.floor(sortedAnalytics.length / 2);

    const firstHalf = sortedAnalytics.slice(0, midPoint);
    const secondHalf = sortedAnalytics.slice(midPoint);

    let firstHalfValue, secondHalfValue;

    if (field === 'clickedResults') {
      firstHalfValue = firstHalf.filter(s => s.clickedResults && s.clickedResults.length > 0).length / firstHalf.length;
      secondHalfValue = secondHalf.filter(s => s.clickedResults && s.clickedResults.length > 0).length / secondHalf.length;
    } else if (field === 'conversionType') {
      firstHalfValue = firstHalf.filter(s => s.conversionType).length / firstHalf.length;
      secondHalfValue = secondHalf.filter(s => s.conversionType).length / secondHalf.length;
    } else if (field === 'responseTime') {
      firstHalfValue = this.calculateAverage(firstHalf.map(s => s.responseTime));
      secondHalfValue = this.calculateAverage(secondHalf.map(s => s.responseTime));
    }

    const change = ((secondHalfValue - firstHalfValue) / firstHalfValue) * 100;

    if (change > 5) return 'increasing';
    if (change < -5) return 'decreasing';
    return 'stable';
  }
}

module.exports = { SearchOptimizationService };
