/**
 * Elasticsearch Analyzers Configuration
 * 
 * This module defines custom analyzers for the Smart Tech B2C e-commerce platform,
 * optimized for the Bangladesh market with support for English and Bengali languages.
 */

const { loggerService } = require('../logger');

/**
 * Edge n-gram filter for autocomplete functionality
 * Generates n-grams from the beginning of words for prefix matching
 */
const edgeNGramFilter = {
  type: 'edge_ngram',
  min_gram: 2,
  max_gram: 20,
  side: 'front'
};

/**
 * Lowercase filter for case-insensitive search
 */
const lowercaseFilter = {
  type: 'lowercase'
};

/**
 * Standard tokenizer for general text tokenization
 */
const standardTokenizer = {
  type: 'standard'
};

/**
 * English stopword filter
 * Removes common English words that don't add search value
 */
const englishStopFilter = {
  type: 'stop',
  stopwords: '_english_'
};

/**
 * Bengali stopword filter
 * Removes common Bengali words that don't add search value
 */
const bengaliStopFilter = {
  type: 'stop',
  stopwords: '_bengali_'
};

/**
 * Stemmer filter for English language
 * Reduces words to their root form
 */
const englishStemmerFilter = {
  type: 'stemmer',
  language: 'english'
};

/**
 * Autocomplete analyzer
 * Uses standard tokenizer with lowercase and edge n-gram filter
 * Optimized for type-ahead search functionality
 */
const autocompleteAnalyzer = {
  type: 'custom',
  tokenizer: 'standard',
  filter: [
    'lowercase',
    'autocomplete_edge_ngram'
  ]
};

/**
 * English analyzer
 * Uses standard tokenizer with English stopwords and stemming
 * Optimized for English language search
 */
const englishAnalyzer = {
  type: 'custom',
  tokenizer: 'standard',
  filter: [
    'lowercase',
    'english_stop',
    'english_stemmer'
  ]
};

/**
 * Bengali analyzer
 * Uses standard tokenizer with Bengali stopwords
 * Optimized for Bengali language search
 */
const bengaliAnalyzer = {
  type: 'custom',
  tokenizer: 'standard',
  filter: [
    'lowercase',
    'bengali_stop'
  ]
};

/**
 * Keyword analyzer for exact matching
 * Treats entire input as a single token
 */
const keywordAnalyzer = {
  type: 'keyword'
};

/**
 * Standard analyzer with lowercase only
 * Used for general text search without stemming
 */
const standardLowercaseAnalyzer = {
  type: 'custom',
  tokenizer: 'standard',
  filter: [
    'lowercase'
  ]
};

/**
 * Complete analysis configuration
 * Combines all analyzers, filters, and tokenizers
 */
const analysisConfiguration = {
  analysis: {
    analyzer: {
      autocomplete: autocompleteAnalyzer,
      english: englishAnalyzer,
      bengali: bengaliAnalyzer,
      keyword: keywordAnalyzer,
      standard_lowercase: standardLowercaseAnalyzer
    },
    filter: {
      autocomplete_edge_ngram: edgeNGramFilter,
      english_stop: englishStopFilter,
      bengali_stop: bengaliStopFilter,
      english_stemmer: englishStemmerFilter
    },
    tokenizer: {
      standard: standardTokenizer
    }
  }
};

/**
 * Get analyzer configuration by name
 * @param {string} analyzerName - Name of the analyzer
 * @returns {Object} Analyzer configuration
 */
function getAnalyzer(analyzerName) {
  const analyzers = {
    autocomplete: autocompleteAnalyzer,
    english: englishAnalyzer,
    bengali: bengaliAnalyzer,
    keyword: keywordAnalyzer,
    standard_lowercase: standardLowercaseAnalyzer
  };

  const analyzer = analyzers[analyzerName];
  
  if (!analyzer) {
    loggerService.error(`Unknown analyzer requested: ${analyzerName}`);
    throw new Error(`Unknown analyzer: ${analyzerName}`);
  }

  return analyzer;
}

/**
 * Get all analyzer configurations
 * @returns {Object} All analyzer configurations
 */
function getAllAnalyzers() {
  return {
    autocomplete: autocompleteAnalyzer,
    english: englishAnalyzer,
    bengali: bengaliAnalyzer,
    keyword: keywordAnalyzer,
    standard_lowercase: standardLowercaseAnalyzer
  };
}

/**
 * Get complete analysis configuration
 * @returns {Object} Complete analysis configuration with filters and tokenizers
 */
function getAnalysisConfiguration() {
  return analysisConfiguration;
}

/**
 * Validate analyzer structure
 * @param {Object} analyzer - The analyzer to validate
 * @returns {boolean} True if valid, false otherwise
 */
function validateAnalyzer(analyzer) {
  if (!analyzer || typeof analyzer !== 'object') {
    loggerService.error('Analyzer is not an object');
    return false;
  }

  if (!analyzer.type) {
    loggerService.error('Analyzer does not have a type');
    return false;
  }

  if (analyzer.type === 'custom') {
    if (!analyzer.tokenizer) {
      loggerService.error('Custom analyzer does not have a tokenizer');
      return false;
    }
  }

  return true;
}

/**
 * Test analyzer configuration
 * @param {string} text - Text to analyze
 * @param {string} analyzerName - Name of the analyzer to test
 * @returns {Object} Test result
 */
function testAnalyzer(text, analyzerName) {
  try {
    const analyzer = getAnalyzer(analyzerName);
    
    loggerService.info(`Testing analyzer: ${analyzerName}`, {
      text,
      analyzer: JSON.stringify(analyzer)
    });

    return {
      success: true,
      analyzer: analyzerName,
      text,
      configuration: analyzer
    };

  } catch (error) {
    loggerService.error(`Failed to test analyzer: ${analyzerName}`, {
      error: error.message,
      text
    });

    return {
      success: false,
      error: error.message,
      analyzer: analyzerName
    };
  }
}

/**
 * Get analyzer description
 * @param {string} analyzerName - Name of the analyzer
 * @returns {Object} Analyzer description
 */
function getAnalyzerDescription(analyzerName) {
  const descriptions = {
    autocomplete: {
      name: 'Autocomplete Analyzer',
      description: 'Optimized for type-ahead search with edge n-gram tokenization',
      useCase: 'Product name autocomplete, search suggestions',
      components: ['standard tokenizer', 'lowercase filter', 'edge_ngram filter (2-20)']
    },
    english: {
      name: 'English Analyzer',
      description: 'Optimized for English language search with stopwords and stemming',
      useCase: 'English product descriptions, names, search queries',
      components: ['standard tokenizer', 'lowercase filter', 'English stopwords', 'English stemmer']
    },
    bengali: {
      name: 'Bengali Analyzer',
      description: 'Optimized for Bengali language search with stopwords',
      useCase: 'Bengali product descriptions, names, search queries',
      components: ['standard tokenizer', 'lowercase filter', 'Bengali stopwords']
    },
    keyword: {
      name: 'Keyword Analyzer',
      description: 'Treats entire input as a single token for exact matching',
      useCase: 'Exact matches, IDs, SKUs, aggregations',
      components: ['keyword tokenizer']
    },
    standard_lowercase: {
      name: 'Standard Lowercase Analyzer',
      description: 'Standard tokenization with lowercase conversion',
      useCase: 'General text search without stemming',
      components: ['standard tokenizer', 'lowercase filter']
    }
  };

  const description = descriptions[analyzerName];
  
  if (!description) {
    loggerService.error(`Unknown analyzer requested: ${analyzerName}`);
    throw new Error(`Unknown analyzer: ${analyzerName}`);
  }

  return description;
}

/**
 * Get all analyzer descriptions
 * @returns {Object} All analyzer descriptions
 */
function getAllAnalyzerDescriptions() {
  return {
    autocomplete: getAnalyzerDescription('autocomplete'),
    english: getAnalyzerDescription('english'),
    bengali: getAnalyzerDescription('bengali'),
    keyword: getAnalyzerDescription('keyword'),
    standard_lowercase: getAnalyzerDescription('standard_lowercase')
  };
}

module.exports = {
  // Individual components
  edgeNGramFilter,
  lowercaseFilter,
  standardTokenizer,
  englishStopFilter,
  bengaliStopFilter,
  englishStemmerFilter,
  
  // Analyzers
  autocompleteAnalyzer,
  englishAnalyzer,
  bengaliAnalyzer,
  keywordAnalyzer,
  standardLowercaseAnalyzer,
  analysisConfiguration,
  
  // Functions
  getAnalyzer,
  getAllAnalyzers,
  getAnalysisConfiguration,
  validateAnalyzer,
  testAnalyzer,
  getAnalyzerDescription,
  getAllAnalyzerDescriptions
};
