/**
 * Stock Validation Service Tests
 * 
 * Tests for stock validation functionality including:
 * - Stock availability checking
 * - Stock reservations
 * - Backorder handling
 * - ETag support
 */

const { PrismaClient } = require('@prisma/client');
const { StockValidationService, BACKORDER_CONFIG, RESERVATION_STATUS } = require('../services/stockValidationService');

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    stockReservation: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
      aggregate: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
    },
    productVariant: {
      findUnique: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

// Mock Redis
jest.mock('../services/redisConnectionPool', () => ({
  redisConnectionPool: {
    getClient: jest.fn(() => ({
      set: jest.fn().mockResolvedValue('OK'),
      get: jest.fn().mockResolvedValue(null),
      del: jest.fn().mockResolvedValue(1),
      ping: jest.fn().mockResolvedValue('PONG'),
    })),
  },
}));

// Mock Logger
jest.mock('../services/logger', () => ({
  loggerService: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('StockValidationService', () => {
  let stockService;
  let prisma;

  beforeEach(() => {
    jest.clearAllMocks();
    stockService = new StockValidationService();
    prisma = new PrismaClient();
  });

  describe('checkStockAvailability', () => {
    it('should return available=true when stock is sufficient', async () => {
      // Mock product with sufficient stock
      prisma.product.findUnique.mockResolvedValue({
        id: 'product-1',
        name: 'Test Product',
        status: 'active',
        stockQuantity: 100,
        allowBackorder: false,
      });

      // Mock no reservations
      prisma.stockReservation.aggregate.mockResolvedValue({
        _sum: { quantity: 0 },
      });

      const result = await stockService.checkStockAvailability('product-1', null, 5);

      expect(result.available).toBe(true);
      expect(result.currentStock).toBe(100);
      expect(result.availableForSale).toBe(100);
      expect(result.requestedQuantity).toBe(5);
    });

    it('should return available=false when stock is insufficient', async () => {
      // Mock product with low stock
      prisma.product.findUnique.mockResolvedValue({
        id: 'product-1',
        name: 'Test Product',
        status: 'active',
        stockQuantity: 3,
        allowBackorder: false,
      });

      // Mock no reservations
      prisma.stockReservation.aggregate.mockResolvedValue({
        _sum: { quantity: 0 },
      });

      const result = await stockService.checkStockAvailability('product-1', null, 5);

      expect(result.available).toBe(false);
      expect(result.error).toContain('Insufficient stock');
    });

    it('should handle backorder when enabled and product allows it', async () => {
      // Mock product with low stock but allows backorder
      prisma.product.findUnique.mockResolvedValue({
        id: 'product-1',
        name: 'Test Product',
        status: 'active',
        stockQuantity: 3,
        allowBackorder: true,
      });

      // Mock no reservations
      prisma.stockReservation.aggregate.mockResolvedValue({
        _sum: { quantity: 0 },
      });

      const result = await stockService.checkStockAvailability('product-1', null, 5);

      expect(result.available).toBe(true);
      expect(result.canBackorder).toBe(true);
      expect(result.backorderQuantity).toBe(2);
    });

    it('should return error when product not found', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      const result = await stockService.checkStockAvailability('invalid-product', null, 5);

      expect(result.available).toBe(false);
      expect(result.error).toBe('Product not found');
    });

    it('should return error when product is not active', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'product-1',
        name: 'Test Product',
        status: 'inactive',
        stockQuantity: 100,
        allowBackorder: false,
      });

      const result = await stockService.checkStockAvailability('product-1', null, 5);

      expect(result.available).toBe(false);
      expect(result.error).toBe('Product is not available');
    });
  });

  describe('reserveStock', () => {
    it('should create a reservation when stock is available', async () => {
      // Mock sufficient stock
      prisma.product.findUnique.mockResolvedValue({
        id: 'product-1',
        name: 'Test Product',
        status: 'active',
        stockQuantity: 100,
        allowBackorder: false,
      });

      prisma.stockReservation.aggregate.mockResolvedValue({
        _sum: { quantity: 0 },
      });

      prisma.stockReservation.create.mockResolvedValue({
        id: 'reservation-1',
        productId: 'product-1',
        variantId: null,
        cartId: 'cart-1',
        quantity: 5,
        status: RESERVATION_STATUS.ACTIVE,
      });

      const result = await stockService.reserveStock('product-1', null, 5, 'cart-1');

      expect(result.success).toBe(true);
      expect(result.reservationId).toBe('reservation-1');
      expect(prisma.stockReservation.create).toHaveBeenCalled();
    });

    it('should fail when stock is not available', async () => {
      // Mock insufficient stock
      prisma.product.findUnique.mockResolvedValue({
        id: 'product-1',
        name: 'Test Product',
        status: 'active',
        stockQuantity: 3,
        allowBackorder: false,
      });

      prisma.stockReservation.aggregate.mockResolvedValue({
        _sum: { quantity: 0 },
      });

      const result = await stockService.reserveStock('product-1', null, 5, 'cart-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient stock');
    });
  });

  describe('releaseStock', () => {
    it('should release an active reservation', async () => {
      prisma.stockReservation.findUnique.mockResolvedValue({
        id: 'reservation-1',
        productId: 'product-1',
        status: RESERVATION_STATUS.ACTIVE,
      });

      prisma.stockReservation.update.mockResolvedValue({
        id: 'reservation-1',
        status: RESERVATION_STATUS.RELEASED,
      });

      const result = await stockService.releaseStock('reservation-1');

      expect(result.success).toBe(true);
      expect(prisma.stockReservation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'reservation-1' },
          data: expect.objectContaining({
            status: RESERVATION_STATUS.RELEASED,
          }),
        })
      );
    });

    it('should fail when reservation not found', async () => {
      prisma.stockReservation.findUnique.mockResolvedValue(null);

      const result = await stockService.releaseStock('invalid-reservation');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Reservation not found');
    });

    it('should fail when reservation is already released', async () => {
      prisma.stockReservation.findUnique.mockResolvedValue({
        id: 'reservation-1',
        status: RESERVATION_STATUS.RELEASED,
      });

      const result = await stockService.releaseStock('reservation-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot release reservation');
    });
  });

  describe('getReservedStock', () => {
    it('should return total reserved quantity', async () => {
      prisma.stockReservation.aggregate.mockResolvedValue({
        _sum: { quantity: 25 },
      });

      const result = await stockService.getReservedStock('product-1', null);

      expect(result).toBe(25);
    });

    it('should return 0 when no reservations exist', async () => {
      prisma.stockReservation.aggregate.mockResolvedValue({
        _sum: { quantity: null },
      });

      const result = await stockService.getReservedStock('product-1', null);

      expect(result).toBe(0);
    });
  });

  describe('ETag methods', () => {
    it('should generate valid ETag', () => {
      const etag = stockService.generateETag('cart-1', 1);

      expect(etag).toMatch(/^"cart-1-1-\d+"$/);
    });

    it('should parse valid ETag', () => {
      const etag = stockService.generateETag('cart-1', 1);
      const parsed = stockService.parseETag(etag);

      expect(parsed.cartId).toBe('cart-1');
      expect(parsed.version).toBe(1);
      expect(parsed.timestamp).toBeGreaterThan(0);
    });

    it('should return null for invalid ETag', () => {
      const parsed = stockService.parseETag(null);
      expect(parsed).toBeNull();
    });

    it('should validate matching ETag', () => {
      const etag = stockService.generateETag('cart-1', 1);
      const isValid = stockService.validateETag('cart-1', etag, 1);

      expect(isValid).toBe(true);
    });

    it('should reject non-matching ETag', () => {
      const etag = stockService.generateETag('cart-1', 1);
      const isValid = stockService.validateETag('cart-1', etag, 2);

      expect(isValid).toBe(false);
    });
  });

  describe('getBackorderConfig', () => {
    it('should return backorder configuration', () => {
      const config = stockService.getBackorderConfig();

      expect(config).toHaveProperty('enabled');
      expect(config).toHaveProperty('maxQuantity');
      expect(config).toHaveProperty('reservationExpiry');
    });
  });

  describe('cleanupExpiredReservations', () => {
    it('should mark expired reservations as expired', async () => {
      prisma.stockReservation.findMany.mockResolvedValue([
        { id: 'reservation-1', productId: 'product-1' },
        { id: 'reservation-2', productId: 'product-2' },
      ]);

      prisma.stockReservation.updateMany.mockResolvedValue({ count: 2 });

      const result = await stockService.cleanupExpiredReservations();

      expect(result.success).toBe(true);
      expect(result.cleanedCount).toBe(2);
    });
  });
});

describe('BACKORDER_CONFIG', () => {
  it('should have required configuration properties', () => {
    expect(BACKORDER_CONFIG).toHaveProperty('ENABLED');
    expect(BACKORDER_CONFIG).toHaveProperty('MAX_BACKORDER_QUANTITY');
    expect(BACKORDER_CONFIG).toHaveProperty('RESERVATION_EXPIRY_MINUTES');
    expect(BACKORDER_CONFIG).toHaveProperty('CLEANUP_INTERVAL');
  });

  it('should have valid reservation status values', () => {
    expect(RESERVATION_STATUS.ACTIVE).toBe('active');
    expect(RESERVATION_STATUS.EXPIRED).toBe('expired');
    expect(RESERVATION_STATUS.COMMITTED).toBe('committed');
    expect(RESERVATION_STATUS.RELEASED).toBe('released');
  });
});
