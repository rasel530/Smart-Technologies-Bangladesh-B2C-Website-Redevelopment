/**
 * Elasticsearch Synonyms Management Service
 * 
 * This module provides synonym management for the Smart Tech B2C e-commerce platform,
 * optimized for the Bangladesh market with support for English and Bengali languages.
 */

const { loggerService } = require('../logger');

/**
 * Synonym dictionary for common product terms
 * Organized by category for better management
 */
const synonymDictionary = {
  // Computing devices
  computing: [
    'laptop, notebook, portable computer',
    'desktop, personal computer, pc',
    'tablet, tab, slate',
    'monitor, display, screen',
    'keyboard, input device',
    'mouse, pointing device',
    'printer, printing machine',
    'scanner, document scanner',
    'webcam, camera',
    'speaker, audio speaker',
    'headphone, earphone, headset',
    'microphone, mic'
  ],
  
  // Mobile devices
  mobile: [
    'mobile phone, smartphone, cell phone',
    'iphone, apple phone',
    'android phone, android',
    'charger, power adapter',
    'power bank, portable charger',
    'case, cover, phone case',
    'screen protector, glass protector',
    'earbuds, wireless earphones',
    'smartwatch, watch'
  ],
  
  // Audio and video
  audioVideo: [
    'television, tv, tv set',
    'led tv, led television',
    'smart tv, smart television',
    'home theater, surround sound',
    'soundbar, audio bar',
    'bluetooth speaker, wireless speaker',
    'headphones, earphones, headset',
    'earbuds, wireless earbuds',
    'microphone, mic',
    'amplifier, amp'
  ],
  
  // Appliances
  appliances: [
    'refrigerator, fridge, freezer',
    'washing machine, washer',
    'dryer, clothes dryer',
    'air conditioner, ac',
    'fan, ceiling fan',
    'iron, clothes iron',
    'vacuum cleaner, vacuum',
    'microwave, microwave oven',
    'oven, cooking oven',
    'toaster, bread toaster',
    'blender, mixer',
    'rice cooker, rice steamer',
    'water purifier, water filter',
    'geyser, water heater'
  ],
  
  // Camera and photography
  camera: [
    'camera, digital camera',
    'dslr, digital slr',
    'mirrorless camera, mirrorless',
    'action camera, action cam',
    'camcorder, video camera',
    'tripod, camera stand',
    'lens, camera lens',
    'flash, camera flash',
    'memory card, sd card',
    'camera bag, camera case'
  ],
  
  // Gaming
  gaming: [
    'game console, gaming console',
    'playstation, ps, sony console',
    'xbox, microsoft console',
    'nintendo switch, switch',
    'game controller, gamepad',
    'gaming mouse, gaming mouse',
    'gaming keyboard, gaming keyboard',
    'gaming headset, gaming headphones',
    'gaming monitor, gaming display'
  ],
  
  // Networking
  networking: [
    'router, wifi router',
    'modem, cable modem',
    'switch, network switch',
    'access point, wireless ap',
    'cable, network cable',
    'adapter, network adapter',
    'extender, wifi extender',
    'ethernet cable, lan cable'
  ],
  
  // Storage
  storage: [
    'hard drive, hdd',
    'solid state drive, ssd',
    'usb drive, flash drive',
    'memory card, sd card',
    'external hard drive, external hdd',
    'nas, network storage',
    'cloud storage, online storage'
  ],
  
  // Accessories
  accessories: [
    'cable, wire',
    'adapter, converter',
    'stand, holder',
    'mount, bracket',
    'case, cover',
    'protector, guard',
    'cleaning kit, cleaner',
    'battery, power cell',
    'screen protector, glass'
  ],
  
  // Bengali synonyms for common terms
  bengali: [
    'মোবাইল, ফোন, সেলফোন',
    'ল্যাপটপ, নোটবুক, কম্পিউটার',
    'টিভি, টেলিভিশন',
    'ফ্রিজ, রেফ্রিজারেটর',
    'এসি, এয়ার কন্ডিশনার',
    'ওয়াশিং মেশিন, কাপড় ধোয়ার মেশিন',
    'চার্জার, পাওয়ার অ্যাডাপ্টার',
    'ইয়ারবাড, ইয়ারফোন',
    'স্মার্টওয়াচ, ঘড়ি',
    'পাওয়ার ব্যাংক, পোর্টেবল চার্জার'
  ]
};

/**
 * Get all synonyms as a single array
 * @returns {Array<string>} All synonym rules
 */
function getAllSynonyms() {
  return Object.values(synonymDictionary).flat();
}

/**
 * Get synonyms for a specific category
 * @param {string} category - The category name
 * @returns {Array<string>} Synonym rules for the category
 */
function getCategorySynonyms(category) {
  const synonyms = synonymDictionary[category];
  
  if (!synonyms) {
    loggerService.error(`Unknown synonym category requested: ${category}`);
    throw new Error(`Unknown synonym category: ${category}`);
  }

  return synonyms;
}

/**
 * Get all synonym categories
 * @returns {Array<string>} All category names
 */
function getAllCategories() {
  return Object.keys(synonymDictionary);
}

/**
 * Search for synonyms containing a specific term
 * @param {string} term - The term to search for
 * @returns {Array<string>} Matching synonym rules
 */
function searchSynonyms(term) {
  const searchTerm = term.toLowerCase();
  const allSynonyms = getAllSynonyms();
  
  return allSynonyms.filter(synonymRule => 
    synonymRule.toLowerCase().includes(searchTerm)
  );
}

/**
 * Add new synonym rule to a category
 * @param {string} category - The category name
 * @param {string} synonymRule - The synonym rule to add
 * @returns {Object} Result of the operation
 */
function addSynonym(category, synonymRule) {
  try {
    if (!synonymDictionary[category]) {
      loggerService.error(`Cannot add synonym to unknown category: ${category}`);
      return {
        success: false,
        error: `Unknown category: ${category}`
      };
    }

    synonymDictionary[category].push(synonymRule);
    
    loggerService.info(`Added synonym rule to category: ${category}`, {
      rule: synonymRule
    });

    return {
      success: true,
      category,
      rule: synonymRule,
      totalRules: synonymDictionary[category].length
    };

  } catch (error) {
    loggerService.error(`Failed to add synonym rule`, {
      error: error.message,
      category,
      rule: synonymRule
    });

    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Remove synonym rule from a category
 * @param {string} category - The category name
 * @param {string} synonymRule - The synonym rule to remove
 * @returns {Object} Result of the operation
 */
function removeSynonym(category, synonymRule) {
  try {
    if (!synonymDictionary[category]) {
      loggerService.error(`Cannot remove synonym from unknown category: ${category}`);
      return {
        success: false,
        error: `Unknown category: ${category}`
      };
    }

    const index = synonymDictionary[category].indexOf(synonymRule);
    
    if (index === -1) {
      loggerService.warn(`Synonym rule not found in category: ${category}`, {
        rule: synonymRule
      });

      return {
        success: false,
        error: 'Synonym rule not found',
        category,
        rule: synonymRule
      };
    }

    synonymDictionary[category].splice(index, 1);
    
    loggerService.info(`Removed synonym rule from category: ${category}`, {
      rule: synonymRule
    });

    return {
      success: true,
      category,
      rule: synonymRule,
      totalRules: synonymDictionary[category].length
    };

  } catch (error) {
    loggerService.error(`Failed to remove synonym rule`, {
      error: error.message,
      category,
      rule: synonymRule
    });

    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get synonym filter configuration for Elasticsearch
 * @param {string} category - Optional category filter
 * @returns {Object} Synonym filter configuration
 */
function getSynonymFilterConfig(category = null) {
  const synonyms = category 
    ? getCategorySynonyms(category)
    : getAllSynonyms();

  return {
    type: 'synonym',
    synonyms: synonyms
  };
}

/**
 * Get analyzer configuration with synonyms
 * @param {string} baseAnalyzer - Base analyzer name
 * @param {string} category - Optional category filter
 * @returns {Object} Analyzer configuration with synonyms
 */
function getAnalyzerWithSynonyms(baseAnalyzer = 'standard', category = null) {
  const synonymFilter = getSynonymFilterConfig(category);
  
  return {
    type: 'custom',
    tokenizer: 'standard',
    filter: [
      'lowercase',
      'synonyms'
    ],
    char_filter: []
  };
}

/**
 * Validate synonym rule format
 * @param {string} synonymRule - The synonym rule to validate
 * @returns {boolean} True if valid, false otherwise
 */
function validateSynonymRule(synonymRule) {
  if (!synonymRule || typeof synonymRule !== 'string') {
    loggerService.error('Synonym rule must be a non-empty string');
    return false;
  }

  // Check for valid format: comma-separated terms
  const terms = synonymRule.split(',').map(t => t.trim());
  
  if (terms.length < 2) {
    loggerService.error('Synonym rule must have at least 2 terms', {
      rule: synonymRule
    });
    return false;
  }

  // Check for empty terms
  if (terms.some(t => t === '')) {
    loggerService.error('Synonym rule cannot have empty terms', {
      rule: synonymRule
    });
    return false;
  }

  return true;
}

/**
 * Export synonyms to file format
 * @returns {string} Synonyms in file format
 */
function exportSynonymsToFile() {
  return getAllSynonyms().join('\n');
}

/**
 * Import synonyms from file format
 * @param {string} content - File content with synonym rules
 * @param {string} category - Category to import to
 * @returns {Object} Import result
 */
function importSynonymsFromFile(content, category = 'custom') {
  try {
    const lines = content.split('\n').filter(line => line.trim());
    let successCount = 0;
    let failureCount = 0;
    const errors = [];

    // Create custom category if it doesn't exist
    if (!synonymDictionary[category]) {
      synonymDictionary[category] = [];
    }

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue; // Skip empty lines and comments
      }

      if (validateSynonymRule(trimmedLine)) {
        synonymDictionary[category].push(trimmedLine);
        successCount++;
      } else {
        failureCount++;
        errors.push(trimmedLine);
      }
    }

    loggerService.info(`Imported synonyms to category: ${category}`, {
      successCount,
      failureCount,
      totalRules: synonymDictionary[category].length
    });

    return {
      success: true,
      category,
      successCount,
      failureCount,
      errors,
      totalRules: synonymDictionary[category].length
    };

  } catch (error) {
    loggerService.error(`Failed to import synonyms from file`, {
      error: error.message
    });

    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get synonym statistics
 * @returns {Object} Synonym statistics
 */
function getSynonymStatistics() {
  const stats = {
    totalRules: 0,
    totalCategories: 0,
    categories: {}
  };

  for (const [category, rules] of Object.entries(synonymDictionary)) {
    stats.totalCategories++;
    stats.totalRules += rules.length;
    stats.categories[category] = {
      ruleCount: rules.length,
      totalTerms: rules.reduce((sum, rule) => {
        return sum + rule.split(',').length;
      }, 0)
    };
  }

  return stats;
}

/**
 * Get synonym dictionary (for testing purposes)
 * @returns {Object} The synonym dictionary
 */
function getSynonymDictionary() {
  return synonymDictionary;
}

module.exports = {
  // Data
  synonymDictionary,
  
  // Core functions
  getAllSynonyms,
  getCategorySynonyms,
  getAllCategories,
  searchSynonyms,
  
  // Management functions
  addSynonym,
  removeSynonym,
  
  // Configuration functions
  getSynonymFilterConfig,
  getAnalyzerWithSynonyms,
  
  // Utility functions
  validateSynonymRule,
  exportSynonymsToFile,
  importSynonymsFromFile,
  getSynonymStatistics,
  getSynonymDictionary
};
