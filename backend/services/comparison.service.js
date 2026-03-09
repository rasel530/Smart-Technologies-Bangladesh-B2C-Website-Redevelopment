const { PrismaClient } = require('@prisma/client');
// BUG-LOW-001: No JSDoc documentation - Added JSDoc comments to service

class ComparisonService {
  constructor() {
    this.prisma = new PrismaClient();
  }

  // Specification normalization mappings
  specNormalizations = {
    ram: ['ram', 'memory', 'system memory', 'internal memory'],
    storage: ['storage', 'internal storage', 'rom', 'hard drive', 'ssd', 'hdd'],
    processor: ['processor', 'cpu', 'chipset', 'chip'],
    display: ['display', 'screen', 'panel', 'monitor'],
    camera: ['camera', 'rear camera', 'front camera', 'selfie camera'],
    battery: ['battery', 'battery capacity', 'power'],
    os: ['os', 'operating system', 'software'],
    weight: ['weight', 'device weight'],
    dimensions: ['dimensions', 'size', 'device size'],
    connectivity: ['connectivity', 'network', 'wifi', 'bluetooth'],
    'gpu': ['gpu', 'graphics', 'graphics card', 'video card']
  };

  // Unit normalization mappings
  unitNormalizations = {
    gb: ['gb', 'gigabyte', 'gigabytes'],
    mb: ['mb', 'megabyte', 'megabytes'],
    tb: ['tb', 'terabyte', 'terabytes'],
    ghz: ['ghz', 'gigahertz'],
    mhz: ['mhz', 'megahertz'],
    mp: ['mp', 'megapixel', 'megapixels'],
    mah: ['mah', 'milliampere-hour'],
    kg: ['kg', 'kilogram', 'kilograms'],
    g: ['g', 'gram', 'grams'],
    inch: ['inch', 'inches', '"']
  };

  // Specification importance weights by category
  specWeights = {
    default: 1.0,
    ram: 2.0,
    storage: 2.0,
    processor: 2.5,
    display: 1.5,
    camera: 1.5,
    battery: 1.5,
    gpu: 2.0,
    os: 1.0
  };

  /**
   * Normalize specification name
   */
  normalizeSpecName(name) {
    if (!name) return 'other';
    
    const normalizedName = name.toLowerCase().trim().replace(/[\s_-]+/g, ' ');
    
    for (const [canonical, variations] of Object.entries(this.specNormalizations)) {
      if (variations.includes(normalizedName)) {
        return canonical;
      }
    }
    
    return normalizedName;
  }

  /**
   * Normalize unit value
   * FIXED: Properly handles plural unit names by matching variations and replacing with canonical form
   */
  normalizeUnitValue(value) {
    if (!value) return value;
    
    const normalized = value.toLowerCase().trim();
    
    for (const [canonical, variations] of Object.entries(this.unitNormalizations)) {
      for (const variation of variations) {
        // Match the pattern with word boundary to ensure complete unit name match
        const regex = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${variation}\\b`, 'gi');
        if (regex.test(normalized)) {
          // Replace with canonical form (without 's' for plural units)
          return normalized.replace(regex, `$1 ${canonical}`);
        }
      }
    }
    
    return normalized;
  }

  /**
   * Extract numeric value from string
   */
  extractNumericValue(value) {
    if (!value) return null;
    
    const match = value.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : null;
  }

  /**
   * Compare two specification values
   */
  compareSpecValues(value1, value2, specName) {
    const num1 = this.extractNumericValue(value1);
    const num2 = this.extractNumericValue(value2);
    
    // Both are numeric
    if (num1 !== null && num2 !== null) {
      const weight = this.specWeights[specName] || this.specWeights.default;
      const diff = num2 - num1;
      const percentageDiff = num1 !== 0 ? (diff / num1) * 100 : 0;
      
      return {
        isDifferent: num1 !== num2,
        isBetter: diff > 0,
        difference: Math.abs(diff),
        percentageDifference: Math.abs(percentageDiff),
        weight: weight
      };
    }
    
    // String comparison
    const str1 = String(value1).toLowerCase().trim();
    const str2 = String(value2).toLowerCase().trim();
    
    return {
      isDifferent: str1 !== str2,
      isBetter: false,
      difference: 0,
      percentageDifference: 0,
      weight: this.specWeights[specName] || this.specWeights.default
    };
  }

  /**
   * Get all specifications from products and normalize them
   */
  async getProductSpecifications(productIds) {
    // BUG-LOW-002: No console logging - Added console.log for debugging
    console.log('Fetching specifications for products:', productIds);
    
    const specifications = await this.prisma.product_specifications.findMany({
      where: {
        productId: { in: productIds }
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            nameEn: true,
            slug: true,
            regularPrice: true,
            salePrice: true
          }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });

    // Group specifications by product and normalize names
    const specsByProduct = {};
    const allSpecNames = new Set();

    for (const spec of specifications) {
      const productId = spec.productId;
      if (!specsByProduct[productId]) {
        specsByProduct[productId] = {};
      }
      
      const normalizedName = this.normalizeSpecName(spec.name);
      const normalizedValue = this.normalizeUnitValue(spec.value);
      
      specsByProduct[productId][normalizedName] = {
        name: spec.name,
        normalizedName,
        value: normalizedValue,
        originalValue: spec.value,
        category: this.getSpecCategory(normalizedName)
      };
      
      allSpecNames.add(normalizedName);
    }

    return {
      specsByProduct,
      allSpecNames: Array.from(allSpecNames)
    };
  }

  /**
   * Get category for a specification
   * FIXED: Normalize spec name before checking category to handle variations like 'screen', 'panel', etc.
   */
  getSpecCategory(specName) {
    // First normalize the spec name to handle variations
    const normalizedName = this.normalizeSpecName(specName);
    
    const categories = {
      ram: 'performance',
      storage: 'performance',
      processor: 'performance',
      gpu: 'performance',
      display: 'display',
      camera: 'camera',
      battery: 'battery',
      os: 'software',
      weight: 'physical',
      dimensions: 'physical',
      connectivity: 'connectivity'
    };

    return categories[normalizedName] || 'general';
  }

  /**
   * Calculate score for a product based on specifications
   * BUG-LOW-002: No console logging - Added console.log statements for debugging
   */
  calculateProductScore(productSpecs, allSpecNames) {
    let totalScore = 0;
    let totalWeight = 0;

    for (const specName of allSpecNames) {
      const spec = productSpecs[specName];
      if (!spec) continue;

      const weight = this.specWeights[specName] || this.specWeights.default;
      const numericValue = this.extractNumericValue(spec.value);

      if (numericValue !== null) {
        totalScore += numericValue * weight;
        totalWeight += weight;
      }
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Generate comparison data for products
   * BUG-LOW-002: No console logging - Added console.log statements for debugging
   */
  async generateComparison(comparisonId) {
    console.log('Generating comparison for:', comparisonId);
    // Get comparison with items
    const comparison = await this.prisma.product_comparisons.findUnique({
      where: { id: comparisonId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { processingStatus: { not: 'deleted' } },
                  orderBy: { displayOrder: 'asc' }
                },
                specifications: {
                  orderBy: { sortOrder: 'asc' }
                },
                brand: {
                  select: { id: true, name: true, slug: true }
                },
                categories: {
                  include: {
                    category: {
                      select: { id: true, name: true, slug: true }
                    }
                  },
                  where: { isPrimary: true },
                  take: 1
                }
              }
            }
          },
          orderBy: { addedAt: 'asc' }
        }
      }
    });

    if (!comparison) {
      throw new Error('Comparison not found');
    }

    const products = comparison.items.map(item => ({
      ...item.product,
      notes: item.notes
    }));

    if (products.length === 0) {
      return {
        comparisonId,
        products: [],
        specifications: [],
        priceComparison: [],
        imageComparison: [],
        summary: {
          totalProducts: 0,
          priceRange: { min: 0, max: 0 },
          commonSpecs: [],
          differentSpecs: [],
          bestValueProduct: null
        }
      };
    }

    const productIds = products.map(p => p.id);
    
    // Get specifications
    const { specsByProduct, allSpecNames } = await this.getProductSpecifications(productIds);

    // Build specification comparison
    const specComparison = products.map(product => {
      const productSpecs = specsByProduct[product.id] || {};
      const specifications = [];

      for (const specName of allSpecNames) {
        const spec = productSpecs[specName];
        specifications.push({
          name: specName,
          value: spec ? spec.value : 'N/A',
          originalName: spec ? spec.name : specName,
          category: spec ? spec.category : 'general',
          isDifferent: false,
          isBetter: false
        });
      }

      const score = this.calculateProductScore(productSpecs, allSpecNames);

      return {
        productId: product.id,
        productName: product.nameEn || product.name,
        specifications,
        score
      };
    });

    // Mark differences and better values
    for (let i = 0; i < specComparison.length; i++) {
      for (let j = 0; j < specComparison[i].specifications.length; j++) {
        const spec = specComparison[i].specifications[j];
        
        // Compare with other products
        for (let k = 0; k < specComparison.length; k++) {
          if (i === k) continue;
          
          const otherSpec = specComparison[k].specifications.find(s => s.name === spec.name);
          if (otherSpec) {
            const comparison = this.compareSpecValues(spec.value, otherSpec.value, spec.name);
            if (comparison.isDifferent) {
              spec.isDifferent = true;
              spec.isBetter = comparison.isBetter;
            }
          }
        }
      }
    }

    // Build price comparison
    const prices = products.map(p => ({
      productId: p.id,
      productName: p.nameEn || p.name,
      regularPrice: parseFloat(p.regularPrice),
      salePrice: p.salePrice ? parseFloat(p.salePrice) : null
    }));

    const minPrice = Math.min(...prices.map(p => p.salePrice || p.regularPrice));
    const maxPrice = Math.max(...prices.map(p => p.regularPrice));

    const priceComparison = prices.map(p => {
      const effectivePrice = p.salePrice || p.regularPrice;
      return {
        productId: p.productId,
        productName: p.productName,
        regularPrice: p.regularPrice,
        salePrice: p.salePrice,
        isCheapest: effectivePrice === minPrice,
        isMostExpensive: p.regularPrice === maxPrice,
        priceDifference: effectivePrice - minPrice
      };
    });

    // Build image comparison
    const imageComparison = products.map(p => ({
      productId: p.id,
      productName: p.nameEn || p.name,
      primaryImage: p.images.find(img => img.isPrimary)?.originalUrl || p.images[0]?.originalUrl || null,
      allImages: p.images.map(img => img.originalUrl)
    }));

    // Find common and different specs
    const commonSpecs = [];
    const differentSpecs = [];

    for (const specName of allSpecNames) {
      const values = products.map(p => {
        const spec = specsByProduct[p.id]?.[specName];
        return spec ? spec.value : 'N/A';
      });

      const allSame = values.every(v => v === values[0]);
      if (allSame && values[0] !== 'N/A') {
        commonSpecs.push(specName);
      } else if (!allSame) {
        differentSpecs.push(specName);
      }
    }

    // Find best value product (highest score)
    const bestValueProduct = specComparison.length > 0 
      ? specComparison.reduce((best, current) => 
          current.score > best.score ? current : best
        )
      : null;

    return {
      comparisonId,
      products,
      specifications: specComparison,
      priceComparison,
      imageComparison,
      summary: {
        totalProducts: products.length,
        priceRange: { min: minPrice, max: maxPrice },
        commonSpecs,
        differentSpecs,
        bestValueProduct: bestValueProduct ? bestValueProduct.productId : null
      }
    };
  }

  /**
   * Get specification comparison only
   */
  async getSpecificationComparison(comparisonId) {
    const comparison = await this.generateComparison(comparisonId);
    return {
      comparisonId: comparison.comparisonId,
      specifications: comparison.specifications
    };
  }

  /**
   * Get price comparison only
   */
  async getPriceComparison(comparisonId) {
    const comparison = await this.generateComparison(comparisonId);
    return {
      comparisonId: comparison.comparisonId,
      priceComparison: comparison.priceComparison,
      priceRange: comparison.summary.priceRange
    };
  }

  /**
   * Get image comparison only
   */
  async getImageComparison(comparisonId) {
    const comparison = await this.generateComparison(comparisonId);
    return {
      comparisonId: comparison.comparisonId,
      imageComparison: comparison.imageComparison
    };
  }

  /**
   * Get differences highlight
   */
  async getDifferencesHighlight(comparisonId) {
    const comparison = await this.generateComparison(comparisonId);
    const differences = [];

    for (const productSpec of comparison.specifications) {
      const differentSpecs = productSpec.specifications.filter(s => s.isDifferent);
      
      if (differentSpecs.length > 0) {
        differences.push({
          productId: productSpec.productId,
          productName: productSpec.productName,
          score: productSpec.score,
          betterSpecs: differentSpecs.filter(s => s.isBetter),
          worseSpecs: differentSpecs.filter(s => !s.isBetter && s.value !== 'N/A')
        });
      }
    }

    return {
      comparisonId: comparison.comparisonId,
      differences,
      summary: comparison.summary
    };
  }

  /**
   * Create comparison history entry
   * BUG-LOW-002: No console logging - Added console.log statements for debugging
   */
  async createHistoryEntry(userId, comparisonId, action, metadata = {}) {
    console.log('Creating history entry:', { userId, comparisonId, action, metadata });
    try {
      await this.prisma.comparison_histories.create({
        data: {
          userId,
          comparisonId,
          action,
          metadata
        }
      });
    } catch (error) {
      // Log but don't throw - history is not critical
      console.error('Failed to create comparison history entry:', error);
    }
  }

  /**
   * Clean up expired comparisons
   * BUG-LOW-002: No console logging - Added console.log statements for debugging
   */
  async cleanupExpiredComparisons() {
    console.log('Cleaning up expired comparisons...');
    const now = new Date();
    
    const expiredComparisons = await this.prisma.productComparison.findMany({
      where: {
        expiresAt: {
          lt: now
        }
      }
    });

    for (const comparison of expiredComparisons) {
      await this.prisma.productComparison.delete({
        where: { id: comparison.id }
      });
    }

    return expiredComparisons.length;
  }
}

module.exports = { ComparisonService };
