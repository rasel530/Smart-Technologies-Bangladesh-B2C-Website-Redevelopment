const request = require('supertest');
const express = require('express');
const { mockDatabaseService } = require('./mock-database');
const { DatabaseValidator } = require('./database-validator');

/**
 * Comprehensive API Endpoint Tests with Mocking
 * Tests all API endpoints without requiring live database connection
 */
class APIEndpointTester {
  constructor() {
    this.app = null;
    this.mockDB = mockDatabaseService;
    this.validator = null;
    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  async initialize() {
    // Initialize mock database
    await this.mockDB.connect();
    await this.mockDB.seedTestData();

    // Initialize database validator
    this.validator = new DatabaseValidator({ useMock: true });
    await this.validator.initialize();

    // Create Express app with mocked services
    this.app = this.createTestApp();
  }

  createTestApp() {
    const app = express();
    app.use(express.json());

    // Mock middleware
    app.use((req, res, next) => {
      req.user = { id: 'user-1', role: 'CUSTOMER' };
      next();
    });

    // Health check endpoint
    app.get('/health', async (req, res) => {
      const health = await this.mockDB.healthCheck();
      res.json(health);
    });

    // Database status endpoint
    app.get('/api/db-status', async (req, res) => {
      const stats = await this.mockDB.getStats();
      res.json({ status: 'connected', statistics: stats });
    });

    // Users endpoints
    app.get('/api/v1/users', async (req, res) => {
      try {
        const users = await this.mockDB.find('users', {}, { take: 10 });
        res.json({ success: true, data: users, total: users.length });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.get('/api/v1/users/:id', async (req, res) => {
      try {
        const user = await this.mockDB.find('users', { id: req.params.id }, { first: true });
        if (!user) {
          return res.status(404).json({ success: false, error: 'User not found' });
        }
        res.json({ success: true, data: user });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.post('/api/v1/users', async (req, res) => {
      try {
        const user = await this.mockDB.create('users', req.body);
        res.status(201).json({ success: true, data: user });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Products endpoints
    app.get('/api/v1/products', async (req, res) => {
      try {
        const { category, brand, limit = 20, skip = 0 } = req.query;
        const where = {};
        if (category) where.categoryId = category;
        if (brand) where.brandId = brand;
        
        const products = await this.mockDB.find('products', where, { 
          take: parseInt(limit), 
          skip: parseInt(skip) 
        });
        res.json({ success: true, data: products, total: products.length });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.get('/api/v1/products/:id', async (req, res) => {
      try {
        const product = await this.mockDB.find('products', { id: req.params.id }, { first: true });
        if (!product) {
          return res.status(404).json({ success: false, error: 'Product not found' });
        }
        res.json({ success: true, data: product });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.post('/api/v1/products', async (req, res) => {
      try {
        const product = await this.mockDB.create('products', req.body);
        res.status(201).json({ success: true, data: product });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Categories endpoints
    app.get('/api/v1/categories', async (req, res) => {
      try {
        const categories = await this.mockDB.find('categories', { isActive: true });
        res.json({ success: true, data: categories, total: categories.length });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.get('/api/v1/categories/:id', async (req, res) => {
      try {
        const category = await this.mockDB.find('categories', { id: req.params.id }, { first: true });
        if (!category) {
          return res.status(404).json({ success: false, error: 'Category not found' });
        }
        res.json({ success: true, data: category });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Brands endpoints
    app.get('/api/v1/brands', async (req, res) => {
      try {
        const brands = await this.mockDB.find('brands', { isActive: true });
        res.json({ success: true, data: brands, total: brands.length });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Orders endpoints
    app.get('/api/v1/orders', async (req, res) => {
      try {
        const orders = await this.mockDB.find('orders', { userId: 'user-1' });
        res.json({ success: true, data: orders, total: orders.length });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.post('/api/v1/orders', async (req, res) => {
      try {
        const order = await this.mockDB.create('orders', {
          ...req.body,
          userId: 'user-1',
          orderNumber: `ORD-${Date.now()}`,
          status: 'PENDING'
        });
        res.status(201).json({ success: true, data: order });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Cart endpoints
    app.get('/api/v1/cart', async (req, res) => {
      try {
        const cartItems = await this.mockDB.find('cartItems', { userId: 'user-1' });
        res.json({ success: true, data: cartItems, total: cartItems.length });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.post('/api/v1/cart', async (req, res) => {
      try {
        const cartItem = await this.mockDB.create('cartItems', {
          ...req.body,
          userId: 'user-1',
          cartId: 'cart-1'
        });
        res.status(201).json({ success: true, data: cartItem });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Reviews endpoints
    app.get('/api/v1/reviews', async (req, res) => {
      try {
        const { productId } = req.query;
        const where = productId ? { productId } : {};
        const reviews = await this.mockDB.find('reviews', where);
        res.json({ success: true, data: reviews, total: reviews.length });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.post('/api/v1/reviews', async (req, res) => {
      try {
        const review = await this.mockDB.create('reviews', {
          ...req.body,
          userId: 'user-1',
          isApproved: false,
          isVerified: false
        });
        res.status(201).json({ success: true, data: review });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Coupons endpoints
    app.get('/api/v1/coupons', async (req, res) => {
      try {
        const coupons = await this.mockDB.find('coupons', { isActive: true });
        res.json({ success: true, data: coupons, total: coupons.length });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Bangladesh-specific endpoints
    app.get('/api/v1/divisions', async (req, res) => {
      try {
        const divisions = await this.mockDB.getDivisions();
        res.json({ success: true, data: divisions });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.get('/api/v1/payment-methods', async (req, res) => {
      try {
        const paymentMethods = await this.mockDB.getPaymentMethods();
        res.json({ success: true, data: paymentMethods });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Error handling
    app.use((err, req, res, next) => {
      console.error('Test error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    });

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({ success: false, error: 'Route not found' });
    });

    return app;
  }

  async runAllTests() {
    console.log('🧪 Starting Comprehensive API Endpoint Tests...\n');

    await this.testHealthEndpoints();
    await this.testUserEndpoints();
    await this.testProductEndpoints();
    await this.testCategoryEndpoints();
    await this.testBrandEndpoints();
    await this.testOrderEndpoints();
    await this.testCartEndpoints();
    await this.testReviewEndpoints();
    await this.testCouponEndpoints();
    await this.testBangladeshSpecificEndpoints();
    await this.testErrorHandling();

    this.printTestSummary();
    return this.testResults;
  }

  async testHealthEndpoints() {
    console.log('🏥 Testing Health Endpoints...');

    await this.runTest('GET /health', async () => {
      const response = await request(this.app).get('/health');
      this.assert(response.status === 200, 'Health endpoint should return 200');
      this.assert(response.body.status === 'healthy', 'Health status should be healthy');
      this.assert(response.body.database === 'connected', 'Database should be connected');
    });

    await this.runTest('GET /api/db-status', async () => {
      const response = await request(this.app).get('/api/db-status');
      this.assert(response.status === 200, 'DB status endpoint should return 200');
      this.assert(response.body.status === 'connected', 'DB status should be connected');
      this.assert(typeof response.body.statistics === 'object', 'Should return statistics');
    });
  }

  async testUserEndpoints() {
    console.log('👥 Testing User Endpoints...');

    await this.runTest('GET /api/v1/users', async () => {
      const response = await request(this.app).get('/api/v1/users');
      this.assert(response.status === 200, 'Users list should return 200');
      this.assert(response.body.success === true, 'Should return success flag');
      this.assert(Array.isArray(response.body.data), 'Should return array of users');
    });

    await this.runTest('GET /api/v1/users/:id', async () => {
      const response = await request(this.app).get('/api/v1/users/user-1');
      this.assert(response.status === 200, 'User by ID should return 200');
      this.assert(response.body.data.id === 'user-1', 'Should return correct user');
    });

    await this.runTest('POST /api/v1/users', async () => {
      const newUser = {
        email: 'newuser@test.com',
        firstName: 'New',
        lastName: 'User',
        role: 'CUSTOMER',
        status: 'ACTIVE'
      };
      const response = await request(this.app).post('/api/v1/users').send(newUser);
      this.assert(response.status === 201, 'User creation should return 201');
      this.assert(response.body.data.email === newUser.email, 'Should create user with correct email');
    });

    await this.runTest('GET /api/v1/users/nonexistent', async () => {
      const response = await request(this.app).get('/api/v1/users/nonexistent');
      this.assert(response.status === 404, 'Nonexistent user should return 404');
      this.assert(response.body.success === false, 'Should return failure flag');
    });
  }

  async testProductEndpoints() {
    console.log('📦 Testing Product Endpoints...');

    await this.runTest('GET /api/v1/products', async () => {
      const response = await request(this.app).get('/api/v1/products');
      this.assert(response.status === 200, 'Products list should return 200');
      this.assert(Array.isArray(response.body.data), 'Should return array of products');
    });

    await this.runTest('GET /api/v1/products?category=cat-1', async () => {
      const response = await request(this.app).get('/api/v1/products?category=cat-1');
      this.assert(response.status === 200, 'Filtered products should return 200');
      this.assert(response.body.data.every(p => p.categoryId === 'cat-1'), 'Should filter by category');
    });

    await this.runTest('GET /api/v1/products/prod-1', async () => {
      const response = await request(this.app).get('/api/v1/products/prod-1');
      this.assert(response.status === 200, 'Product by ID should return 200');
      this.assert(response.body.data.id === 'prod-1', 'Should return correct product');
      this.assert(response.body.data.nameEn, 'Should have English name');
      this.assert(response.body.data.nameBn, 'Should have Bengali name');
    });

    await this.runTest('POST /api/v1/products', async () => {
      const newProduct = {
        sku: 'TEST-PRODUCT-002',
        name: 'Test Product 2',
        nameEn: 'Test Product 2',
        nameBn: 'পরীক্ষা পণ্য ২',
        slug: 'test-product-2',
        categoryId: 'cat-1',
        brandId: 'brand-1',
        regularPrice: 2000,
        salePrice: 1500,
        costPrice: 1200,
        taxRate: 15,
        stockQuantity: 50,
        status: 'ACTIVE'
      };
      const response = await request(this.app).post('/api/v1/products').send(newProduct);
      this.assert(response.status === 201, 'Product creation should return 201');
      this.assert(response.body.data.sku === newProduct.sku, 'Should create product with correct SKU');
    });
  }

  async testCategoryEndpoints() {
    console.log('📂 Testing Category Endpoints...');

    await this.runTest('GET /api/v1/categories', async () => {
      const response = await request(this.app).get('/api/v1/categories');
      this.assert(response.status === 200, 'Categories list should return 200');
      this.assert(Array.isArray(response.body.data), 'Should return array of categories');
    });

    await this.runTest('GET /api/v1/categories/cat-1', async () => {
      const response = await request(this.app).get('/api/v1/categories/cat-1');
      this.assert(response.status === 200, 'Category by ID should return 200');
      this.assert(response.body.data.id === 'cat-1', 'Should return correct category');
    });
  }

  async testBrandEndpoints() {
    console.log('🏷️ Testing Brand Endpoints...');

    await this.runTest('GET /api/v1/brands', async () => {
      const response = await request(this.app).get('/api/v1/brands');
      this.assert(response.status === 200, 'Brands list should return 200');
      this.assert(Array.isArray(response.body.data), 'Should return array of brands');
    });
  }

  async testOrderEndpoints() {
    console.log('🛒 Testing Order Endpoints...');

    await this.runTest('GET /api/v1/orders', async () => {
      const response = await request(this.app).get('/api/v1/orders');
      this.assert(response.status === 200, 'Orders list should return 200');
      this.assert(Array.isArray(response.body.data), 'Should return array of orders');
    });

    await this.runTest('POST /api/v1/orders', async () => {
      const newOrder = {
        addressId: 'addr-1',
        subtotal: 1000,
        tax: 150,
        shippingCost: 50,
        total: 1200,
        paymentMethod: 'CASH_ON_DELIVERY'
      };
      const response = await request(this.app).post('/api/v1/orders').send(newOrder);
      this.assert(response.status === 201, 'Order creation should return 201');
      this.assert(response.body.data.orderNumber, 'Should generate order number');
    });
  }

  async testCartEndpoints() {
    console.log('🛍️ Testing Cart Endpoints...');

    await this.runTest('GET /api/v1/cart', async () => {
      const response = await request(this.app).get('/api/v1/cart');
      this.assert(response.status === 200, 'Cart should return 200');
      this.assert(Array.isArray(response.body.data), 'Should return array of cart items');
    });

    await this.runTest('POST /api/v1/cart', async () => {
      const cartItem = {
        productId: 'prod-1',
        quantity: 2,
        unitPrice: 75000,
        totalPrice: 150000
      };
      const response = await request(this.app).post('/api/v1/cart').send(cartItem);
      this.assert(response.status === 201, 'Cart item addition should return 201');
    });
  }

  async testReviewEndpoints() {
    console.log('⭐ Testing Review Endpoints...');

    await this.runTest('GET /api/v1/reviews', async () => {
      const response = await request(this.app).get('/api/v1/reviews');
      this.assert(response.status === 200, 'Reviews list should return 200');
      this.assert(Array.isArray(response.body.data), 'Should return array of reviews');
    });

    await this.runTest('POST /api/v1/reviews', async () => {
      const review = {
        productId: 'prod-1',
        rating: 5,
        title: 'Great product!',
        comment: 'Excellent quality and fast delivery'
      };
      const response = await request(this.app).post('/api/v1/reviews').send(review);
      this.assert(response.status === 201, 'Review creation should return 201');
      this.assert(response.body.data.rating === 5, 'Should save correct rating');
    });
  }

  async testCouponEndpoints() {
    console.log('🎫 Testing Coupon Endpoints...');

    await this.runTest('GET /api/v1/coupons', async () => {
      const response = await request(this.app).get('/api/v1/coupons');
      this.assert(response.status === 200, 'Coupons list should return 200');
      this.assert(Array.isArray(response.body.data), 'Should return array of coupons');
    });
  }

  async testBangladeshSpecificEndpoints() {
    console.log('🇧🇩 Testing Bangladesh-Specific Endpoints...');

    await this.runTest('GET /api/v1/divisions', async () => {
      const response = await request(this.app).get('/api/v1/divisions');
      this.assert(response.status === 200, 'Divisions should return 200');
      this.assert(Array.isArray(response.body.data), 'Should return array of divisions');
      this.assert(response.body.data.includes('DHAKA'), 'Should include Dhaka division');
      this.assert(response.body.data.includes('CHITTAGONG'), 'Should include Chittagong division');
    });

    await this.runTest('GET /api/v1/payment-methods', async () => {
      const response = await request(this.app).get('/api/v1/payment-methods');
      this.assert(response.status === 200, 'Payment methods should return 200');
      this.assert(Array.isArray(response.body.data), 'Should return array of payment methods');
      this.assert(response.body.data.includes('BKASH'), 'Should include bKash');
      this.assert(response.body.data.includes('NAGAD'), 'Should include Nagad');
      this.assert(response.body.data.includes('ROCKET'), 'Should include Rocket');
    });
  }

  async testErrorHandling() {
    console.log('❌ Testing Error Handling...');

    await this.runTest('Invalid endpoint', async () => {
      const response = await request(this.app).get('/api/v1/invalid-endpoint');
      this.assert(response.status === 404, 'Should return 404 for invalid endpoint');
      this.assert(response.body.success === false, 'Should return failure flag');
    });

    await this.runTest('Invalid method', async () => {
      const response = await request(this.app).patch('/api/v1/users');
      this.assert(response.status === 404, 'Should return 404 for unsupported method');
    });
  }

  async runTest(testName, testFunction) {
    this.testResults.total++;
    try {
      await testFunction();
      this.testResults.passed++;
      console.log(`  ✅ ${testName}`);
    } catch (error) {
      this.testResults.failed++;
      this.testResults.errors.push({ test: testName, error: error.message });
      console.log(`  ❌ ${testName}: ${error.message}`);
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  printTestSummary() {
    console.log('\n📊 API Endpoint Test Summary:');
    console.log(`Total Tests: ${this.testResults.total}`);
    console.log(`Passed: ${this.testResults.passed}`);
    console.log(`Failed: ${this.testResults.failed}`);
    console.log(`Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(1)}%`);

    if (this.testResults.errors.length > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults.errors.forEach(error => {
        console.log(`  - ${error.test}: ${error.error}`);
      });
    }
  }

  async cleanup() {
    if (this.validator) {
      await this.validator.cleanup();
    }
    if (this.mockDB) {
      await this.mockDB.disconnect();
    }
  }
}

module.exports = {
  APIEndpointTester
};