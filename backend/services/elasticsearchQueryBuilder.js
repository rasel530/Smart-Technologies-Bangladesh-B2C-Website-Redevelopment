/**
 * Elasticsearch Query Builder Service (JavaScript version)
 * 
 * This module provides intelligent query building for Smart Tech B2C e-commerce platform,
 * including query parsing, normalization, fuzzy matching, relevance scoring with field boosting,
 * recency boosting, and popularity boosting.
 */

const { loggerService } = require('./logger');

/**
 * Default query builder configuration
 */
const DEFAULT_CONFIG = {
  fieldBoosts: {
    nameEn: 3.0,
    nameBn: 2.0,
    descriptionEn: 1.0,
    descriptionBn: 1.0,
    shortDescription: 1.0,
    sku: 3.0
  },
  fuzzy: {
    fuzziness: 'AUTO',
    prefixLength: 2,
    maxExpansions: 50
  },
  recencyBoost: {
    enabled: true,
    newProductDays: 30,
    boostFactor: 1.5
  },
  popularityBoost: {
    enabled: true,
    boostFactor: 1.3
  },
  minScore: 0.1
};

/**
 * Elasticsearch Query Builder class
 */
class ElasticsearchQueryBuilder {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Build search query from advanced search parameters
   * @param searchQuery - Advanced search query parameters
   * @returns Elasticsearch query DSL
   */
  buildSearchQuery(searchQuery) {
    const {
      query,
      categoryIds,
      brandIds,
      priceRange,
      specifications,
      inStockOnly,
      featuredOnly,
      newArrivalsOnly,
      bestSellersOnly,
      sort = 'relevance',
      page = 1,
      pageSize = 20,
      minScore,
      enableFuzzy = true,
      language = 'en'
    } = searchQuery;

    // Initialize query structure
    const esQuery = {
      query: {},
      from: (page - 1) * pageSize,
      size: pageSize,
      track_total_hits: true,
      track_scores: true,
      timeout: '2s',
      request_cache: true
    };

    // Build must clauses (text search)
    const mustClauses = [];

    // Add text search if query is provided
    if (query && query.trim().length > 0) {
      const normalizedQuery = this.normalizeQuery(query);
      const textQuery = this.buildTextQuery(normalizedQuery, enableFuzzy, language);
      mustClauses.push(textQuery);
    }

    // Build filter clauses
    const filterClauses = [];

    // Add category filters
    if (categoryIds && categoryIds.length > 0) {
      filterClauses.push({
        terms: { 'categories.id': categoryIds }
      });
    }

    // Add brand filters
    if (brandIds && brandIds.length > 0) {
      filterClauses.push({
        terms: { 'brand.id': brandIds }
      });
    }

    // Add price range filter
    if (priceRange) {
      const rangeQuery = { 'price.current': {} };
      if (priceRange.min !== undefined) {
        rangeQuery['price.current'].gte = priceRange.min;
      }
      if (priceRange.max !== undefined) {
        rangeQuery['price.current'].lte = priceRange.max;
      }
      filterClauses.push({ range: rangeQuery });
    }

    // Add specification filters
    if (specifications && specifications.length > 0) {
      specifications.forEach(spec => {
        if (spec.values && spec.values.length > 0) {
          filterClauses.push({
            bool: {
              should: spec.values.map(value => ({
                nested: {
                  path: 'specifications',
                  query: {
                    bool: {
                      must: [
                        { term: { 'specifications.name': spec.name } },
                        { term: { 'specifications.value': value } }
                      ]
                    }
                  }
                }
              }))
            }
          });
        }
      });
    }

    // Add stock filter
    if (inStockOnly) {
      filterClauses.push({
        range: { 'inventory.quantity': { gt: 0 } }
      });
    }

    // Add featured filter
    if (featuredOnly) {
      filterClauses.push({
        term: { 'flags.featured': true }
      });
    }

    // Add new arrivals filter
    if (newArrivalsOnly) {
      const newProductDate = new Date();
      newProductDate.setDate(newProductDate.getDate() - this.config.recencyBoost.newProductDays);
      filterClauses.push({
        range: { createdAt: { gte: newProductDate.toISOString() } }
      });
    }

    // Add best sellers filter
    if (bestSellersOnly) {
      filterClauses.push({
        term: { 'flags.bestSeller': true }
      });
    }

    // Build final query structure
    if (mustClauses.length > 0 || filterClauses.length > 0) {
      const boolQuery = {};

      if (mustClauses.length > 0) {
        boolQuery.must = mustClauses;
      }

      if (filterClauses.length > 0) {
        boolQuery.filter = filterClauses;
      }

      // Apply function score for boosting
      if (this.config.recencyBoost.enabled || this.config.popularityBoost.enabled) {
        esQuery.query = this.buildFunctionScoreQuery(boolQuery);
      } else {
        esQuery.query.bool = boolQuery;
      }
    }

    // Add minimum score
    const finalMinScore = minScore ?? this.config.minScore;
    if (finalMinScore > 0) {
      if (esQuery.query.function_score) {
        esQuery.query.function_score.min_score = finalMinScore;
      } else if (esQuery.query.bool) {
        esQuery.query.bool.min_score = finalMinScore;
      }
    }

    // Add sorting
    esQuery.sort = this.buildSortOption(sort);

    // Add aggregations
    esQuery.aggs = this.buildAggregationQuery(searchQuery);

    return esQuery;
  }

  /**
   * Build autocomplete query
   * @param query - Search query string
   * @param language - Language preference
   * @returns Elasticsearch query DSL
   */
  buildAutocompleteQuery(query, language = 'en') {
    const normalizedQuery = this.normalizeQuery(query);

    return {
      query: {
        bool: {
          should: [
            // Prefix match on name
            {
              prefix: {
                [`name.${language}`]: {
                  value: normalizedQuery,
                  case_insensitive: true,
                  boost: 3.0
                }
              }
            },
            // Prefix match on the other language
            {
              prefix: {
                [`name.${language === 'en' ? 'bn' : 'en'}`]: {
                  value: normalizedQuery,
                  case_insensitive: true,
                  boost: 2.0
                }
              }
            },
            // Fuzzy match on name
            {
              multi_match: {
                query: normalizedQuery,
                fields: [
                  `name.${language}^3.0`,
                  `name.${language === 'en' ? 'bn' : 'en'}^2.0`,
                  'sku^2.5'
                ],
                type: 'best_fields',
                fuzziness: this.config.fuzzy.fuzziness,
                prefix_length: this.config.fuzzy.prefixLength,
                operator: 'or'
              }
            }
          ],
          minimum_should_match: 1
        }
      },
      size: 10,
      track_total_hits: false,
      timeout: '1s'
    };
  }

  /**
   * Build suggestion query
   * @param query - Search query string
   * @returns Elasticsearch query DSL
   */
  buildSuggestionQuery(query) {
    const normalizedQuery = this.normalizeQuery(query);

    return {
      query: {
        bool: {
          should: [
            // Exact match with high boost
            {
              term: {
                'name.en.keyword': {
                  value: normalizedQuery,
                  boost: 5.0
                }
              }
            },
            // Fuzzy match on name
            {
              multi_match: {
                query: normalizedQuery,
                fields: [
                  'name.en^3.0',
                  'name.bn^2.0',
                  'description.en^1.0',
                  'description.bn^1.0'
                ],
                type: 'best_fields',
                fuzziness: this.config.fuzzy.fuzziness,
                prefix_length: this.config.fuzzy.prefixLength,
                operator: 'or'
              }
            },
            // Phrase match
            {
              multi_match: {
                query: normalizedQuery,
                fields: [
                  'name.en^2.0',
                  'name.bn^1.5'
                ],
                type: 'phrase',
                slop: 2
              }
            }
          ],
          minimum_should_match: 1
        }
      },
      size: 5,
      track_total_hits: false,
      timeout: '1s'
    };
  }

  /**
   * Build aggregation query for facets
   * @param filters - Filter parameters
   * @returns Elasticsearch query DSL
   */
  buildAggregationQuery(filters) {
    const filterClauses = [];

    // Add filters
    if (filters.categoryIds && filters.categoryIds.length > 0) {
      filterClauses.push({
        terms: { 'categories.id': filters.categoryIds }
      });
    }

    if (filters.brandIds && filters.brandIds.length > 0) {
      filterClauses.push({
        terms: { 'brand.id': filters.brandIds }
      });
    }

    if (filters.priceRange) {
      const rangeQuery = { 'price.current': {} };
      if (filters.priceRange.min !== undefined) {
        rangeQuery['price.current'].gte = filters.priceRange.min;
      }
      if (filters.priceRange.max !== undefined) {
        rangeQuery['price.current'].lte = filters.priceRange.max;
      }
      filterClauses.push({ range: rangeQuery });
    }

    if (filters.inStockOnly) {
      filterClauses.push({
        range: { 'inventory.quantity': { gt: 0 } }
      });
    }

    if (filters.featuredOnly) {
      filterClauses.push({
        term: { 'flags.featured': true }
      });
    }

    const query = {
      query: {},
      size: 0,
      aggs: this.buildAggregations(),
      timeout: '2s'
    };

    if (filterClauses.length > 0) {
      query.query.bool = { filter: filterClauses };
    }

    return query;
  }

  /**
   * Build text search query with multi-field search and boosting
   * @param query - Normalized query string
   * @param enableFuzzy - Enable fuzzy matching
   * @param language - Language preference
   * @returns Query clause
   */
  buildTextQuery(query, enableFuzzy, language) {
    const fields = [
      `name.${language}^${this.config.fieldBoosts.nameEn}`,
      `name.${language === 'en' ? 'bn' : 'en'}^${this.config.fieldBoosts.nameBn}`,
      `description.${language}^${this.config.fieldBoosts.descriptionEn}`,
      `description.${language === 'en' ? 'bn' : 'en'}^${this.config.fieldBoosts.descriptionBn}`,
      `shortDescription^${this.config.fieldBoosts.shortDescription}`,
      `sku^${this.config.fieldBoosts.sku}`
    ];

    const multiMatchQuery = {
      multi_match: {
        query,
        fields,
        type: 'best_fields',
        operator: 'or'
      }
    };

    // Add fuzzy matching if enabled
    if (enableFuzzy) {
      multiMatchQuery.multi_match.fuzziness = this.config.fuzzy.fuzziness;
      multiMatchQuery.multi_match.prefix_length = this.config.fuzzy.prefixLength;
      multiMatchQuery.multi_match.max_expansions = this.config.fuzzy.maxExpansions;
    }

    return multiMatchQuery;
  }

  /**
   * Build function score query for recency and popularity boosting
   * @param boolQuery - Bool query to wrap
   * @returns Function score query
   */
  buildFunctionScoreQuery(boolQuery) {
    const functions = [];

    // Add recency boosting
    if (this.config.recencyBoost.enabled) {
      const newProductDate = new Date();
      newProductDate.setDate(newProductDate.getDate() - this.config.recencyBoost.newProductDays);

      functions.push({
        gauss: {
          createdAt: {
            origin: 'now',
            scale: `${this.config.recencyBoost.newProductDays}d`,
            offset: '0d',
            decay: 0.5
          }
        },
        weight: this.config.recencyBoost.boostFactor
      });
    }

    // Add popularity boosting
    if (this.config.popularityBoost.enabled) {
      functions.push({
        field_value_factor: {
          field: 'stats.viewCount',
          factor: 0.1,
          modifier: 'log1p',
          missing: 0
        },
        weight: this.config.popularityBoost.boostFactor
      });
    }

    return {
      function_score: {
        query: boolQuery,
        functions,
        score_mode: 'sum',
        boost_mode: 'sum'
      }
    };
  }

  /**
   * Build sort option
   * @param sort - Sort option
   * @returns Sort array
   */
  buildSortOption(sort) {
    switch (sort) {
      case 'relevance':
        return ['_score', { _doc: 'desc' }];
      case 'price_asc':
        return [{ 'price.current': 'asc' }];
      case 'price_desc':
        return [{ 'price.current': 'desc' }];
      case 'rating':
        return [{ 'stats.averageRating': 'desc' }, { 'stats.reviewCount': 'desc' }];
      case 'newest':
        return [{ createdAt: 'desc' }];
      case 'name_asc':
        return [{ 'name.en.keyword': 'asc' }];
      case 'name_desc':
        return [{ 'name.en.keyword': 'desc' }];
      default:
        return ['_score'];
    }
  }

  /**
   * Build aggregations for faceted search
   * @returns Aggregations object
   */
  buildAggregations() {
    return {
      categories: {
        terms: {
          field: 'categories.id',
          size: 20
        },
        aggs: {
          category_name: {
            terms: {
              field: 'categories.name',
              size: 1
            }
          },
          category_slug: {
            terms: {
              field: 'categories.slug',
              size: 1
            }
          },
          parent_id: {
            terms: {
              field: 'categories.parentId',
              size: 1
            }
          },
          level: {
            terms: {
              field: 'categories.level',
              size: 1
            }
          }
        }
      },
      brands: {
        terms: {
          field: 'brand.id',
          size: 20
        },
        aggs: {
          brand_name: {
            terms: {
              field: 'brand.name',
              size: 1
            }
          },
          brand_slug: {
            terms: {
              field: 'brand.slug',
              size: 1
            }
          },
          is_featured: {
            terms: {
              field: 'brand.isFeatured',
              size: 1
            }
          }
        }
      },
      price_ranges: {
        range: {
          field: 'price.current',
          ranges: [
            { to: 500, key: 'under_500' },
            { from: 500, to: 1000, key: '500_1000' },
            { from: 1000, to: 2000, key: '1000_2000' },
            { from: 2000, to: 5000, key: '2000_5000' },
            { from: 5000, key: 'over_5000' }
          ]
        }
      },
      ratings: {
        range: {
          field: 'stats.averageRating',
          ranges: [
            { from: 4, key: '4_and_up' },
            { from: 3, to: 4, key: '3_to_4' },
            { from: 2, to: 3, key: '2_to_3' },
            { from: 1, to: 2, key: '1_to_2' }
          ]
        }
      },
      in_stock: {
        filter: {
          range: {
            'inventory.quantity': { gt: 0 }
          }
        }
      },
      specifications: {
        nested: {
          path: 'specifications'
        },
        aggs: {
          spec_names: {
            terms: {
              field: 'specifications.name',
              size: 50
            },
            aggs: {
              spec_values: {
                terms: {
                  field: 'specifications.value',
                  size: 20
                }
              }
            }
          }
        }
      }
    };
  }

  /**
   * Normalize query string
   * @param query - Query string to normalize
   * @returns Normalized query string
   */
  normalizeQuery(query) {
    let normalized = query.trim();

    // Remove special characters (except spaces, hyphens, and common punctuation)
    normalized = normalized.replace(/[^\w\s\-.,]/g, ' ');

    // Collapse multiple spaces
    normalized = normalized.replace(/\s+/g, ' ');

    // Trim again
    normalized = normalized.trim();

    return normalized;
  }

  /**
   * Get current configuration
   * @returns Current configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Update configuration
   * @param updates - Configuration updates
   */
  updateConfig(updates) {
    this.config = { ...this.config, ...updates };
    loggerService.info('Elasticsearch query builder configuration updated', { updates });
  }
}

// Export singleton instance
const elasticsearchQueryBuilder = new ElasticsearchQueryBuilder();

module.exports = { ElasticsearchQueryBuilder, elasticsearchQueryBuilder };
