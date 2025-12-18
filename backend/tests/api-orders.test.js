/**
 * Order Management API Endpoint Tests
 * 
 * This test suite covers all order management endpoints including:
 * - Get all orders with filtering
 * - Get order by ID
 * - Create order
 * - Update order status
 * - Input validation
 * - Authorization checks
 * - Error handling
 * - Bangladesh-specific payment methods
 */

const request = require('supertest');
const { app } = require('../index');
const { 
  TEST_CONFIG, 
  createTestUser, 
  createTestAdmin,
  createTestCategory,
  createTestBrand,
  createTestProduct,
  createTestOrder,
  cleanupTestData,
  makeAuthenticatedRequest,
  validateResponseStructure,
  BANGLADESH_TEST_DATA,
  prisma 
} = require('./api-test-utils');

describe('Order Management API Endpoints', () => {
  let testUser, adminUser, testProduct, testOrder, testAddress;

  beforeEach(async () => {
    // Clean up before each test
    await cleanupTestData();
    
    // Create test data
    testUser = await createTestUser();
    adminUser = await createTestAdmin();
    testProduct = await createTestProduct();
    
    // Create test address for orders
    testAddress = await prisma.address.create({
      data: {
        userId: testUser.user.id,
        firstName: testUser.user.firstName,
        lastName: testUser.user.lastName,
        phone: testUser.user.phone || '+8801712345678',
        address: '123 Test Street',
        city: 'Dhaka',
        district: 'Dhaka',
        division: 'DHAKA',
        postalCode: '1000',
        type: 'SHIPPING',
        isDefault: true
      }
    });
    
    testOrder = await createTestOrder({ 
      user: testUser.user, 
      product: testProduct 
    });
  });

  afterEach(async () => {
    // Clean up after each test
    await cleanupTestData();
  });

  describe('GET /api/v1/orders', () => {
    /**
     * Test successful retrieval of all orders by admin
     */
    it('should allow admin to retrieve all orders', async () => {
      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        '/api/v1/orders',
        {},
        adminUser.token
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('orders');
      expect(response.body).toHaveProperty('pagination');
      
      // Verify pagination structure
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('pages');
      
      // Verify order data structure
      const orders = response.body.orders;
      expect(Array.isArray(orders)).toBe(true);
      
      if (orders.length > 0) {
        const order = orders[0];
        expect(order).toHaveProperty('id');
        expect(order).toHaveProperty('orderNumber');
        expect(order).toHaveProperty('userId');
        expect(order).toHaveProperty('subtotal');
        expect(order).toHaveProperty('tax');
        expect(order).toHaveProperty('shippingCost');
        expect(order).toHaveProperty('discount');
        expect(order).toHaveProperty('total');
        expect(order).toHaveProperty('paymentMethod');
        expect(order).toHaveProperty('paymentStatus');
        expect(order).toHaveProperty('status');
        expect(order).toHaveProperty('createdAt');
        expect(order).toHaveProperty('user');
        expect(order).toHaveProperty('address');
        expect(order).toHaveProperty('items');
        expect(order).toHaveProperty('transactions');
      }
    });

    /**
     * Test user retrieving their own orders
     */
    it('should allow user to retrieve their own orders', async () => {
      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/orders?userId=${testUser.user.id}`,
        {},
        testUser.token
      );

      expect(response.status).toBe(200);
      const orders = response.body.orders;
      
      if (orders.length > 0) {
        orders.forEach(order => {
          expect(order.userId).toBe(testUser.user.id);
        });
      }
    });

    /**
     * Test pagination parameters
     */
    it('should respect pagination parameters', async () => {
      // Create additional orders
      await Promise.all([
        createTestOrder({ user: testUser.user }),
        createTestOrder({ user: testUser.user }),
        createTestOrder({ user: testUser.user })
      ]);

      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        '/api/v1/orders?page=1&limit=2',
        {},
        adminUser.token
      );

      expect(response.status).toBe(200);
      expect(response.body.orders.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
    });

    /**
     * Test filtering by user ID
     */
    it('should filter orders by user ID', async () => {
      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/orders?userId=${testUser.user.id}`,
        {},
        adminUser.token
      );

      expect(response.status).toBe(200);
      const orders = response.body.orders;
      
      if (orders.length > 0) {
        orders.forEach(order => {
          expect(order.userId).toBe(testUser.user.id);
        });
      }
    });

    /**
     * Test filtering by status
     */
    it('should filter orders by status', async () => {
      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        '/api/v1/orders?status=PENDING',
        {},
        adminUser.token
      );

      expect(response.status).toBe(200);
      const orders = response.body.orders;
      
      if (orders.length > 0) {
        orders.forEach(order => {
          expect(order.status).toBe('PENDING');
        });
      }
    });

    /**
     * Test unauthorized access by regular user to all orders
     */
    it('should deny regular user access to all orders', async () => {
      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        '/api/v1/orders',
        {},
        testUser.token
      );

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Insufficient permissions');
    });

    /**
     * Test unauthorized access without authentication
     */
    it('should deny access without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/orders');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Access token required');
    });

    /**
     * Test validation of query parameters
     */
    it('should validate query parameters', async () => {
      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        '/api/v1/orders?page=-1&limit=0',
        {},
        adminUser.token
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });
  });

  describe('GET /api/v1/orders/:id', () => {
    /**
     * Test successful retrieval of order by ID by admin
     */
    it('should allow admin to retrieve any order by ID', async () => {
      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/orders/${testOrder.id}`,
        {},
        adminUser.token
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('order');
      
      const order = response.body.order;
      expect(order.id).toBe(testOrder.id);
      expect(order).toHaveProperty('orderNumber');
      expect(order).toHaveProperty('subtotal');
      expect(order).toHaveProperty('tax');
      expect(order).toHaveProperty('shippingCost');
      expect(order).toHaveProperty('discount');
      expect(order).toHaveProperty('total');
      expect(order).toHaveProperty('paymentMethod');
      expect(order).toHaveProperty('paymentStatus');
      expect(order).toHaveProperty('status');
      expect(order).toHaveProperty('notes');
      expect(order).toHaveProperty('createdAt');
      expect(order).toHaveProperty('updatedAt');
      expect(order).toHaveProperty('confirmedAt');
      expect(order).toHaveProperty('shippedAt');
      expect(order).toHaveProperty('deliveredAt');
      expect(order).toHaveProperty('user');
      expect(order).toHaveProperty('address');
      expect(order).toHaveProperty('items');
      expect(order).toHaveProperty('transactions');
    });

    /**
     * Test user retrieving their own order
     */
    it('should allow user to retrieve their own order', async () => {
      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/orders/${testOrder.id}`,
        {},
        testUser.token
      );

      expect(response.status).toBe(200);
      expect(response.body.order.userId).toBe(testUser.user.id);
    });

    /**
     * Test user retrieving another user's order
     */
    it('should deny user accessing another user\'s order', async () => {
      // Create another user and order
      const anotherUser = await createTestUser({ email: 'another@example.com' });
      const anotherOrder = await createTestOrder({ user: anotherUser.user });

      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/orders/${anotherOrder.id}`,
        {},
        testUser.token
      );

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Access denied');
    });

    /**
     * Test retrieval of non-existent order
     */
    it('should return 404 for non-existent order', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/orders/${fakeId}`,
        {},
        adminUser.token
      );

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Order not found');
    });

    /**
     * Test invalid UUID format
     */
    it('should return validation error for invalid UUID format', async () => {
      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        '/api/v1/orders/invalid-uuid',
        {},
        adminUser.token
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });
  });

  describe('POST /api/v1/orders', () => {
    /**
     * Test successful order creation
     */
    it('should create order successfully', async () => {
      const orderData = {
        userId: testUser.user.id,
        addressId: testAddress.id,
        items: [
          {
            productId: testProduct.id,
            quantity: 2
          }
        ],
        paymentMethod: 'CASH_ON_DELIVERY',
        notes: 'Test order notes'
      };

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/v1/orders',
        orderData,
        testUser.token
      );

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Order created successfully');
      expect(response.body).toHaveProperty('order');
      
      const order = response.body.order;
      expect(order.userId).toBe(orderData.userId);
      expect(order.addressId).toBe(orderData.addressId);
      expect(order.paymentMethod).toBe(orderData.paymentMethod);
      expect(order.notes).toBe(orderData.notes);
      expect(order.status).toBe('PENDING');
      expect(order).toHaveProperty('orderNumber');
      expect(order).toHaveProperty('subtotal');
      expect(order).toHaveProperty('tax');
      expect(order).toHaveProperty('shippingCost');
      expect(order).toHaveProperty('total');
      expect(order).toHaveProperty('items');
      expect(Array.isArray(order.items)).toBe(true);
    });

    /**
     * Test order creation with multiple items
     */
    it('should create order with multiple items', async () => {
      // Create additional products
      const product2 = await createTestProduct({ name: 'Second Product' });
      const product3 = await createTestProduct({ name: 'Third Product' });

      const orderData = {
        userId: testUser.user.id,
        addressId: testAddress.id,
        items: [
          {
            productId: testProduct.id,
            quantity: 1
          },
          {
            productId: product2.id,
            quantity: 2
          },
          {
            productId: product3.id,
            quantity: 1
          }
        ],
        paymentMethod: 'BKASH'
      };

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/v1/orders',
        orderData,
        testUser.token
      );

      expect(response.status).toBe(201);
      const order = response.body.order;
      expect(order.items.length).toBe(3);
      
      // Verify total calculation
      const expectedSubtotal = 
        parseFloat(testProduct.regularPrice) * 1 +
        parseFloat(product2.regularPrice) * 2 +
        parseFloat(product3.regularPrice) * 1;
      const expectedTax = expectedSubtotal * 0.15;
      const expectedTotal = expectedSubtotal + expectedTax + 100; // + shipping
      
      expect(parseFloat(order.subtotal)).toBeCloseTo(expectedSubtotal, 0.01);
      expect(parseFloat(order.total)).toBeCloseTo(expectedTotal, 0.01);
    });

    /**
     * Test order creation with insufficient stock
     */
    it('should reject order with insufficient stock', async () => {
      // Create product with limited stock
      const limitedStockProduct = await createTestProduct({ 
        stockQuantity: 1 
      });

      const orderData = {
        userId: testUser.user.id,
        addressId: testAddress.id,
        items: [
          {
            productId: limitedStockProduct.id,
            quantity: 5 // More than available
          }
        ],
        paymentMethod: 'CASH_ON_DELIVERY'
      };

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/v1/orders',
        orderData,
        testUser.token
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Insufficient stock');
    });

    /**
     * Test order creation with non-existent user
     */
    it('should reject order with non-existent user', async () => {
      const fakeUserId = '550e8400-e29b-41d4-a716-446655440000';
      
      const orderData = {
        userId: fakeUserId,
        addressId: testAddress.id,
        items: [
          {
            productId: testProduct.id,
            quantity: 1
          }
        ],
        paymentMethod: 'CASH_ON_DELIVERY'
      };

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/v1/orders',
        orderData,
        testUser.token
      );

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'User not found');
    });

    /**
     * Test order creation with non-existent address
     */
    it('should reject order with non-existent address', async () => {
      const fakeAddressId = '550e8400-e29b-41d4-a716-446655440000';
      
      const orderData = {
        userId: testUser.user.id,
        addressId: fakeAddressId,
        items: [
          {
            productId: testProduct.id,
            quantity: 1
          }
        ],
        paymentMethod: 'CASH_ON_DELIVERY'
      };

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/v1/orders',
        orderData,
        testUser.token
      );

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Address not found');
    });

    /**
     * Test validation of required fields
     */
    it('should validate required order fields', async () => {
      const incompleteData = {
        userId: testUser.user.id
        // Missing addressId, items, paymentMethod
      };

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/v1/orders',
        incompleteData,
        testUser.token
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    /**
     * Test validation of items array
     */
    it('should validate items array', async () => {
      const invalidItemsData = {
        userId: testUser.user.id,
        addressId: testAddress.id,
        items: 'not-an-array',
        paymentMethod: 'CASH_ON_DELIVERY'
      };

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/v1/orders',
        invalidItemsData,
        testUser.token
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    /**
     * Test empty items array
     */
    it('should reject empty items array', async () => {
      const emptyItemsData = {
        userId: testUser.user.id,
        addressId: testAddress.id,
        items: [],
        paymentMethod: 'CASH_ON_DELIVERY'
      };

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/v1/orders',
        emptyItemsData,
        testUser.token
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });
  });

  describe('PUT /api/v1/orders/:id/status', () => {
    /**
     * Test successful order status update by admin
     */
    it('should allow admin to update order status', async () => {
      const updateData = {
        status: 'CONFIRMED',
        notes: 'Order confirmed by admin'
      };

      const response = await makeAuthenticatedRequest(
        app,
        'PUT',
        `/api/v1/orders/${testOrder.id}/status`,
        updateData,
        adminUser.token
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Order status updated successfully');
      expect(response.body).toHaveProperty('order');
      
      const order = response.body.order;
      expect(order.status).toBe(updateData.status);
      expect(order.notes).toBe(updateData.notes);
      expect(order).toHaveProperty('confirmedAt'); // Should be set when confirmed
    });

    /**
     * Test status update with timestamps
     */
    it('should set appropriate timestamps based on status', async () => {
      const statusTests = [
        { status: 'CONFIRMED', expectedField: 'confirmedAt' },
        { status: 'SHIPPED', expectedField: 'shippedAt' },
        { status: 'DELIVERED', expectedField: 'deliveredAt' }
      ];

      for (const statusTest of statusTests) {
        const newOrder = await createTestOrder({ user: testUser.user });
        
        const updateData = {
          status: statusTest.status
        };

        const response = await makeAuthenticatedRequest(
          app,
          'PUT',
          `/api/v1/orders/${newOrder.id}/status`,
          updateData,
          adminUser.token
        );

        expect(response.status).toBe(200);
        expect(response.body.order).toHaveProperty(statusTest.expectedField);
      }
    });

    /**
     * Test unauthorized status update by regular user
     */
    it('should deny status update by regular user', async () => {
      const updateData = {
        status: 'SHIPPED'
      };

      const response = await makeAuthenticatedRequest(
        app,
        'PUT',
        `/api/v1/orders/${testOrder.id}/status`,
        updateData,
        testUser.token
      );

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Insufficient permissions');
    });

    /**
     * Test update of non-existent order
     */
    it('should return 404 when updating non-existent order', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await makeAuthenticatedRequest(
        app,
        'PUT',
        `/api/v1/orders/${fakeId}/status`,
        { status: 'CONFIRMED' },
        adminUser.token
      );

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Order not found');
    });

    /**
     * Test validation of status values
     */
    it('should validate status values', async () => {
      const invalidStatusData = {
        status: 'INVALID_STATUS'
      };

      const response = await makeAuthenticatedRequest(
        app,
        'PUT',
        `/api/v1/orders/${testOrder.id}/status`,
        invalidStatusData,
        adminUser.token
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });
  });

  describe('Order Management Bangladesh-Specific Tests', () => {
    /**
     * Test Bangladesh payment methods
     */
    it('should accept Bangladesh-specific payment methods', async () => {
      const bdPaymentMethods = ['CASH_ON_DELIVERY', 'BKASH', 'NAGAD', 'ROCKET'];
      
      for (const paymentMethod of bdPaymentMethods) {
        const orderData = {
          userId: testUser.user.id,
          addressId: testAddress.id,
          items: [
            {
              productId: testProduct.id,
              quantity: 1
            }
          ],
          paymentMethod: paymentMethod
        };

        const response = await makeAuthenticatedRequest(
          app,
          'POST',
          '/api/v1/orders',
          orderData,
          testUser.token
        );

        expect(response.status).toBe(201);
        expect(response.body.order.paymentMethod).toBe(paymentMethod);
      }
    });

    /**
     * Test order with Bangladesh address
     */
    it('should handle Bangladesh address structure', async () => {
      // Create Bangladesh-specific address
      const bdAddress = await prisma.address.create({
        data: {
          userId: testUser.user.id,
          firstName: testUser.user.firstName,
          lastName: testUser.user.lastName,
          phone: '+8801712345678',
          address: 'House 12, Road 5, Dhanmondi',
          addressLine2: 'Block A, Apartment 3B',
          city: 'Dhaka',
          district: 'Dhaka',
          division: 'DHAKA',
          upazila: 'Dhanmondi',
          postalCode: '1209',
          type: 'SHIPPING',
          isDefault: true
        }
      });

      const orderData = {
        userId: testUser.user.id,
        addressId: bdAddress.id,
        items: [
          {
            productId: testProduct.id,
            quantity: 1
          }
        ],
        paymentMethod: 'CASH_ON_DELIVERY'
      };

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/v1/orders',
        orderData,
        testUser.token
      );

      expect(response.status).toBe(201);
      
      // Verify order includes full address
      const order = await prisma.order.findUnique({
        where: { id: response.body.order.id },
        include: { address: true }
      });
      
      expect(order.address.division).toBe('DHAKA');
      expect(order.address.upazila).toBe('Dhanmondi');
      expect(order.address.postalCode).toBe('1209');
    });

    /**
     * Test BDT currency handling
     */
    it('should handle BDT currency correctly', async () => {
      const bdtOrderData = {
        userId: testUser.user.id,
        addressId: testAddress.id,
        items: [
          {
            productId: testProduct.id,
            quantity: 1
          }
        ],
        paymentMethod: 'CASH_ON_DELIVERY'
      };

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/v1/orders',
        bdtOrderData,
        testUser.token
      );

      expect(response.status).toBe(201);
      const order = response.body.order;
      
      // Verify BDT pricing
      expect(typeof parseFloat(order.subtotal)).toBe('number');
      expect(typeof parseFloat(order.total)).toBe('number');
      
      // Verify transaction currency
      if (order.transactions && order.transactions.length > 0) {
        order.transactions.forEach(transaction => {
          expect(transaction.currency).toBe('BDT');
        });
      }
    });
  });

  describe('Order Management Security Tests', () => {
    /**
     * Test SQL injection protection
     */
    it('should protect against SQL injection in order search', async () => {
      const maliciousQuery = "'; DROP TABLE orders; --";
      
      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/orders?search=${encodeURIComponent(maliciousQuery)}`,
        {},
        adminUser.token
      );

      // Should not crash the server
      expect(response.status).toBe(200);
      
      // Verify orders table still exists
      const orderCount = await prisma.order.count();
      expect(orderCount).toBeGreaterThanOrEqual(0);
    });

    /**
     * Test XSS protection in order data
     */
    it('should sanitize order input to prevent XSS', async () => {
      const xssPayload = '<script>alert("xss")</script>';
      
      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/v1/orders',
        {
          userId: testUser.user.id,
          addressId: testAddress.id,
          items: [
            {
              productId: testProduct.id,
              quantity: 1
            }
          ],
          paymentMethod: 'CASH_ON_DELIVERY',
          notes: xssPayload
        },
        testUser.token
      );

      // Should either reject or sanitize input
      expect([201, 400]).toContain(response.status);
      
      if (response.status === 201) {
        // If accepted, should be sanitized
        expect(response.body.order.notes).not.toBe(xssPayload);
      }
    });

    /**
     * Test rate limiting on order creation
     */
    it('should implement rate limiting on order creation', async () => {
      const orderData = {
        userId: testUser.user.id,
        addressId: testAddress.id,
        items: [
          {
            productId: testProduct.id,
            quantity: 1
          }
        ],
        paymentMethod: 'CASH_ON_DELIVERY'
      };

      // Make multiple requests
      const promises = Array(10).fill().map(() => 
        makeAuthenticatedRequest(
          app,
          'POST',
          '/api/v1/orders',
          orderData,
          testUser.token
        )
      );

      const responses = await Promise.all(promises);
      
      // At least one should be rate limited
      const rateLimitedResponse = responses.find(res => res.status === 429);
      expect(rateLimitedResponse).toBeDefined();
    });

    /**
     * Test order manipulation protection
     */
    it('should prevent order total manipulation', async () => {
      const maliciousOrderData = {
        userId: testUser.user.id,
        addressId: testAddress.id,
        items: [
          {
            productId: testProduct.id,
            quantity: 1
          }
        ],
        paymentMethod: 'CASH_ON_DELIVERY',
        subtotal: -100, // Attempt to manipulate price
        total: -50
      };

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/v1/orders',
        maliciousOrderData,
        testUser.token
      );

      // Should reject manipulated totals
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });
  });
});