/**
 * Inventory Reservation API Tests
 * Tests for admin inventory reservation tracking endpoints
 */

const request = require('supertest');
const express = require('express');

// Mock Prisma client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    productStockReservation: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      aggregate: jest.fn(),
    },
    productStock: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    inventoryReservationAuditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    cart: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  })),
}));

// Mock logger service
jest.mock('../services/logger', () => ({
  loggerService: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock auth middleware
jest.mock('../middleware/auth', () => ({
  authMiddleware: {
    authenticate: () => (req, res, next) => next(),
  },
}));

// Mock RBAC middleware
jest.mock('../middleware/rbacAuth', () => ({
  rbacAuthMiddleware: {
    requirePermission: (permission) => (req, res, next) => {
      req.user = { id: 'test-admin-id', role: 'admin' };
      next();
    },
  },
}));

const { adminInventoryController } = require('../controllers/adminInventoryController');

describe('Admin Inventory Controller', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    
    // Setup routes
    app.get('/api/v1/admin/carts/inventory-impact', adminInventoryController.getInventoryImpact);
    app.get('/api/v1/admin/carts/inventory-impact/summary', adminInventoryController.getInventoryDashboard);
    app.get('/api/v1/admin/carts/inventory-impact/product/:productId', adminInventoryController.getProductReservedStock);
    app.post('/api/v1/admin/carts/inventory-impact/release/:reservationId', adminInventoryController.releaseReservation);
    app.post('/api/v1/admin/carts/inventory-impact/release-by-cart/:cartId', adminInventoryController.releaseCartReservations);
    app.post('/api/v1/admin/carts/inventory-impact/cleanup', adminInventoryController.cleanupExpiredReservations);
    app.get('/api/v1/admin/carts/inventory-impact/export', adminInventoryController.exportInventoryImpact);
  });

  describe('GET /api/v1/admin/carts/inventory-impact', () => {
    it('should return inventory impact data', async () => {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      // Mock empty results
      prisma.productStockReservation.findMany.mockResolvedValue([]);
      
      const response = await request(app)
        .get('/api/v1/admin/carts/inventory-impact')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/admin/carts/inventory-impact/summary', () => {
    it('should return dashboard summary', async () => {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      // Mock empty results
      prisma.product.findMany.mockResolvedValue([]);
      prisma.productStockReservation.findMany.mockResolvedValue([]);
      
      const response = await request(app)
        .get('/api/v1/admin/carts/inventory-impact/summary')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/admin/carts/inventory-impact/cleanup', () => {
    it('should cleanup expired reservations', async () => {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      // Mock empty expired reservations
      prisma.productStockReservation.findMany.mockResolvedValue([]);
      prisma.productStockReservation.updateMany.mockResolvedValue({ count: 0 });
      
      const response = await request(app)
        .post('/api/v1/admin/carts/inventory-impact/cleanup')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});

describe('Inventory Reservation Service', () => {
  let service;
  let prisma;

  beforeEach(() => {
    jest.clearAllMocks();
    const { InventoryReservationService } = require('../services/inventoryReservationService');
    service = new InventoryReservationService();
    const { PrismaClient } = require('@prisma/client');
    prisma = new PrismaClient();
  });

  describe('getInventoryImpact', () => {
    it('should return inventory impact for products', async () => {
      // Mock cart data
      prisma.productStockReservation.findMany.mockResolvedValue([
        {
          id: 'res-1',
          productId: 'prod-1',
          product: {
            id: 'prod-1',
            name: 'Test Product',
            sku: 'TEST-001',
            stockQuantity: 100,
            lowStockThreshold: 10
          },
          cartId: 'cart-1',
          cartItemId: 'item-1',
          quantity: 5,
          status: 'pending',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 3600000),
          cart: {
            id: 'cart-1',
            userId: 'user-1',
            status: 'active',
            createdAt: new Date(),
            user: {
              id: 'user-1',
              email: 'test@example.com',
              firstName: 'Test',
              lastName: 'User'
            }
          }
        }
      ]);

      const result = await service.getInventoryImpact();
      
      expect(result.success).toBe(true);
      expect(result.data.products).toBeDefined();
      expect(result.data.summary).toBeDefined();
    });
  });

  describe('releaseReservation', () => {
    it('should release a reservation', async () => {
      const mockReservation = {
        id: 'res-1',
        productId: 'prod-1',
        quantity: 5,
        status: 'pending'
      };

      prisma.productStockReservation.findUnique.mockResolvedValue(mockReservation);
      prisma.productStockReservation.update.mockResolvedValue({
        ...mockReservation,
        status: 'released',
        releasedAt: new Date()
      });
      prisma.inventoryReservationAuditLog.create.mockResolvedValue({});
      prisma.product.findUnique.mockResolvedValue({ stockQuantity: 100 });

      const result = await service.releaseReservation('res-1', 'admin-1', 'Test release');

      expect(result.success).toBe(true);
    });

    it('should return error if reservation not found', async () => {
      prisma.productStockReservation.findUnique.mockResolvedValue(null);

      const result = await service.releaseReservation('non-existent', 'admin-1', 'Test');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Reservation not found');
    });
  });

  describe('cleanupExpiredReservations', () => {
    it('should cleanup expired reservations', async () => {
      prisma.productStockReservation.findMany.mockResolvedValue([]);
      prisma.productStockReservation.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.cleanupExpiredReservations();

      expect(result.success).toBe(true);
    });
  });

  describe('getInventoryDashboard', () => {
    it('should return dashboard data', async () => {
      prisma.product.findMany.mockResolvedValue([
        { id: 'prod-1', name: 'Product 1', sku: 'P1', stockQuantity: 100, lowStockThreshold: 10 }
      ]);
      prisma.productStockReservation.findMany.mockResolvedValue([]);

      const result = await service.getInventoryDashboard();

      expect(result.success).toBe(true);
      expect(result.data.summary).toBeDefined();
      expect(result.data.stockDistribution).toBeDefined();
    });
  });
});
