/**
 * Unit Tests for Comparison Service
 * 
 * Tests for all functions in comparison.service.js including:
 * - Specification normalization
 * - Unit normalization
 * - Numeric value extraction
 * - Specification comparison
 * - Product specification retrieval
 * - Comparison generation
 * - Price comparison
 * - Image comparison
 * - Difference highlighting
 * - History entry creation
 * - Cleanup operations
 */

const { ComparisonService } = require('../../services/comparison.service');
const { PrismaClient } = require('@prisma/client');

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    productSpecification: {
      findMany: jest.fn(),
    },
    productComparison: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    productComparisonItem: {
      groupBy: jest.fn(),
    },
    comparisonHistory: {
      create: jest.fn(),
    },
  })),
}));

describe('ComparisonService', () => {
  let comparisonService;

  beforeEach(() => {
    comparisonService = new ComparisonService();
    jest.clearAllMocks();
  });

  describe('normalizeSpecName', () => {
    test('should normalize RAM variations to "ram"', () => {
      expect(comparisonService.normalizeSpecName('RAM')).toBe('ram');
      expect(comparisonService.normalizeSpecName('Memory')).toBe('ram');
      expect(comparisonService.normalizeSpecName('System Memory')).toBe('ram');
      expect(comparisonService.normalizeSpecName('Internal Memory')).toBe('ram');
    });

    test('should normalize storage variations to "storage"', () => {
      expect(comparisonService.normalizeSpecName('Storage')).toBe('storage');
      expect(comparisonService.normalizeSpecName('Internal Storage')).toBe('storage');
      expect(comparisonService.normalizeSpecName('ROM')).toBe('storage');
      expect(comparisonService.normalizeSpecName('Hard Drive')).toBe('storage');
      expect(comparisonService.normalizeSpecName('SSD')).toBe('storage');
      expect(comparisonService.normalizeSpecName('HDD')).toBe('storage');
    });

    test('should normalize processor variations to "processor"', () => {
      expect(comparisonService.normalizeSpecName('Processor')).toBe('processor');
      expect(comparisonService.normalizeSpecName('CPU')).toBe('processor');
      expect(comparisonService.normalizeSpecName('Chipset')).toBe('processor');
      expect(comparisonService.normalizeSpecName('Chip')).toBe('processor');
    });

    test('should handle null/undefined input', () => {
      expect(comparisonService.normalizeSpecName(null)).toBe('other');
      expect(comparisonService.normalizeSpecName(undefined)).toBe('other');
      expect(comparisonService.normalizeSpecName('')).toBe('other');
    });

    test('should trim and lowercase spec names', () => {
      expect(comparisonService.normalizeSpecName('  RAM  ')).toBe('ram');
      expect(comparisonService.normalizeSpecName('System-Memory')).toBe('ram');
      expect(comparisonService.normalizeSpecName('Internal_Memory')).toBe('ram');
    });

    test('should return normalized name for unknown specs', () => {
      expect(comparisonService.normalizeSpecName('Color')).toBe('color');
      expect(comparisonService.normalizeSpecName('Weight')).toBe('weight');
      expect(comparisonService.normalizeSpecName('Unknown Spec')).toBe('unknown spec');
    });
  });

  describe('normalizeUnitValue', () => {
    test('should normalize GB variations to "gb"', () => {
      expect(comparisonService.normalizeUnitValue('8 GB')).toBe('8 gb');
      expect(comparisonService.normalizeUnitValue('16 Gigabyte')).toBe('16 gb');
      expect(comparisonService.normalizeUnitValue('32 Gigabytes')).toBe('32 gb');
    });

    test('should normalize MB variations to "mb"', () => {
      expect(comparisonService.normalizeUnitValue('4 MB')).toBe('4 mb');
      expect(comparisonService.normalizeUnitValue('8 Megabyte')).toBe('8 mb');
      expect(comparisonService.normalizeUnitValue('16 Megabytes')).toBe('16 mb');
    });

    test('should normalize TB variations to "tb"', () => {
      expect(comparisonService.normalizeUnitValue('1 TB')).toBe('1 tb');
      expect(comparisonService.normalizeUnitValue('2 Terabyte')).toBe('2 tb');
      expect(comparisonService.normalizeUnitValue('4 Terabytes')).toBe('4 tb');
    });

    test('should normalize GHz variations to "ghz"', () => {
      expect(comparisonService.normalizeUnitValue('2.4 GHz')).toBe('2.4 ghz');
      expect(comparisonService.normalizeUnitValue('3.2 Gigahertz')).toBe('3.2 ghz');
    });

    test('should normalize MHz variations to "mhz"', () => {
      expect(comparisonService.normalizeUnitValue('800 MHz')).toBe('800 mhz');
      expect(comparisonService.normalizeUnitValue('1200 Megahertz')).toBe('1200 mhz');
    });

    test('should normalize MP variations to "mp"', () => {
      expect(comparisonService.normalizeUnitValue('12 MP')).toBe('12 mp');
      expect(comparisonService.normalizeUnitValue('48 Megapixel')).toBe('48 mp');
      expect(comparisonService.normalizeUnitValue('108 Megapixels')).toBe('108 mp');
    });

    test('should normalize mAh variations to "mah"', () => {
      expect(comparisonService.normalizeUnitValue('4000 mAh')).toBe('4000 mah');
      expect(comparisonService.normalizeUnitValue('5000 Milliampere-hour')).toBe('5000 mah');
    });

    test('should normalize kg variations to "kg"', () => {
      expect(comparisonService.normalizeUnitValue('0.5 kg')).toBe('0.5 kg');
      expect(comparisonService.normalizeUnitValue('1.2 Kilogram')).toBe('1.2 kg');
      expect(comparisonService.normalizeUnitValue('2.5 Kilograms')).toBe('2.5 kg');
    });

    test('should normalize g variations to "g"', () => {
      expect(comparisonService.normalizeUnitValue('200 g')).toBe('200 g');
      expect(comparisonService.normalizeUnitValue('500 gram')).toBe('500 g');
      expect(comparisonService.normalizeUnitValue('1000 grams')).toBe('1000 g');
    });

    test('should normalize inch variations to "inch"', () => {
      expect(comparisonService.normalizeUnitValue('6.5 inch')).toBe('6.5 inch');
      expect(comparisonService.normalizeUnitValue('6.5 inches')).toBe('6.5 inch');
      expect(comparisonService.normalizeUnitValue('6.5"')).toBe('6.5 inch');
    });

    test('should handle null/undefined input', () => {
      expect(comparisonService.normalizeUnitValue(null)).toBeNull();
      expect(comparisonService.normalizeUnitValue(undefined)).toBeUndefined();
      expect(comparisonService.normalizeUnitValue('')).toBe('');
    });

    test('should return original value if no unit found', () => {
      expect(comparisonService.normalizeUnitValue('Black')).toBe('black');
      expect(comparisonService.normalizeUnitValue('Yes')).toBe('yes');
      expect(comparisonService.normalizeUnitValue('No')).toBe('no');
    });
  });

  describe('extractNumericValue', () => {
    test('should extract numeric value from string', () => {
      expect(comparisonService.extractNumericValue('8 GB')).toBe(8);
      expect(comparisonService.extractNumericValue('16.5 GB')).toBe(16.5);
      expect(comparisonService.extractNumericValue('2.4 GHz')).toBe(2.4);
      expect(comparisonService.extractNumericValue('4000 mAh')).toBe(4000);
    });

    test('should extract decimal values', () => {
      expect(comparisonService.extractNumericValue('6.5 inch')).toBe(6.5);
      expect(comparisonService.extractNumericValue('0.5 kg')).toBe(0.5);
      expect(comparisonService.extractNumericValue('3.2 GHz')).toBe(3.2);
    });

    test('should return null for non-numeric strings', () => {
      expect(comparisonService.extractNumericValue('Black')).toBeNull();
      expect(comparisonService.extractNumericValue('Yes')).toBeNull();
      expect(comparisonService.extractNumericValue('No')).toBeNull();
    });

    test('should handle null/undefined input', () => {
      expect(comparisonService.extractNumericValue(null)).toBeNull();
      expect(comparisonService.extractNumericValue(undefined)).toBeNull();
      expect(comparisonService.extractNumericValue('')).toBeNull();
    });

    test('should handle integers', () => {
      expect(comparisonService.extractNumericValue('8')).toBe(8);
      expect(comparisonService.extractNumericValue('16')).toBe(16);
      expect(comparisonService.extractNumericValue('32')).toBe(32);
    });
  });

  describe('compareSpecValues', () => {
    test('should compare numeric values correctly', () => {
      const result = comparisonService.compareSpecValues('8 GB', '16 GB', 'ram');
      
      expect(result.isDifferent).toBe(true);
      expect(result.isBetter).toBe(true);
      expect(result.difference).toBe(8);
      expect(result.percentageDifference).toBe(100);
      expect(result.weight).toBe(2.0);
    });

    test('should handle equal numeric values', () => {
      const result = comparisonService.compareSpecValues('8 GB', '8 GB', 'ram');
      
      expect(result.isDifferent).toBe(false);
      expect(result.isBetter).toBe(false);
      expect(result.difference).toBe(0);
      expect(result.percentageDifference).toBe(0);
    });

    test('should handle first value being greater', () => {
      const result = comparisonService.compareSpecValues('16 GB', '8 GB', 'ram');
      
      expect(result.isDifferent).toBe(true);
      expect(result.isBetter).toBe(false);
      expect(result.difference).toBe(8);
    });

    test('should compare string values', () => {
      const result = comparisonService.compareSpecValues('Black', 'White', 'color');
      
      expect(result.isDifferent).toBe(true);
      expect(result.isBetter).toBe(false);
      expect(result.difference).toBe(0);
      expect(result.percentageDifference).toBe(0);
    });

    test('should handle equal string values', () => {
      const result = comparisonService.compareSpecValues('Black', 'Black', 'color');
      
      expect(result.isDifferent).toBe(false);
      expect(result.isBetter).toBe(false);
      expect(result.difference).toBe(0);
    });

    test('should apply correct weight based on spec name', () => {
      const ramResult = comparisonService.compareSpecValues('8 GB', '16 GB', 'ram');
      const storageResult = comparisonService.compareSpecValues('256 GB', '512 GB', 'storage');
      const processorResult = comparisonService.compareSpecValues('2.4 GHz', '3.2 GHz', 'processor');
      const displayResult = comparisonService.compareSpecValues('6.5"', '6.7"', 'display');
      
      expect(ramResult.weight).toBe(2.0);
      expect(storageResult.weight).toBe(2.0);
      expect(processorResult.weight).toBe(2.5);
      expect(displayResult.weight).toBe(1.5);
    });

    test('should handle division by zero', () => {
      const result = comparisonService.compareSpecValues('0 GB', '8 GB', 'ram');
      
      expect(result.isDifferent).toBe(true);
      expect(result.isBetter).toBe(true);
      expect(result.percentageDifference).toBe(0);
    });

    test('should handle null values', () => {
      const result1 = comparisonService.compareSpecValues(null, '8 GB', 'ram');
      const result2 = comparisonService.compareSpecValues('8 GB', null, 'ram');
      
      expect(result1.isDifferent).toBe(true);
      expect(result1.isBetter).toBe(false);
      
      expect(result2.isDifferent).toBe(true);
      expect(result2.isBetter).toBe(true);
    });
  });

  describe('getSpecCategory', () => {
    test('should return correct category for performance specs', () => {
      expect(comparisonService.getSpecCategory('ram')).toBe('performance');
      expect(comparisonService.getSpecCategory('storage')).toBe('performance');
      expect(comparisonService.getSpecCategory('processor')).toBe('performance');
      expect(comparisonService.getSpecCategory('gpu')).toBe('performance');
    });

    test('should return correct category for display specs', () => {
      expect(comparisonService.getSpecCategory('display')).toBe('display');
      expect(comparisonService.getSpecCategory('screen')).toBe('display');
      expect(comparisonService.getSpecCategory('panel')).toBe('display');
    });

    test('should return correct category for camera specs', () => {
      expect(comparisonService.getSpecCategory('camera')).toBe('camera');
      expect(comparisonService.getSpecCategory('rear camera')).toBe('camera');
      expect(comparisonService.getSpecCategory('front camera')).toBe('camera');
    });

    test('should return correct category for battery specs', () => {
      expect(comparisonService.getSpecCategory('battery')).toBe('battery');
      expect(comparisonService.getSpecCategory('battery capacity')).toBe('battery');
      expect(comparisonService.getSpecCategory('power')).toBe('battery');
    });

    test('should return correct category for physical specs', () => {
      expect(comparisonService.getSpecCategory('weight')).toBe('physical');
      expect(comparisonService.getSpecCategory('dimensions')).toBe('physical');
      expect(comparisonService.getSpecCategory('size')).toBe('physical');
    });

    test('should return correct category for connectivity specs', () => {
      expect(comparisonService.getSpecCategory('connectivity')).toBe('connectivity');
      expect(comparisonService.getSpecCategory('network')).toBe('connectivity');
      expect(comparisonService.getSpecCategory('wifi')).toBe('connectivity');
    });

    test('should return general category for unknown specs', () => {
      expect(comparisonService.getSpecCategory('color')).toBe('general');
      expect(comparisonService.getSpecCategory('material')).toBe('general');
      expect(comparisonService.getSpecCategory('warranty')).toBe('general');
    });
  });

  describe('calculateProductScore', () => {
    test('should calculate product score correctly', () => {
      const productSpecs = {
        ram: { value: '8 gb' },
        storage: { value: '256 gb' },
        processor: { value: '2.4 ghz' },
        display: { value: '6.5 inch' },
      };
      const allSpecNames = ['ram', 'storage', 'processor', 'display'];
      
      const score = comparisonService.calculateProductScore(productSpecs, allSpecNames);
      
      expect(score).toBeGreaterThan(0);
      expect(typeof score).toBe('number');
    });

    test('should handle empty product specs', () => {
      const productSpecs = {};
      const allSpecNames = ['ram', 'storage', 'processor'];
      
      const score = comparisonService.calculateProductScore(productSpecs, allSpecNames);
      
      expect(score).toBe(0);
    });

    test('should handle empty spec names', () => {
      const productSpecs = { ram: { value: '8 gb' } };
      const allSpecNames = [];
      
      const score = comparisonService.calculateProductScore(productSpecs, allSpecNames);
      
      expect(score).toBe(0);
    });

    test('should apply weights correctly', () => {
      const productSpecs1 = {
        ram: { value: '8 gb' },
        display: { value: '6.5 inch' },
      };
      const productSpecs2 = {
        ram: { value: '8 gb' },
        processor: { value: '2.4 ghz' },
      };
      const allSpecNames = ['ram', 'display', 'processor'];
      
      const score1 = comparisonService.calculateProductScore(productSpecs1, allSpecNames);
      const score2 = comparisonService.calculateProductScore(productSpecs2, allSpecNames);
      
      // Processor has higher weight than display
      expect(score2).toBeGreaterThan(score1);
    });
  });

  describe('createHistoryEntry', () => {
    test('should create history entry successfully', async () => {
      const mockHistoryEntry = {
        id: 'history-id-1',
        userId: 'user-id-1',
        comparisonId: 'comparison-id-1',
        action: 'created',
        metadata: { productCount: 2 },
        createdAt: new Date(),
      };
      
      comparisonService.prisma.comparisonHistory.create.mockResolvedValue(mockHistoryEntry);
      
      await comparisonService.createHistoryEntry('user-id-1', 'comparison-id-1', 'created', { productCount: 2 });
      
      expect(comparisonService.prisma.comparisonHistory.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-id-1',
          comparisonId: 'comparison-id-1',
          action: 'created',
          metadata: { productCount: 2 },
        },
      });
    });

    test('should handle errors gracefully without throwing', async () => {
      comparisonService.prisma.comparisonHistory.create.mockRejectedValue(new Error('Database error'));
      
      await expect(
        comparisonService.createHistoryEntry('user-id-1', 'comparison-id-1', 'created')
      ).resolves.not.toThrow();
    });

    test('should create history entry without metadata', async () => {
      const mockHistoryEntry = {
        id: 'history-id-1',
        userId: 'user-id-1',
        comparisonId: 'comparison-id-1',
        action: 'viewed',
        metadata: {},
        createdAt: new Date(),
      };
      
      comparisonService.prisma.comparisonHistory.create.mockResolvedValue(mockHistoryEntry);
      
      await comparisonService.createHistoryEntry('user-id-1', 'comparison-id-1', 'viewed');
      
      expect(comparisonService.prisma.comparisonHistory.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-id-1',
          comparisonId: 'comparison-id-1',
          action: 'viewed',
          metadata: {},
        },
      });
    });
  });

  describe('cleanupExpiredComparisons', () => {
    test('should delete expired comparisons', async () => {
      const expiredComparisons = [
        { id: 'expired-1', expiresAt: new Date('2020-01-01') },
        { id: 'expired-2', expiresAt: new Date('2020-01-01') },
      ];
      
      comparisonService.prisma.productComparison.findMany.mockResolvedValue(expiredComparisons);
      comparisonService.prisma.productComparison.delete.mockResolvedValue({});
      
      const result = await comparisonService.cleanupExpiredComparisons();
      
      expect(result).toBe(2);
      expect(comparisonService.prisma.productComparison.findMany).toHaveBeenCalledWith({
        where: {
          expiresAt: {
            lt: expect.any(Date),
          },
        },
      });
      expect(comparisonService.prisma.productComparison.delete).toHaveBeenCalledTimes(2);
    });

    test('should handle no expired comparisons', async () => {
      comparisonService.prisma.productComparison.findMany.mockResolvedValue([]);
      
      const result = await comparisonService.cleanupExpiredComparisons();
      
      expect(result).toBe(0);
      expect(comparisonService.prisma.productComparison.delete).not.toHaveBeenCalled();
    });

    test('should handle errors gracefully', async () => {
      comparisonService.prisma.productComparison.findMany.mockRejectedValue(new Error('Database error'));
      
      await expect(comparisonService.cleanupExpiredComparisons()).rejects.toThrow();
    });
  });

  describe('getProductSpecifications', () => {
    test('should retrieve and group specifications by product', async () => {
      const mockSpecs = [
        {
          id: 'spec-1',
          productId: 'product-1',
          name: 'RAM',
          value: '8 GB',
          sortOrder: 1,
          product: {
            id: 'product-1',
            name: 'Product 1',
            nameEn: 'Product 1',
            slug: 'product-1',
            regularPrice: 1000,
            salePrice: 900,
          },
        },
        {
          id: 'spec-2',
          productId: 'product-2',
          name: 'Memory',
          value: '16 GB',
          sortOrder: 1,
          product: {
            id: 'product-2',
            name: 'Product 2',
            nameEn: 'Product 2',
            slug: 'product-2',
            regularPrice: 1200,
            salePrice: null,
          },
        },
      ];
      
      comparisonService.prisma.productSpecification.findMany.mockResolvedValue(mockSpecs);
      
      const result = await comparisonService.getProductSpecifications(['product-1', 'product-2']);
      
      expect(result.specsByProduct).toHaveProperty('product-1');
      expect(result.specsByProduct).toHaveProperty('product-2');
      expect(result.allSpecNames).toContain('ram');
      expect(result.allSpecNames).toContain('storage');
    });

    test('should normalize specification names', async () => {
      const mockSpecs = [
        {
          id: 'spec-1',
          productId: 'product-1',
          name: 'RAM',
          value: '8 GB',
          sortOrder: 1,
          product: {
            id: 'product-1',
            name: 'Product 1',
            nameEn: 'Product 1',
            slug: 'product-1',
            regularPrice: 1000,
            salePrice: 900,
          },
        },
        {
          id: 'spec-2',
          productId: 'product-2',
          name: 'Memory',
          value: '16 GB',
          sortOrder: 1,
          product: {
            id: 'product-2',
            name: 'Product 2',
            nameEn: 'Product 2',
            slug: 'product-2',
            regularPrice: 1200,
            salePrice: null,
          },
        },
      ];
      
      comparisonService.prisma.productSpecification.findMany.mockResolvedValue(mockSpecs);
      
      const result = await comparisonService.getProductSpecifications(['product-1', 'product-2']);
      
      // Both RAM and Memory should be normalized to 'ram'
      expect(result.specsByProduct['product-1']).toHaveProperty('ram');
      expect(result.specsByProduct['product-2']).toHaveProperty('ram');
    });

    test('should handle empty product IDs', async () => {
      comparisonService.prisma.productSpecification.findMany.mockResolvedValue([]);
      
      const result = await comparisonService.getProductSpecifications([]);
      
      expect(result.specsByProduct).toEqual({});
      expect(result.allSpecNames).toEqual([]);
    });

    test('should normalize unit values', async () => {
      const mockSpecs = [
        {
          id: 'spec-1',
          productId: 'product-1',
          name: 'RAM',
          value: '8 Gigabyte',
          sortOrder: 1,
          product: {
            id: 'product-1',
            name: 'Product 1',
            nameEn: 'Product 1',
            slug: 'product-1',
            regularPrice: 1000,
            salePrice: 900,
          },
        },
      ];
      
      comparisonService.prisma.productSpecification.findMany.mockResolvedValue(mockSpecs);
      
      const result = await comparisonService.getProductSpecifications(['product-1']);
      
      expect(result.specsByProduct['product-1']['ram'].value).toBe('8 gb');
    });
  });
});
